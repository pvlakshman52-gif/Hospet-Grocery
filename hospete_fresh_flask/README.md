# Hospete Fresh - Mobile Grocery Shopping Application & Vendor Marketplace

A clean, modern grocery-commerce web application and vendor management portal for Hospete, Karnataka, built with Flask, SQLite, HTML5, modern CSS3, and JavaScript.

## 🚀 Key Modules & Capabilities

### 1. Vendor Onboarding, Registration & Authentication Module
- **Vendor Registration**: Responsive registration page (`/vendor/register`) with business name, owner name, 10-digit mobile number, email, business type (Farmer, Dairy, Snacks, Grocery, Other), Hospete base locality, delivery service area, address, secure password hashing, and clear validation.
- **Pending Approval Workflow**: Registered vendors automatically enter **Pending Approval** status. Pending or rejected vendors cannot publish live items or accept customer orders.
- **Telecom Notice**: Explicit notice on carrier phone verification noting SMS OTP gateway is slated for future carrier integration.
- **Secure Authentication & Session Protection**: Login (`/vendor/login`) and logout (`/vendor/logout`) routes protected with `@vendor_required` authorization decorators.
- **Multi-Vendor Role Scoping**: Vendors can strictly only access, view, and modify their own catalog products, inventory, and assigned orders.

### 2. Vendor Product & Dynamic Variant Management
- **Add New Product Listing** (`/vendor/products/new`): Name, category, brand, description, image, SKU, and dynamic pack-variant builder.
- **Multi-Pack Variant Support**: Add multiple pack sizes (e.g. 500g, 1kg, 2kg Family Pack) with independent Selling Price (₹), MRP (₹), stock units, and default flag.
- **Edit Existing Products & Variants** (`/vendor/products/<id>/edit`): Re-save prices, add variants, or update descriptions with automatic re-validation.

### 3. Vendor Inventory & Stock Manager (Visual Reference Matched)
- **Header Card**: Heading **Vendor Inventory & Stock Manager**, subtitle, and green **Test in Mobile Store &rarr;** button.
- **White Rounded Panel**: Titled **Product Variants & Stock Inventory** with live variant count badge.
- **Structured Table**: Product Name (bold), Brand (muted), Pack Size (bold), Selling Price (green), MRP (strikethrough), Stock Units (green available, amber low, red out-of-stock badge).
- **Instant Stock Actions**:
  - **Set Out of Stock**: Instantly sets variant `stock_qty = 0` in SQLite.
  - **Restock 50**: Instantly restores variant stock to `50` units.
- **Customer Storefront Protection**: Out-of-stock items immediately disable customer ordering and are blocked in `/add-to-cart`.

### 4. Administrator Console & Vendor Moderation (`/admin`)
- **Vendor Applications Review Tab**: View all registered vendors, contact info, business type, and registration status.
- **Approve, Reject, or Suspend**: Administrators can approve pending vendor applications, reject with feedback reasons, or toggle active/suspended status.
- **Catalog Moderation**: Review and approve/reject vendor product submissions before they appear in the customer store.

### 5. Customer Home Screen Reference Sequence (`/`)
- 1. Delivery header with Hospete localities (College Rd, Patel Nagar, Dam Rd, Amaravathi, etc.) and ETA.
- 2. Search bar with instant suggestions.
- 3. Full promotional grocery banner (Tungabhadra Harvest Fest, code HOSPETE30).
- 4. Four shortcuts: Offers, Best Sellers, Fresh Farm, Bulk Packs.
- 5. "Shop by Category" with "See All".
- 6. Four-column category tile grid with icons and badges.
- 7. "Today's Flash Deals" horizontal scrollable product cards.
- 8. Compact 2-column grocery product cards with solid green Add buttons.
- 9. Fixed 5-tab bottom navigation (Home, Categories, Search, Orders, Account).
- 10. Floating basket summary bar.

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

# 4. Initialize and seed the SQLite database with full Hospete catalog and demo accounts
python init_db.py

# 5. Start the Flask application
python app.py
```

Now open your web browser at:
- **Vendor Portal**: http://127.0.0.1:5000/vendor
  - *Demo Approved Farmer*: Phone `9845011111`, Password `vendor123` (Suresh Gowda - Tungabhadra Agro)
  - *Demo Approved Snacks*: Phone `9845022222`, Password `vendor123` (Prasad Rao - Hospete Sweets)
  - *Demo Pending Supplier*: Phone `9845033333`, Password `vendor123` (Manjunath K - Bellary Dairy)
  - *Register New*: http://127.0.0.1:5000/vendor/register
- **Customer Mobile Storefront**: http://127.0.0.1:5000/
- **Admin Management Portal**: http://127.0.0.1:5000/admin
- **Delivery Partner Fleet**: http://127.0.0.1:5000/delivery
