# Hospete Fresh - Mobile Grocery Shopping Application & Vendor Marketplace

A clean, modern grocery-commerce web application for Hospete, Karnataka, built with Flask, SQLite, HTML5, modern CSS3, and JavaScript.

## 🚀 Key Fixes & Features in this Version

1. **Vendor Inventory & Stock Manager (Reference Matched)**:
   - **White Header Card**: Heading **Vendor Inventory & Stock Manager**, subtitle, and green **Test in Mobile Store &rarr;** button linking directly to `/`.
   - **White Rounded Panel**: Titled **Product Variants & Stock Inventory** with total variant count badge.
   - **Variant-Based Rows**: Every pack size (e.g., 500g, 1kg, 2kg) displays as an independent inventory row with Product Name (bold), Brand (muted), Pack Size (bold), Selling Price (green), MRP (strikethrough), and Stock Units (green available, amber low, red out-of-stock badge).
   - **Stock Actions**:
     - **Set Out of Stock**: Instantly zeroes variant stock in SQLite (`stock_qty = 0`) with confirmation and flash notification.
     - **Restock 50**: Instantly restores variant stock in SQLite (`stock_qty = 50`) so customers can purchase again.
   - **Customer Storefront Protection**: Out-of-stock items are automatically disabled in customer product cards and blocked on the server in `/add-to-cart`.
   - **Full Desktop Layout**: Vendor `/vendor`, Admin `/admin`, and Delivery `/delivery` screens bypass mobile shell constraints and use full responsive desktop width.

2. **Fixed Product-Card ADD Button**:
   - Resolved conflicting CSS rules where `.btn` was styled as white with green text.
   - High-specificity `.btn-add` rule applied: vibrant `#16a34a` grocery-green background with `#ffffff` text and icon.
   - Full hover state (`#15803d`), active touch states, and disabled grey styling when stock is exhausted.

3. **Customer Home Screen Reference Sequence**:
   - 1. App header with delivery location dropdown (Patel Nagar, College Rd, Amaravathi, etc.) and ETA.
   - 2. Search bar with instant suggestions.
   - 3. Full promotional grocery banner (Tungabhadra Harvest Fest, code HOSPETE30).
   - 4. Four shortcuts: Offers, Best Sellers, Fresh Farm, Bulk Packs.
   - 5. "Shop by Category" with "See All".
   - 6. Four-column category tile grid with icons and badges.
   - 7. "Today's Flash Deals" horizontal scrollable product cards.
   - 8. Compact 2-column grocery product cards with stock status and green Add buttons.
   - 9. Fixed 5-tab bottom navigation (Home, Categories, Search, Orders, Account).
   - 10. Non-intrusive floating basket summary bar.

4. **Centered Mobile Frame on Desktop**:
   - Customer mobile screens are framed in a sleek 410px mobile shell on desktop monitors.
   - On actual mobile devices, it smoothly adapts to 100% available viewport width.

5. **Product Details Page**:
   - Large, sharp product image.
   - Back, wishlist heart, and cart counter.
   - Brand, category, star rating, and review count.
   - Selectable pack-size cards (e.g., 500g, 1kg, 2kg) that dynamically update price, MRP, discount %, and cart payload.
   - Quantity stepper (- [qty] +) and green Add to Cart button.
   - Customer assurance row: 100% Fresh, 20-Min Delivery, Easy Returns, Secure UPI/COD.

6. **Fixed Broken Product Image (Mixture Snacks)**:
   - Root cause: Missing file and malformed relative image path in SQLite database.
   - Fixed: Verified static image `mixture_snacks.jpg` in `/static/images/` and resilient SVG fallback in `app.js`.

---

## 💻 PowerShell Commands to Run the Project

Open Windows PowerShell, navigate to the extracted folder, and run:

```powershell
# 1. Navigate to the extracted project folder
cd hospete_fresh_flask

# 2. (Optional but recommended) Create and activate a Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize and seed the SQLite database with full Hospete catalog
python init_db.py

# 5. Start the Flask application
python app.py
```

Now open your web browser at:
- **Vendor Inventory Portal**: http://127.0.0.1:5000/vendor
- **Customer Mobile Storefront**: http://127.0.0.1:5000/
- **Admin Management Portal**: http://127.0.0.1:5000/admin
- **Delivery Partner Fleet**: http://127.0.0.1:5000/delivery
