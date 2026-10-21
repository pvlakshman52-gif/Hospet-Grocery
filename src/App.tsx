/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  Minus,
  Check,
  Heart,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Download,
  Terminal,
  Store,
  Bike,
  LayoutDashboard,
  Smartphone,
  Maximize2,
  Minimize2,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, INITIAL_PRODUCTS, INITIAL_VENDORS, LOCALITIES, INITIAL_CATALOG_AUDIT_LOGS } from './data.ts';
import { CartItem, Order, Product, ProductVariant, Vendor, AdminPreviewLog, CatalogAuditLog } from './types.ts';
import { VendorPortal } from './components/VendorPortal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';

type AppTab = 'home' | 'categories' | 'search' | 'orders' | 'account';
type RoleView = 'customer' | 'admin' | 'vendor' | 'delivery' | 'deliverables';

export default function App() {
  const [roleView, setRoleView] = useState<RoleView>('customer');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isMobileFrame, setIsMobileFrame] = useState(true);

  // Data states
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [currentVendor, setCurrentVendor] = useState<Vendor | null>(INITIAL_VENDORS[0]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedLocality, setSelectedLocality] = useState(LOCALITIES[1]); // Patel Nagar
  const [searchQuery, setSearchQuery] = useState('');
  const [activeShortcut, setActiveShortcut] = useState<'all' | 'offers' | 'bestsellers' | 'fresh' | 'bulk'>('all');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [vendorNotice, setVendorNotice] = useState<{ text: string; type: 'warning' | 'success' } | null>(null);

  // Admin Preview State & Audit Logs
  const [adminPreviewState, setAdminPreviewState] = useState<{
    isPreview: boolean;
    vendorId: number | null;
    safeMode: boolean;
  }>({
    isPreview: false,
    vendorId: null,
    safeMode: true
  });

  const [adminPreviewLogs, setAdminPreviewLogs] = useState<AdminPreviewLog[]>([
    {
      id: 'log-init-1',
      adminIdentifier: 'superadmin@hospetegrocery.in',
      vendorId: 1,
      vendorName: 'Tungabhadra Agro & Organics',
      action: 'ENTER_PREVIEW',
      notes: 'Initial operational audit inspection of inventory variants.',
      timestamp: '2026-03-16 10:15'
    }
  ]);

  const [catalogAuditLogs, setCatalogAuditLogs] = useState<CatalogAuditLog[]>(INITIAL_CATALOG_AUDIT_LOGS);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Cart state: keyed by variantId
  const [cart, setCart] = useState<Record<number, CartItem>>({});

  // Product details modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [pdpQty, setPdpQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Checkout modal / screen
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('Ramesh Rao');
  const [customerPhone, setCustomerPhone] = useState('9845012345');
  const [customerAddress, setCustomerAddress] = useState('#42, 3rd Main, Patel Nagar');
  const [paymentMethod, setPaymentMethod] = useState('UPI / PhonePe / GPay');

  // Orders state
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 83921,
      orderNumber: 'HF-83921',
      customerName: 'Ramesh Rao',
      phone: '9845012345',
      address: '#42, 3rd Cross, Gandhi Nagar',
      locality: 'Patel Nagar',
      totalAmount: 389,
      paymentMethod: 'UPI / PhonePe',
      status: 'Out for Delivery',
      createdAt: 'Today, 2:15 PM',
      items: [
        { productName: 'Farm Fresh Red Tomatoes', packSize: '1 kg', unitPrice: 32, quantity: 2, subtotal: 64 },
        { productName: 'Nandini Pure Cow Ghee', packSize: '500 ml Pouch', unitPrice: 315, quantity: 1, subtotal: 315 }
      ]
    }
  ]);

  // Cart calculations
  const cartItemList = useMemo(() => Object.values(cart), [cart]);
  const cartItemCount = useMemo(() => cartItemList.reduce((acc, it) => acc + it.qty, 0), [cartItemList]);
  const cartSubtotal = useMemo(() => cartItemList.reduce((acc, it) => acc + it.price * it.qty, 0), [cartItemList]);
  const cartMrpTotal = useMemo(() => cartItemList.reduce((acc, it) => acc + it.mrp * it.qty, 0), [cartItemList]);
  const cartSavings = Math.max(0, cartMrpTotal - cartSubtotal);
  const deliveryFee = cartSubtotal >= 199 || cartSubtotal === 0 ? 0 : 25;
  const grandTotal = cartSubtotal + deliveryFee;

  // Cart actions
  const handleAddToCart = (product: Product, variant: ProductVariant, qtyToAdd = 1) => {
    if (variant.stockQty <= 0) return;
    setCart(prev => {
      const existing = prev[variant.id];
      const newQty = existing ? existing.qty + qtyToAdd : qtyToAdd;
      return {
        ...prev,
        [variant.id]: {
          variantId: variant.id,
          productId: product.id,
          name: product.name,
          packSize: variant.packSize,
          price: variant.price,
          mrp: variant.mrp,
          imageUrl: product.imageUrl,
          qty: newQty
        }
      };
    });
  };

  const handleUpdateQty = (variantId: number, newQty: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (newQty <= 0) {
        delete next[variantId];
      } else if (next[variantId]) {
        next[variantId] = { ...next[variantId], qty: newQty };
      }
      return next;
    });
  };

  // Open Product Details
  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    const defVar = product.variants.find(v => v.isDefault) || product.variants[0];
    setSelectedVariant(defVar);
    setPdpQty(1);
    setIsWishlisted(false);
  };

  // Place order
  const handlePlaceOrder = () => {
    if (cartItemList.length === 0) return;
    setCheckoutError(null);

    // Revalidate items against current catalog & vendor state
    for (const item of cartItemList) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        setCheckoutError(`Product "${item.name}" is no longer available in the catalog.`);
        return;
      }
      if (prod.approvalStatus !== 'approved') {
        setCheckoutError(`Product "${item.name}" is currently awaiting approval or rejected.`);
        return;
      }
      if (prod.isActive === false) {
        setCheckoutError(`Product "${item.name}" is currently marked inactive/hidden by store administration.`);
        return;
      }
      if (prod.vendorId) {
        const v = vendors.find(vend => vend.id === prod.vendorId);
        if (v && v.status !== 'approved') {
          setCheckoutError(`Supplier "${v.businessName}" for "${item.name}" is currently ${v.status}. New orders cannot be fulfilled.`);
          return;
        }
      }
      const variant = prod.variants.find(vr => vr.id === item.variantId);
      if (!variant || variant.stockQty < item.qty) {
        setCheckoutError(`Item "${item.name}" (${item.packSize}) only has ${variant?.stockQty ?? 0} units left in stock.`);
        return;
      }
    }

    const orderNum = `HF-${Math.floor(10000 + Math.random() * 90000)}`;
    const newOrder: Order = {
      id: Date.now(),
      orderNumber: orderNum,
      customerName,
      phone: customerPhone,
      address: customerAddress,
      locality: selectedLocality.name,
      totalAmount: grandTotal,
      paymentMethod,
      status: 'Placed',
      createdAt: 'Just now',
      items: cartItemList.map(it => ({
        productName: it.name,
        packSize: it.packSize,
        unitPrice: it.price,
        quantity: it.qty,
        subtotal: it.price * it.qty
      }))
    };
    setOrders(prev => [newOrder, ...prev]);
    setCart({});
    setIsCheckoutOpen(false);
    setActiveTab('orders');
  };

  // Filter products for Customer Home (Only approved products from approved vendors!)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Check product approval status
      if (p.approvalStatus && p.approvalStatus !== 'approved') return false;

      // Check product active / storefront visibility toggle
      if (p.isActive === false) return false;

      // Check vendor status if assigned
      if (p.vendorId) {
        const v = vendors.find(vend => vend.id === p.vendorId);
        if (v && v.status !== 'approved') return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedCategorySlug && p.categorySlug !== selectedCategorySlug) {
        return false;
      }
      if (activeShortcut === 'offers') {
        const def = p.variants.find(v => v.isDefault) || p.variants[0];
        return p.isDeal || def.mrp > def.price;
      }
      if (activeShortcut === 'bestsellers') return p.isBestseller;
      if (activeShortcut === 'fresh') return p.isFresh;
      if (activeShortcut === 'bulk') return p.isBulk;
      return true;
    });
  }, [products, vendors, searchQuery, selectedCategorySlug, activeShortcut]);

  // Flash deals
  const deals = useMemo(() => filteredProducts.filter(p => p.isDeal), [filteredProducts]);

  // Fallback image helper
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, label: string) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="20" y="20" width="260" height="260" rx="16" fill="%23ecfdf5" stroke="%23bbf7d0" stroke-width="2"/><text x="150" y="140" font-size="42" text-anchor="middle">🥗</text><text x="150" y="180" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle" fill="%23065f46">${encodeURIComponent(label)}</text><text x="150" y="202" font-family="sans-serif" font-size="11" text-anchor="middle" fill="%2316a34a">Hospete Fresh Verified</text></svg>`;
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* TOP CONTROL NAVIGATION BAR: Switch roles & toggle preview */}
      <header className="bg-slate-900 text-white px-4 py-2.5 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Role Tag */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-xs font-black px-2.5 py-1 rounded tracking-tight">
                HOSPETE FRESH
              </span>
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">
                Grocery-Commerce UI Engine
              </span>
            </div>

            {/* Quick role tabs */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs font-medium border border-slate-700">
              <button
                onClick={() => setRoleView('customer')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'customer'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Customer App</span>
              </button>
              <button
                onClick={() => setRoleView('admin')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'admin'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Admin Portal</span>
              </button>
              <button
                onClick={() => setRoleView('vendor')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'vendor'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Vendor</span>
              </button>
              <button
                onClick={() => setRoleView('delivery')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'delivery'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Delivery</span>
              </button>
              <button
                onClick={() => setRoleView('deliverables')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                  roleView === 'deliverables'
                    ? 'bg-amber-500 text-slate-900 font-bold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download ZIP</span>
              </button>
            </div>
          </div>

          {/* Right controls: frame toggle & quick download */}
          <div className="flex items-center gap-3">
            {roleView === 'customer' && (
              <button
                onClick={() => setIsMobileFrame(!isMobileFrame)}
                className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-md border border-slate-700 transition-colors"
                title="Toggle mobile device shell on desktop"
              >
                {isMobileFrame ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand View</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5" />
                    <span>Mobile Frame (410px)</span>
                  </>
                )}
              </button>
            )}

            <a
              href="/hospete_fresh_updated.zip"
              download="hospete_fresh_updated.zip"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get ZIP</span>
            </a>
          </div>
        </div>
      </header>

      {/* =========================================================================
          VIEW 1: CUSTOMER MOBILE VIEW (Centered 390-430px wide preview on desktop)
          ========================================================================= */}
      {roleView === 'customer' && (
        <div
          className={`flex-1 flex justify-center items-start ${
            isMobileFrame
              ? 'py-4 sm:py-6 bg-radial from-slate-200 to-slate-300'
              : 'p-0 bg-white'
          }`}
        >
          {/* Centered Mobile App Shell (390-430px on desktop) */}
          <div
            className={`w-full bg-white flex flex-col relative transition-all ${
              isMobileFrame
                ? 'max-w-[420px] min-h-[850px] max-h-[92vh] rounded-[32px] shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35),0_0_0_10px_#0f172a,0_0_0_12px_#334155] overflow-hidden'
                : 'max-w-4xl min-h-screen'
            }`}
          >
            {/* Status Notch on mobile device */}
            {isMobileFrame && (
              <div className="bg-slate-900 text-slate-300 text-[11px] font-semibold px-5 py-1.5 flex justify-between items-center select-none">
                <span>9:41</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Hospete 5G ⚡
                </span>
              </div>
            )}

            {/* 1. APP HEADER AND DELIVERY LOCATION */}
            <header className="p-3 bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-600 text-white text-xs font-black px-2 py-0.5 rounded tracking-tight">
                    HOSPETE FRESH
                  </div>
                  <div className="flex flex-col">
                    <div className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>⚡ {selectedLocality.etaMinutes} MINS</span>
                    </div>
                    {/* Locality Dropdown */}
                    <div className="relative inline-flex items-center">
                      <MapPin className="w-3 h-3 text-emerald-600 mr-1" />
                      <select
                        value={selectedLocality.name}
                        onChange={e => {
                          const found = LOCALITIES.find(l => l.name === e.target.value);
                          if (found) setSelectedLocality(found);
                        }}
                        className="text-xs font-bold text-slate-800 bg-transparent pr-4 cursor-pointer focus:outline-hidden"
                      >
                        {LOCALITIES.map(loc => (
                          <option key={loc.name} value={loc.name}>
                            {loc.name}, 583201
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('account')}
                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    👤
                  </button>
                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-8 h-8 rounded-full bg-slate-100 relative flex items-center justify-center text-slate-700 hover:bg-slate-200"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* 2. SEARCH BAR */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search rice, fresh tomatoes, Nandini milk, snacks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick Search Chips */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar pb-0.5 text-[11px]">
                {['All', 'Tomatoes', 'Nandini', 'Mixture Snacks', 'Sona Masoori', 'Atta'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag === 'All' ? '' : tag)}
                    className={`whitespace-nowrap px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                      (tag === 'All' && !searchQuery) || searchQuery === tag
                        ? 'bg-emerald-100 text-emerald-800 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </header>

            {/* SCROLLABLE MOBILE CONTENT */}
            <div className="flex-1 overflow-y-auto pb-24">
              {activeTab === 'home' && (
                <>
                  {/* 3. FULL PROMOTIONAL GROCERY BANNER */}
                  <div className="p-3">
                    <div className="w-full rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-600 text-white p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px]">
                      {/* Decorative background shapes */}
                      <div className="absolute right-0 top-0 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="absolute right-3 bottom-2 text-6xl opacity-30 select-none">🥦</div>

                      <div>
                        <span className="inline-block bg-white/20 text-emerald-100 text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-1 tracking-wider">
                          🌟 Tungabhadra Harvest Fest
                        </span>
                        <h2 className="text-base sm:text-lg font-black leading-tight drop-shadow-xs">
                          Flat 30% OFF on Fresh Farm Staples
                        </h2>
                        <p className="text-xs text-emerald-100 mt-0.5 max-w-[240px]">
                          Handpicked local veggies, Nandini dairy & freshly made snacks delivered in 15 mins.
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 z-10">
                        <span className="bg-white text-emerald-900 text-[11px] font-black px-2.5 py-1 rounded shadow-xs">
                          Code: <strong>HOSPETE30</strong>
                        </span>
                        <button
                          onClick={() => setActiveShortcut('offers')}
                          className="bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black px-3 py-1 rounded-lg shadow-sm transition-transform active:scale-95"
                        >
                          Claim Offer &rarr;
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4. FOUR SHORTCUTS: Offers, Best Sellers, Fresh, Bulk Packs */}
                  <div className="grid grid-cols-4 gap-2 px-3 pb-2">
                    {[
                      { key: 'offers', label: 'Offers', icon: '🏷️', color: 'hover:bg-rose-50' },
                      { key: 'bestsellers', label: 'Best Sellers', icon: '⭐', color: 'hover:bg-amber-50' },
                      { key: 'fresh', label: 'Fresh Farm', icon: '🥦', color: 'hover:bg-emerald-50' },
                      { key: 'bulk', label: 'Bulk Packs', icon: '📦', color: 'hover:bg-blue-50' },
                    ].map(shortcut => (
                      <button
                        key={shortcut.key}
                        onClick={() => {
                          setActiveShortcut(activeShortcut === shortcut.key ? 'all' : (shortcut.key as any));
                          setSelectedCategorySlug(null);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                          activeShortcut === shortcut.key
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs scale-102'
                            : `bg-slate-50 border-slate-200/70 ${shortcut.color}`
                        }`}
                      >
                        <span className="text-xl mb-1">{shortcut.icon}</span>
                        <span className="text-[11px] font-bold text-slate-800 leading-tight">
                          {shortcut.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* 5 & 6. SHOP BY CATEGORY WITH "SEE ALL" & FOUR-COLUMN CATEGORY TILE GRID */}
                  <section className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        Shop by Category
                      </h3>
                      <button
                        onClick={() => setActiveTab('categories')}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
                      >
                        See All &rarr;
                      </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            setSelectedCategorySlug(
                              selectedCategorySlug === cat.slug ? null : cat.slug
                            );
                            setActiveShortcut('all');
                          }}
                          className={`flex flex-col items-center text-center p-1.5 rounded-xl transition-all ${
                            selectedCategorySlug === cat.slug
                              ? 'bg-emerald-50 ring-2 ring-emerald-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-xs mb-1.5 border border-black/5"
                            style={{ backgroundColor: cat.bannerColor }}
                          >
                            <span>{cat.iconEmoji}</span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">
                            {cat.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* 7. TODAY'S DEALS (Horizontal Product Cards) */}
                  {deals.length > 0 && !selectedCategorySlug && activeShortcut === 'all' && (
                    <section className="px-3 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">⚡</span>
                          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                            Today's Flash Deals
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Ends in 3h 40m
                        </span>
                      </div>

                      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
                        {deals.map(prod => {
                          const defVar = prod.variants.find(v => v.isDefault) || prod.variants[0];
                          const discountPct = Math.round(((defVar.mrp - defVar.price) / defVar.mrp) * 100);
                          const inCart = cart[defVar.id];

                          return (
                            <div
                              key={prod.id}
                              className="min-w-[140px] max-w-[140px] bg-white border border-rose-100 rounded-xl p-2.5 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-colors"
                            >
                              <div className="relative">
                                <span className="absolute top-0 left-0 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded z-10">
                                  {prod.dealTag || `${discountPct}% OFF`}
                                </span>
                                <div
                                  onClick={() => handleOpenProduct(prod)}
                                  className="w-full h-24 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer mb-2"
                                >
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    onError={e => handleImageError(e, prod.name)}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                                  />
                                </div>
                                <div
                                  onClick={() => handleOpenProduct(prod)}
                                  className="text-[11px] font-bold text-slate-800 line-clamp-2 h-7 leading-tight cursor-pointer hover:text-emerald-700"
                                >
                                  {prod.name}
                                </div>
                              </div>

                              <div className="mt-2">
                                <div className="text-[10px] text-slate-500 font-medium">
                                  {defVar.packSize}
                                </div>
                                <div className="flex items-baseline gap-1.5 my-1.5">
                                  <span className="text-xs font-black text-slate-900">
                                    ₹{defVar.price}
                                  </span>
                                  {defVar.mrp > defVar.price && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      ₹{defVar.mrp}
                                    </span>
                                  )}
                                </div>

                                {/* SOLID GREEN ADD BUTTON OR STEPPER */}
                                {inCart ? (
                                  <div className="flex items-center justify-between h-8 bg-emerald-600 text-white rounded-md px-1">
                                    <button
                                      onClick={() => handleUpdateQty(defVar.id, inCart.qty - 1)}
                                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold">{inCart.qty}</span>
                                    <button
                                      onClick={() => handleUpdateQty(defVar.id, inCart.qty + 1)}
                                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(prod, defVar, 1)}
                                    className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-md flex items-center justify-center gap-1 shadow-xs transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ADD</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* 8. COMPACT GROCERY PRODUCT CARDS (2-Column Grid) */}
                  <section className="px-3 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                          {selectedCategorySlug
                            ? `${CATEGORIES.find(c => c.slug === selectedCategorySlug)?.name}`
                            : activeShortcut !== 'all'
                            ? `${activeShortcut.toUpperCase()} Selection`
                            : 'Daily Grocery Essentials'}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          ({filteredProducts.length})
                        </span>
                      </div>
                      {(selectedCategorySlug || activeShortcut !== 'all' || searchQuery) && (
                        <button
                          onClick={() => {
                            setSelectedCategorySlug(null);
                            setActiveShortcut('all');
                            setSearchQuery('');
                          }}
                          className="text-[11px] text-emerald-600 font-bold hover:underline"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {filteredProducts.length === 0 ? (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center my-4">
                        <div className="text-3xl mb-2">🔍</div>
                        <h4 className="text-xs font-bold text-slate-800">No products found</h4>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Try searching for tomatoes, milk, mixture snacks, or rice.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2.5">
                        {filteredProducts.map(prod => {
                          const defVar = prod.variants.find(v => v.isDefault) || prod.variants[0];
                          const discountPct = Math.round(((defVar.mrp - defVar.price) / defVar.mrp) * 100);
                          const inCart = cart[defVar.id];
                          const isOutOfStock = defVar.stockQty <= 0;

                          return (
                            <div
                              key={prod.id}
                              className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all group"
                            >
                              <div className="relative">
                                {/* Discount badge */}
                                {discountPct > 0 && (
                                  <span className="absolute top-0 left-0 bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded z-10 shadow-xs">
                                    {discountPct}% OFF
                                  </span>
                                )}

                                {/* Product Image */}
                                <div
                                  onClick={() => handleOpenProduct(prod)}
                                  className="w-full aspect-square bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center cursor-pointer mb-2"
                                >
                                  <img
                                    src={prod.imageUrl}
                                    alt={prod.name}
                                    onError={e => handleImageError(e, prod.name)}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>

                                <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mb-0.5">
                                  {prod.brand}
                                </div>
                                <h4
                                  onClick={() => handleOpenProduct(prod)}
                                  className="text-xs font-bold text-slate-900 line-clamp-2 h-8 leading-snug cursor-pointer hover:text-emerald-700"
                                >
                                  {prod.name}
                                </h4>
                              </div>

                              <div className="mt-2 pt-1 border-t border-slate-100">
                                <div className="text-[10px] text-slate-500 font-medium">
                                  {defVar.packSize}
                                </div>
                                <div className="flex items-baseline gap-1.5 my-1.5">
                                  <span className="text-sm font-black text-slate-900">
                                    ₹{defVar.price}
                                  </span>
                                  {defVar.mrp > defVar.price && (
                                    <span className="text-[11px] text-slate-400 line-through">
                                      ₹{defVar.mrp}
                                    </span>
                                  )}
                                </div>

                                {/* CRITICAL REQUIREMENT 3:
                                    The Add button must be green background with white text and plus icon,
                                    with disabled visibly grey state only when out of stock. */}
                                {isOutOfStock ? (
                                  <button
                                    disabled
                                    className="w-full h-8 bg-slate-100 text-slate-400 font-bold text-xs rounded-md border border-slate-200 cursor-not-allowed"
                                  >
                                    Out of Stock
                                  </button>
                                ) : inCart ? (
                                  <div className="flex items-center justify-between h-8 bg-emerald-600 text-white rounded-md px-1 shadow-xs">
                                    <button
                                      onClick={() => handleUpdateQty(defVar.id, inCart.qty - 1)}
                                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded active:scale-95"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-bold">{inCart.qty}</span>
                                    <button
                                      onClick={() => handleUpdateQty(defVar.id, inCart.qty + 1)}
                                      className="w-6 h-6 flex items-center justify-center font-bold text-sm hover:bg-emerald-700 rounded active:scale-95"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleAddToCart(prod, defVar, 1)}
                                    className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs rounded-md flex items-center justify-center gap-1 shadow-xs transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ADD</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* TAB 2: CATEGORIES */}
              {activeTab === 'categories' && (
                <div className="p-3">
                  <h2 className="text-sm font-extrabold text-slate-900 mb-3">All Grocery Categories</h2>
                  <div className="space-y-3">
                    {CATEGORIES.map(cat => {
                      const catProds = products.filter(p => p.categorySlug === cat.slug);
                      return (
                        <div key={cat.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{cat.iconEmoji}</span>
                              <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedCategorySlug(cat.slug);
                                setActiveTab('home');
                              }}
                              className="text-[11px] font-bold text-emerald-600 hover:underline"
                            >
                              View All ({catProds.length}) &rarr;
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {catProds.slice(0, 2).map(p => {
                              const def = p.variants[0];
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleOpenProduct(p)}
                                  className="border border-slate-100 rounded-lg p-2 bg-slate-50 flex items-center gap-2 cursor-pointer hover:bg-emerald-50/50"
                                >
                                  <img
                                    src={p.imageUrl}
                                    alt={p.name}
                                    onError={e => handleImageError(e, p.name)}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-bold text-slate-800 truncate">
                                      {p.name}
                                    </div>
                                    <div className="text-[11px] font-black text-emerald-700">
                                      ₹{def.price}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: SEARCH */}
              {activeTab === 'search' && (
                <div className="p-3">
                  <h2 className="text-sm font-extrabold text-slate-900 mb-2">Instant Grocery Search</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredProducts.map(prod => {
                      const def = prod.variants[0];
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleOpenProduct(prod)}
                          className="bg-white border border-slate-200 rounded-xl p-2.5 cursor-pointer hover:border-emerald-500"
                        >
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            onError={e => handleImageError(e, prod.name)}
                            className="w-full aspect-square object-cover rounded-lg mb-2"
                          />
                          <div className="text-xs font-bold text-slate-900 truncate">{prod.name}</div>
                          <div className="text-xs font-black text-emerald-700 mt-1">₹{def.price}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: ORDERS */}
              {activeTab === 'orders' && (
                <div className="p-3">
                  <h2 className="text-sm font-extrabold text-slate-900 mb-3">Your Orders & Deliveries</h2>
                  <div className="space-y-3">
                    {orders.map(ord => (
                      <div key={ord.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-900">{ord.orderNumber}</span>
                            <div className="text-[10px] text-slate-400">{ord.createdAt}</div>
                          </div>
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            {ord.status}
                          </span>
                        </div>

                        <div className="py-2 space-y-1">
                          {ord.items.map((itm, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-600">
                              <span>
                                {itm.quantity}x {itm.productName} ({itm.packSize})
                              </span>
                              <span className="font-semibold text-slate-900">₹{itm.subtotal}</span>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-dashed border-slate-200 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Delivered to {ord.locality}</span>
                          <span className="font-black text-emerald-700 text-sm">₹{ord.totalAmount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: ACCOUNT */}
              {activeTab === 'account' && (
                <div className="p-3 space-y-3">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xl mx-auto mb-2 font-black">
                      👤
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">Ramesh Rao</h3>
                    <p className="text-xs text-slate-500">+91 98450 12345 • Hospete</p>
                    <span className="inline-block mt-2 text-[10px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                      ★ Hospete Fresh Club Member
                    </span>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="w-full p-3 flex justify-between items-center hover:bg-slate-50 text-left font-semibold text-slate-800"
                    >
                      <span>📦 Order History & Reorder</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="p-3 flex justify-between items-center text-slate-800 font-semibold">
                      <span>📍 Default Address: Patel Nagar, Hospete</span>
                      <span className="text-emerald-600 text-[11px]">Active</span>
                    </div>
                    <div className="p-3 flex justify-between items-center text-slate-800 font-semibold">
                      <span>⚡ 24x7 Hospete Fresh Helpline</span>
                      <span className="text-emerald-700 font-bold">08394-220100</span>
                    </div>
                  </div>

                  {/* Switch to ops portals */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
                    <div className="font-bold text-slate-700 mb-2 uppercase text-[10px] tracking-wider">
                      Operations & Management Portals (Desktop Views)
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => setRoleView('admin')}
                        className="text-left text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Admin Management Console &rarr;</span>
                      </button>
                      <button
                        onClick={() => setRoleView('vendor')}
                        className="text-left text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Vendor Inventory & Stock Manager &rarr;</span>
                      </button>
                      <button
                        onClick={() => setRoleView('delivery')}
                        className="text-left text-emerald-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>Delivery Fleet Partner Dispatch &rarr;</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 10. FLOATING BASKET SUMMARY (Above bottom nav bar) */}
            {cartItemCount > 0 && !isCheckoutOpen && (
              <div className="absolute bottom-16 left-3 right-3 bg-emerald-700 text-white rounded-xl px-3.5 py-2.5 shadow-lg flex items-center justify-between z-30 animate-in fade-in slide-in-from-bottom-2">
                <div>
                  <div className="text-xs font-black">
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} • ₹{cartSubtotal}
                  </div>
                  <div className="text-[10px] text-emerald-200">
                    {deliveryFee === 0 ? '⚡ Free Delivery unlocked' : 'Add ₹' + (199 - cartSubtotal) + ' for Free Delivery'}
                  </div>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-white text-emerald-900 font-extrabold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs hover:bg-emerald-50 active:scale-95 transition-transform"
                >
                  <span>View Basket</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 9. FIXED BOTTOM NAVIGATION (5 items: Home, Categories, Search, Orders, Account) */}
            <nav className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 grid grid-cols-5 items-center z-40">
              {[
                { tab: 'home', label: 'Home', icon: '🏠' },
                { tab: 'categories', label: 'Categories', icon: '📁' },
                { tab: 'search', label: 'Search', icon: '🔍' },
                { tab: 'orders', label: 'Orders', icon: '📦' },
                { tab: 'account', label: 'Account', icon: '👤' },
              ].map(item => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setActiveTab(item.tab as AppTab);
                    if (item.tab === 'home') {
                      setSelectedCategorySlug(null);
                      setActiveShortcut('all');
                      setSearchQuery('');
                    }
                  }}
                  className={`flex flex-col items-center justify-center text-[10px] font-bold transition-colors ${
                    activeTab === item.tab ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="text-base leading-none mb-1">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. PRODUCT DETAILS MODAL / PAGE
          Match the supplied product-details screenshot:
          - Large, sharp product image, properly contained and not distorted
          - Back, wishlist, and cart icons
          - Product name, brand/category, rating/review details
          - Pack-size options displayed as selectable cards
          - Selected pack’s price, MRP, discount, and stock
          - Quantity stepper and prominent green Add to Cart button
          - Benefits row (100% Fresh, 20-min delivery, easy returns, secure UPI/COD)
          ========================================================================= */}
      {selectedProduct && selectedVariant && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-[420px] max-h-[92vh] rounded-3xl overflow-y-auto flex flex-col shadow-2xl relative">
            {/* Top Bar */}
            <div className="p-3 flex items-center justify-between border-b border-slate-100 sticky top-0 bg-white z-10">
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {selectedProduct.brand}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                    }`}
                  />
                </button>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 relative"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Product Image Stage (Sharp, properly contained) */}
            <div className="w-full aspect-[4/3] bg-slate-50 flex items-center justify-center p-6 border-b border-slate-100">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                onError={e => handleImageError(e, selectedProduct.name)}
                className="max-h-full max-w-full object-contain drop-shadow-sm"
              />
            </div>

            {/* Product Body */}
            <div className="p-4 flex-1">
              <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">
                {selectedProduct.categorySlug.toUpperCase()}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                {selectedProduct.name}
              </h2>

              {/* Rating & Stock */}
              <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  ★ {selectedProduct.rating}
                </span>
                <span>({selectedProduct.reviewCount} verified reviews)</span>
                <span>•</span>
                <span className="text-emerald-700 font-bold">
                  {selectedVariant.stockQty > 0
                    ? `In Stock (${selectedVariant.stockQty} left)`
                    : 'Out of Stock'}
                </span>
              </div>

              {/* Pack-size options displayed as selectable cards */}
              <div className="mt-4">
                <div className="text-xs font-bold text-slate-800 mb-2">Select Pack Size:</div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.variants.map(v => {
                    const isSelected = selectedVariant.id === v.id;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2 rounded-xl text-center border-2 transition-all ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="text-[11px] font-bold text-slate-800">{v.packSize}</div>
                        <div className="text-xs font-black text-emerald-700 mt-0.5">₹{v.price}</div>
                        {v.mrp > v.price && (
                          <div className="text-[10px] text-slate-400 line-through">₹{v.mrp}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price & Savings Display */}
              <div className="flex items-baseline gap-2 mt-4 pt-3 border-t border-slate-100">
                <span className="text-2xl font-black text-slate-900">₹{selectedVariant.price}</span>
                {selectedVariant.mrp > selectedVariant.price && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{selectedVariant.mrp}
                  </span>
                )}
                {selectedVariant.mrp > selectedVariant.price && (
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2 py-0.5 rounded">
                    Save ₹{selectedVariant.mrp - selectedVariant.price} (
                    {Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100)}
                    % OFF)
                  </span>
                )}
              </div>

              {/* Stepper and Prominent Green Add to Cart Button */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center border-2 border-slate-200 rounded-xl overflow-hidden h-11 w-28 bg-slate-50">
                  <button
                    onClick={() => pdpQty > 1 && setPdpQty(pdpQty - 1)}
                    className="flex-1 h-full flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black text-slate-900">{pdpQty}</span>
                  <button
                    onClick={() => pdpQty < 10 && setPdpQty(pdpQty + 1)}
                    className="flex-1 h-full flex items-center justify-center font-bold text-slate-700 hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>

                <button
                  disabled={selectedVariant.stockQty <= 0}
                  onClick={() => {
                    handleAddToCart(selectedProduct, selectedVariant, pdpQty);
                    setSelectedProduct(null);
                  }}
                  className={`flex-1 h-11 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 ${
                    selectedVariant.stockQty <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {selectedVariant.stockQty <= 0 ? 'Out of Stock' : `Add to Cart • ₹${selectedVariant.price * pdpQty}`}
                  </span>
                </button>
              </div>

              {/* Highlights */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-1">Product Description</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedProduct.description}</p>
              </div>

              {/* Benefits Row */}
              <div className="grid grid-cols-4 gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 mt-4 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">🌿</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">100% Fresh Guarantee</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">⚡</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">20-Min Delivery</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">🛡️</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">Easy Returns</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-lg mb-1">💳</span>
                  <span className="text-[9px] font-bold text-slate-700 leading-tight">UPI & COD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CHECKOUT & BASKET MODAL
          ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white w-full max-w-[420px] max-h-[92vh] rounded-3xl overflow-y-auto flex flex-col shadow-2xl">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-sm font-extrabold text-slate-900">Your Basket & Checkout</h3>
              </div>
              <span className="text-xs font-bold text-emerald-600">
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {/* Cart items list */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {cartItemList.map(item => (
                  <div key={item.variantId} className="p-3 flex items-center justify-between gap-3">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      onError={e => handleImageError(e, item.name)}
                      className="w-12 h-12 object-cover rounded-lg border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.packSize}</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">₹{item.price}</div>
                    </div>
                    {/* Stepper */}
                    <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-lg overflow-hidden h-7">
                      <button
                        onClick={() => handleUpdateQty(item.variantId, item.qty - 1)}
                        className="w-6 h-full flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-black text-emerald-900">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.variantId, item.qty + 1)}
                        className="w-6 h-full flex items-center justify-center font-bold text-emerald-800 hover:bg-emerald-100"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Details */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Deliver To (Hospete)
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Customer Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Mobile Number</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 mt-0.5"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Locality</label>
                  <select
                    value={selectedLocality.name}
                    onChange={e => {
                      const found = LOCALITIES.find(l => l.name === e.target.value);
                      if (found) setSelectedLocality(found);
                    }}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2 mt-0.5"
                  >
                    {LOCALITIES.map(loc => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} (Pin: {loc.pincode} - {loc.etaMinutes} mins)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Street Address</label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    className="w-full h-8 text-xs bg-white border border-slate-200 rounded px-2.5 mt-0.5"
                  />
                </div>
              </div>

              {/* Payment selector */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                  Payment Mode
                </div>
                <div className="space-y-1.5">
                  {['UPI / PhonePe / GPay', 'Cash on Delivery (COD)'].map(mode => (
                    <label key={mode} className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === mode}
                        onChange={() => setPaymentMethod(mode)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs bg-white">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span>₹{cartSubtotal}</span>
                </div>
                {cartSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount Savings</span>
                    <span>- ₹{cartSavings}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-dashed border-slate-200 text-sm">
                  <span>Total Payable</span>
                  <span className="text-emerald-700 text-base">₹{grandTotal}</span>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <span>Place Order • ₹{grandTotal}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: ADMIN MANAGEMENT PORTAL (Full wide desktop layout)
          ========================================================================= */}
      {roleView === 'admin' && (
        <AdminPortal
          vendors={vendors}
          setVendors={setVendors}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          onOpenMobileApp={() => setRoleView('customer')}
          onOpenDeliverables={() => setRoleView('deliverables')}
          adminPreviewLogs={adminPreviewLogs}
          setAdminPreviewLogs={setAdminPreviewLogs}
          catalogAuditLogs={catalogAuditLogs}
          setCatalogAuditLogs={setCatalogAuditLogs}
          onPreviewProductInStore={(p) => {
            setSearchQuery(p.name);
            setRoleView('customer');
            setActiveTab('home');
          }}
          onSelectVendorToTest={(v, options) => {
            setAdminPreviewState({
              isPreview: true,
              vendorId: v.id,
              safeMode: options?.safeMode ?? true
            });
            setCurrentVendor(v);
            setRoleView('vendor');
          }}
        />
      )}

      {/* =========================================================================
          VIEW 3: VENDOR INVENTORY & ONBOARDING PORTAL (Full wide desktop layout)
          ========================================================================= */}
      {roleView === 'vendor' && (
        <VendorPortal
          vendors={vendors}
          setVendors={setVendors}
          products={products}
          setProducts={setProducts}
          orders={orders}
          setOrders={setOrders}
          currentVendor={currentVendor}
          setCurrentVendor={setCurrentVendor}
          onTestInMobileStore={() => setRoleView('customer')}
          categories={CATEGORIES}
          localities={LOCALITIES}
          isAdminPreview={adminPreviewState.isPreview}
          adminSafeMode={adminPreviewState.safeMode}
          onExitAdminPreview={() => {
            setAdminPreviewState({ isPreview: false, vendorId: null, safeMode: true });
            setRoleView('admin');
          }}
          onToggleAdminSafeMode={() => {
            setAdminPreviewState(prev => ({ ...prev, safeMode: !prev.safeMode }));
          }}
        />
      )}

      {/* =========================================================================
          VIEW 4: DELIVERY FLEET PARTNER CONSOLE (Full wide desktop layout)
          ========================================================================= */}
      {roleView === 'delivery' && (
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Delivery Fleet Partner Console</h1>
              <p className="text-xs text-slate-500 mt-1">
                Dispatch console for Hospete delivery riders: Patel Nagar, College Road, Dam Road, etc.
              </p>
            </div>
            <button
              onClick={() => setRoleView('customer')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg"
            >
              Back to Customer View &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map(ord => (
              <div key={ord.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-sm text-slate-900">{ord.orderNumber}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {ord.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-1 text-xs">
                  <div className="font-bold text-slate-900">{ord.customerName} • {ord.phone}</div>
                  <div className="text-slate-600">📍 {ord.address}, {ord.locality}</div>
                  <div className="font-black text-emerald-700">
                    Collect: ₹{ord.totalAmount} ({ord.paymentMethod})
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  <strong>Items:</strong> {ord.items.map(it => `${it.quantity}x ${it.productName}`).join(', ')}
                </div>

                <div className="flex gap-2 pt-1">
                  {(['Placed', 'Packed', 'Out for Delivery', 'Delivered'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        setOrders(prev =>
                          prev.map(o => (o.id === ord.id ? { ...o, status: st } : o))
                        );
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        ord.status === st
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'Out for Delivery' ? 'Out' : st}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: DELIVERABLES & DOWNLOAD CENTER
          ========================================================================= */}
      {roleView === 'deliverables' && (
        <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="max-w-2xl">
              <span className="inline-block bg-white/20 text-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-2">
                🎉 Project Deliverables Ready
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                Hospete Fresh - Updated Project Package
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 mt-2">
                All HTML, CSS, JavaScript, SQLite database, and Python Flask route fixes have been implemented, tested, and bundled into a standalone ZIP file.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/hospete_fresh_updated.zip"
                  download="hospete_fresh_updated.zip"
                  className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-sm px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-98"
                >
                  <Download className="w-5 h-5" />
                  <span>Download hospete_fresh_updated.zip</span>
                </a>
                <button
                  onClick={() => setRoleView('customer')}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors"
                >
                  Preview Customer UI &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* Key Fixes Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <span>Summary of Key Fixes Implemented</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1. Product-Card ADD Button Root Cause Fixed</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Diagnosed conflicting rules where generic button classes forced white backgrounds with green text. Implemented high-specificity <code>.btn-add</code> with solid grocery green (<code>#16a34a</code>) background, white text/plus icon, rounded corners, active feedback, and disabled grey styling when stock is exhausted.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>2. Customer Home Screen Reference Sequence</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Sequenced exact 10 steps: Delivery header with Hospete localities, search bar, HD promotional banner with coupon code HOSPETE30, 4 shortcuts (Offers, Best Sellers, Fresh Farm, Bulk Packs), Shop by Category, 4-col category tile grid, Today's Flash Deals, 2-col compact cards, fixed bottom nav, and floating basket summary.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>3. Centered Mobile Shell vs Full Portals</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Customer view is framed in a 410px mobile preview on desktop monitors, adapting to 100% on actual mobile devices. Admin, Vendor, and Delivery partner screens use full-width desktop dashboard layouts without mobile constraints.
                </p>
              </div>

              <div className="border border-slate-100 rounded-xl p-4 bg-slate-50 space-y-1.5">
                <div className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>4. Product Details Dynamic Pack-Sizes & Zero Broken Images</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Pack sizes rendered as selectable cards that dynamically update selling price, MRP, discount badge, and stock. Fixed "Mixture Snacks" with authentic verified imagery and inline SVG data fallback so no broken image icons ever show.
                </p>
              </div>
            </div>
          </div>

          {/* PowerShell Commands */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 shadow-md space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400 font-sans border-b border-slate-800 pb-2">
              <span className="flex items-center gap-2 font-bold text-slate-200">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Windows PowerShell Commands to Run
              </span>
              <span className="text-[11px]">Python 3.10+ / Flask</span>
            </div>
            <pre className="text-emerald-400 overflow-x-auto p-2 bg-slate-950/60 rounded-lg">
{`# 1. Extract the downloaded hospete_fresh_updated.zip and open PowerShell in that folder:
cd hospete_fresh_flask

# 2. (Recommended) Create and activate a Python virtual environment:
python -m venv venv
.\\venv\\Scripts\\Activate.ps1

# 3. Install requirements (Flask):
pip install -r requirements.txt

# 4. Initialize the SQLite database with full Hospete catalog:
python init_db.py

# 5. Start the application:
python app.py`}
            </pre>
            <p className="text-slate-400 font-sans text-xs">
              Open <strong>http://127.0.0.1:5000/</strong> in your browser to experience the updated customer store, or visit <strong>/admin</strong> for the operations dashboard.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
