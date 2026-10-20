export interface ProductVariant {
  id: number;
  packSize: string;
  price: number;
  mrp: number;
  stockQty: number;
  isDefault: boolean;
}

export interface Product {
  id: number;
  name: string;
  categorySlug: string;
  brand: string;
  description: string;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  isDeal?: boolean;
  dealTag?: string;
  isBestseller?: boolean;
  isFresh?: boolean;
  isBulk?: boolean;
  variants: ProductVariant[];
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
  name: string;
  packSize: string;
  price: number;
  mrp: number;
  imageUrl: string;
  qty: number;
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
  items: {
    productName: string;
    packSize: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
}

export interface Locality {
  name: string;
  pincode: string;
  etaMinutes: number;
}
