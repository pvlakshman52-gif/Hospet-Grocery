import os
import sqlite3
import random
from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash

app = Flask(__name__)
app.secret_key = 'hospete_fresh_super_secret_key_2026'

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospete_fresh.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.before_request
def make_session_permanent():
    if 'cart' not in session:
        session['cart'] = {}  # key: variant_id -> {product_id, name, pack_size, price, mrp, image_url, qty}
    if 'locality' not in session:
        session['locality'] = 'College Road'
        session['pincode'] = '583201'
        session['eta'] = 15

@app.context_processor
def inject_cart_data():
    cart = session.get('cart', {})
    total_qty = sum(item['qty'] for item in cart.values())
    total_amount = sum(item['price'] * item['qty'] for item in cart.values())
    total_mrp = sum(item['mrp'] * item['qty'] for item in cart.values())
    total_savings = total_mrp - total_amount
    
    # Check localities
    conn = get_db()
    localities = conn.execute('SELECT * FROM localities').fetchall()
    conn.close()

    return {
        'cart_count': total_qty,
        'cart_total': total_amount,
        'cart_savings': max(0, total_savings),
        'cart_items': cart,
        'current_locality': session.get('locality', 'College Road'),
        'current_eta': session.get('eta', 15),
        'localities_list': localities
    }

# ----------------- CUSTOMER ROUTES -----------------

@app.route('/')
def home():
    conn = get_db()
    shortcut = request.args.get('shortcut', 'all')
    search_query = request.args.get('q', '').strip()
    selected_cat = request.args.get('category', '').strip()

    categories = conn.execute('SELECT * FROM categories ORDER BY id ASC').fetchall()

    # Query for products
    sql = '''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
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
        sql += ' WHERE ' + ' AND '.join(conditions)

    sql += ' ORDER BY p.id ASC'
    products = conn.execute(sql, params).fetchall()

    # Today's deals
    deals = conn.execute('''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        WHERE p.is_deal = 1
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

    variants = conn.execute('''
        SELECT *, ROUND(((mrp - price) / mrp) * 100) as discount_pct
        FROM product_variants
        WHERE product_id = ?
        ORDER BY price ASC
    ''', (product_id,)).fetchall()

    category = conn.execute('SELECT * FROM categories WHERE slug = ?', (product['category_slug'],)).fetchone()

    # Similar products
    similar = conn.execute('''
        SELECT p.*, v.id as default_variant_id, v.pack_size, v.price, v.mrp, v.stock_qty,
               ROUND(((v.mrp - v.price) / v.mrp) * 100) as discount_pct
        FROM products p
        JOIN product_variants v ON p.id = v.product_id AND v.is_default = 1
        WHERE p.category_slug = ? AND p.id != ?
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
            WHERE p.category_slug = ?
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
            WHERE p.name LIKE ? OR p.brand LIKE ? OR p.category_slug LIKE ?
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
        SELECT v.*, p.name as product_name, p.image_url
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ?
    ''', (variant_id,)).fetchone()
    conn.close()

    if not variant:
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'message': 'Product variant not found'}), 404
        return redirect(url_for('home'))

    # Stock availability check: ensure out-of-stock variants cannot be added
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
                INSERT INTO order_items (order_id, product_id, product_name, pack_size, unit_price, quantity, subtotal)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (order_id, item['product_id'], item['name'], item['pack_size'], item['price'], item['qty'], item['price'] * item['qty']))

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

# ----------------- MULTI-ROLE SCREENS -----------------
# As per instructions: "Do not unintentionally apply customer mobile framing to vendor, delivery, or admin screens."

@app.route('/vendor')
def vendor_portal():
    conn = get_db()
    products = conn.execute('''
        SELECT p.*, v.id as variant_id, v.pack_size, v.price, v.mrp, v.stock_qty
        FROM products p
        JOIN product_variants v ON p.id = v.product_id
        ORDER BY p.name ASC, v.id ASC
    ''').fetchall()
    conn.close()
    return render_template('vendor.html', products=products)

@app.route('/vendor/update-stock', methods=['POST'])
def vendor_update_stock():
    variant_id = request.form.get('variant_id', type=int)
    new_stock = request.form.get('stock', type=int)
    new_price = request.form.get('price', type=float)

    conn = get_db()
    if new_price:
        conn.execute('UPDATE product_variants SET stock_qty = ?, price = ? WHERE id = ?', (new_stock, new_price, variant_id))
    else:
        conn.execute('UPDATE product_variants SET stock_qty = ? WHERE id = ?', (new_stock, variant_id))
    conn.commit()
    conn.close()
    flash('Inventory updated successfully', 'success')
    return redirect(url_for('vendor_portal'))

@app.route('/vendor/toggle-stock', methods=['POST'])
def vendor_toggle_stock():
    variant_id = request.form.get('variant_id', type=int)
    action = request.form.get('action')
    quantity = request.form.get('quantity', 50, type=int)

    conn = get_db()
    variant = conn.execute('''
        SELECT v.*, p.name as product_name
        FROM product_variants v
        JOIN products p ON v.product_id = p.id
        WHERE v.id = ?
    ''', (variant_id,)).fetchone()

    if not variant:
        conn.close()
        flash('Product variant not found.', 'error')
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

@app.route('/admin')
def admin_portal():
    conn = get_db()
    total_revenue = conn.execute('SELECT COALESCE(SUM(total_amount), 0) FROM orders').fetchone()[0]
    total_orders = conn.execute('SELECT COUNT(*) FROM orders').fetchone()[0]
    total_products = conn.execute('SELECT COUNT(*) FROM products').fetchone()[0]
    recent_orders = conn.execute('SELECT * FROM orders ORDER BY created_at DESC LIMIT 10').fetchall()
    conn.close()
    return render_template('admin.html',
                           revenue=total_revenue,
                           orders_count=total_orders,
                           products_count=total_products,
                           recent_orders=recent_orders)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
