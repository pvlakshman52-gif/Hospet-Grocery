import sqlite3
import os

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

DB_PATH = os.path.join(os.path.dirname(__file__), 'hospete_fresh.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop existing tables to ensure clean rebuild
    cursor.executescript('''
    DROP TABLE IF EXISTS order_items;
    DROP TABLE IF EXISTS orders;
    DROP TABLE IF EXISTS product_variants;
    DROP TABLE IF EXISTS products;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS localities;
    DROP TABLE IF EXISTS vendors;

    CREATE TABLE localities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        pincode TEXT NOT NULL,
        eta_minutes INTEGER DEFAULT 20
    );

    CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        icon_emoji TEXT,
        image_path TEXT,
        banner_color TEXT
    );

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
        business_type TEXT NOT NULL, -- grocery, farmer, dairy, snacks, other
        description TEXT,
        status TEXT DEFAULT 'pending', -- pending, approved, rejected, suspended
        rejection_reason TEXT,
        suspension_reason TEXT,
        resubmission_status TEXT DEFAULT 'none', -- none, pending_resubmission, resubmitted
        additional_info_requested TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE vendor_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        document_type TEXT NOT NULL,
        document_name TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size TEXT,
        status TEXT DEFAULT 'verified', -- verified, pending_review, rejected
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE vendor_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        admin_identifier TEXT NOT NULL,
        previous_status TEXT NOT NULL,
        new_status TEXT NOT NULL,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE admin_preview_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_identifier TEXT NOT NULL,
        vendor_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- ENTER_PREVIEW, BLOCKED_TRANSACTION, EXIT_PREVIEW
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL DEFAULT 1,
        name TEXT NOT NULL,
        category_slug TEXT NOT NULL,
        brand TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        sku TEXT,
        rating REAL DEFAULT 4.5,
        review_count INTEGER DEFAULT 84,
        is_deal INTEGER DEFAULT 0,
        deal_tag TEXT,
        is_bestseller INTEGER DEFAULT 0,
        is_fresh INTEGER DEFAULT 0,
        is_bulk INTEGER DEFAULT 0,
        approval_status TEXT DEFAULT 'approved', -- pending, approved, rejected
        is_active INTEGER DEFAULT 1, -- 1 for live active, 0 for inactive/hidden by admin
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_slug) REFERENCES categories(slug),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );

    CREATE TABLE admin_catalog_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_identifier TEXT NOT NULL,
        product_id INTEGER NOT NULL,
        action TEXT NOT NULL, -- APPROVE, REJECT, HIDE, ACTIVATE
        previous_state TEXT,
        new_state TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        pack_size TEXT NOT NULL,
        price REAL NOT NULL,
        mrp REAL NOT NULL,
        stock_qty INTEGER DEFAULT 50,
        is_default INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        locality TEXT NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT DEFAULT 'Cash on Delivery',
        status TEXT DEFAULT 'Placed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        vendor_id INTEGER NOT NULL DEFAULT 1,
        product_name TEXT NOT NULL,
        pack_size TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        fulfillment_status TEXT DEFAULT 'Pending', -- Pending, Accepted, Preparing, Ready for Pickup, Dispatched
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (vendor_id) REFERENCES vendors(id)
    );
    ''')

    # Seed Localities in Hospete
    localities = [
        ('College Road', '583201', 15),
        ('Patel Nagar', '583201', 20),
        ('Station Road', '583201', 20),
        ('Amaravathi', '583201', 25),
        ('Hampi Road', '583201', 25),
        ('Dam Road', '583225', 30),
        ('Ananthashayana Gudi', '583201', 25),
        ('M.J. Nagar', '583203', 20)
    ]
    cursor.executemany('INSERT INTO localities (name, pincode, eta_minutes) VALUES (?, ?, ?)', localities)

    # Seed Categories
    categories = [
        ('Fresh Veggies', 'veggies', '🥦', '/static/images/cat_veggies.jpg', '#ecfdf5'),
        ('Fresh Fruits', 'fruits', '🍎', '/static/images/cat_fruits.jpg', '#fef2f2'),
        ('Dairy & Bakery', 'dairy', '🥛', '/static/images/cat_dairy.jpg', '#eff6ff'),
        ('Atta, Rice & Dals', 'staples', '🌾', '/static/images/cat_staples.jpg', '#fefce8'),
        ('Snacks & Namkeen', 'snacks', '🍿', '/static/images/cat_snacks.jpg', '#fff7ed'),
        ('Masalas & Oils', 'oils', '🌶️', '/static/images/cat_oils.jpg', '#fdf2f8'),
        ('Beverages & Tea', 'beverages', '☕', '/static/images/cat_beverages.jpg', '#f5f3ff'),
        ('Household Essentials', 'household', '🧼', '/static/images/cat_household.jpg', '#f0fdfa')
    ]
    cursor.executemany('INSERT INTO categories (name, slug, icon_emoji, image_path, banner_color) VALUES (?, ?, ?, ?, ?)', categories)

    # Seed Vendors (Approved, Pending, and Rejected for complete workflow testing)
    vendors = [
        (
            1,
            'Tungabhadra Agro & Organics',
            'Suresh Gowda',
            '9845011111',
            'suresh@tungabhadra.in',
            'Plot 44, Rural Market Yard, Hospete',
            'College Road',
            'College Road, Patel Nagar, Amaravathi',
            generate_password_hash('vendor123'),
            'farmer',
            'Direct farm supplier of pesticide-free vegetables, grains, and fruits from Tungabhadra basin.',
            'approved',
            None
        ),
        (
            2,
            'Hospete Sweets & Namkeen',
            'Prasad Rao',
            '9845022222',
            'prasad@hospetesweets.com',
            'Station Road Market, Shop #12, Hospete',
            'Station Road',
            'Station Road, Patel Nagar, Hampi Road',
            generate_password_hash('vendor123'),
            'snacks',
            'Authentic Karnataka savories, hot mixture, banana chips, and traditional namkeen.',
            'approved',
            None
        ),
        (
            3,
            'Bellary Organic Dairy',
            'Manjunath K',
            '9845033333',
            'manju@bellarydairy.com',
            'Near Dam Circle, Hospete',
            'Dam Road',
            'Dam Road, College Road',
            generate_password_hash('vendor123'),
            'dairy',
            'Pure A2 Gir Cow Milk, fresh paneer, and artisanal curd.',
            'pending',
            None
        ),
        (
            4,
            'Hampi Spice Traders',
            'Venkatesh B',
            '9845044444',
            'venki@hampispices.com',
            'Bazaar Street, Hospete',
            'Hampi Road',
            'Hampi Road, Amaravathi',
            generate_password_hash('vendor123'),
            'grocery',
            'Wholesale ground spices and cold-pressed oils.',
            'rejected',
            'Incomplete FSSAI registration document uploaded. Please upload valid copy.',
            None,
            'pending_resubmission',
            None
        ),
        (
            5,
            'Vijayanagar Mart & Provisions',
            'Ganesh Hegde',
            '9845055555',
            'ganesh@vijayanagarmart.in',
            'Patel Nagar Main Circle, Hospete',
            'Patel Nagar',
            'Patel Nagar, College Road, Station Road',
            generate_password_hash('vendor123'),
            'grocery',
            'Neighbourhood provision store offering daily pulses, spices, branded edible oils.',
            'suspended',
            None,
            'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles on 2026-03-16. Storefront listings deactivated pending warehouse audit.',
            'none',
            None
        )
    ]
    cursor.executemany('''
    INSERT INTO vendors (id, business_name, owner_name, phone, email, address, locality, service_area, password_hash, business_type, description, status, rejection_reason, suspension_reason, resubmission_status, additional_info_requested)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', [
        (1, 'Tungabhadra Agro & Organics', 'Suresh Gowda', '9845011111', 'suresh@tungabhadra.in', 'Plot 44, Rural Market Yard, Hospete', 'College Road', 'College Road, Patel Nagar, Amaravathi', generate_password_hash('vendor123'), 'farmer', 'Direct farm supplier of pesticide-free vegetables, grains, and fruits from Tungabhadra basin.', 'approved', None, None, 'none', None),
        (2, 'Hospete Sweets & Namkeen', 'Prasad Rao', '9845022222', 'prasad@hospetesweets.com', 'Station Road Market, Shop #12, Hospete', 'Station Road', 'Station Road, Patel Nagar, Hampi Road', generate_password_hash('vendor123'), 'snacks', 'Authentic Karnataka savories, hot mixture, banana chips, and traditional namkeen.', 'approved', None, None, 'none', None),
        (3, 'Bellary Organic Dairy', 'Manjunath K', '9845033333', 'manju@bellarydairy.com', 'Near Dam Circle, Hospete', 'Dam Road', 'Dam Road, College Road', generate_password_hash('vendor123'), 'dairy', 'Pure A2 Gir Cow Milk, fresh paneer, and artisanal curd.', 'pending', None, None, 'none', None),
        (4, 'Hampi Spice Traders', 'Venkatesh B', '9845044444', 'venki@hampispices.com', 'Bazaar Street, Hospete', 'Hampi Road', 'Hampi Road, Amaravathi', generate_password_hash('vendor123'), 'grocery', 'Wholesale ground spices and cold-pressed oils.', 'rejected', 'Incomplete FSSAI registration document uploaded. Please upload valid copy.', None, 'pending_resubmission', None),
        (5, 'Vijayanagar Mart & Provisions', 'Ganesh Hegde', '9845055555', 'ganesh@vijayanagarmart.in', 'Patel Nagar Main Circle, Hospete', 'Patel Nagar', 'Patel Nagar, College Road, Station Road', generate_password_hash('vendor123'), 'grocery', 'Neighbourhood provision store offering daily pulses, spices, branded edible oils.', 'suspended', None, 'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles on 2026-03-16. Storefront listings deactivated pending warehouse audit.', 'none', None)
    ])

    # Seed Vendor Documents (Configurable by Business Type)
    vendor_docs = [
        # Farmer: Land Record / RTC, Kisan ID, Organic Cert
        (1, 'pahani_rtc', 'Land Record / Pahani (RTC)', 'rtc_survey_44_hospete.pdf', '1.8 MB', 'verified'),
        (1, 'farmer_id', 'Kisan / Farmer Photo ID', 'kisan_card_suresh.pdf', '950 KB', 'verified'),
        (1, 'organic_cert', 'Organic Farming Certificate', 'jaivik_bharat_cert.pdf', '2.1 MB', 'verified'),
        # Snacks: FSSAI Mfg, Hygiene NOC, Udyam MSME
        (2, 'fssai_mfg', 'FSSAI Food Manufacturing License', 'fssai_lic_21223000.pdf', '1.2 MB', 'verified'),
        (2, 'hygiene_noc', 'Commercial Kitchen Hygiene NOC', 'kitchen_sanitation_noc.pdf', '780 KB', 'verified'),
        (2, 'msme_udyam', 'MSME Udyam Registration', 'udyam_kr_14_9921.pdf', '1.4 MB', 'verified'),
        # Dairy: FSSAI Dairy, Trade License (Missing Vet Health NOC)
        (3, 'fssai_dairy', 'FSSAI Dairy Processing License', 'fssai_dairy_cert_bellary.pdf', '1.1 MB', 'pending_review'),
        (3, 'trade_license', 'Hospete CMC Trade License', 'cmc_dam_circle_shop.pdf', '890 KB', 'pending_review'),
        # Rejected Vendor 4: Blurry / rejected document
        (4, 'fssai_retail', 'FSSAI Retail License', 'fssai_scan_blurry.jpg', '420 KB', 'rejected'),
        # Suspended Vendor 5: Verified docs
        (5, 'gstin', 'GSTIN Certificate', 'gstin_29AAACH7721.pdf', '1.3 MB', 'verified'),
        (5, 'fssai_retail', 'FSSAI Food Business License', 'fssai_retail_patelnagar.pdf', '980 KB', 'verified'),
        (5, 'trade_license', 'Hospete Municipal Trade License', 'cmc_patelnagar_trade.pdf', '1.5 MB', 'verified')
    ]
    cursor.executemany('''
    INSERT INTO vendor_documents (vendor_id, document_type, document_name, file_name, file_size, status)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', vendor_docs)

    # Seed Vendor Status History
    status_history = [
        (1, 'superadmin@hospetegrocery.in', 'pending', 'approved', 'Land records verified and field inspection passed.'),
        (2, 'superadmin@hospetegrocery.in', 'pending', 'approved', 'Commercial kitchen hygiene certificate and FSSAI valid through 2028.'),
        (3, 'system@hospetegrocery.in', 'pending', 'pending', 'Self-registration submitted for dairy supplier listing. Awaiting review.'),
        (4, 'superadmin@hospetegrocery.in', 'pending', 'rejected', 'Incomplete FSSAI registration document uploaded. Please upload valid copy.'),
        (5, 'superadmin@hospetegrocery.in', 'pending', 'approved', 'Documents verified and business authorized.'),
        (5, 'superadmin@hospetegrocery.in', 'approved', 'suspended', 'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles on 2026-03-16. Storefront listings deactivated pending warehouse audit.')
    ]
    cursor.executemany('''
    INSERT INTO vendor_status_history (vendor_id, admin_identifier, previous_status, new_status, reason)
    VALUES (?, ?, ?, ?, ?)
    ''', status_history)

    # Seed Initial Admin Preview Log
    preview_logs = [
        ('superadmin@hospetegrocery.in', 1, 'ENTER_PREVIEW', 'Initial operational audit inspection of inventory variants.')
    ]
    cursor.executemany('''
    INSERT INTO admin_preview_logs (admin_identifier, vendor_id, action, notes)
    VALUES (?, ?, ?, ?)
    ''', preview_logs)

    # Seed Products with vendor_id, approval_status, and is_active
    products = [
        (1, 'Farm Fresh Red Tomatoes', 'veggies', 'Tungabhadra Farms', 'Locally harvested ripe farm-fresh red tomatoes, handpicked daily from Hospete rural farms.', '/static/images/tomatoes.jpg', 'VEG-TOM-01', 4.8, 142, 1, 'SAVE 25%', 1, 1, 0, 'approved', 1, None),
        (1, 'Fresh Green Coriander (Kothambari)', 'veggies', 'Local Fresh', 'Crisp and aromatic fresh coriander leaves sourced from Tungabhadra riverbed growers.', '/static/images/coriander.jpg', 'VEG-COR-01', 4.7, 98, 0, None, 0, 1, 0, 'approved', 1, None),
        (1, 'Nandini Pasteurised Toned Milk', 'dairy', 'Nandini (KMF)', 'Pure and rich toned cow milk pouch from Karnataka Milk Federation. Homogenised and nutrient rich.', '/static/images/nandini_milk.jpg', 'DAR-MLK-01', 4.9, 310, 1, 'DAILY ESSENTIAL', 1, 1, 0, 'approved', 1, None),
        (1, 'Nandini Pure Cow Ghee', 'dairy', 'Nandini (KMF)', 'Golden, granulated authentic Karnataka cow ghee with traditional aroma and pure taste.', '/static/images/nandini_ghee.jpg', 'DAR-GHE-01', 4.9, 215, 1, 'FLAT ₹40 OFF', 1, 0, 0, 'approved', 1, None),
        (2, 'South Indian Special Mixture Snacks', 'snacks', 'Hospete Sweets & Namkeen', 'Authentic crispy spicy Karnataka mixture with roasted groundnuts, curry leaves, sev and boondi. Made fresh daily.', '/static/images/mixture_snacks.jpg', 'SNK-MIX-01', 4.6, 178, 1, 'BESTSELLER', 1, 0, 0, 'approved', 1, None),
        (1, 'Premium Sona Masoori Rice', 'staples', 'Tungabhadra Gold', 'Aged, lightweight and aromatic Karnataka Sona Masoori raw rice. Ideal for everyday meals.', '/static/images/sona_masoori.jpg', 'STP-RCE-01', 4.8, 260, 0, None, 1, 0, 1, 'approved', 1, None),
        (1, 'Aashirvaad Shudh Chakki Atta', 'staples', 'Aashirvaad', '100% whole wheat flour, naturally rich in dietary fibre for soft and fluffy rotis.', '/static/images/aashirvaad_atta.jpg', 'STP-ATT-01', 4.8, 190, 1, 'VALUE PACK', 1, 0, 1, 'approved', 1, None),
        (1, 'Robusta Fresh Bananas', 'fruits', 'Hospete Orchard', 'Sweet, energetic locally grown bananas from Bellary & Hospete fruit plantations.', '/static/images/bananas.jpg', 'FRT-BAN-01', 4.7, 112, 0, None, 0, 1, 0, 'approved', 1, None),
        (1, 'Mysore Sandal Classic Soap', 'household', 'KSDL', 'World-famous authentic sandalwood oil toilet soap from Government of Karnataka.', '/static/images/mysore_sandal.jpg', 'HSD-MYS-01', 4.9, 340, 1, 'HERITAGE CARE', 1, 0, 0, 'approved', 1, None),
        (1, 'Gemini Pure Refined Sunflower Oil', 'oils', 'Gemini', 'Enriched with Vitamin A and D. Light cooking oil for heart-healthy South Indian cooking.', '/static/images/sunflower_oil.jpg', 'OIL-SUN-01', 4.7, 165, 0, None, 0, 0, 1, 'approved', 1, None),
        (1, 'Tata Tea Gold Leaf Tea', 'beverages', 'Tata Tea', 'Gentle blend of rich Assam CTC teas with 15% long leaves for heavenly aroma and strength.', '/static/images/tata_tea.jpg', 'BEV-TEA-01', 4.8, 145, 0, None, 1, 0, 0, 'approved', 1, None),
        (2, 'Crispy Masala Banana Chips', 'snacks', 'Malnad Crunch', 'Thinly sliced raw bananas fried in coconut oil with fresh black pepper and rock salt.', '/static/images/banana_chips.jpg', 'SNK-CHP-01', 4.7, 130, 1, 'TOP SNACK', 0, 0, 0, 'approved', 1, None),
        (3, 'Farm Fresh A2 Paneer (Malai Cubes)', 'dairy', 'Bellary Organic Dairy', 'Rich, chemical-free cottage cheese freshly pressed every morning.', '/static/images/cat_dairy.jpg', 'DAR-PAN-01', 4.8, 12, 0, None, 0, 1, 0, 'pending', 1, None),
        (5, 'Vijayanagar Roasted Gram & Peanuts Mixture', 'snacks', 'Vijayanagar Mart', 'Crispy roasted chana dal and salted peanuts prepared in peanut oil.', '/static/images/mixture_snacks.jpg', 'SNK-ROA-01', 4.4, 38, 0, None, 0, 0, 0, 'approved', 1, None),
        (1, 'Organic Hydroponic Cherry Tomatoes', 'veggies', 'Tungabhadra Farms', 'Sweet, bite-sized hydroponic cherry tomatoes cultivated in Hospete climate polyhouse.', '/static/images/tomatoes.jpg', 'VEG-CHR-01', 4.9, 16, 1, 'NEW CROP', 0, 1, 0, 'pending', 1, None),
        (2, 'Hampi Special Traditional Mysore Pak', 'snacks', 'Hampi Heritage Sweets', 'Royal ghee Mysore Pak packed in special tin gift box.', '/static/images/mixture_snacks.jpg', 'SNK-MYS-01', 4.5, 22, 0, None, 0, 0, 0, 'rejected', 1, 'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.'),
        (1, 'Seasonal Ratnagiri Alphonso Mangoes', 'fruits', 'Hospete Orchard', 'Naturally ripened carbide-free Alphonso mangoes with rich saffron pulp.', '/static/images/bananas.jpg', 'FRT-MNG-01', 4.9, 88, 0, None, 0, 1, 0, 'approved', 0, None),
        (1, 'Fresh Kolar Cauliflower (Gobi)', 'veggies', 'Local Fresh', 'Crisp white florets harvested with protective green leaves from Kolar-Bellary farms.', '/static/images/coriander.jpg', 'VEG-CAU-01', 4.6, 42, 0, None, 0, 1, 0, 'approved', 1, None)
    ]

    cursor.executemany('''
    INSERT INTO products (vendor_id, name, category_slug, brand, description, image_url, sku, rating, review_count, is_deal, deal_tag, is_bestseller, is_fresh, is_bulk, approval_status, is_active, rejection_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', products)

    # Seed Product Variants (Pack size, Price, MRP, Stock)
    variants = [
        # Product 1: Tomatoes (Vendor 1)
        (1, '500 g', 18.0, 24.0, 45, 1),
        (1, '1 kg', 32.0, 45.0, 30, 0),
        (1, '2 kg (Family Pack)', 59.0, 90.0, 20, 0),

        # Product 2: Coriander (Vendor 1)
        (2, '1 Bunch (100g)', 12.0, 15.0, 25, 1),
        (2, '2 Bunches', 22.0, 30.0, 15, 0),

        # Product 3: Nandini Milk (Vendor 1)
        (3, '500 ml', 24.0, 24.0, 60, 1),
        (3, '1 Litre', 46.0, 48.0, 40, 0),

        # Product 4: Nandini Ghee (Vendor 1)
        (4, '200 ml Jar', 135.0, 145.0, 30, 0),
        (4, '500 ml Pouch', 315.0, 340.0, 40, 1),
        (4, '1 Litre Tin', 610.0, 660.0, 15, 0),

        # Product 5: Mixture Snacks (Vendor 2)
        (5, '200 g Pouch', 48.0, 60.0, 50, 1),
        (5, '400 g Pack', 92.0, 120.0, 35, 0),
        (5, '1 kg Jar', 220.0, 290.0, 20, 0),

        # Product 6: Sona Masoori Rice (Vendor 1)
        (6, '1 kg', 65.0, 75.0, 40, 1),
        (6, '5 kg Bag', 310.0, 360.0, 25, 0),
        (6, '25 kg Family Sack', 1450.0, 1750.0, 10, 0),

        # Product 7: Aashirvaad Atta (Vendor 1)
        (7, '1 kg', 52.0, 60.0, 35, 0),
        (7, '5 kg Value Pack', 245.0, 285.0, 40, 1),
        (7, '10 kg Mega Pack', 475.0, 550.0, 18, 0),

        # Product 8: Bananas (Vendor 1)
        (8, '500 g (approx 6 pcs)', 25.0, 32.0, 30, 1),
        (8, '1 kg (approx 12 pcs)', 45.0, 60.0, 25, 0),

        # Product 9: Mysore Sandal Soap (Vendor 1)
        (9, '75 g Single', 45.0, 50.0, 50, 0),
        (9, '125 g Pack of 3', 215.0, 250.0, 30, 1),

        # Product 10: Sunflower Oil (Vendor 1)
        (10, '1 Litre Pouch', 135.0, 160.0, 35, 1),
        (10, '5 Litre Can', 650.0, 780.0, 15, 0),

        # Product 11: Tata Tea Gold (Vendor 1)
        (11, '250 g', 140.0, 160.0, 30, 1),
        (11, '500 g Pack', 265.0, 310.0, 20, 0),

        # Product 12: Banana Chips (Vendor 2)
        (12, '150 g Pouch', 42.0, 55.0, 40, 1),
        (12, '300 g Family Pack', 80.0, 105.0, 25, 0),

        # Product 13: A2 Paneer (Vendor 3 - Pending Approval)
        (13, '200 g Block', 95.0, 110.0, 20, 1),
        (13, '500 g Pack', 225.0, 260.0, 15, 0),

        # Product 14: Roasted Gram (Vendor 5 - Suspended)
        (14, '200 g Pack', 45.0, 60.0, 20, 1),
        (14, '500 g Family Pack', 100.0, 140.0, 10, 0),

        # Product 15: Cherry Tomatoes (Vendor 1 - Pending Approval)
        (15, '250 g Clamshell', 45.0, 60.0, 30, 1),
        (15, '500 g Punnet', 85.0, 110.0, 15, 0),

        # Product 16: Mysore Pak (Vendor 2 - Rejected)
        (16, '250 g Gift Tin', 180.0, 220.0, 25, 1),
        (16, '500 g Festive Box', 340.0, 400.0, 15, 0),

        # Product 17: Mangoes (Vendor 1 - Inactive / Hidden)
        (17, '1 kg Box', 420.0, 500.0, 12, 1),
        (17, '3 kg Crate', 1200.0, 1450.0, 5, 0),

        # Product 18: Cauliflower (Vendor 1 - Out of Stock)
        (18, '1 Medium Head', 28.0, 35.0, 0, 1)
    ]

    cursor.executemany('''
    INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', variants)

    # Seed Initial Catalog Audit Logs
    catalog_audit_logs = [
        ('superadmin@hospetegrocery.in', 17, 'HIDE', 'Live Active', 'Inactive / Hidden', 'Off-season inventory paused per orchard supplier request.'),
        ('superadmin@hospetegrocery.in', 16, 'REJECT', 'Pending Approval', 'Rejected', 'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.'),
        ('superadmin@hospetegrocery.in', 12, 'APPROVE', 'Pending Approval', 'Live Active', 'FSSAI license verified and batch packaging approved.')
    ]
    cursor.executemany('''
    INSERT INTO admin_catalog_audit_logs (admin_identifier, product_id, action, previous_state, new_state, reason)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', catalog_audit_logs)

    # Seed sample orders with vendor_id
    cursor.execute('''
    INSERT INTO orders (order_number, customer_name, phone, delivery_address, locality, total_amount, payment_method, status)
    VALUES ('HF-83921', 'Ramesh Rao', '9845012345', '#42, 3rd Cross, Gandhi Nagar', 'Patel Nagar', 389.0, 'UPI / PhonePe', 'Out for Delivery')
    ''')
    sample_order_id = cursor.lastrowid
    cursor.execute('''
    INSERT INTO order_items (order_id, product_id, vendor_id, product_name, pack_size, unit_price, quantity, subtotal, fulfillment_status)
    VALUES (?, 1, 1, 'Farm Fresh Red Tomatoes', '1 kg', 32.0, 2, 64.0, 'Dispatched')
    ''', (sample_order_id,))
    cursor.execute('''
    INSERT INTO order_items (order_id, product_id, vendor_id, product_name, pack_size, unit_price, quantity, subtotal, fulfillment_status)
    VALUES (?, 4, 1, 'Nandini Pure Cow Ghee', '500 ml Pouch', 315.0, 1, 315.0, 'Dispatched')
    ''', (sample_order_id,))

    conn.commit()
    conn.close()
    print("Hospete Fresh SQLite database with Vendor Module initialized successfully at:", DB_PATH)

if __name__ == '__main__':
    init_db()
