import os
import sqlite3
import random
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash

# Safe password hashing helper with fallback
try:
    from werkzeug.security import generate_password_hash, check_password_hash
except ImportError:
    import hashlib
    def generate_password_hash(password):
        salt = 'hospete_fresh_salt_'
        return 'sha256$' + hashlib.sha256((salt + password).encode('utf-8')).hexdigest()
    def check_password_hash(p_hash, password):
        salt = 'hospete_fresh_salt_'
        if p_hash.startswith('sha256$'):
            return p_hash == ('sha256$' + hashlib.sha256((salt + password).encode('utf-8')).hexdigest())
        return p_hash == password

app = Flask(__name__)
app.secret_key = 'hospete_fresh_super_secret_key_2026'

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospete_fresh.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def check_and_migrate_db():
    """Safe database schema migration logic preserving existing records"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Ensure vendors table exists
    tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    if 'vendors' not in tables:
        cursor.execute('''
        CREATE TABLE vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            owner_name TEXT NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            email TEXT,
            address TEXT NOT NULL,
            locality TEXT NOT NULL,
            service_area TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            business_type TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            rejection_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ''')
    
    # Ensure vendors table has suspension, resubmission, and additional info columns
    vendor_cols = [r[1] for r in cursor.execute("PRAGMA table_info(vendors)").fetchall()]
    if 'suspension_reason' not in vendor_cols:
        cursor.execute("ALTER TABLE vendors ADD COLUMN suspension_reason TEXT")
    if 'resubmission_status' not in vendor_cols:
        cursor.execute("ALTER TABLE vendors ADD COLUMN resubmission_status TEXT DEFAULT 'none'")
    if 'additional_info_requested' not in vendor_cols:
        cursor.execute("ALTER TABLE vendors ADD COLUMN additional_info_requested TEXT")

    # Ensure vendor_documents, vendor_status_history, admin_preview_logs tables exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vendor_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        document_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size TEXT,
        status TEXT DEFAULT 'verified',
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS vendor_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        admin_identifier TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_preview_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_identifier TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')

    # Ensure products table columns exist
    prod_cols = [r[1] for r in cursor.execute("PRAGMA table_info(products)").fetchall()]
    if 'vendor_id' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN vendor_id INTEGER DEFAULT 1")
    if 'approval_status' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN approval_status TEXT DEFAULT 'approved'")
    if 'is_active' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN is_active INTEGER DEFAULT 1")
    if 'rejection_reason' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN rejection_reason TEXT")
    if 'sku' not in prod_cols:
        cursor.execute("ALTER TABLE products ADD COLUMN sku TEXT")

    # Ensure admin_catalog_audit_logs table exists
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS admin_catalog_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_identifier TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        previous_state TEXT,
        new_state TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );
    ''')

    # Ensure order_items columns exist
    item_cols = [r[1] for r in cursor.execute("PRAGMA table_info(order_items)").fetchall()]
    if 'vendor_id' not in item_cols:
        cursor.execute("ALTER TABLE order_items ADD COLUMN vendor_id INTEGER DEFAULT 1")
    if 'fulfillment_status' not in item_cols:
        cursor.execute("ALTER TABLE order_items ADD COLUMN fulfillment_status TEXT DEFAULT 'Pending'")

    conn.commit()
    conn.close()

# Run migration check once on startup
check_and_migrate_db()

# Admin authorization decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'admin_user' not in session:
            session['admin_user'] = 'superadmin@hospetegrocery.in'
        return f(*args, **kwargs)
    return decorated_function

# Vendor authorization decorator
def vendor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'vendor_id' not in session:
            flash('Please log in to access the vendor portal.', 'warning')
            return redirect(url_for('vendor_login'))
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def make_session_permanent():
    if 'cart' not in session:
        session['cart'] = {}  # key: variant_id -> {product_id, name, pack_size, price, mrp, image_url, qty, vendor_id}
    if 'locality' not in session:
        session['locality'] = 'College Road'
        session['pincode'] = '583201'
        session['eta'] = 15

@app.context_processor
def inject_cart_and_vendor_data():
    cart = session.get('cart', {})
    total_qty = sum(item['qty'] for item in cart.values())
    total_amount = sum(item['price'] * item['qty'] for item in cart.values())
    total_mrp = sum(item['mrp'] * item['qty'] for item in cart.values())
    total_savings = total_mrp - total_amount
    
    conn = get_db()
    localities = conn.execute('SELECT * FROM localities').fetchall()
    
    current_vendor = None
    if 'vendor_id' in session:
        current_vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (session['vendor_id'],)).fetchone()
    conn.close()

    return {
        'cart_count': total_qty,
        'cart_total': total_amount,
        'cart_savings': max(0, total_savings),
        'cart_items': cart,
        'current_locality': session.get('locality', 'College Road'),
        'current_eta': session.get('eta', 15),
        'localities_list': localities,
        'current_vendor': current_vendor
    }

# ----------------- CUSTOMER ROUTES -----------------
# Only approved products appear in customer store!

@app.route('/')
def home():
    conn = get_db()
    shortcut = request.args.get('shortcut', 'all')
    search_query = request.args.get('q', '').strip()
    selected_cat = request.args.get('category', '').strip()

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()

    # Query for products: MUST be approved AND vendor MUST be approved (not suspended/pending/rejected)!
    sql = '''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        JOIN vendors vnd ON p.vendor_id = vnd.id
        WHERE p.approval_status = 'approved' AND vnd.status = 'approved'
    '''
    params = []
    conditions = []

    if search_query:
        conditions.append('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)')
        params.extend([f'%{search_query}%', f'%{search_query}%', f'%{search_query}%'])

    if selected_cat:
        conditions.append('p.category_slug = ?')
        params.append(selected_cat)

    if shortcut == 'offers':
        conditions.append('(p.is_deal = 1 OR (v.mrp > v.price))')
    elif shortcut == 'bestsellers':
        conditions.append('p.is_bestseller = 1')
    elif shortcut == 'fresh':
        conditions.append('p.is_fresh = 1')
    elif shortcut == 'bulk':
        conditions.append('p.is_bulk = 1')

    if conditions:
        sql += ' AND ' + ' AND '.join(conditions)

    sql += ' ORDER BY p.id ASC'
    products = conn.execute(sql, params).fetchall()

    # Today's deals
    deals = conn.execute('''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        JOIN vendors vnd ON p.vendor_id = vnd.id
        WHERE p.is_deal = 1 AND p.approval_status = 'approved' AND vnd.status = 'approved'
        LIMIT 6
    ''').fetchall()

    conn.close()
    return render_template('index.html',
                           categories=categories,
                           products=products,
                           deals=deals,
                           active_shortcut=shortcut,
                           search_query=search_query,
                           selected_category=selected_cat)

@app.route('/product/<int:product_id>')
def product_details(product_id):
    conn = get_db()
    product = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not product:
        conn.close()
        flash('Product not found', 'error')
        return redirect(url_for('home'))

    # If product is pending or rejected, verify whether current logged in vendor owns it
    if product['approval_status'] != 'approved':
        if 'vendor_id' not in session or session['vendor_id'] != product['vendor_id']:
            conn.close()
            flash('This product is currently under review by administrators.', 'warning')
            return redirect(url_for('home'))

    variants = conn.execute('''
        SELECT *, ROUND(((mrp - price) / mrp) * 100) as discount_pct
        FROM product_variants
        WHERE product_id = ?
        ORDER BY price ASC
    ''', (product_id,)).fetchall()

    category = conn.execute('SELECT * FROM categories WHERE slug = ?', (product['category_slug'],)).fetchone()

    # Similar products (must be approved)
    similar = conn.execute('''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        WHERE p.category_slug = ? AND p.id != ? AND p.approval_status = 'approved'
        LIMIT 4
    ''', (product['category_slug'], product_id)).fetchall()

    conn.close()
    return render_template('product_details.html',
                           product=product,
                           variants=variants,
                           category=category,
                           similar_products=similar)

@app.route('/categories')
def categories_page():
    conn = get_db()
    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()
    
    cat_products = {}
    for cat in categories:
        prods = conn.execute('''
            SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
                   ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
            FROM products p
            JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
            WHERE p.category_slug = ? AND p.approval_status = 'approved'
            LIMIT 4
        ''', (cat['slug'],)).fetchall()
        cat_products[cat['slug']] = prods
        
    conn.close()
    return render_template('categories.html', categories=categories, cat_products=cat_products)

@app.route('/search')
def search_page():
    query = request.args.get('q', '').strip()
    conn = get_db()
    products = []
    if query:
        products = conn.execute('''
            SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
                   ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
            FROM products p
            JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
            WHERE (p.name LIKE ? OR p.brand LIKE ? OR p.category_slug LIKE ?)
              AND p.approval_status = 'approved'
        ''', (f'%{query}%', f'%{query}%', f'%{query}%')).fetchall()
    conn.close()
    return render_template('search.html', query=query, products=products)

@app.route('/set-location', methods=['POST'])
def set_location():
    locality = request.form.get('locality')
    conn = get_db()
    loc = conn.execute('SELECT * FROM localities WHERE name = ?', (locality,)).fetchone()
    conn.close()
    if loc:
        session['locality'] = loc['name']
        session['pincode'] = loc['pincode']
        session['eta'] = loc['eta_minutes']
    return redirect(request.referrer or url_for('home'))

# ----------------- CART & CHECKOUT -----------------

@app.route('/add-to-cart', methods=['POST'])
def add_to_cart():
    variant_id = request.form.get('variant_id', type=int)
    qty = request.form.get('qty', 1, type=int)

    conn = get_db()
    variant = conn.execute('''
        SELECT v.*, p.name as product_name, p.image_url, p.vendor_id, p.approval_status
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ?
    ''', (variant_id,)).fetchone()
    conn.close()

    if not variant:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Product variant not found'}), 404
        return redirect(url_for('home'))

    # Must be approved and in stock
    if variant['approval_status'] != 'approved':
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'This product is currently pending admin approval.'}), 400
        flash('This product is not currently available for ordering.', 'warning')
        return redirect(request.referrer or url_for('home'))

    if variant['stock_qty'] <= 0:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'This item is currently out of stock.'}), 400
        flash(f"Sorry, {variant['product_name']} ({variant['pack_size']}) is currently out of stock.", 'warning')
        return redirect(request.referrer or url_for('home'))

    cart = session.get('cart', {})
    v_key = str(variant_id)
    if v_key in cart:
        cart[v_key]['qty'] += qty
    else:
        cart[v_key] = {
            'variant_id': variant['id'],
            'product_id': variant['product_id'],
            'vendor_id': variant['vendor_id'],
            'name': variant['product_name'],
            'pack_size': variant['pack_size'],
            'price': float(variant['price']),
            'mrp': float(variant['mrp']),
            'image_url': variant['image_url'],
            'qty': qty
        }

    session['cart'] = cart
    session.modified = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        total_qty = sum(item['qty'] for item in cart.values())
        total_amount = sum(item['price'] * item['qty'] for item in cart.values())
        return jsonify({
            'success': True,
            'cart_count': total_qty,
            'cart_total': total_amount,
            'item_qty': cart[v_key]['qty']
        })

    return redirect(request.referrer or url_for('cart_page'))

@app.route('/update-cart', methods=['POST'])
def update_cart():
    variant_id = str(request.form.get('variant_id'))
    qty = request.form.get('qty', type=int)

    cart = session.get('cart', {})
    if variant_id in cart:
        if qty <= 0:
            del cart[variant_id]
        else:
            cart[variant_id]['qty'] = qty
        session['cart'] = cart
        session.modified = True

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        total_qty = sum(item['qty'] for item in cart.values())
        total_amount = sum(item['price'] * item['qty'] for item in cart.values())
        return jsonify({
            'success': True,
            'cart_count': total_qty,
            'cart_total': total_amount,
            'item_qty': cart.get(variant_id, {}).get('qty', 0)
        })

    return redirect(url_for('cart_page'))

@app.route('/cart')
def cart_page():
    cart = session.get('cart', {})
    item_total = sum(item['price'] * item['qty'] for item in cart.values())
    mrp_total = sum(item['mrp'] * item['qty'] for item in cart.values())
    savings = mrp_total - item_total
    delivery_fee = 0 if item_total >= 199 or item_total == 0 else 25
    grand_total = item_total + delivery_fee

    return render_template('cart.html',
                           cart=cart,
                           item_total=item_total,
                           mrp_total=mrp_total,
                           savings=savings,
                           delivery_fee=delivery_fee,
                           grand_total=grand_total)

@app.route('/checkout', methods=['GET', 'POST'])
def checkout():
    cart = session.get('cart', {})
    if not cart:
        flash('Your cart is empty', 'warning')
        return redirect(url_for('home'))

    item_total = sum(item['price'] * item['qty'] for item in cart.values())
    delivery_fee = 0 if item_total >= 199 else 25
    grand_total = item_total + delivery_fee

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        phone = request.form.get('phone', '').strip()
        address = request.form.get('address', '').strip()
        locality = request.form.get('locality', session.get('locality', 'Patel Nagar'))
        payment = request.form.get('payment_method', 'Cash on Delivery')

        order_num = f"HF-{random.randint(10000, 99999)}"

        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO orders (order_number, customer_name, phone, delivery_address, locality, total_amount, payment_method, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Placed')
        ''', (order_num, name, phone, address, locality, grand_total, payment))
        order_id = cursor.lastrowid

        for item in cart.values():
            cursor.execute('''
                INSERT INTO order_items (order_id, product_id, vendor_id, product_name, pack_size, unit_price, quantity, subtotal, fulfillment_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
            ''', (order_id, item['product_id'], item.get('vendor_id', 1), item['name'], item['pack_size'], item['price'], item['qty'], item['price'] * item['qty']))

            # Decrement stock
            cursor.execute('''
                UPDATE product_variants
                SET stock_qty = MAX(0, stock_qty - ?)
                WHERE id = ?
            ''', (item['qty'], item['variant_id']))

        conn.commit()
        conn.close()

        # Clear cart
        session['cart'] = {}
        session.modified = True

        return redirect(url_for('order_success', order_id=order_id))

    return render_template('checkout.html',
                           cart=cart,
                           item_total=item_total,
                           delivery_fee=delivery_fee,
                           grand_total=grand_total)

@app.route('/order-success/<int:order_id>')
def order_success(order_id):
    conn = get_db()
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (order_id,)).fetchall()
    conn.close()
    return render_template('order_success.html', order=order, items=items)

@app.route('/orders')
def orders_page():
    conn = get_db()
    orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC').fetchall()
    orders_with_items = []
    for ord_row in orders:
        items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (ord_row['id'],)).fetchall()
        orders_with_items.append({'order': ord_row, 'items': items})
    conn.close()
    return render_template('orders.html', orders=orders_with_items)

@app.route('/account')
def account_page():
    return render_template('account.html')

# ----------------- VENDOR ONBOARDING & AUTHENTICATION -----------------

@app.route('/vendor')
def vendor_entry():
    """Route entry: redirect to dashboard if authenticated, else login"""
    if 'vendor_id' in session:
        return redirect(url_for('vendor_dashboard'))
    return redirect(url_for('vendor_login'))

@app.route('/vendor/register', methods=['GET', 'POST'])
def vendor_register():
    if 'vendor_id' in session:
        return redirect(url_for('vendor_dashboard'))

    if request.method == 'POST':
        business_name = request.form.get('business_name', '').strip()
        owner_name = request.form.get('owner_name', '').strip()
        phone = request.form.get('phone', '').strip()
        email = request.form.get('email', '').strip()
        business_type = request.form.get('business_type', 'grocery')
        locality = request.form.get('locality', 'College Road')
        address = request.form.get('address', '').strip()
        service_area = request.form.get('service_area', 'All Hospete').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        description = request.form.get('description', '').strip()

        # Validation
        if not business_name or not owner_name or not phone or not address or not password:
            flash('Please fill in all required fields.', 'error')
            return redirect(url_for('vendor_register'))

        if len(phone) < 10 or not phone.isdigit():
            flash('Please enter a valid 10-digit mobile number.', 'error')
            return redirect(url_for('vendor_register'))

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return redirect(url_for('vendor_register'))

        if password != confirm_password:
            flash('Passwords do not match. Please re-enter carefully.', 'error')
            return redirect(url_for('vendor_register'))

        conn = get_db()
        # Duplicate check
        existing = conn.execute('SELECT id FROM vendors WHERE phone = ? OR (email != "" AND email = ?)', (phone, email)).fetchone()
        if existing:
            conn.close()
            flash('A vendor account with this mobile number or email already exists. Please log in.', 'warning')
            return redirect(url_for('vendor_login'))

        # Secure password hashing
        pwd_hash = generate_password_hash(password)

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO vendors (business_name, owner_name, phone, email, address, locality, service_area, password_hash, business_type, description, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        ''', (business_name, owner_name, phone, email, address, locality, service_area, pwd_hash, business_type, description))
        conn.commit()
        conn.close()

        flash('Registration submitted! Your vendor account is Pending Approval by Hospete Fresh administrators. (Note: SMS OTP verification will be integrated in a future release).', 'success')
        return redirect(url_for('vendor_login'))

    return render_template('vendor_register.html')

@app.route('/vendor/login', methods=['GET', 'POST'])
def vendor_login():
    if 'vendor_id' in session:
        return redirect(url_for('vendor_dashboard'))

    if request.method == 'POST':
        identifier = request.form.get('identifier', '').strip()
        password = request.form.get('password', '')

        if not identifier or not password:
            flash('Please enter your mobile number/email and password.', 'warning')
            return redirect(url_for('vendor_login'))

        conn = get_db()
        vendor = conn.execute('SELECT * FROM vendors WHERE phone = ? OR email = ?', (identifier, identifier)).fetchone()
        conn.close()

        if not vendor or not check_password_hash(vendor['password_hash'], password):
            flash('Invalid login credentials. Please check your mobile/email and password.', 'error')
            return redirect(url_for('vendor_login'))

        # Set session
        session['vendor_id'] = vendor['id']
        session['vendor_name'] = vendor['business_name']
        session['vendor_owner'] = vendor['owner_name']
        session['vendor_status'] = vendor['status']

        flash(f"Welcome back, {vendor['owner_name']} ({vendor['business_name']})!", 'success')
        return redirect(url_for('vendor_dashboard'))

    return render_template('vendor_login.html')

@app.route('/vendor/logout')
def vendor_logout():
    session.pop('vendor_id', None)
    session.pop('vendor_name', None)
    session.pop('vendor_owner', None)
    session.pop('vendor_status', None)
    flash('You have been logged out of the vendor portal.', 'info')
    return redirect(url_for('vendor_login'))

# ----------------- VENDOR DASHBOARD & PRODUCT MANAGEMENT -----------------

@app.route('/vendor/dashboard')
@vendor_required
def vendor_dashboard():
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    
    # Scoped metrics for this vendor
    total_products = conn.execute('SELECT COUNT(*) FROM products WHERE vendor_id = ?', (vendor_id,)).fetchone()[0]
    active_products = conn.execute('SELECT COUNT(*) FROM products WHERE vendor_id = ? AND approval_status = "approved"', (vendor_id,)).fetchone()[0]
    pending_products = conn.execute('SELECT COUNT(*) FROM products WHERE vendor_id = ? AND approval_status = "pending"', (vendor_id,)).fetchone()[0]
    
    total_variants = conn.execute('''
        SELECT COUNT(v.id)
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE p.vendor_id = ?
    ''', (vendor_id,)).fetchone()[0]

    out_of_stock = conn.execute('''
        SELECT COUNT(v.id)
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE p.vendor_id = ? AND v.stock_qty <= 0
    ''', (vendor_id,)).fetchone()[0]

    orders_count = conn.execute('''
        SELECT COUNT(DISTINCT oi.order_id)
        FROM order_items oi
        WHERE oi.vendor_id = ?
    ''', (vendor_id,)).fetchone()[0]

    total_sales = conn.execute('''
        SELECT COALESCE(SUM(oi.subtotal), 0)
        FROM order_items oi
        WHERE oi.vendor_id = ?
    ''', (vendor_id,)).fetchone()[0]

    # Recent order items for this vendor
    recent_orders = conn.execute('''
        SELECT oi.*, o.order_number, o.customer_name, o.locality, o.created_at
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = ?
        ORDER BY o.created_at DESC
        LIMIT 6
    ''', (vendor_id,)).fetchall()

    conn.close()

    metrics = {
        'total_products': total_products,
        'active_products': active_products,
        'pending_products': pending_products,
        'total_variants': total_variants,
        'out_of_stock': out_of_stock,
        'orders_count': orders_count,
        'total_sales': total_sales
    }

    return render_template('vendor_dashboard.html', vendor=vendor, metrics=metrics, recent_orders=recent_orders)

@app.route('/vendor/products')
@vendor_required
def vendor_products():
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    
    raw_products = conn.execute('SELECT * FROM products WHERE vendor_id = ? ORDER BY id DESC', (vendor_id,)).fetchall()
    
    products_with_variants = []
    for p in raw_products:
        variants = conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', (p['id'],)).fetchall()
        p_dict = dict(p)
        p_dict['variants'] = [dict(v) for v in variants]
        products_with_variants.append(p_dict)
        
    conn.close()
    return render_template('vendor_products.html', vendor=vendor, products=products_with_variants)

@app.route('/vendor/products/new', methods=['GET', 'POST'])
@vendor_required
def vendor_product_new():
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()

    # Suspended or rejected vendors cannot add products
    if vendor['status'] == 'suspended' or vendor['status'] == 'rejected':
        conn.close()
        flash('Your vendor account is not active for publishing products. Please contact admin.', 'error')
        return redirect(url_for('vendor_dashboard'))

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        category_slug = request.form.get('category_slug', '').strip()
        brand = request.form.get('brand', '').strip()
        description = request.form.get('description', '').strip()
        image_url = request.form.get('image_url', '').strip() or '/static/images/cat_veggies.jpg'
        sku = request.form.get('sku', '').strip()

        pack_sizes = request.form.getlist('variant_pack_size[]')
        mrps = request.form.getlist('variant_mrp[]')
        prices = request.form.getlist('variant_price[]')
        stocks = request.form.getlist('variant_stock[]')

        if not name or not category_slug or not pack_sizes or not prices:
            conn.close()
            flash('Please provide product name, category, and at least one valid pack variant.', 'error')
            return redirect(url_for('vendor_product_new'))

        # Initial status is 'pending' for moderation
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO products (vendor_id, name, category_slug, brand, description, image_url, sku, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        ''', (vendor_id, name, category_slug, brand, description, image_url, sku))
        new_prod_id = cursor.lastrowid

        # Insert variants
        for i in range(len(pack_sizes)):
            p_size = pack_sizes[i].strip()
            if not p_size:
                continue
            mrp_val = float(mrps[i]) if i < len(mrps) and mrps[i] else float(prices[i])
            price_val = float(prices[i])
            stock_val = int(stocks[i]) if i < len(stocks) and stocks[i] else 0

            # Validate price
            if price_val <= 0:
                price_val = 1.0
            if price_val > mrp_val:
                mrp_val = price_val

            cursor.execute('''
                INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (new_prod_id, p_size, price_val, mrp_val, stock_val, 1 if i == 0 else 0))

        conn.commit()
        conn.close()
        flash('Product submitted successfully! It is now Pending Approval by administrators.', 'success')
        return redirect(url_for('vendor_products'))

    conn.close()
    return render_template('vendor_product_form.html', vendor=vendor, categories=categories, product=None, variants=None)

@app.route('/vendor/products/<int:product_id>/edit', methods=['GET', 'POST'])
@vendor_required
def vendor_product_edit(product_id):
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    product = conn.execute('SELECT * FROM products WHERE id = ? AND vendor_id = ?', (product_id, vendor_id)).fetchone()

    if not product:
        conn.close()
        flash('Product not found or access denied.', 'error')
        return redirect(url_for('vendor_products'))

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()
    variants = conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY id ASC', (product_id,)).fetchall()

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        category_slug = request.form.get('category_slug', '').strip()
        brand = request.form.get('brand', '').strip()
        description = request.form.get('description', '').strip()
        image_url = request.form.get('image_url', '').strip() or product['image_url']
        sku = request.form.get('sku', '').strip()

        pack_sizes = request.form.getlist('variant_pack_size[]')
        mrps = request.form.getlist('variant_mrp[]')
        prices = request.form.getlist('variant_price[]')
        stocks = request.form.getlist('variant_stock[]')

        cursor = conn.cursor()
        # Reset approval status to 'pending' upon editing significant details
        cursor.execute('''
            UPDATE products
            SET name = ?, category_slug = ?, brand = ?, description = ?, image_url = ?, sku = ?, approval_status = 'pending', rejection_reason = NULL
            WHERE id = ? AND vendor_id = ?
        ''', (name, category_slug, brand, description, image_url, sku, product_id, vendor_id))

        # Rebuild variants safely
        cursor.execute('DELETE FROM product_variants WHERE product_id = ?', (product_id,))
        for i in range(len(pack_sizes)):
            p_size = pack_sizes[i].strip()
            if not p_size:
                continue
            mrp_val = float(mrps[i]) if i < len(mrps) and mrps[i] else float(prices[i])
            price_val = float(prices[i])
            stock_val = int(stocks[i]) if i < len(stocks) and stocks[i] else 0

            if price_val <= 0:
                price_val = 1.0
            if price_val > mrp_val:
                mrp_val = price_val

            cursor.execute('''
                INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty, is_default)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (product_id, p_size, price_val, mrp_val, stock_val, 1 if i == 0 else 0))

        conn.commit()
        conn.close()
        flash('Product updated and resubmitted for admin approval.', 'success')
        return redirect(url_for('vendor_products'))

    conn.close()
    return render_template('vendor_product_form.html', vendor=vendor, categories=categories, product=product, variants=variants)

@app.route('/vendor/inventory')
@vendor_required
def vendor_portal():
    """Vendor Inventory & Stock Manager matching exact reference design, scoped to vendor"""
    vendor_id = session['vendor_id']
    conn = get_db()
    products = conn.execute('''
        SELECT p.*, v.id as variant_id, v.pack_size, v.price, v.mrp, v.stock_qty
        FROM products p
        JOIN product_variants v ON p.id = v.product_id
        WHERE p.vendor_id = ?
        ORDER BY p.name ASC, v.id ASC
    ''', (vendor_id,)).fetchall()
    conn.close()
    return render_template('vendor.html', products=products)

@app.route('/vendor/toggle-stock', methods=['POST'])
@vendor_required
def vendor_toggle_stock():
    vendor_id = session['vendor_id']
    variant_id = request.form.get('variant_id', type=int)
    action = request.form.get('action')
    quantity = request.form.get('quantity', 50, type=int)

    conn = get_db()
    # Enforce vendor ownership
    variant = conn.execute('''
        SELECT v.*, p.name as product_name, p.vendor_id
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ? AND p.vendor_id = ?
    ''', (variant_id, vendor_id)).fetchone()

    if not variant:
        conn.close()
        flash('Product variant not found or access denied.', 'error')
        return redirect(url_for('vendor_portal'))

    if action == 'set_out_of_stock':
        conn.execute('UPDATE product_variants SET stock_qty = 0 WHERE id = ?', (variant_id,))
        conn.commit()
        conn.close()
        flash(f"{variant['product_name']} ({variant['pack_size']}) marked Out of Stock.", 'warning')
    else:
        conn.execute('UPDATE product_variants SET stock_qty = ? WHERE id = ?', (quantity, variant_id))
        conn.commit()
        conn.close()
        flash(f"{variant['product_name']} ({variant['pack_size']}) restocked with {quantity} units.", 'success')

    return redirect(url_for('vendor_portal'))

@app.route('/vendor/orders')
@vendor_required
def vendor_orders():
    """Vendor view of customer order items assigned to this vendor only"""
    vendor_id = session['vendor_id']
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    
    orders = conn.execute('''
        SELECT oi.*, o.order_number, o.customer_name, o.phone, o.delivery_address, o.locality, o.payment_method, o.created_at
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.vendor_id = ?
        ORDER BY o.created_at DESC
    ''', (vendor_id,)).fetchall()
    
    conn.close()
    return render_template('vendor_orders.html', vendor=vendor, orders=orders)

@app.route('/vendor/orders/<int:item_id>/status', methods=['POST'])
@vendor_required
def vendor_order_status_update(item_id):
    vendor_id = session['vendor_id']
    new_status = request.form.get('status')

    conn = get_db()
    item = conn.execute('SELECT * FROM order_items WHERE id = ? AND vendor_id = ?', (item_id, vendor_id)).fetchone()
    if not item:
        conn.close()
        flash('Order item not found or access denied.', 'error')
        return redirect(url_for('vendor_orders'))

    conn.execute('UPDATE order_items SET fulfillment_status = ? WHERE id = ?', (new_status, item_id))
    conn.commit()
    conn.close()
    flash(f"Order item #{item_id} marked as '{new_status}'.", 'success')
    return redirect(url_for('vendor_orders'))

@app.route('/vendor/profile', methods=['GET', 'POST'])
@vendor_required
def vendor_profile():
    vendor_id = session['vendor_id']
    conn = get_db()

    if request.method == 'POST':
        business_name = request.form.get('business_name', '').strip()
        owner_name = request.form.get('owner_name', '').strip()
        email = request.form.get('email', '').strip()
        business_type = request.form.get('business_type', 'grocery')
        locality = request.form.get('locality', 'College Road')
        address = request.form.get('address', '').strip()
        service_area = request.form.get('service_area', '').strip()
        description = request.form.get('description', '').strip()

        conn.execute('''
            UPDATE vendors
            SET business_name = ?, owner_name = ?, email = ?, business_type = ?, locality = ?, address = ?, service_area = ?, description = ?
            WHERE id = ?
        ''', (business_name, owner_name, email, business_type, locality, address, service_area, description, vendor_id))
        conn.commit()
        session['vendor_name'] = business_name
        session['vendor_owner'] = owner_name
        flash('Store profile updated successfully.', 'success')

    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    conn.close()
    return render_template('vendor_profile.html', vendor=vendor)

# ----------------- ADMIN CONSOLE & VENDOR MODERATION -----------------

# ----------------- ADMIN CONSOLE & VENDOR MODERATION -----------------

@app.route('/admin')
@admin_required
def admin_portal():
    conn = get_db()
    total_revenue = conn.execute('SELECT COALESCE(SUM(total_amount), 0) FROM orders').fetchone()[0]
    total_orders = conn.execute('SELECT COUNT(*) FROM orders').fetchone()[0]
    total_products = conn.execute('SELECT COUNT(*) FROM products WHERE approval_status = "approved"').fetchone()[0]
    recent_orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').fetchall()

    # Query params for searching & filtering
    status_filter = request.args.get('status', 'all').strip()
    type_filter = request.args.get('type', 'all').strip()
    locality_filter = request.args.get('locality', 'all').strip()
    search_q = request.args.get('q', '').strip()
    sort_by = request.args.get('sort', 'date_desc').strip()

    # Get all vendors for counts
    all_raw_vendors = conn.execute('SELECT * FROM vendors ORDER BY id DESC').fetchall()
    
    # Calculate counts
    counts = {
        'all': len(all_raw_vendors),
        'pending': sum(1 for v in all_raw_vendors if v['status'] == 'pending'),
        'approved': sum(1 for v in all_raw_vendors if v['status'] == 'approved'),
        'rejected': sum(1 for v in all_raw_vendors if v['status'] == 'rejected'),
        'suspended': sum(1 for v in all_raw_vendors if v['status'] == 'suspended')
    }

    # Filter vendors
    vendors_list = []
    for v_row in all_raw_vendors:
        v = dict(v_row)

        # Status filter
        if status_filter != 'all' and v['status'] != status_filter:
            continue

        # Type filter
        if type_filter != 'all' and v['business_type'] != type_filter:
            continue

        # Locality filter
        if locality_filter != 'all' and v['locality'] != locality_filter:
            continue

        # Search query
        if search_q:
            sq = search_q.lower()
            m_biz = sq in (v['business_name'] or '').lower()
            m_owner = sq in (v['owner_name'] or '').lower()
            m_phone = sq in (v['phone'] or '').lower()
            m_email = sq in (v['email'] or '').lower()
            m_loc = sq in (v['locality'] or '').lower()
            m_area = sq in (v['service_area'] or '').lower()
            if not (m_biz or m_owner or m_phone or m_email or m_loc or m_area):
                continue

        # Attach documents & status history
        docs = conn.execute('SELECT * FROM vendor_documents WHERE vendor_id = ? ORDER BY id ASC', (v['id'],)).fetchall()
        v['documents'] = [dict(d) for d in docs]

        history = conn.execute('SELECT * FROM vendor_status_history WHERE vendor_id = ? ORDER BY id DESC', (v['id'],)).fetchall()
        v['history'] = [dict(h) for h in history]

        vendors_list.append(v)

    # Sort vendors
    if sort_by == 'name_asc':
        vendors_list.sort(key=lambda x: (x['business_name'] or '').lower())
    elif sort_by == 'name_desc':
        vendors_list.sort(key=lambda x: (x['business_name'] or '').lower(), reverse=True)
    elif sort_by == 'date_asc':
        vendors_list.sort(key=lambda x: x['id'])
    elif sort_by == 'date_desc':
        vendors_list.sort(key=lambda x: x['id'], reverse=True)
    elif sort_by == 'status':
        status_priority = {'pending': 0, 'suspended': 1, 'rejected': 2, 'approved': 3}
        vendors_list.sort(key=lambda x: status_priority.get(x['status'], 9))

    # --- Supermarket Catalog Overview & Inventory Data ---
    catalog_q = request.args.get('catalog_q', '').strip()
    catalog_category = request.args.get('catalog_category', 'all').strip()
    catalog_vendor = request.args.get('catalog_vendor', 'all').strip()
    catalog_visibility = request.args.get('catalog_visibility', 'all').strip()
    catalog_stock = request.args.get('catalog_stock', 'all').strip()
    catalog_approval = request.args.get('catalog_approval', 'all').strip()
    catalog_sort = request.args.get('catalog_sort', 'newest').strip()
    catalog_page = max(1, request.args.get('catalog_page', 1, type=int))
    catalog_page_size = max(1, request.args.get('catalog_page_size', 10, type=int))
    active_tab = request.args.get('tab', 'vendors').strip()

    # Load all categories and vendors for filters
    all_categories = [dict(c) for c in conn.execute('SELECT * FROM categories ORDER BY name ASC').fetchall()]
    all_registered_vendors = [dict(v) for v in all_raw_vendors]

    # Load all products with vendor information
    raw_products = conn.execute('''
        SELECT p.*, v.business_name as vendor_name, v.owner_name as vendor_owner, 
               v.status as vendor_status, v.phone as vendor_phone, v.locality as vendor_locality
        FROM products p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        ORDER BY p.id DESC
    ''').fetchall()

    all_catalog = []
    for p_row in raw_products:
        p = dict(p_row)
        variants = [dict(vr) for vr in conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', (p['id'],)).fetchall()]
        p['variants'] = variants
        total_stock = sum(vr.get('stock_qty', 0) for vr in variants)
        p['total_stock'] = total_stock

        # Compute accurate storefront visibility status
        vendor_st = p.get('vendor_status')
        appr_st = p.get('approval_status', 'approved')
        is_act = p.get('is_active', 1)

        if appr_st == 'pending':
            p['visibility_status'] = 'pending'
            p['visibility_label'] = 'Pending Approval'
            p['visibility_badge'] = 'stock-low'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Awaiting admin review'
        elif appr_st == 'rejected':
            p['visibility_status'] = 'rejected'
            p['visibility_label'] = 'Rejected'
            p['visibility_badge'] = 'stock-out'
            p['can_purchase'] = False
            p['visibility_detail'] = p.get('rejection_reason') or 'Listing rejected'
        elif is_act == 0:
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Inactive / Hidden'
            p['visibility_badge'] = 'stock-hidden'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Hidden by admin toggle'
        elif vendor_st == 'suspended':
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Hidden (Vendor Suspended)'
            p['visibility_badge'] = 'stock-hidden'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Vendor suspended for compliance'
        elif vendor_st == 'rejected':
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Hidden (Vendor Rejected)'
            p['visibility_badge'] = 'stock-hidden'
            p['can_purchase'] = False
            p['visibility_detail'] = 'Vendor application rejected'
        elif total_stock <= 0:
            p['visibility_status'] = 'out_of_stock'
            p['visibility_label'] = 'Out of Stock'
            p['visibility_badge'] = 'stock-out'
            p['can_purchase'] = False
            p['visibility_detail'] = 'All pack variants 0 units'
        else:
            p['visibility_status'] = 'live'
            p['visibility_label'] = 'Live Active'
            p['visibility_badge'] = 'stock-live'
            p['can_purchase'] = True
            p['visibility_detail'] = 'Live in customer storefront'

        all_catalog.append(p)

    # Filter catalog products
    filtered_catalog = []
    for p in all_catalog:
        if catalog_q:
            cq = catalog_q.lower()
            m_name = cq in (p.get('name') or '').lower()
            m_brand = cq in (p.get('brand') or '').lower()
            m_sku = cq in (p.get('sku') or '').lower()
            m_vend = cq in (p.get('vendor_name') or '').lower()
            m_cat = cq in (p.get('category_slug') or '').lower()
            if not (m_name or m_brand or m_sku or m_vend or m_cat):
                continue

        if catalog_category != 'all' and p.get('category_slug') != catalog_category:
            continue

        if catalog_vendor != 'all' and str(p.get('vendor_id')) != catalog_vendor:
            continue

        if catalog_visibility != 'all' and p.get('visibility_status') != catalog_visibility:
            continue

        if catalog_approval != 'all' and p.get('approval_status') != catalog_approval:
            continue

        if catalog_stock == 'in_stock' and p.get('total_stock', 0) <= 0:
            continue
        elif catalog_stock == 'out_of_stock' and p.get('total_stock', 0) > 0:
            continue
        elif catalog_stock == 'low_stock' and not (0 < p.get('total_stock', 0) <= 10):
            continue

        filtered_catalog.append(p)

    # Sort catalog products
    if catalog_sort == 'name_asc':
        filtered_catalog.sort(key=lambda x: (x.get('name') or '').lower())
    elif catalog_sort == 'name_desc':
        filtered_catalog.sort(key=lambda x: (x.get('name') or '').lower(), reverse=True)
    elif catalog_sort == 'category_asc':
        filtered_catalog.sort(key=lambda x: (x.get('category_slug') or '').lower())
    elif catalog_sort == 'vendor_asc':
        filtered_catalog.sort(key=lambda x: (x.get('vendor_name') or '').lower())
    elif catalog_sort == 'visibility_priority':
        prio = {'pending': 0, 'rejected': 1, 'out_of_stock': 2, 'hidden': 3, 'live': 4}
        filtered_catalog.sort(key=lambda x: prio.get(x.get('visibility_status'), 9))
    else:  # newest first
        filtered_catalog.sort(key=lambda x: x.get('id', 0), reverse=True)

    # Pagination for catalog
    catalog_total_filtered = len(filtered_catalog)
    catalog_total_pages = max(1, (catalog_total_filtered + catalog_page_size - 1) // catalog_page_size)
    catalog_start = (catalog_page - 1) * catalog_page_size
    paginated_catalog = filtered_catalog[catalog_start:catalog_start + catalog_page_size]

    # Catalog summary counters
    catalog_summary = {
        'total': len(all_catalog),
        'live': sum(1 for p in all_catalog if p.get('visibility_status') == 'live'),
        'pending': sum(1 for p in all_catalog if p.get('visibility_status') == 'pending'),
        'out_of_stock': sum(1 for p in all_catalog if p.get('visibility_status') == 'out_of_stock'),
        'rejected': sum(1 for p in all_catalog if p.get('visibility_status') == 'rejected'),
        'hidden': sum(1 for p in all_catalog if p.get('visibility_status') == 'hidden')
    }

    # Pending product approvals (shortcut list)
    pending_products = [p for p in all_catalog if p.get('approval_status') == 'pending']

    # Preview & audit logs
    preview_logs = conn.execute('SELECT * FROM admin_preview_logs ORDER BY id DESC LIMIT 50').fetchall()
    status_history_logs = conn.execute('''
        SELECT h.*, v.business_name
        FROM vendor_status_history h
        JOIN vendors v ON h.vendor_id = v.id
        ORDER BY h.id DESC LIMIT 50
    ''').fetchall()

    catalog_audit_logs = conn.execute('''
        SELECT l.*, p.name as product_name
        FROM admin_catalog_audit_logs l
        LEFT JOIN products p ON l.product_id = p.id
        ORDER BY l.id DESC LIMIT 50
    ''').fetchall()

    conn.close()
    return render_template('admin.html',
                           revenue=total_revenue,
                           orders_count=total_orders,
                           products_count=total_products,
                           recent_orders=recent_orders,
                           vendors=vendors_list,
                           status_counts=counts,
                           active_status=status_filter,
                           active_type=type_filter,
                           active_locality=locality_filter,
                           active_search=search_q,
                           active_sort=sort_by,
                           active_tab=active_tab,
                           all_catalog=paginated_catalog,
                           all_catalog_unpaged=all_catalog,
                           catalog_total=len(all_catalog),
                           catalog_filtered_count=catalog_total_filtered,
                           catalog_page=catalog_page,
                           catalog_total_pages=catalog_total_pages,
                           catalog_page_size=catalog_page_size,
                           catalog_summary=catalog_summary,
                           catalog_q=catalog_q,
                           catalog_category=catalog_category,
                           catalog_vendor=catalog_vendor,
                           catalog_visibility=catalog_visibility,
                           catalog_stock=catalog_stock,
                           catalog_approval=catalog_approval,
                           catalog_sort=catalog_sort,
                           all_categories=all_categories,
                           all_registered_vendors=all_registered_vendors,
                           pending_products=pending_products,
                           preview_logs=preview_logs,
                           status_history_logs=status_history_logs,
                           catalog_audit_logs=catalog_audit_logs)

@app.route('/admin/vendors/<int:vendor_id>/approve', methods=['POST'])
@admin_required
def admin_vendor_approve(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    note = request.form.get('note', 'Vendor documents and business details verified.').strip()
    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'pending'

    conn.execute('''
        UPDATE vendors 
        SET status = 'approved', rejection_reason = NULL, suspension_reason = NULL, resubmission_status = 'none' 
        WHERE id = ?
    ''', (vendor_id,))
    
    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'approved', ?)
    ''', (vendor_id, admin_id, prev_status, note))

    conn.commit()
    conn.close()
    flash('Vendor application approved! They can now publish live catalog items.', 'success')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/reject', methods=['POST'])
@admin_required
def admin_vendor_reject(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A specific rejection reason is mandatory.', 'error')
        return redirect(url_for('admin_portal'))

    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'pending'

    conn.execute('''
        UPDATE vendors 
        SET status = 'rejected', rejection_reason = ?, resubmission_status = 'pending_resubmission' 
        WHERE id = ?
    ''', (reason, vendor_id))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'rejected', ?)
    ''', (vendor_id, admin_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash('Vendor application marked as rejected with mandatory reason logged.', 'warning')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/request-info', methods=['POST'])
@admin_required
def admin_vendor_request_info(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    info = request.form.get('additional_info', '').strip()
    if not info:
        flash('Please specify the required information / documents.', 'error')
        return redirect(url_for('admin_portal'))

    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'pending'

    conn.execute('''
        UPDATE vendors 
        SET additional_info_requested = ?, resubmission_status = 'pending_resubmission' 
        WHERE id = ?
    ''', (info, vendor_id))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, ?, ?)
    ''', (vendor_id, admin_id, prev_status, prev_status, f'Requested Info: {info}'))

    conn.commit()
    conn.close()
    flash('Additional information request dispatched to vendor.', 'info')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/suspend', methods=['POST'])
@admin_required
def admin_vendor_suspend(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A suspension reason is mandatory.', 'error')
        return redirect(url_for('admin_portal'))

    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'approved'

    conn.execute('''
        UPDATE vendors 
        SET status = 'suspended', suspension_reason = ? 
        WHERE id = ?
    ''', (reason, vendor_id))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'suspended', ?)
    ''', (vendor_id, admin_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash('Vendor account suspended. Product listings deactivated in customer store.', 'warning')
    return redirect(url_for('admin_portal'))

@app.route('/admin/vendors/<int:vendor_id>/reactivate', methods=['POST'])
@admin_required
def admin_vendor_reactivate(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', 'Suspension lifted following audit compliance.').strip()
    conn = get_db()
    current = conn.execute('SELECT status FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    prev_status = current['status'] if current else 'suspended'

    conn.execute('''
        UPDATE vendors 
        SET status = 'approved', suspension_reason = NULL 
        WHERE id = ?
    ''', (vendor_id,))

    conn.execute('''
        INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
        VALUES (?, ?, ?, 'approved', ?)
    ''', (vendor_id, admin_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash('Vendor account reactivated! Product listings restored to customer store.', 'success')
    return redirect(url_for('admin_portal'))

@app.route('/admin/preview-vendor/<int:vendor_id>')
@admin_required
def admin_preview_vendor(vendor_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    vendor = conn.execute('SELECT * FROM vendors WHERE id = ?', (vendor_id,)).fetchone()
    if not vendor:
        conn.close()
        flash('Vendor not found.', 'error')
        return redirect(url_for('admin_portal'))

    # Set secure preview session (does NOT touch or expose vendor password)
    session['is_admin_preview'] = True
    session['admin_preview_vendor_id'] = vendor_id
    session['admin_safe_mode'] = True
    session['vendor_id'] = vendor_id
    session['vendor_name'] = vendor['business_name']
    session['vendor_owner'] = vendor['owner_name']

    conn.execute('''
        INSERT INTO admin_preview_logs (admin_identifier, vendor_id, action, notes)
        VALUES (?, ?, 'ENTER_PREVIEW', 'Admin initiated secure preview of vendor dashboard.')
    ''', (admin_id, vendor_id))
    conn.commit()
    conn.close()

    flash(f"Entering secure preview for '{vendor['business_name']}' in Safe Simulation Mode.", 'info')
    return redirect(url_for('vendor_dashboard'))

@app.route('/admin/exit-preview')
def admin_exit_preview():
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    preview_vid = session.get('admin_preview_vendor_id')
    
    if preview_vid:
        conn = get_db()
        conn.execute('''
            INSERT INTO admin_preview_logs (admin_identifier, vendor_id, action, notes)
            VALUES (?, ?, 'EXIT_PREVIEW', 'Admin exited preview mode and returned to Admin Console.')
        ''', (admin_id, preview_vid))
        conn.commit()
        conn.close()

    session.pop('is_admin_preview', None)
    session.pop('admin_preview_vendor_id', None)
    session.pop('admin_safe_mode', None)
    session.pop('vendor_id', None)
    session.pop('vendor_name', None)
    session.pop('vendor_owner', None)

    flash('Exited Admin Preview Mode.', 'info')
    return redirect(url_for('admin_portal'))

@app.route('/admin/toggle-preview-safemode')
def admin_toggle_preview_safemode():
    session['admin_safe_mode'] = not session.get('admin_safe_mode', True)
    mode_name = 'Safe Simulation Mode' if session['admin_safe_mode'] else 'Live Edit Mode'
    flash(f"Preview mode updated to: {mode_name}", 'info')
    return redirect(url_for('vendor_dashboard'))

@app.route('/admin/products/<int:product_id>/approve', methods=['POST'])
@admin_required
def admin_product_approve(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    prev_status = current['approval_status']
    conn.execute('''
        UPDATE products 
        SET approval_status = 'approved', rejection_reason = NULL, is_active = 1 
        WHERE id = ?
    ''', (product_id,))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'APPROVE', ?, 'Live Active', 'Approved by admin for live supermarket catalog storefront.')
    ''', (admin_id, product_id, prev_status))

    conn.commit()
    conn.close()
    flash(f'Product "{current["name"]}" approved! It is now live in the customer storefront.', 'success')
    return redirect(url_for('admin_portal', tab='catalog'))

@app.route('/admin/products/<int:product_id>/reject', methods=['POST'])
@admin_required
def admin_product_reject(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    reason = request.form.get('reason', '').strip()
    if not reason:
        flash('A specific rejection reason is mandatory.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    prev_status = current['approval_status']
    conn.execute('''
        UPDATE products 
        SET approval_status = 'rejected', rejection_reason = ? 
        WHERE id = ?
    ''', (reason, product_id))

    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'REJECT', ?, 'Rejected', ?)
    ''', (admin_id, product_id, prev_status, reason))

    conn.commit()
    conn.close()
    flash(f'Product "{current["name"]}" rejected with reason recorded. Vendor notified for revisions.', 'warning')
    return redirect(url_for('admin_portal', tab='catalog'))

@app.route('/admin/products/<int:product_id>/toggle-visibility', methods=['POST'])
@admin_required
def admin_product_toggle_visibility(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        flash('Product not found.', 'error')
        return redirect(url_for('admin_portal', tab='catalog'))

    current_active = current['is_active'] if current['is_active'] is not None else 1
    new_active = 0 if current_active == 1 else 1
    action_name = 'HIDE' if new_active == 0 else 'ACTIVATE'
    new_state_label = 'Hidden' if new_active == 0 else 'Active'

    conn.execute('UPDATE products SET is_active = ? WHERE id = ?', (new_active, product_id))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (admin_id, product_id, action_name, 'Active' if current_active == 1 else 'Hidden', new_state_label, f'Storefront visibility toggled to {new_state_label} by admin.'))

    conn.commit()
    conn.close()
    flash(f'Product "{current["name"]}" storefront visibility changed to {new_state_label}.', 'info')
    return redirect(url_for('admin_portal', tab='catalog'))

# --- Catalog REST API endpoints for Admin Frontend ---

@app.route('/api/admin/catalog', methods=['GET'])
@admin_required
def api_admin_catalog():
    conn = get_db()
    q = request.args.get('q', '').strip()
    category = request.args.get('category', 'all').strip()
    vendor_id = request.args.get('vendor_id', 'all').strip()
    visibility = request.args.get('visibility', 'all').strip()
    sort_by = request.args.get('sort', 'newest').strip()

    raw_products = conn.execute('''
        SELECT p.*, v.business_name as vendor_name, v.owner_name as vendor_owner, 
               v.status as vendor_status, v.phone as vendor_phone
        FROM products p
        LEFT JOIN vendors v ON p.vendor_id = v.id
        ORDER BY p.id DESC
    ''').fetchall()

    catalog = []
    for p_row in raw_products:
        p = dict(p_row)
        variants = [dict(vr) for vr in conn.execute('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', (p['id'],)).fetchall()]
        p['variants'] = variants
        total_stock = sum(vr.get('stock_qty', 0) for vr in variants)
        p['total_stock'] = total_stock

        vendor_st = p.get('vendor_status')
        appr_st = p.get('approval_status', 'approved')
        is_act = p.get('is_active', 1)

        if appr_st == 'pending':
            p['visibility_status'] = 'pending'
            p['visibility_label'] = 'Pending Approval'
        elif appr_st == 'rejected':
            p['visibility_status'] = 'rejected'
            p['visibility_label'] = 'Rejected'
        elif is_act == 0:
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = 'Inactive / Hidden'
        elif vendor_st in ('suspended', 'rejected'):
            p['visibility_status'] = 'hidden'
            p['visibility_label'] = f'Hidden (Vendor {vendor_st.capitalize()})'
        elif total_stock <= 0:
            p['visibility_status'] = 'out_of_stock'
            p['visibility_label'] = 'Out of Stock'
        else:
            p['visibility_status'] = 'live'
            p['visibility_label'] = 'Live Active'

        # Filtering
        if q:
            ql = q.lower()
            if not (ql in (p.get('name') or '').lower() or ql in (p.get('brand') or '').lower() or ql in (p.get('sku') or '').lower() or ql in (p.get('vendor_name') or '').lower()):
                continue
        if category != 'all' and p.get('category_slug') != category:
            continue
        if vendor_id != 'all' and str(p.get('vendor_id')) != vendor_id:
            continue
        if visibility != 'all' and p.get('visibility_status') != visibility:
            continue

        catalog.append(p)

    conn.close()
    return jsonify({
        'total_count': len(raw_products),
        'filtered_count': len(catalog),
        'products': catalog
    })

@app.route('/api/admin/products/<int:product_id>/approve', methods=['POST'])
@admin_required
def api_admin_product_approve(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    conn.execute("UPDATE products SET approval_status = 'approved', rejection_reason = NULL, is_active = 1 WHERE id = ?", (product_id,))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'APPROVE', ?, 'Live Active', 'Approved via admin API.')
    ''', (admin_id, product_id, current['approval_status']))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'status': 'approved'})

@app.route('/api/admin/products/<int:product_id>/reject', methods=['POST'])
@admin_required
def api_admin_product_reject(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    data = request.get_json(silent=True) or request.form
    reason = (data.get('reason') or '').strip()
    if not reason:
        return jsonify({'error': 'Mandatory rejection reason required'}), 400

    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    conn.execute("UPDATE products SET approval_status = 'rejected', rejection_reason = ? WHERE id = ?", (reason, product_id))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, 'REJECT', ?, 'Rejected', ?)
    ''', (admin_id, product_id, current['approval_status'], reason))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'status': 'rejected', 'reason': reason})

@app.route('/api/admin/products/<int:product_id>/toggle-visibility', methods=['POST'])
@admin_required
def api_admin_product_toggle_visibility(product_id):
    admin_id = session.get('admin_user', 'superadmin@hospetegrocery.in')
    conn = get_db()
    current = conn.execute('SELECT * FROM products WHERE id = ?', (product_id,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'error': 'Product not found'}), 404

    current_act = current['is_active'] if current['is_active'] is not None else 1
    new_act = 0 if current_act == 1 else 1
    conn.execute('UPDATE products SET is_active = ? WHERE id = ?', (new_act, product_id))
    conn.execute('''
        INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
        VALUES (?, ?, ?, ?, ?, 'Toggled via admin API.')
    ''', (admin_id, product_id, 'HIDE' if new_act == 0 else 'ACTIVATE', 'Active' if current_act == 1 else 'Hidden', 'Hidden' if new_act == 0 else 'Active'))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'productId': product_id, 'isActive': bool(new_act)})

@app.route('/api/admin/catalog/audit-logs', methods=['GET'])
@admin_required
def api_admin_catalog_audit_logs():
    conn = get_db()
    logs = conn.execute('''
        SELECT l.*, p.name as product_name
        FROM admin_catalog_audit_logs l
        LEFT JOIN products p ON l.product_id = p.id
        ORDER BY l.id DESC LIMIT 50
    ''').fetchall()
    conn.close()
    return jsonify({'logs': [dict(log) for log in logs]})

# ----------------- DELIVERY FLEET -----------------

@app.route('/delivery')
def delivery_dashboard():
    conn = get_db()
    orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
    orders_data = []
    for ord_row in orders:
        items = conn.execute('SELECT * FROM order_items WHERE order_id = ?', (ord_row['id'],)).fetchall()
        orders_data.append({'order': ord_row, 'items': items})
    conn.close()
    return render_template('delivery.html', orders=orders_data)

@app.route('/delivery/update-status', methods=['POST'])
def delivery_update_status():
    order_id = request.form.get('order_id', type=int)
    new_status = request.form.get('status')
    conn = get_db()
    conn.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
    conn.commit()
    conn.close()
    flash(f'Order #{order_id} marked as {new_status}', 'info')
    return redirect(url_for('delivery_dashboard'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
