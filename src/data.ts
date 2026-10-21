import { Category, Locality, Product, Vendor, CatalogAuditLog } from './types.ts';

export const LOCALITIES: Locality[] = [
  { name: 'College Road', pincode: '583201', etaMinutes: 15 },
  { name: 'Patel Nagar', pincode: '583201', etaMinutes: 20 },
  { name: 'Station Road', pincode: '583201', etaMinutes: 20 },
  { name: 'Amaravathi', pincode: '583201', etaMinutes: 25 },
  { name: 'Hampi Road', pincode: '583201', etaMinutes: 25 },
  { name: 'Dam Road', pincode: '583225', etaMinutes: 30 },
  { name: 'Ananthashayana Gudi', pincode: '583201', etaMinutes: 25 },
  { name: 'M.J. Nagar', pincode: '583203', etaMinutes: 20 },
];

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Fresh Veggies', slug: 'veggies', iconEmoji: '🥦', bannerColor: '#ecfdf5', imageUrl: '/images/cat_veggies.jpg' },
  { id: 2, name: 'Fresh Fruits', slug: 'fruits', iconEmoji: '🍎', bannerColor: '#fef2f2', imageUrl: '/images/cat_fruits.jpg' },
  { id: 3, name: 'Dairy & Bakery', slug: 'dairy', iconEmoji: '🥛', bannerColor: '#eff6ff', imageUrl: '/images/cat_dairy.jpg' },
  { id: 4, name: 'Atta, Rice & Dals', slug: 'staples', iconEmoji: '🌾', bannerColor: '#fefce8', imageUrl: '/images/cat_staples.jpg' },
  { id: 5, name: 'Snacks & Namkeen', slug: 'snacks', iconEmoji: '🍿', bannerColor: '#fff7ed', imageUrl: '/images/cat_snacks.jpg' },
  { id: 6, name: 'Masalas & Oils', slug: 'oils', iconEmoji: '🌶️', bannerColor: '#fdf2f8', imageUrl: '/images/cat_oils.jpg' },
  { id: 7, name: 'Beverages & Tea', slug: 'beverages', iconEmoji: '☕', bannerColor: '#f5f3ff', imageUrl: '/images/cat_beverages.jpg' },
  { id: 8, name: 'Household', slug: 'household', iconEmoji: '🧼', bannerColor: '#f0fdfa', imageUrl: '/images/cat_household.jpg' },
];

export interface DocumentRequirementRule {
  type: string;
  name: string;
  description: string;
  mandatory: boolean;
}

export const BUSINESS_TYPE_DOCUMENT_RULES: Record<Vendor['businessType'], DocumentRequirementRule[]> = {
  farmer: [
    { type: 'pahani_rtc', name: 'Land Record / Pahani (RTC)', description: 'Government land ownership / RTC revenue record from Hospete taluk', mandatory: true },
    { type: 'farmer_id', name: 'Kisan / Farmer Photo ID', description: 'Aadhaar / Karnataka Raitha ID proof', mandatory: true },
    { type: 'organic_cert', name: 'Organic Farming Certificate', description: 'PGS-India or Jaivik Bharat organic certification (optional)', mandatory: false }
  ],
  dairy: [
    { type: 'fssai_dairy', name: 'FSSAI Dairy Processing License', description: 'Food safety standards registration for raw milk / dairy derivatives', mandatory: true },
    { type: 'vet_health', name: 'Veterinary Livestock Health NOC', description: 'Herd vaccination and milk safety inspection certificate', mandatory: true },
    { type: 'trade_license', name: 'Hospete CMC Trade License', description: 'City municipal commercial operating permit', mandatory: true }
  ],
  grocery: [
    { type: 'gstin', name: 'GSTIN Certificate', description: 'GST registration certificate from Karnataka Commercial Taxes', mandatory: true },
    { type: 'fssai_retail', name: 'FSSAI Food Business License', description: 'Retail grocery food storage and sale license', mandatory: true },
    { type: 'trade_license', name: 'Hospete Municipal Trade License', description: 'Hospete CMC Shop Act license', mandatory: true }
  ],
  snacks: [
    { type: 'fssai_mfg', name: 'FSSAI Food Manufacturing License', description: 'License for namkeen, sweets, and fried snacks processing unit', mandatory: true },
    { type: 'hygiene_noc', name: 'Commercial Kitchen Hygiene NOC', description: 'Health and sanitation inspection clearance', mandatory: true },
    { type: 'msme_udyam', name: 'MSME Udyam Registration', description: 'Udyam micro enterprise registration certificate', mandatory: false }
  ],
  other: [
    { type: 'shop_act', name: 'Shop & Commercial Establishment Registration', description: 'Karnataka Labour Dept Form C certificate', mandatory: true },
    { type: 'owner_id', name: 'Owner Government Photo ID', description: 'Aadhaar, Voter ID, or Passport of authorized signatory', mandatory: true }
  ]
};

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 1,
    businessName: 'Tungabhadra Agro & Organics',
    ownerName: 'Suresh Gowda',
    phone: '9845011111',
    email: 'suresh@tungabhadra.in',
    address: 'Plot 44, Rural Market Yard, Hospete',
    locality: 'College Road',
    serviceArea: 'College Road, Patel Nagar, Amaravathi',
    password: 'vendor123',
    businessType: 'farmer',
    description: 'Direct farm supplier of pesticide-free vegetables, grains, and fruits harvested fresh along the Tungabhadra river valley.',
    status: 'approved',
    createdAt: '2026-03-01',
    documents: [
      { id: 'doc-1-1', documentType: 'pahani_rtc', documentName: 'Land Record / Pahani (RTC)', fileName: 'rtc_survey_44_hospete.pdf', fileSize: '1.8 MB', status: 'verified', uploadedAt: '2026-03-01 10:14' },
      { id: 'doc-1-2', documentType: 'farmer_id', documentName: 'Kisan / Farmer Photo ID', fileName: 'kisan_card_suresh.pdf', fileSize: '950 KB', status: 'verified', uploadedAt: '2026-03-01 10:16' },
      { id: 'doc-1-3', documentType: 'organic_cert', documentName: 'Organic Farming Certificate', fileName: 'jaivik_bharat_cert.pdf', fileSize: '2.1 MB', status: 'verified', uploadedAt: '2026-03-01 10:20' }
    ],
    statusHistory: [
      { id: 'hist-1-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Self-registration submitted by vendor.', timestamp: '2026-03-01 10:22' },
      { id: 'hist-1-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'Land records verified and field inspection passed.', timestamp: '2026-03-02 11:30' }
    ]
  },
  {
    id: 2,
    businessName: 'Hospete Sweets & Namkeen',
    ownerName: 'Prasad Rao',
    phone: '9845022222',
    email: 'prasad@hospetesweets.com',
    address: 'Station Road Market, Shop #12, Hospete',
    locality: 'Station Road',
    serviceArea: 'Station Road, Patel Nagar, Hampi Road',
    password: 'vendor123',
    businessType: 'snacks',
    description: 'Authentic Karnataka savories, hot mixture, banana chips, and traditional namkeen prepared fresh every morning.',
    status: 'approved',
    createdAt: '2026-03-05',
    documents: [
      { id: 'doc-2-1', documentType: 'fssai_mfg', documentName: 'FSSAI Food Manufacturing License', fileName: 'fssai_lic_21223000.pdf', fileSize: '1.2 MB', status: 'verified', uploadedAt: '2026-03-05 14:02' },
      { id: 'doc-2-2', documentType: 'hygiene_noc', documentName: 'Commercial Kitchen Hygiene NOC', fileName: 'kitchen_sanitation_noc.pdf', fileSize: '780 KB', status: 'verified', uploadedAt: '2026-03-05 14:05' },
      { id: 'doc-2-3', documentType: 'msme_udyam', documentName: 'MSME Udyam Registration', fileName: 'udyam_kr_14_9921.pdf', fileSize: '1.4 MB', status: 'verified', uploadedAt: '2026-03-05 14:10' }
    ],
    statusHistory: [
      { id: 'hist-2-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Self-registration submitted with 3 certificates.', timestamp: '2026-03-05 14:12' },
      { id: 'hist-2-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'Commercial kitchen hygiene certificate and FSSAI valid through 2028.', timestamp: '2026-03-06 09:15' }
    ]
  },
  {
    id: 3,
    businessName: 'Bellary Organic Dairy',
    ownerName: 'Manjunath K',
    phone: '9845033333',
    email: 'manju@bellarydairy.com',
    address: 'Near Dam Circle, Hospete',
    locality: 'Dam Road',
    serviceArea: 'Dam Road, College Road, Patel Nagar',
    password: 'vendor123',
    businessType: 'dairy',
    description: 'Pure A2 Gir Cow Milk, fresh malai paneer, and artisanal churned curd from local dairy herds.',
    status: 'pending',
    createdAt: '2026-03-12',
    documents: [
      { id: 'doc-3-1', documentType: 'fssai_dairy', documentName: 'FSSAI Dairy Processing License', fileName: 'fssai_dairy_cert_bellary.pdf', fileSize: '1.1 MB', status: 'pending_review', uploadedAt: '2026-03-12 16:30' },
      { id: 'doc-3-2', documentType: 'trade_license', documentName: 'Hospete CMC Trade License', fileName: 'cmc_dam_circle_shop.pdf', fileSize: '890 KB', status: 'pending_review', uploadedAt: '2026-03-12 16:35' }
      // Missing vet_health requirement!
    ],
    statusHistory: [
      { id: 'hist-3-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Application submitted for dairy supplier listing. Awaiting review.', timestamp: '2026-03-12 16:40' }
    ]
  },
  {
    id: 4,
    businessName: 'Hampi Farm Delights',
    ownerName: 'Ravi Kumar',
    phone: '9845044444',
    email: 'ravi@hampifarms.com',
    address: 'Kadirampura Cross, Hospete',
    locality: 'Hampi Road',
    serviceArea: 'Hampi Road, Amaravathi',
    password: 'vendor123',
    businessType: 'farmer',
    description: 'Exotic organic fruits, pomegranate, and seasonal greens from Hampi heritage soil.',
    status: 'rejected',
    rejectionReason: 'Incomplete FSSAI / local trade license document. The uploaded land title was expired and unreadable. Please re-submit with clear scanned copy.',
    resubmissionStatus: 'pending_resubmission',
    createdAt: '2026-03-14',
    documents: [
      { id: 'doc-4-1', documentType: 'pahani_rtc', documentName: 'Land Record / Pahani (RTC)', fileName: 'rtc_scan_blurry.jpg', fileSize: '420 KB', status: 'rejected', uploadedAt: '2026-03-14 11:20' }
    ],
    statusHistory: [
      { id: 'hist-4-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Initial application submitted.', timestamp: '2026-03-14 11:25' },
      { id: 'hist-4-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'rejected', reason: 'Incomplete FSSAI / local trade license document. The uploaded land title was expired and unreadable. Please re-submit with clear scanned copy.', timestamp: '2026-03-15 15:40' }
    ]
  },
  {
    id: 5,
    businessName: 'Vijayanagar Mart & Provisions',
    ownerName: 'Ganesh Hegde',
    phone: '9845055555',
    email: 'ganesh@vijayanagarmart.in',
    address: 'Patel Nagar Main Circle, Hospete',
    locality: 'Patel Nagar',
    serviceArea: 'Patel Nagar, College Road, Station Road',
    password: 'vendor123',
    businessType: 'grocery',
    description: 'Neighbourhood provision store offering daily pulses, spices, branded edible oils, and packaged foods.',
    status: 'suspended',
    suspensionReason: 'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles reported on 2026-03-16. Storefront listings deactivated pending warehouse audit.',
    createdAt: '2026-02-20',
    documents: [
      { id: 'doc-5-1', documentType: 'gstin', documentName: 'GSTIN Certificate', fileName: 'gstin_29AAACH7721.pdf', fileSize: '1.3 MB', status: 'verified', uploadedAt: '2026-02-20 09:10' },
      { id: 'doc-5-2', documentType: 'fssai_retail', documentName: 'FSSAI Food Business License', fileName: 'fssai_retail_patelnagar.pdf', fileSize: '980 KB', status: 'verified', uploadedAt: '2026-02-20 09:15' },
      { id: 'doc-5-3', documentType: 'trade_license', documentName: 'Hospete Municipal Trade License', fileName: 'cmc_patelnagar_trade.pdf', fileSize: '1.5 MB', status: 'verified', uploadedAt: '2026-02-20 09:20' }
    ],
    statusHistory: [
      { id: 'hist-5-1', adminIdentifier: 'system@hospetegrocery.in', previousStatus: 'pending', newStatus: 'pending', reason: 'Application registered.', timestamp: '2026-02-20 09:25' },
      { id: 'hist-5-2', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'pending', newStatus: 'approved', reason: 'Documents verified and business authorized.', timestamp: '2026-02-22 14:00' },
      { id: 'hist-5-3', adminIdentifier: 'superadmin@hospetegrocery.in', previousStatus: 'approved', newStatus: 'suspended', reason: 'Customer quality complaints: multiple orders contained unsealed packages and expired oil bottles reported on 2026-03-16. Storefront listings deactivated pending warehouse audit.', timestamp: '2026-03-16 17:30' }
    ]
  }
];

export const DEFAULT_FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    vendorId: 1,
    approvalStatus: 'approved',
    imageReviewStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-101',
    barcode: '890103001011',
    name: 'Farm Fresh Red Tomatoes',
    categorySlug: 'veggies',
    brand: 'Tungabhadra Farms',
    description: 'Locally harvested ripe farm-fresh red tomatoes, handpicked daily from Hospete rural farms.',
    imageUrl: '/images/tomatoes.jpg',
    additionalImages: ['/images/tomatoes.jpg'],
    rating: 4.8,
    reviewCount: 142,
    isDeal: true,
    dealTag: 'SAVE 25%',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 08:30',
    variants: [
      { id: 101, packSize: '500 g', price: 18, mrp: 24, stockQty: 45, isDefault: true },
      { id: 102, packSize: '1 kg', price: 32, mrp: 45, stockQty: 30, isDefault: false },
      { id: 103, packSize: '2 kg (Family Pack)', price: 59, mrp: 90, stockQty: 20, isDefault: false },
    ]
  },
  {
    id: 2,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-201',
    barcode: '890103002012',
    name: 'Fresh Green Coriander (Kothambari)',
    categorySlug: 'veggies',
    brand: 'Local Fresh',
    description: 'Crisp and aromatic fresh coriander leaves sourced from Tungabhadra riverbed growers.',
    imageUrl: '/images/coriander.jpg',
    rating: 4.7,
    reviewCount: 98,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-01 08:45',
    variants: [
      { id: 201, packSize: '1 Bunch (100g)', price: 12, mrp: 15, stockQty: 25, isDefault: true },
      { id: 202, packSize: '2 Bunches', price: 22, mrp: 30, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 3,
    vendorId: 3,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-DAI-301',
    barcode: '890103003013',
    name: 'Nandini Pasteurised Toned Milk',
    categorySlug: 'dairy',
    brand: 'Nandini (KMF)',
    description: 'Pure and rich toned cow milk pouch from Karnataka Milk Federation. Homogenised and nutrient rich.',
    imageUrl: '/images/nandini_milk.jpg',
    rating: 4.9,
    reviewCount: 310,
    isDeal: true,
    dealTag: 'DAILY ESSENTIAL',
    isBestseller: true,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-02 09:10',
    variants: [
      { id: 301, packSize: '500 ml', price: 24, mrp: 24, stockQty: 60, isDefault: true },
      { id: 302, packSize: '1 Litre', price: 46, mrp: 48, stockQty: 40, isDefault: false },
    ]
  },
  {
    id: 4,
    vendorId: 3,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-DAI-401',
    barcode: '890103004014',
    name: 'Nandini Pure Cow Ghee',
    categorySlug: 'dairy',
    brand: 'Nandini (KMF)',
    description: 'Golden, granulated authentic Karnataka cow ghee with traditional aroma and pure taste.',
    imageUrl: '/images/nandini_ghee.jpg',
    rating: 4.9,
    reviewCount: 215,
    isDeal: true,
    dealTag: 'FLAT ₹40 OFF',
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-02 09:20',
    variants: [
      { id: 401, packSize: '200 ml Jar', price: 135, mrp: 145, stockQty: 30, isDefault: false },
      { id: 402, packSize: '500 ml Pouch', price: 315, mrp: 340, stockQty: 40, isDefault: true },
      { id: 403, packSize: '1 Litre Tin', price: 610, mrp: 660, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 5,
    vendorId: 2,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-SNK-501',
    barcode: '890103005015',
    name: 'South Indian Special Mixture Snacks',
    categorySlug: 'snacks',
    brand: 'Hospete Sweets & Namkeen',
    description: 'Authentic crispy spicy Karnataka mixture with roasted groundnuts, curry leaves, crunchy sev, and boondi. Made fresh daily.',
    imageUrl: '/images/mixture_snacks.jpg',
    rating: 4.6,
    reviewCount: 178,
    isDeal: true,
    dealTag: 'BESTSELLER',
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-03 10:15',
    variants: [
      { id: 501, packSize: '200 g Pouch', price: 48, mrp: 60, stockQty: 50, isDefault: true },
      { id: 502, packSize: '400 g Pack', price: 92, mrp: 120, stockQty: 35, isDefault: false },
      { id: 503, packSize: '1 kg Jar', price: 220, mrp: 290, stockQty: 20, isDefault: false },
    ]
  },
  {
    id: 6,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-STP-601',
    barcode: '890103006016',
    name: 'Premium Sona Masoori Rice',
    categorySlug: 'staples',
    brand: 'Tungabhadra Gold',
    description: 'Aged, lightweight and aromatic Karnataka Sona Masoori raw rice. Ideal for everyday South Indian meals.',
    imageUrl: '/images/sona_masoori.jpg',
    rating: 4.8,
    reviewCount: 260,
    isDeal: false,
    isBestseller: true,
    isFresh: false,
    isBulk: true,
    createdAt: '2026-03-03 11:00',
    variants: [
      { id: 601, packSize: '1 kg', price: 65, mrp: 75, stockQty: 40, isDefault: true },
      { id: 602, packSize: '5 kg Bag', price: 310, mrp: 360, stockQty: 25, isDefault: false },
      { id: 603, packSize: '25 kg Family Sack', price: 1450, mrp: 1750, stockQty: 10, isDefault: false },
    ]
  },
  {
    id: 7,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-STP-701',
    barcode: '890103007017',
    name: 'Aashirvaad Shudh Chakki Atta',
    categorySlug: 'staples',
    brand: 'Aashirvaad',
    description: '100% whole wheat flour, naturally rich in dietary fibre for soft and fluffy rotis.',
    imageUrl: '/images/aashirvaad_atta.jpg',
    rating: 4.8,
    reviewCount: 190,
    isDeal: true,
    dealTag: 'VALUE PACK',
    isBestseller: true,
    isFresh: false,
    isBulk: true,
    createdAt: '2026-03-04 12:30',
    variants: [
      { id: 701, packSize: '1 kg', price: 52, mrp: 60, stockQty: 35, isDefault: false },
      { id: 702, packSize: '5 kg Value Pack', price: 245, mrp: 285, stockQty: 40, isDefault: true },
      { id: 703, packSize: '10 kg Mega Pack', price: 475, mrp: 550, stockQty: 18, isDefault: false },
    ]
  },
  {
    id: 8,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-FRU-801',
    barcode: '890103008018',
    name: 'Robusta Fresh Bananas',
    categorySlug: 'fruits',
    brand: 'Hospete Orchard',
    description: 'Sweet, energetic locally grown bananas from Bellary & Hospete fruit plantations.',
    imageUrl: '/images/bananas.jpg',
    rating: 4.7,
    reviewCount: 112,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-05 07:45',
    variants: [
      { id: 801, packSize: '500 g (approx 6 pcs)', price: 25, mrp: 32, stockQty: 30, isDefault: true },
      { id: 802, packSize: '1 kg (approx 12 pcs)', price: 45, mrp: 60, stockQty: 25, isDefault: false },
    ]
  },
  {
    id: 9,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-HOU-901',
    barcode: '890103009019',
    name: 'Mysore Sandal Classic Soap',
    categorySlug: 'household',
    brand: 'KSDL',
    description: 'World-famous authentic sandalwood oil toilet soap from Government of Karnataka.',
    imageUrl: '/images/mysore_sandal.jpg',
    rating: 4.9,
    reviewCount: 340,
    isDeal: true,
    dealTag: 'HERITAGE CARE',
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-05 14:20',
    variants: [
      { id: 901, packSize: '75 g Single', price: 45, mrp: 50, stockQty: 50, isDefault: false },
      { id: 902, packSize: '125 g Pack of 3', price: 215, mrp: 250, stockQty: 30, isDefault: true },
    ]
  },
  {
    id: 10,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-OIL-1001',
    barcode: '890103010011',
    name: 'Gemini Pure Refined Sunflower Oil',
    categorySlug: 'oils',
    brand: 'Gemini',
    description: 'Enriched with Vitamin A and D. Light cooking oil for heart-healthy South Indian cooking.',
    imageUrl: '/images/sunflower_oil.jpg',
    rating: 4.7,
    reviewCount: 165,
    isDeal: false,
    isBestseller: false,
    isFresh: false,
    isBulk: true,
    createdAt: '2026-03-06 15:10',
    variants: [
      { id: 1001, packSize: '1 Litre Pouch', price: 135, mrp: 160, stockQty: 35, isDefault: true },
      { id: 1002, packSize: '5 Litre Can', price: 650, mrp: 780, stockQty: 15, isDefault: false },
    ]
  },
  {
    id: 11,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-BEV-1101',
    barcode: '890103011012',
    name: 'Tata Tea Gold Leaf Tea',
    categorySlug: 'beverages',
    brand: 'Tata Tea',
    description: 'Gentle blend of rich Assam CTC teas with 15% long leaves for heavenly aroma and strength.',
    imageUrl: '/images/tata_tea.jpg',
    rating: 4.8,
    reviewCount: 145,
    isDeal: false,
    isBestseller: true,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-06 16:00',
    variants: [
      { id: 1101, packSize: '250 g', price: 140, mrp: 160, stockQty: 30, isDefault: true },
      { id: 1102, packSize: '500 g Pack', price: 265, mrp: 310, stockQty: 20, isDefault: false },
    ]
  },
  {
    id: 12,
    vendorId: 2,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-SNK-1201',
    barcode: '890103012013',
    name: 'Crispy Masala Banana Chips',
    categorySlug: 'snacks',
    brand: 'Malnad Crunch',
    description: 'Thinly sliced raw bananas fried in coconut oil with fresh black pepper and rock salt.',
    imageUrl: '/images/banana_chips.jpg',
    rating: 4.7,
    reviewCount: 130,
    isDeal: true,
    dealTag: 'TOP SNACK',
    isBestseller: false,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-07 11:20',
    variants: [
      { id: 1201, packSize: '150 g Pouch', price: 42, mrp: 55, stockQty: 40, isDefault: true },
      { id: 1202, packSize: '300 g Family Pack', price: 80, mrp: 105, stockQty: 25, isDefault: false },
    ]
  },
  {
    id: 13,
    vendorId: 5,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-SNK-1301',
    barcode: '890103013014',
    name: 'Vijayanagar Roasted Gram & Peanuts Mixture',
    categorySlug: 'snacks',
    brand: 'Vijayanagar Mart',
    description: 'Crispy roasted chana dal and salted peanuts prepared in peanut oil.',
    imageUrl: '/images/banana_chips.jpg',
    rating: 4.4,
    reviewCount: 38,
    isDeal: false,
    isBestseller: false,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-08 09:50',
    variants: [
      { id: 1301, packSize: '200 g Pack', price: 45, mrp: 60, stockQty: 20, isDefault: true },
      { id: 1302, packSize: '500 g Family Pack', price: 100, mrp: 140, stockQty: 10, isDefault: false }
    ]
  },
  {
    id: 14,
    vendorId: 1,
    approvalStatus: 'pending',
    isActive: true,
    sku: 'SKU-VEG-1401',
    barcode: '890103014015',
    name: 'Organic Hydroponic Cherry Tomatoes',
    categorySlug: 'veggies',
    brand: 'Tungabhadra Farms',
    description: 'Bite-sized, vibrant sweet cherry tomatoes cultivated in controlled climate polyhouse at Hospete Agro.',
    imageUrl: '/images/tomatoes.jpg',
    rating: 4.9,
    reviewCount: 16,
    isDeal: true,
    dealTag: 'NEW CROP',
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-14 10:00',
    variants: [
      { id: 1401, packSize: '250 g Clamshell', price: 45, mrp: 60, stockQty: 30, isDefault: true },
      { id: 1402, packSize: '500 g Punnet', price: 85, mrp: 110, stockQty: 15, isDefault: false }
    ]
  },
  {
    id: 15,
    vendorId: 2,
    approvalStatus: 'rejected',
    rejectionReason: 'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.',
    isActive: true,
    sku: 'SKU-SNK-1501',
    barcode: '890103015016',
    name: 'Hampi Special Traditional Mysore Pak (Tin Box)',
    categorySlug: 'snacks',
    brand: 'Hampi Heritage Sweets',
    description: 'Melt-in-mouth traditional ghee Mysore Pak packed in royal gift tin box.',
    imageUrl: '/images/mixture_snacks.jpg',
    rating: 4.5,
    reviewCount: 22,
    isDeal: false,
    isBestseller: false,
    isFresh: false,
    isBulk: false,
    createdAt: '2026-03-12 14:30',
    variants: [
      { id: 1501, packSize: '250 g Gift Tin', price: 180, mrp: 220, stockQty: 25, isDefault: true },
      { id: 1502, packSize: '500 g Festive Box', price: 340, mrp: 400, stockQty: 15, isDefault: false }
    ]
  },
  {
    id: 16,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: false, // Inactive / Hidden state
    sku: 'SKU-FRU-1601',
    barcode: '890103016017',
    name: 'Seasonal Ratnagiri Alphonso Mangoes',
    categorySlug: 'fruits',
    brand: 'Hospete Orchard',
    description: 'Naturally ripened carbide-free Alphonso (Hapus) mangoes with rich aroma and saffron pulp.',
    imageUrl: '/images/bananas.jpg',
    rating: 4.9,
    reviewCount: 88,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-10 11:00',
    adminNotes: 'Season temporarily concluded. Hidden from customer store by admin.',
    variants: [
      { id: 1601, packSize: '1 kg Box (approx 3-4 pcs)', price: 420, mrp: 500, stockQty: 12, isDefault: true },
      { id: 1602, packSize: '3 kg Semi-Wooden Crate', price: 1200, mrp: 1450, stockQty: 5, isDefault: false }
    ]
  },
  {
    id: 17,
    vendorId: 1,
    approvalStatus: 'approved',
    isActive: true,
    sku: 'SKU-VEG-1701',
    barcode: '890103017018',
    name: 'Fresh Kolar Cauliflower (Gobi)',
    categorySlug: 'veggies',
    brand: 'Local Fresh',
    description: 'Crisp white florets harvested with protective green leaves from Kolar-Bellary farms.',
    imageUrl: '/images/coriander.jpg',
    rating: 4.6,
    reviewCount: 42,
    isDeal: false,
    isBestseller: false,
    isFresh: true,
    isBulk: false,
    createdAt: '2026-03-11 08:00',
    variants: [
      { id: 1701, packSize: '1 Medium Head (approx 500g)', price: 28, mrp: 35, stockQty: 0, isDefault: true } // Out of Stock!
    ]
  }
];

export const INITIAL_CATALOG_AUDIT_LOGS: CatalogAuditLog[] = [
  {
    id: 'cal-1',
    adminIdentifier: 'superadmin@hospetegrocery.in',
    productId: 16,
    productName: 'Seasonal Ratnagiri Alphonso Mangoes',
    action: 'HIDE',
    previousState: 'Live Active',
    newState: 'Inactive / Hidden',
    reason: 'Off-season inventory paused per orchard supplier request.',
    timestamp: '2026-03-10 11:15'
  },
  {
    id: 'cal-2',
    adminIdentifier: 'superadmin@hospetegrocery.in',
    productId: 15,
    productName: 'Hampi Special Traditional Mysore Pak (Tin Box)',
    action: 'REJECT',
    previousState: 'Pending Approval',
    newState: 'Rejected',
    reason: 'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.',
    timestamp: '2026-03-12 14:40'
  },
  {
    id: 'cal-3',
    adminIdentifier: 'superadmin@hospetegrocery.in',
    productId: 12,
    productName: 'Crispy Masala Banana Chips',
    action: 'APPROVE',
    previousState: 'Pending Approval',
    newState: 'Live Active',
    reason: 'FSSAI license verified and batch packaging approved.',
    timestamp: '2026-03-07 12:00'
  }
];
