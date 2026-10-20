import sqlite3
import os

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

    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category_slug TEXT NOT NULL,
        brand TEXT NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        rating REAL DEFAULT 4.5,
        review_count INTEGER DEFAULT 84,
        is_deal INTEGER DEFAULT 0,
        deal_tag TEXT,
        is_bestseller INTEGER DEFAULT 0,
        is_fresh INTEGER DEFAULT 0,
        is_bulk INTEGER DEFAULT 0,
        FOREIGN KEY (category_slug) REFERENCES categories(slug)
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
        product_name TEXT NOT NULL,
        pack_size TEXT NOT NULL,
        unit_price REAL NOT NULL,
        quantity INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
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

    # Seed Categories (Four-column category tile grid)
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

    # Seed Products
    products = [
        ('Farm Fresh Red Tomatoes', 'veggies', 'Tungabhadra Farms', 'Locally harvested ripe farm-fresh red tomatoes, handpicked daily from Hospete rural farms.', '/static/images/tomatoes.jpg', 4.8, 142, 1, 'SAVE 25%', 1, 1, 0),
        ('Fresh Green Coriander (Kothambari)', 'veggies', 'Local Fresh', 'Crisp and aromatic fresh coriander leaves sourced from Tungabhadra riverbed growers.', '/static/images/coriander.jpg', 4.7, 98, 0, None, 0, 1, 0),
        ('Nandini Pasteurised Toned Milk', 'dairy', 'Nandini (KMF)', 'Pure and rich toned cow milk pouch from Karnataka Milk Federation. Homogenised and nutrient rich.', '/static/images/nandini_milk.jpg', 4.9, 310, 1, 'DAILY ESSENTIAL', 1, 1, 0),
        ('Nandini Pure Cow Ghee', 'dairy', 'Nandini (KMF)', 'Golden, granulated authentic Karnataka cow ghee with traditional aroma and pure taste.', '/static/images/nandini_ghee.jpg', 4.9, 215, 1, 'FLAT ₹40 OFF', 1, 0, 0),
        ('South Indian Special Mixture Snacks', 'snacks', 'Hospete Sweets & Namkeen', 'Authentic crispy spicy Karnataka mixture with roasted groundnuts, curry leaves, sev and boondi. Made fresh daily.', '/static/images/mixture_snacks.jpg', 4.6, 178, 1, 'BESTSELLER', 1, 0, 0),
        ('Premium Sona Masoori Rice', 'staples', 'Tungabhadra Gold', 'Aged, lightweight and aromatic Karnataka Sona Masoori raw rice. Ideal for everyday meals.', '/static/images/sona_masoori.jpg', 4.8, 260, 0, None, 1, 0, 1),
        ('Aashirvaad Shudh Chakki Atta', 'staples', 'Aashirvaad', '100% whole wheat flour, naturally rich in dietary fibre for soft and fluffy rotis.', '/static/images/aashirvaad_atta.jpg', 4.8, 190, 1, 'VALUE PACK', 1, 0, 1),
        ('Robusta Fresh Bananas', 'fruits', 'Hospete Orchard', 'Sweet, energetic locally grown bananas from Bellary & Hospete fruit plantations.', '/static/images/bananas.jpg', 4.7, 112, 0, None, 0, 1, 0),
        ('Mysore Sandal Classic Soap', 'household', 'KSDL', 'World-famous authentic sandalwood oil toilet soap from Government of Karnataka.', '/static/images/mysore_sandal.jpg', 4.9, 340, 1, 'HERITAGE CARE', 1, 0, 0),
        ('Gemini Pure Refined Sunflower Oil', 'oils', 'Gemini', 'Enriched with Vitamin A and D. Light cooking oil for heart-healthy South Indian cooking.', '/static/images/sunflower_oil.jpg', 4.7, 165, 0, None, 0, 0, 1),
        ('Tata Tea Gold Leaf Tea', 'beverages', 'Tata Tea', 'Gentle blend of rich Assam CTC teas with 15% long leaves for heavenly aroma and strength.', '/static/images/tata_tea.jpg', 4.8, 145, 0, None, 1, 0, 0),
        ('Crispy Masala Banana Chips', 'snacks', 'Malnad Crunch', 'Thinly sliced raw bananas fried in coconut oil with fresh black pepper and rock salt.', '/static/images/banana_chips.jpg', 4.7, 130, 1, 'TOP SNACK', 0, 0, 0)
    ]

    cursor.executemany('''
    INSERT INTO products (name, category_slug, brand, description, image_url, rating, review_count, is_deal, deal_tag, is_bestseller, is_fresh, is_bulk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', products)

    # Seed Product Variants (Pack size, Price, MRP, Stock)
    variants = [
        # Product 1: Tomatoes
        (1, '500 g', 18.0, 24.0, 45, 1),
        (1, '1 kg', 32.0, 45.0, 30, 0),
        (1, '2 kg (Family Pack)', 59.0, 90.0, 20, 0),

        # Product 2: Coriander
        (2, '1 Bunch (100g)', 12.0, 15.0, 25, 1),
        (2, '2 Bunches', 22.0, 30.0, 15, 0),

        # Product 3: Nandini Milk
        (3, '500 ml', 24.0, 24.0, 60, 1),
        (3, '1 Litre', 46.0, 48.0, 40, 0),

        # Product 4: Nandini Ghee
        (4, '200 ml Jar', 135.0, 145.0, 30, 0),
        (4, '500 ml Pouch', 315.0, 340.0, 40, 1),
        (4, '1 Litre Tin', 610.0, 660.0, 15, 0),

        # Product 5: Mixture Snacks (Fixed!)
        (5, '200 g Pouch', 48.0, 60.0, 50, 1),
        (5, '400 g Pack', 92.0, 120.0, 35, 0),
        (5, '1 kg Jar', 220.0, 290.0, 20, 0),

        # Product 6: Sona Masoori Rice
        (6, '1 kg', 65.0, 75.0, 40, 1),
        (6, '5 kg Bag', 310.0, 360.0, 25, 0),
        (6, '25 kg Family Sack', 1450.0, 1750.0, 10, 0),

        # Product 7: Aashirvaad Atta
        (7, '1 kg', 52.0, 60.0, 35, 0),
        (7, '5 kg Value Pack', 245.0, 285.0, 40, 1),
        (7, '10 kg Mega Pack', 475.0, 550.0, 18, 0),

        # Product 8: Bananas
        (8, '500 g (approx 6 pcs)', 25.0, 32.0, 30, 1),
        (8, '1 kg (approx 12 pcs)', 45.0, 60.0, 25, 0),

        # Product 9: Mysore Sandal Soap
        (9, '75 g Single', 45.0, 50.0, 50, 0),
        (9, '125 g Pack of 3', 215.0, 250.0, 30, 1),

        # Product 10: Sunflower Oil
        (10, '1 Litre Pouch', 135.0, 160.0, 35, 1),
        (10, '5 Litre Can', 650.0, 780.0, 15, 0),

        # Product 11: Tata Tea Gold
        (11, '250 g', 140.0, 160.0, 30, 1),
        (11, '500 g Pack', 265.0, 310.0, 20, 0),

        # Product 12: Banana Chips
        (12, '150 g Pouch', 42.0, 55.0, 40, 1),
        (12, '300 g Family Pack', 80.0, 105.0, 25, 0)
    ]

    cursor.executemany('''
    INSERT INTO product_variants (product_id, pack_size, price, mrp, stock_qty, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', variants)

    # Seed sample placed order
    cursor.execute('''
    INSERT INTO orders (order_number, customer_name, phone, delivery_address, locality, total_amount, payment_method, status)
    VALUES ('HF-83921', 'Ramesh Rao', '9845012345', '#42, 3rd Cross, Gandhi Nagar', 'Patel Nagar', 389.0, 'UPI / PhonePe', 'Out for Delivery')
    ''')
    sample_order_id = cursor.lastrowid
    cursor.execute('''
    INSERT INTO order_items (order_id, product_id, product_name, pack_size, unit_price, quantity, subtotal)
    VALUES (?, 1, 'Farm Fresh Red Tomatoes', '1 kg', 32.0, 2, 64.0)
    ''', (sample_order_id,))
    cursor.execute('''
    INSERT INTO order_items (order_id, product_id, product_name, pack_size, unit_price, quantity, subtotal)
    VALUES (?, 4, 'Nandini Pure Cow Ghee', '500 ml Pouch', 315.0, 1, 315.0)
    ''', (sample_order_id,))

    conn.commit()
    conn.close()
    print("Hospete Fresh SQLite database initialized successfully at:", DB_PATH)

if __name__ == '__main__':
    init_db()
