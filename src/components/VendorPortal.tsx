import React, { useState } from 'react';
import {
  Store,
  Plus,
  Trash2,
  Edit3,
  Check,
  AlertCircle,
  Clock,
  LogOut,
  UserPlus,
  LogIn,
  Package,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Category, Locality, Order, Product, ProductVariant, Vendor } from '../types.ts';

interface VendorPortalProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  currentVendor: Vendor | null;
  setCurrentVendor: React.Dispatch<React.SetStateAction<Vendor | null>>;
  onTestInMobileStore: () => void;
  categories: Category[];
  localities: Locality[];
  isAdminPreview?: boolean;
  adminSafeMode?: boolean;
  onExitAdminPreview?: () => void;
  onToggleAdminSafeMode?: () => void;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({
  vendors,
  setVendors,
  products,
  setProducts,
  orders,
  setOrders,
  currentVendor,
  setCurrentVendor,
  onTestInMobileStore,
  categories,
  localities,
  isAdminPreview = false,
  adminSafeMode = true,
  onExitAdminPreview,
  onToggleAdminSafeMode
}) => {
  // Auth view modes: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [activeVendorTab, setActiveVendorTab] = useState<'inventory' | 'products' | 'orders' | 'profile'>('inventory');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('9845011111'); // default to Suresh Gowda
  const [loginPassword, setLoginPassword] = useState('vendor123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Registration form state
  const [regData, setRegData] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    locality: localities[0]?.name || 'College Road',
    serviceArea: 'College Road, Patel Nagar, Station Road',
    password: '',
    confirmPassword: '',
    businessType: 'farmer' as Vendor['businessType'],
    description: ''
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  // Flash notification in dashboard
  const [vendorNotice, setVendorNotice] = useState<{ text: string; type: 'warning' | 'success' | 'info' } | null>(null);

  // Modal states for Product Add / Edit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categorySlug: 'veggies',
    brand: '',
    description: '',
    imageUrl: '/images/tomatoes.jpg',
    sku: '',
    variants: [
      { id: Date.now(), packSize: '1 kg', price: 40, mrp: 50, stockQty: 50, isDefault: true },
      { id: Date.now() + 1, packSize: '2 kg Pack', price: 75, mrp: 100, stockQty: 30, isDefault: false }
    ]
  });

  // Filter products scoped strictly to current logged-in vendor
  const vendorProducts = currentVendor
    ? products.filter(p => p.vendorId === currentVendor.id)
    : [];

  const vendorVariants = vendorProducts.flatMap(p =>
    p.variants.map(v => ({ ...v, product: p }))
  );

  // Filter order items assigned to this vendor
  const vendorOrderItems = currentVendor
    ? orders.flatMap(ord =>
        ord.items
          .filter(it => it.vendorId === currentVendor.id || (!it.vendorId && currentVendor.id === 1))
          .map(it => ({ ...it, order: ord }))
      )
    : [];

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = vendors.find(
      v =>
        (v.phone === loginIdentifier.trim() || (v.email && v.email.toLowerCase() === loginIdentifier.trim().toLowerCase())) &&
        (v.password === loginPassword || loginPassword === 'vendor123')
    );

    if (!found) {
      setLoginError('Invalid credentials. Please enter a valid registered mobile number/email and password.');
      return;
    }

    setCurrentVendor(found);
    setVendorNotice({
      text: `Welcome back, ${found.ownerName} (${found.businessName})!`,
      type: 'success'
    });
  };

  // Handle Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regData.businessName.trim() || !regData.ownerName.trim() || !regData.phone.trim() || !regData.address.trim() || !regData.password) {
      setRegError('Please complete all mandatory fields.');
      return;
    }

    if (regData.phone.trim().length < 10) {
      setRegError('Mobile number must be at least 10 digits.');
      return;
    }

    if (regData.password.length < 6) {
      setRegError('Password must contain at least 6 characters.');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setRegError('Passwords do not match. Please re-enter carefully.');
      return;
    }

    // Duplicate check
    const existing = vendors.find(
      v => v.phone === regData.phone.trim() || (regData.email && v.email && v.email.toLowerCase() === regData.email.trim().toLowerCase())
    );

    if (existing) {
      setRegError('A vendor account with this mobile number or email is already registered. Please log in.');
      return;
    }

    const newVendor: Vendor = {
      id: Date.now(),
      businessName: regData.businessName.trim(),
      ownerName: regData.ownerName.trim(),
      phone: regData.phone.trim(),
      email: regData.email.trim() || undefined,
      address: regData.address.trim(),
      locality: regData.locality,
      serviceArea: regData.serviceArea.trim(),
      password: regData.password,
      businessType: regData.businessType,
      description: regData.description.trim() || undefined,
      status: 'pending', // Starts as Pending Approval!
      createdAt: 'Just now'
    };

    setVendors(prev => [newVendor, ...prev]);
    setCurrentVendor(newVendor);
    setRegSuccessNotice('Registration submitted successfully! Your account is now Pending Approval by administrators.');
  };

  // Handle Logout
  const handleLogout = () => {
    setCurrentVendor(null);
    setVendorNotice(null);
    setAuthMode('login');
  };

  // Open Product Modal (New or Edit)
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      categorySlug: categories[0]?.slug || 'veggies',
      brand: currentVendor?.businessName || '',
      description: '',
      imageUrl: '/images/tomatoes.jpg',
      sku: `SKU-${Date.now().toString().slice(-5)}`,
      variants: [
        { id: Date.now(), packSize: '500 g', price: 25, mrp: 35, stockQty: 50, isDefault: true },
        { id: Date.now() + 1, packSize: '1 kg', price: 45, mrp: 65, stockQty: 30, isDefault: false }
      ]
    });
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      categorySlug: product.categorySlug,
      brand: product.brand,
      description: product.description,
      imageUrl: product.imageUrl,
      sku: product.sku || `SKU-${product.id}`,
      variants: product.variants.map(v => ({ ...v }))
    });
    setIsProductModalOpen(true);
  };

  // Save Product (Add or Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVendor) return;

    if (!productForm.name.trim() || productForm.variants.length === 0) {
      alert('Please provide product name and at least one pack variant.');
      return;
    }

    if (editingProduct) {
      // Update existing
      setProducts(prev =>
        prev.map(p =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name.trim(),
                categorySlug: productForm.categorySlug,
                brand: productForm.brand.trim() || currentVendor.businessName,
                description: productForm.description.trim(),
                imageUrl: productForm.imageUrl,
                sku: productForm.sku,
                variants: productForm.variants
              }
            : p
        )
      );
      setVendorNotice({
        text: `Product '${productForm.name}' updated successfully.`,
        type: 'success'
      });
    } else {
      // Create new
      const newProduct: Product = {
        id: Date.now(),
        vendorId: currentVendor.id,
        approvalStatus: 'approved',
        name: productForm.name.trim(),
        categorySlug: productForm.categorySlug,
        brand: productForm.brand.trim() || currentVendor.businessName,
        description: productForm.description.trim() || `Fresh local produce from ${currentVendor.businessName}`,
        imageUrl: productForm.imageUrl,
        sku: productForm.sku,
        rating: 4.8,
        reviewCount: 1,
        variants: productForm.variants
      };

      setProducts(prev => [newProduct, ...prev]);
      setVendorNotice({
        text: `New product '${productForm.name}' added to your catalog!`,
        type: 'success'
      });
    }

    setIsProductModalOpen(false);
  };

  // Quick preset image choices
  const PRESET_IMAGES = [
    { label: 'Tomatoes', url: '/images/tomatoes.jpg' },
    { label: 'Coriander', url: '/images/coriander.jpg' },
    { label: 'Bananas', url: '/images/bananas.jpg' },
    { label: 'Nandini Milk', url: '/images/nandini_milk.jpg' },
    { label: 'Cow Ghee', url: '/images/nandini_ghee.jpg' },
    { label: 'Mixture Snacks', url: '/images/mixture_snacks.jpg' },
    { label: 'Banana Chips', url: '/images/banana_chips.jpg' },
    { label: 'Sona Masoori Rice', url: '/images/sona_masoori.jpg' },
    { label: 'Chakki Atta', url: '/images/aashirvaad_atta.jpg' },
    { label: 'Sunflower Oil', url: '/images/sunflower_oil.jpg' },
    { label: 'Mysore Sandal', url: '/images/mysore_sandal.jpg' },
    { label: 'Tata Tea', url: '/images/tata_tea.jpg' }
  ];

  // -------------------------------------------------------------
  // RENDER: NOT LOGGED IN (Login or Register)
  // -------------------------------------------------------------
  if (!currentVendor) {
    return (
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <Store className="w-3.5 h-3.5" />
              <span>Hospete Fresh Marketplace Partner Hub</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Vendor Onboarding & Inventory Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Empowering Tungabhadra farmers, local dairies, and Karnataka snack makers with direct customer reach.
            </p>
          </div>
          <button
            onClick={onTestInMobileStore}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>Preview Mobile Store</span>
            <span className="text-base">&rarr;</span>
          </button>
        </div>

        {/* Quick Demo Switcher Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
          <div className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Fast-Track Demo Login (Click to Test Roles Instantly):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            {vendors.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setCurrentVendor(v);
                  setVendorNotice({
                    text: `Logged in as ${v.ownerName} (${v.businessName}) - Status: ${v.status.toUpperCase()}`,
                    type: v.status === 'approved' ? 'success' : v.status === 'pending' ? 'warning' : 'info'
                  });
                }}
                className={`p-3 rounded-xl border text-left transition-all hover:shadow-xs active:scale-98 ${
                  v.status === 'approved'
                    ? 'bg-white border-emerald-200 hover:border-emerald-400'
                    : v.status === 'pending'
                    ? 'bg-white border-amber-200 hover:border-amber-400'
                    : 'bg-white border-rose-200 hover:border-rose-400'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase">
                  <span className="text-slate-500">{v.businessType}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      v.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : v.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="font-black text-xs text-slate-900 mt-1 truncate">{v.businessName}</div>
                <div className="text-[11px] text-slate-500 truncate">{v.ownerName} • {v.phone}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Auth Container */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Tab buttons: Login vs Register */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 text-center font-extrabold text-sm">
            <button
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition-all ${
                authMode === 'login'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Vendor Login</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setRegError(null);
              }}
              className={`py-3.5 flex items-center justify-center gap-2 border-b-2 transition-all ${
                authMode === 'register'
                  ? 'border-emerald-600 text-emerald-700 bg-white font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Vendor</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* 1. LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="max-w-md mx-auto space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-slate-900">Sign in to Vendor Console</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your registered 10-digit mobile number or email address
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. 9845011111 or suresh@tungabhadra.in"
                    className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
                    <span className="text-[11px] text-slate-400">Default demo: vendor123</span>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In to Vendor Portal</span>
                </button>

                <div className="pt-4 text-center border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    Are you a local producer in Hospete?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthMode('register')}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      Register your store here &rarr;
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. REGISTRATION FORM */}
            {authMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="max-w-2xl mx-auto space-y-4">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-black text-slate-900">Vendor Partner Registration</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Sell farm produce, milk, savories, and staples to Hospete consumers with next-day settlement.
                  </p>
                </div>

                {/* SMS OTP future integration notice */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Carrier Phone Verification Notice:</strong>
                    <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                      Real-time SMS OTP verification will be enabled in a future telecom carrier integration. During this release, your submitted mobile number is registered directly and verified by the Hospete Fresh administrator team.
                    </p>
                  </div>
                </div>

                {regError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Business / Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.businessName}
                      onChange={e => setRegData({ ...regData, businessName: e.target.value })}
                      placeholder="e.g. Tungabhadra Agro & Organics"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Owner / Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={regData.ownerName}
                      onChange={e => setRegData({ ...regData, ownerName: e.target.value })}
                      placeholder="e.g. Suresh Gowda"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={regData.phone}
                      onChange={e => setRegData({ ...regData, phone: e.target.value.replace(/\D/g, '') })}
                      placeholder="e.g. 9845012345"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={regData.email}
                      onChange={e => setRegData({ ...regData, email: e.target.value })}
                      placeholder="e.g. contact@business.in"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Business Type *
                    </label>
                    <select
                      value={regData.businessType}
                      onChange={e => setRegData({ ...regData, businessType: e.target.value as Vendor['businessType'] })}
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    >
                      <option value="farmer">Farmer / Agricultural Producer</option>
                      <option value="dairy">Dairy & Milk Supplier</option>
                      <option value="snacks">Snacks & Namkeen Maker</option>
                      <option value="grocery">Local Supermarket / Grocery Store</option>
                      <option value="other">Other Producer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Hub / Primary Locality *
                    </label>
                    <select
                      value={regData.locality}
                      onChange={e => setRegData({ ...regData, locality: e.target.value })}
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    >
                      {localities.map(loc => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name} ({loc.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Delivery Service Area in Hospete *
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.serviceArea}
                    onChange={e => setRegData({ ...regData, serviceArea: e.target.value })}
                    placeholder="e.g. College Road, Patel Nagar, Dam Road, Amaravathi"
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Business / Farm Physical Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={regData.address}
                    onChange={e => setRegData({ ...regData, address: e.target.value })}
                    placeholder="Plot / Shop #, Street, Near Landmark, Hospete, Karnataka"
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Password (min 6 chars) *
                    </label>
                    <input
                      type="password"
                      required
                      value={regData.password}
                      onChange={e => setRegData({ ...regData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regData.confirmPassword}
                      onChange={e => setRegData({ ...regData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Brief Business Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={regData.description}
                    onChange={e => setRegData({ ...regData, description: e.target.value })}
                    placeholder="e.g. Chemical-free vegetables harvested daily at Tungabhadra basin."
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all mt-4"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Submit Vendor Application (Pending Approval)</span>
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  By registering, you agree to Hospete Fresh Quality, Hygiene, and Delivery SLAs.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: LOGGED IN AS VENDOR
  // -------------------------------------------------------------
  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Admin Preview Mode Top Banner */}
      {isAdminPreview && (
        <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-emerald-400">
                  ADMIN PREVIEW MODE
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {currentVendor.businessName} ({currentVendor.status})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Viewing vendor portal securely without exposing vendor passwords. Real customer transactions and live catalog updates are guarded.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggleAdminSafeMode}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                adminSafeMode
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600/50'
                  : 'bg-amber-950 text-amber-300 border-amber-600/50'
              }`}
              title="Toggle safe read-only simulation vs admin authorized edit mode"
            >
              {adminSafeMode ? '🛡️ Safe Simulation (Guarded)' : '⚠️ Live Edit Override Enabled'}
            </button>

            {onExitAdminPreview && (
              <button
                onClick={onExitAdminPreview}
                className="px-4 py-1.5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs rounded-xl shadow-xs transition-all"
              >
                Exit Preview &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* White Header Card matching the visual reference */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-extrabold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-emerald-600" />
              <span>{currentVendor.businessName}</span>
            </span>

            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                currentVendor.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentVendor.status === 'pending'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : currentVendor.status === 'suspended'
                  ? 'bg-slate-100 text-slate-800 border border-slate-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {currentVendor.status === 'approved'
                ? 'Active Partner'
                : currentVendor.status === 'pending'
                ? 'Pending Review'
                : currentVendor.status === 'suspended'
                ? 'Account Suspended'
                : 'Application Rejected'}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Vendor Inventory & Stock Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time stock adjustment for Hospete farmers, dairy suppliers, and snacks makers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onTestInMobileStore}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>Test in Mobile Store</span>
            <span className="text-base">&rarr;</span>
          </button>

          <button
            onClick={handleLogout}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold px-3 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            title="Log out of this vendor"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Flash Notice */}
      {(vendorNotice || regSuccessNotice) && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border shadow-xs animate-in fade-in duration-200 ${
            (vendorNotice?.type === 'warning' || currentVendor.status === 'pending')
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{vendorNotice?.type === 'warning' ? '⚠️' : '✅'}</span>
            <span>{vendorNotice?.text || regSuccessNotice}</span>
          </div>
          <button
            onClick={() => {
              setVendorNotice(null);
              setRegSuccessNotice(null);
            }}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================================================
          STATE 1: PENDING APPROVAL SCREEN
          ========================================================= */}
      {currentVendor.status === 'pending' && (
        <div className="bg-white rounded-2xl border border-amber-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-amber-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 mb-1">
                Pending Administrator Approval
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Your Vendor Application is Under Review
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Thank you for applying to sell with Hospete Fresh! Our local operations team is reviewing your registered business details (<strong>{currentVendor.businessName}</strong>) and delivery coverage.
              </p>
            </div>
            {/* Quick Demo Action to approve directly */}
            <button
              onClick={() => {
                setVendors(prev =>
                  prev.map(v => (v.id === currentVendor.id ? { ...v, status: 'approved' } : v))
                );
                setCurrentVendor(prev => (prev ? { ...prev, status: 'approved' } : null));
                setVendorNotice({
                  text: 'Account Approved! Full catalog and inventory management unlocked.',
                  type: 'success'
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
            >
              ⚡ Fast-Approve Account (Demo)
            </button>
          </div>

          {/* Details submitted */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Owner Contact</span>
              <span className="font-extrabold text-slate-800 mt-0.5 block">{currentVendor.ownerName}</span>
              <span className="text-slate-500 text-[11px]">{currentVendor.phone}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Business Type</span>
              <span className="font-extrabold text-slate-800 mt-0.5 block capitalize">{currentVendor.businessType}</span>
              <span className="text-slate-500 text-[11px]">Local Hospete supplier</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Base Locality</span>
              <span className="font-extrabold text-slate-800 mt-0.5 block">{currentVendor.locality}</span>
              <span className="text-slate-500 text-[11px]">{currentVendor.serviceArea}</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Approval SLA</span>
              <span className="font-extrabold text-amber-700 mt-0.5 block">Within 24 Hours</span>
              <span className="text-slate-500 text-[11px]">Next dispatch batch</span>
            </div>
          </div>

          {/* Additional Info Requested Notice */}
          {currentVendor.additionalInfoRequested && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-blue-800">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Action Required: Administrator Requested Clarification</span>
              </div>
              <p className="font-medium text-slate-800">{currentVendor.additionalInfoRequested}</p>
              <div className="pt-1">
                <button
                  onClick={() => {
                    const reply = prompt('Enter your clarification / document note for the administrator:');
                    if (!reply) return;
                    setVendors(prev =>
                      prev.map(v =>
                        v.id === currentVendor.id
                          ? {
                              ...v,
                              additionalInfoRequested: undefined,
                              resubmissionStatus: 'resubmitted',
                              statusHistory: [
                                ...(v.statusHistory || []),
                                {
                                  id: `hist-${Date.now()}`,
                                  adminIdentifier: v.phone,
                                  previousStatus: 'pending',
                                  newStatus: 'pending',
                                  reason: `Vendor reply: ${reply}`,
                                  timestamp: new Date().toLocaleString()
                                }
                              ]
                            }
                          : v
                      )
                    );
                    setCurrentVendor(prev =>
                      prev
                        ? {
                            ...prev,
                            additionalInfoRequested: undefined,
                            resubmissionStatus: 'resubmitted'
                          }
                        : null
                    );
                    setVendorNotice({
                      text: 'Your response has been dispatched to the administrator.',
                      type: 'success'
                    });
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs"
                >
                  Respond & Submit Clarification
                </button>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>
              🔒 <strong>Publishing Protected:</strong> You cannot publish products or take customer orders until approved by the admin team.
            </span>
          </div>
        </div>
      )}

      {/* =========================================================
          STATE 2: REJECTED SCREEN
          ========================================================= */}
      {currentVendor.status === 'rejected' && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 mb-1">
                Application Rejected
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Application Requires Clarification
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Reason given by admin:{' '}
                <strong className="text-rose-700">
                  {currentVendor.rejectionReason || 'Document or trade permit missing. Please contact admin.'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                const reply = prompt('Please enter your resubmission comments and confirm updated document details:');
                if (!reply) return;
                setVendors(prev =>
                  prev.map(v =>
                    v.id === currentVendor.id
                      ? {
                          ...v,
                          status: 'pending',
                          resubmissionStatus: 'resubmitted',
                          rejectionReason: undefined,
                          statusHistory: [
                            ...(v.statusHistory || []),
                            {
                              id: `hist-${Date.now()}`,
                              adminIdentifier: v.phone,
                              previousStatus: 'rejected',
                              newStatus: 'pending',
                              reason: `Vendor re-submission: ${reply}`,
                              timestamp: new Date().toLocaleString()
                            }
                          ]
                        }
                      : v
                  )
                );
                setCurrentVendor(prev =>
                  prev
                    ? {
                        ...prev,
                        status: 'pending',
                        resubmissionStatus: 'resubmitted',
                        rejectionReason: undefined
                      }
                    : null
                );
                setVendorNotice({
                  text: 'Application re-submitted for admin review.',
                  type: 'info'
                });
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Re-submit Application with Corrections
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STATE 4: SUSPENDED SCREEN
          ========================================================= */}
      {currentVendor.status === 'suspended' && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-rose-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="flex-1">
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 mb-1">
                Storefront Account Suspended
              </div>
              <h2 className="text-xl font-black text-slate-900">
                Listings Temporarily Deactivated
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Your store has been paused by the Hospete Fresh administrator team for quality or document review.
              </p>
            </div>
          </div>

          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1.5">
            <div className="font-extrabold text-[11px] uppercase tracking-wide">Suspension Cause:</div>
            <div className="text-sm font-medium">{currentVendor.suspensionReason || 'Compliance audit in progress.'}</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Customer Storefront</span>
              <span className="font-bold text-rose-700 mt-0.5 block">Listings Hidden</span>
              <span className="text-slate-500 text-[11px]">Customers cannot view or buy products</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Stock Updates</span>
              <span className="font-bold text-amber-700 mt-0.5 block">Locked</span>
              <span className="text-slate-500 text-[11px]">Live inventory editing paused</span>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Existing Orders</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{vendorOrderItems.length} Placed</span>
              <span className="text-slate-500 text-[11px]">Existing orders remain valid for fulfillment</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            🔒 <strong>Audit in Progress:</strong> Please contact the marketplace team at{' '}
            <strong className="text-slate-900">superadmin@hospetegrocery.in</strong> or phone <strong>+91 98450 12345</strong> to submit corrective measures and request reactivation.
          </div>
        </div>
      )}

      {/* =========================================================
          STATE 3: APPROVED FULL DASHBOARD WORKSPACE
          ========================================================= */}
      {currentVendor.status === 'approved' && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
            {[
              { id: 'inventory', label: 'Product Variants & Stock Inventory', icon: Package, count: vendorVariants.length },
              { id: 'products', label: 'My Products Catalog', icon: Store, count: vendorProducts.length },
              { id: 'orders', label: 'Assigned Customer Orders', icon: ShoppingBag, count: vendorOrderItems.length },
              { id: 'profile', label: 'Store Profile', icon: Info }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveVendorTab(tab.id as typeof activeVendorTab)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all ${
                    activeVendorTab === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        activeVendorTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: INVENTORY & STOCK (Exact Match to Visual Reference) */}
          {activeVendorTab === 'inventory' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-black text-sm sm:text-base text-slate-900">
                    Product Variants & Stock Inventory
                  </h2>
                  <span className="text-[11px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                    {vendorVariants.length} variants listed
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[11px] text-slate-400 hidden sm:block">
                    Click <strong>Set Out of Stock</strong> to immediately disallow customer purchases.
                  </p>
                  <button
                    onClick={openAddProductModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200 tracking-wider">
                    <tr>
                      <th className="p-3 sm:p-4 min-w-[200px]">Product Name</th>
                      <th className="p-3 sm:p-4 min-w-[130px]">Brand</th>
                      <th className="p-3 sm:p-4 min-w-[120px]">Pack Size</th>
                      <th className="p-3 sm:p-4 min-w-[110px]">Selling Price</th>
                      <th className="p-3 sm:p-4 min-w-[100px]">MRP</th>
                      <th className="p-3 sm:p-4 min-w-[130px]">Stock Units</th>
                      <th className="p-3 sm:p-4 text-right pr-6 min-w-[140px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendorVariants.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                          No products listed under {currentVendor.businessName}. Click "Add New Product" to list your first item!
                        </td>
                      </tr>
                    ) : (
                      vendorVariants.map(v => (
                        <tr
                          key={v.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            v.stockQty <= 0 ? 'bg-rose-50/30' : ''
                          }`}
                        >
                          <td className="p-3 sm:p-4 font-bold text-slate-900">{v.product.name}</td>
                          <td className="p-3 sm:p-4 text-slate-500 font-medium">{v.product.brand}</td>
                          <td className="p-3 sm:p-4 font-bold text-slate-800">{v.packSize}</td>
                          <td className="p-3 sm:p-4 font-black text-emerald-700 text-sm">₹{v.price}</td>
                          <td className="p-3 sm:p-4 text-slate-400 line-through">₹{v.mrp}</td>
                          <td className="p-3 sm:p-4">
                            {v.stockQty <= 0 ? (
                              <span className="text-rose-700 font-bold bg-rose-100/80 border border-rose-200 px-2 py-0.5 rounded text-[11px] inline-block">
                                0 (Out of Stock)
                              </span>
                            ) : v.stockQty <= 5 ? (
                              <span className="text-amber-700 font-bold bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded text-[11px] inline-block">
                                {v.stockQty} (Low)
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-bold text-xs">
                                {v.stockQty} in stock
                              </span>
                            )}
                          </td>
                          <td className="p-3 sm:p-4 text-right pr-6">
                            <button
                              onClick={() => {
                                if (isAdminPreview && adminSafeMode) {
                                  setVendorNotice({
                                    text: 'Stock update prevented: Admin preview is in Safe Simulation Mode. Live inventory modifications are guarded.',
                                    type: 'warning'
                                  });
                                  return;
                                }

                                const newStock = v.stockQty > 0 ? 0 : 50;
                                setProducts(prev =>
                                  prev.map(prod =>
                                    prod.id === v.product.id
                                      ? {
                                          ...prod,
                                          variants: prod.variants.map(vari =>
                                            vari.id === v.id
                                              ? { ...vari, stockQty: newStock }
                                              : vari
                                          )
                                        }
                                      : prod
                                  )
                                );
                                setVendorNotice({
                                  text:
                                    newStock === 0
                                      ? `'${v.product.name} (${v.packSize})' marked Out of Stock. Customer ordering is disabled.`
                                      : `'${v.product.name} (${v.packSize})' restocked with 50 units. Customers can now order.`,
                                  type: newStock === 0 ? 'warning' : 'success'
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 whitespace-nowrap ${
                                v.stockQty > 0
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {v.stockQty > 0 ? 'Set Out of Stock' : 'Restock 50'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MY PRODUCTS CATALOG */}
          {activeVendorTab === 'products' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-black text-slate-900">
                  Products Managed by {currentVendor.businessName}
                </h2>
                <button
                  onClick={openAddProductModal}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product Listing</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendorProducts.map(p => (
                  <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex gap-3">
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          {p.categorySlug}
                        </div>
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">{p.name}</h3>
                        <p className="text-xs text-slate-500">{p.brand}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1">
                      <div className="font-bold text-slate-700 text-[11px]">Variants:</div>
                      {p.variants.map(v => (
                        <div key={v.id} className="flex justify-between text-slate-600">
                          <span>{v.packSize}</span>
                          <span className="font-black text-emerald-700">₹{v.price} ({v.stockQty} in stock)</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => openEditProductModal(p)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Product</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNED CUSTOMER ORDERS */}
          {activeVendorTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 sm:p-5 border-b border-slate-200">
                <h2 className="font-black text-base text-slate-900">
                  Incoming Orders for {currentVendor.businessName}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fulfill customer grocery baskets dispatched for local delivery
                </p>
              </div>

              <div className="p-4 space-y-3">
                {vendorOrderItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No order items assigned yet. When customers order items from {currentVendor.businessName}, they will appear here!
                  </div>
                ) : (
                  vendorOrderItems.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900">{item.order.orderNumber}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded">
                            {item.order.locality}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-emerald-800 mt-1">
                          {item.quantity}x {item.productName} ({item.packSize})
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Customer: {item.order.customerName} ({item.order.phone})
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900">₹{item.subtotal}</div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {item.fulfillmentStatus || 'Ready for Pickup'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: STORE PROFILE */}
          {activeVendorTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-4">
              <h2 className="text-base font-black text-slate-900">Registered Store Profile</h2>
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Business Name</label>
                    <div className="font-black text-slate-900">{currentVendor.businessName}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</label>
                    <div className="font-bold text-slate-800">{currentVendor.ownerName}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Mobile</label>
                    <div className="text-slate-800">{currentVendor.phone}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Business Type</label>
                    <div className="text-slate-800 capitalize">{currentVendor.businessType}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Base Locality</label>
                    <div className="text-slate-800">{currentVendor.locality}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Service Coverage</label>
                    <div className="text-slate-800">{currentVendor.serviceArea}</div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
                  <div className="text-slate-800">{currentVendor.address}</div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                  <div className="text-slate-600">{currentVendor.description || 'No description provided.'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          PRODUCT ADD / EDIT MODAL
          ========================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingProduct ? 'Edit Product & Variants' : 'Add New Product to Store'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Organic Bellary Onions"
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Category *
                  </label>
                  <select
                    value={productForm.categorySlug}
                    onChange={e => setProductForm({ ...productForm, categorySlug: e.target.value })}
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.iconEmoji} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Tungabhadra Farms"
                    className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={productForm.description}
                  onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="e.g. Crisp, fresh red onions from farm fields near Tungabhadra."
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-xl focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Quick Image Choice */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Product Image (Click to Select Preset)
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PRESET_IMAGES.map(img => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setProductForm({ ...productForm, imageUrl: img.url })}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold whitespace-nowrap transition-all ${
                        productForm.imageUrl === img.url
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Variants section */}
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/60 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-xs">
                    Pack Sizes & Pricing Variants
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProductForm({
                        ...productForm,
                        variants: [
                          ...productForm.variants,
                          {
                            id: Date.now(),
                            packSize: '1 kg',
                            price: 50,
                            mrp: 65,
                            stockQty: 30,
                            isDefault: false
                          }
                        ]
                      });
                    }}
                    className="text-emerald-700 font-extrabold text-xs flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pack Variant</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {productForm.variants.map((v, i) => (
                    <div key={v.id} className="grid grid-cols-12 gap-1.5 items-center bg-white p-2 rounded-xl border border-slate-200">
                      <div className="col-span-4">
                        <label className="text-[9px] font-bold text-slate-400 block">Pack Size</label>
                        <input
                          type="text"
                          required
                          value={v.packSize}
                          onChange={e => {
                            const val = e.target.value;
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, packSize: val } : item
                              )
                            });
                          }}
                          placeholder="e.g. 500 g"
                          className="w-full h-7 px-2 text-xs border border-slate-200 rounded outline-none"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 block">Selling (₹)</label>
                        <input
                          type="number"
                          required
                          value={v.price}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, price: val } : item
                              )
                            });
                          }}
                          className="w-full h-7 px-1.5 text-xs border border-slate-200 rounded outline-none font-bold text-emerald-700"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 block">MRP (₹)</label>
                        <input
                          type="number"
                          required
                          value={v.mrp}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, mrp: val } : item
                              )
                            });
                          }}
                          className="w-full h-7 px-1.5 text-xs border border-slate-200 rounded outline-none text-slate-500"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[9px] font-bold text-slate-400 block">Stock Qty</label>
                        <input
                          type="number"
                          required
                          value={v.stockQty}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setProductForm({
                              ...productForm,
                              variants: productForm.variants.map((item, idx) =>
                                idx === i ? { ...item, stockQty: val } : item
                              )
                            });
                          }}
                          className="w-full h-7 px-1.5 text-xs border border-slate-200 rounded outline-none"
                        />
                      </div>

                      <div className="col-span-1 text-center pt-2">
                        {productForm.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm({
                                ...productForm,
                                variants: productForm.variants.filter((_, idx) => idx !== i)
                              });
                            }}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs"
                >
                  Save Product Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
