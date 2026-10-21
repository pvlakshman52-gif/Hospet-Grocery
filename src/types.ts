export interface ProductVariant {
  id: number;
  packSize: string;
  price: number;
  mrp: number;
  stockQty: number;
  isDefault: boolean;
}

export interface ProductImageAudit {
  id: string | number;
  action: 'VENDOR_UPLOAD' | 'ADMIN_APPROVE' | 'ADMIN_CORRECTION_REQUEST' | 'ADMIN_REPLACE' | 'VENDOR_RESUBMIT';
  actor: string;
  actorRole: 'vendor' | 'admin';
  imageUrl: string;
  notes?: string;
  timestamp: string;
}

export interface Product {
  id: number;
  vendorId?: number;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isActive?: boolean; // Storefront visibility toggle by admin
  sku?: string;
  barcode?: string;
  name: string;
  categorySlug: string;
  brand: string;
  description: string;
  imageUrl: string;
  additionalImages?: string[]; // Optional extra gallery images uploaded by vendor
  imageReviewStatus?: 'submitted' | 'approved' | 'needs_correction';
  imageCorrectionReason?: string;
  originalImageUrl?: string; // Preserved original vendor upload when admin replaces
  adminReplacedImageUrl?: string;
  imageReplacedByAdmin?: boolean;
  imageReplacementReason?: string;
  imageAuditHistory?: ProductImageAudit[];
  rating: number;
  reviewCount: number;
  isDeal?: boolean;
  dealTag?: string;
  isBestseller?: boolean;
  isFresh?: boolean;
  isBulk?: boolean;
  variants: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
  adminNotes?: string;
}

export interface CatalogAuditLog {
  id: string | number;
  adminIdentifier: string;
  productId: number;
  productName: string;
  action: 'APPROVE' | 'REJECT' | 'HIDE' | 'ACTIVATE' | 'STOCK_UPDATE' | 'IMAGE_APPROVE' | 'IMAGE_CORRECTION' | 'IMAGE_REPLACE';
  previousState?: string;
  newState?: string;
  reason?: string;
  timestamp: string;
}

export interface VendorDocument {
  id: string | number;
  documentType: string;
  documentName: string;
  fileName: string;
  fileSize?: string;
  status: 'verified' | 'pending_review' | 'rejected';
  uploadedAt: string;
}

export interface VendorStatusHistory {
  id: string | number;
  adminIdentifier: string;
  previousStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  newStatus: 'pending' | 'approved' | 'rejected' | 'suspended';
  reason: string;
  timestamp: string;
}

export interface AdminPreviewLog {
  id: string | number;
  adminIdentifier: string;
  vendorId: number;
  vendorName: string;
  action: 'ENTER_PREVIEW' | 'BLOCKED_TRANSACTION' | 'EXIT_PREVIEW' | 'STOCK_OVERRIDE';
  notes: string;
  timestamp: string;
}

export interface Vendor {
  id: number;
  businessName: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  locality: string;
  serviceArea: string;
  password?: string;
  businessType: 'grocery' | 'farmer' | 'dairy' | 'snacks' | 'other';
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejectionReason?: string;
  suspensionReason?: string;
  additionalInfoRequested?: string;
  resubmissionStatus?: 'none' | 'pending_resubmission' | 'resubmitted';
  documents?: VendorDocument[];
  statusHistory?: VendorStatusHistory[];
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  iconEmoji: string;
  bannerColor: string;
  imageUrl: string;
}

export interface CartItem {
  variantId: number;
  productId: number;
  vendorId?: number;
  name: string;
  packSize: string;
  price: number;
  mrp: number;
  imageUrl: string;
  qty: number;
}

export interface OrderItem {
  id?: number;
  productId?: number;
  vendorId?: number;
  productName: string;
  packSize: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  fulfillmentStatus?: 'Pending' | 'Accepted' | 'Preparing' | 'Ready for Pickup' | 'Dispatched';
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  address: string;
  locality: string;
  totalAmount: number;
  paymentMethod: string;
  status: 'Placed' | 'Packed' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
  items: OrderItem[];
}

export interface Locality {
  name: string;
  pincode: string;
  etaMinutes: number;
}

