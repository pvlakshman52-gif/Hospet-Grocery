import React, { useState, useMemo } from 'react';
import {
  Users,
  Store,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Package,
  Download,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  X,
  FileCheck,
  FileX,
  History,
  EyeOff,
  Layers,
  Tag,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  Category,
  Order,
  Product,
  ProductVariant,
  Vendor,
  VendorDocument,
  VendorStatusHistory,
  AdminPreviewLog,
  CatalogAuditLog
} from '../types.ts';
import { BUSINESS_TYPE_DOCUMENT_RULES, CATEGORIES, DocumentRequirementRule } from '../data.ts';

interface AdminPortalProps {
  vendors: Vendor[];
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onOpenMobileApp: () => void;
  onOpenDeliverables: () => void;
  onSelectVendorToTest: (vendor: Vendor, options?: { safeMode?: boolean }) => void;
  adminPreviewLogs?: AdminPreviewLog[];
  setAdminPreviewLogs?: React.Dispatch<React.SetStateAction<AdminPreviewLog[]>>;
  catalogAuditLogs?: CatalogAuditLog[];
  setCatalogAuditLogs?: React.Dispatch<React.SetStateAction<CatalogAuditLog[]>>;
  onPreviewProductInStore?: (product: Product) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  vendors,
  setVendors,
  products,
  setProducts,
  orders,
  setOrders,
  onOpenMobileApp,
  onOpenDeliverables,
  onSelectVendorToTest,
  adminPreviewLogs = [],
  setAdminPreviewLogs,
  catalogAuditLogs = [],
  setCatalogAuditLogs,
  onPreviewProductInStore
}) => {
  // Tabs: 'vendors' | 'orders' | 'catalog' | 'logs'
  const [adminTab, setAdminTab] = useState<'vendors' | 'orders' | 'catalog' | 'logs'>('vendors');

  // Supplier Status Filter: 'all' | 'pending' | 'approved' | 'rejected' | 'suspended'
  const [vendorFilter, setVendorFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended'>('all');

  // Search & Secondary Filters for Vendors
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | Vendor['businessType']>('all');
  const [localityFilter, setLocalityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'status'>('date_desc');

  // Catalog Overview Filters & Controls
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('all');
  const [catalogVendor, setCatalogVendor] = useState<string>('all');
  const [catalogVisibility, setCatalogVisibility] = useState<'all' | 'live' | 'pending' | 'rejected' | 'hidden' | 'out_of_stock'>('all');
  const [catalogStock, setCatalogStock] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all');
  const [catalogApproval, setCatalogApproval] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [catalogSort, setCatalogSort] = useState<'name_asc' | 'name_desc' | 'category_asc' | 'vendor_asc' | 'newest' | 'visibility_priority'>('newest');
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogPageSize, setCatalogPageSize] = useState<number>(10);
  const [expandedVariantProductIds, setExpandedVariantProductIds] = useState<Record<number, boolean>>({});
  const [showMobileCatalogFilters, setShowMobileCatalogFilters] = useState<boolean>(false);

  // Modals & Drawers for Catalog
  const [activeProductDrawer, setActiveProductDrawer] = useState<Product | null>(null);
  const [rejectProductModal, setRejectProductModal] = useState<Product | null>(null);
  const [rejectProductReason, setRejectProductReason] = useState<string>('');

  // Admin notification banner
  const [adminNotice, setAdminNotice] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Expanded rejection reason IDs for in-table toggle
  const [expandedReasonVendorIds, setExpandedReasonVendorIds] = useState<Record<number, boolean>>({});

  // Drawer / Details modal state
  const [activeVendorDrawer, setActiveVendorDrawer] = useState<Vendor | null>(null);

  // Modals for actions requiring mandatory reasons
  const [rejectModalVendor, setRejectModalVendor] = useState<Vendor | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');

  const [suspendModalVendor, setSuspendModalVendor] = useState<Vendor | null>(null);
  const [suspendReasonInput, setSuspendReasonInput] = useState('');

  const [reactivateModalVendor, setReactivateModalVendor] = useState<Vendor | null>(null);
  const [reactivateReasonInput, setReactivateReasonInput] = useState('');

  const [requestInfoModalVendor, setRequestInfoModalVendor] = useState<Vendor | null>(null);
  const [requestInfoInput, setRequestInfoInput] = useState('');

  // Document preview simulation modal
  const [previewDoc, setPreviewDoc] = useState<{ doc: VendorDocument; vendorName: string } | null>(null);

  const adminEmail = 'superadmin@hospetegrocery.in';

  // Helper to log status history
  const appendStatusHistory = (
    vendorId: number,
    previousStatus: Vendor['status'],
    newStatus: Vendor['status'],
    reason: string
  ) => {
    const newEntry: VendorStatusHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminIdentifier: adminEmail,
      previousStatus,
      newStatus,
      reason,
      timestamp: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    return newEntry;
  };

  // Helper to log admin preview
  const logAdminPreviewAction = (vendor: Vendor, action: AdminPreviewLog['action'], notes: string) => {
    if (!setAdminPreviewLogs) return;
    const logItem: AdminPreviewLog = {
      id: `log-${Date.now()}`,
      adminIdentifier: adminEmail,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      action,
      notes,
      timestamp: new Date().toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
    setAdminPreviewLogs(prev => [logItem, ...prev]);
  };

  // 1. Approve vendor
  const handleApproveVendor = (vendorId: number, customNote = 'Vendor profile and mandatory trade documents approved.') => {
    const target = vendors.find(v => v.id === vendorId);
    if (!target) return;

    const historyEntry = appendStatusHistory(vendorId, target.status, 'approved', customNote);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vendorId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          const updatedDocs = v.documents?.map(d => ({ ...d, status: 'verified' as const }));
          return {
            ...v,
            status: 'approved',
            rejectionReason: undefined,
            suspensionReason: undefined,
            additionalInfoRequested: undefined,
            resubmissionStatus: 'none',
            documents: updatedDocs || v.documents,
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    // Keep active drawer up-to-date
    if (activeVendorDrawer && activeVendorDrawer.id === vendorId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'approved' } : null));
    }

    setAdminNotice({
      text: `${target.businessName} has been APPROVED! Their listings are now active in the Hospete customer store.`,
      type: 'success'
    });
  };

  // 2. Reject vendor (mandatory reason)
  const handleConfirmReject = () => {
    if (!rejectModalVendor) return;
    const reason = rejectReasonInput.trim();
    if (!reason) {
      alert('A specific reason for rejection is mandatory.');
      return;
    }

    const vId = rejectModalVendor.id;
    const historyEntry = appendStatusHistory(vId, rejectModalVendor.status, 'rejected', reason);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            status: 'rejected',
            rejectionReason: reason,
            resubmissionStatus: 'pending_resubmission',
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'rejected', rejectionReason: reason, resubmissionStatus: 'pending_resubmission' } : null));
    }

    setAdminNotice({
      text: `${rejectModalVendor.businessName} marked as REJECTED. The vendor can view the reason and submit resubmission documents.`,
      type: 'warning'
    });

    setRejectModalVendor(null);
    setRejectReasonInput('');
  };

  // 3. Request Additional Information
  const handleConfirmRequestInfo = () => {
    if (!requestInfoModalVendor) return;
    const infoText = requestInfoInput.trim();
    if (!infoText) {
      alert('Please specify the exact additional information or documents required.');
      return;
    }

    const vId = requestInfoModalVendor.id;
    const historyEntry = appendStatusHistory(vId, requestInfoModalVendor.status, 'pending', `Requested info: ${infoText}`);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            additionalInfoRequested: infoText,
            resubmissionStatus: 'pending_resubmission',
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, additionalInfoRequested: infoText, resubmissionStatus: 'pending_resubmission' } : null));
    }

    setAdminNotice({
      text: `Additional information request dispatched to ${requestInfoModalVendor.businessName}. Notice is prominently displayed in their portal.`,
      type: 'info'
    });

    setRequestInfoModalVendor(null);
    setRequestInfoInput('');
  };

  // 4. Suspend vendor (mandatory reason)
  const handleConfirmSuspend = () => {
    if (!suspendModalVendor) return;
    const reason = suspendReasonInput.trim();
    if (!reason) {
      alert('A suspension reason is mandatory for regulatory and vendor compliance.');
      return;
    }

    const vId = suspendModalVendor.id;
    const historyEntry = appendStatusHistory(vId, suspendModalVendor.status, 'suspended', reason);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            status: 'suspended',
            suspensionReason: reason,
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'suspended', suspensionReason: reason } : null));
    }

    setAdminNotice({
      text: `${suspendModalVendor.businessName} has been SUSPENDED. All product listings are temporarily hidden from the customer storefront. Existing orders remain preserved.`,
      type: 'warning'
    });

    setSuspendModalVendor(null);
    setSuspendReasonInput('');
  };

  // 5. Reactivate vendor
  const handleConfirmReactivate = () => {
    if (!reactivateModalVendor) return;
    const reason = reactivateReasonInput.trim() || 'Suspension lifted following audit and corrective compliance.';

    const vId = reactivateModalVendor.id;
    const historyEntry = appendStatusHistory(vId, reactivateModalVendor.status, 'approved', reason);

    setVendors(prev =>
      prev.map(v => {
        if (v.id === vId) {
          const updatedHistory = v.statusHistory ? [...v.statusHistory, historyEntry] : [historyEntry];
          return {
            ...v,
            status: 'approved',
            suspensionReason: undefined,
            statusHistory: updatedHistory
          };
        }
        return v;
      })
    );

    if (activeVendorDrawer && activeVendorDrawer.id === vId) {
      setActiveVendorDrawer(prev => (prev ? { ...prev, status: 'approved', suspensionReason: undefined } : null));
    }

    setAdminNotice({
      text: `${reactivateModalVendor.businessName} has been REACTIVATED! Their product catalog has been restored to the customer store.`,
      type: 'success'
    });

    setReactivateModalVendor(null);
    setReactivateReasonInput('');
  };

  // 6. Secure Admin Preview Launcher
  const handleLaunchAdminPreview = (vendor: Vendor) => {
    logAdminPreviewAction(vendor, 'ENTER_PREVIEW', 'Admin initiated secure preview mode from admin suppliers list.');
    onSelectVendorToTest(vendor, { safeMode: true });
  };

  // Extract unique localities for filter dropdown
  const availableLocalities = useMemo(() => {
    const set = new Set<string>();
    vendors.forEach(v => {
      if (v.locality) set.add(v.locality);
    });
    return Array.from(set).sort();
  }, [vendors]);

  // Supplier Counts by Status
  const statusCounts = useMemo(() => {
    return {
      all: vendors.length,
      pending: vendors.filter(v => v.status === 'pending').length,
      approved: vendors.filter(v => v.status === 'approved').length,
      rejected: vendors.filter(v => v.status === 'rejected').length,
      suspended: vendors.filter(v => v.status === 'suspended').length
    };
  }, [vendors]);

  // Filtered and Sorted Vendors
  const filteredAndSortedVendors = useMemo(() => {
    let result = vendors.filter(v => {
      // 1. Status Tab filter
      if (vendorFilter !== 'all' && v.status !== vendorFilter) return false;

      // 2. Business Type filter
      if (typeFilter !== 'all' && v.businessType !== typeFilter) return false;

      // 3. Locality filter
      if (localityFilter !== 'all' && v.locality !== localityFilter) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBusiness = v.businessName.toLowerCase().includes(q);
        const matchesOwner = v.ownerName.toLowerCase().includes(q);
        const matchesPhone = v.phone.includes(q);
        const matchesEmail = v.email ? v.email.toLowerCase().includes(q) : false;
        const matchesLocality = v.locality.toLowerCase().includes(q);
        const matchesServiceArea = v.serviceArea.toLowerCase().includes(q);

        if (!matchesBusiness && !matchesOwner && !matchesPhone && !matchesEmail && !matchesLocality && !matchesServiceArea) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name_asc') {
        return a.businessName.localeCompare(b.businessName);
      }
      if (sortBy === 'name_desc') {
        return b.businessName.localeCompare(a.businessName);
      }
      if (sortBy === 'date_asc') {
        return a.createdAt.localeCompare(b.createdAt);
      }
      if (sortBy === 'date_desc') {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (sortBy === 'status') {
        const priority: Record<Vendor['status'], number> = {
          pending: 1,
          suspended: 2,
          rejected: 3,
          approved: 4
        };
        return priority[a.status] - priority[b.status];
      }
      return 0;
    });

    return result;
  }, [vendors, vendorFilter, typeFilter, localityFilter, searchQuery, sortBy]);

  // Toggle reason expansion
  const toggleReasonExpand = (id: number) => {
    setExpandedReasonVendorIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Safe Image Error fallback handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, label: string) => {
    const target = e.currentTarget;
    target.onerror = null;
    target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="100%" height="100%" fill="%23f8fafc"/><rect x="6" y="6" width="68" height="68" rx="10" fill="%23ecfdf5" stroke="%23bbf7d0" stroke-width="1.5"/><text x="40" y="44" font-size="24" text-anchor="middle">🥗</text><text x="40" y="60" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle" fill="%23065f46">${encodeURIComponent(label.slice(0, 10))}</text></svg>`;
  };

  // Helper for computing Product Storefront Visibility
  const getProductStorefrontStatus = (p: Product, v?: Vendor) => {
    const isVendorApproved = v?.status === 'approved';
    const isVendorSuspended = v?.status === 'suspended';
    const isVendorPending = v?.status === 'pending';
    const isVendorRejected = v?.status === 'rejected';

    if (p.approvalStatus === 'rejected') {
      return {
        status: 'rejected' as const,
        label: 'Rejected',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: p.rejectionReason || 'Listing did not meet catalog standards',
        canPurchase: false
      };
    }

    if (p.approvalStatus === 'pending') {
      return {
        status: 'pending' as const,
        label: 'Pending Approval',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        detail: 'Awaiting admin quality & compliance review',
        canPurchase: false
      };
    }

    if (p.isActive === false) {
      return {
        status: 'hidden' as const,
        label: 'Inactive / Hidden',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        detail: p.adminNotes || 'Paused by admin',
        canPurchase: false
      };
    }

    if (isVendorSuspended) {
      return {
        status: 'hidden' as const,
        label: 'Hidden (Vendor Suspended)',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: 'Supplier under compliance suspension',
        canPurchase: false
      };
    }

    if (isVendorPending) {
      return {
        status: 'hidden' as const,
        label: 'Hidden (Vendor Pending)',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        detail: 'Supplier application pending review',
        canPurchase: false
      };
    }

    if (isVendorRejected) {
      return {
        status: 'hidden' as const,
        label: 'Hidden (Vendor Rejected)',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        detail: 'Supplier application rejected',
        canPurchase: false
      };
    }

    const totalStock = p.variants.reduce((sum, vr) => sum + vr.stockQty, 0);
    if (totalStock <= 0) {
      return {
        status: 'out_of_stock' as const,
        label: 'Out of Stock',
        badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
        detail: 'All pack sizes currently 0 units',
        canPurchase: false
      };
    }

    return {
      status: 'live' as const,
      label: 'Live Active',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      detail: 'Live in store and available for customer orders',
      canPurchase: true
    };
  };

  // Pending catalog items count
  const pendingCatalogCount = useMemo(() => {
    return products.filter(p => p.approvalStatus === 'pending').length;
  }, [products]);

  // Dynamic Category counts from actual products
  const catalogCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered Catalog Products
  const filteredCatalogProducts = useMemo(() => {
    return products.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      const vStatus = getProductStorefrontStatus(p, vendor);

      // Search match
      if (catalogSearch.trim()) {
        const q = catalogSearch.toLowerCase().trim();
        const mName = p.name.toLowerCase().includes(q);
        const mBrand = p.brand.toLowerCase().includes(q);
        const mSku = (p.sku || '').toLowerCase().includes(q);
        const mCategory = p.categorySlug.toLowerCase().includes(q);
        const mVendor = (vendor?.businessName || '').toLowerCase().includes(q);
        const mVariantSku = p.variants.some(v => v.packSize.toLowerCase().includes(q));
        if (!mName && !mBrand && !mSku && !mCategory && !mVendor && !mVariantSku) {
          return false;
        }
      }

      // Category filter
      if (catalogCategory !== 'all' && p.categorySlug !== catalogCategory) {
        return false;
      }

      // Vendor filter
      if (catalogVendor !== 'all') {
        const vId = Number(catalogVendor);
        if (p.vendorId !== vId) return false;
      }

      // Visibility filter
      if (catalogVisibility !== 'all') {
        if (catalogVisibility === 'live' && vStatus.status !== 'live') return false;
        if (catalogVisibility === 'pending' && vStatus.status !== 'pending') return false;
        if (catalogVisibility === 'rejected' && vStatus.status !== 'rejected') return false;
        if (catalogVisibility === 'hidden' && vStatus.status !== 'hidden') return false;
        if (catalogVisibility === 'out_of_stock' && vStatus.status !== 'out_of_stock') return false;
      }

      // Stock status filter
      if (catalogStock !== 'all') {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stockQty, 0);
        if (catalogStock === 'in_stock' && totalStock <= 0) return false;
        if (catalogStock === 'out_of_stock' && totalStock > 0) return false;
        if (catalogStock === 'low_stock' && (totalStock <= 0 || totalStock > 10)) return false;
      }

      // Product approval status filter
      if (catalogApproval !== 'all') {
        const appStatus = p.approvalStatus || 'approved';
        if (appStatus !== catalogApproval) return false;
      }

      return true;
    });
  }, [products, vendors, catalogSearch, catalogCategory, catalogVendor, catalogVisibility, catalogStock, catalogApproval]);

  // Sorted Catalog Products
  const sortedCatalogProducts = useMemo(() => {
    const list = [...filteredCatalogProducts];
    if (catalogSort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (catalogSort === 'name_desc') {
      list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (catalogSort === 'category_asc') {
      list.sort((a, b) => a.categorySlug.localeCompare(b.categorySlug));
    } else if (catalogSort === 'vendor_asc') {
      list.sort((a, b) => {
        const vA = vendors.find(v => v.id === a.vendorId)?.businessName || '';
        const vB = vendors.find(v => v.id === b.vendorId)?.businessName || '';
        return vA.localeCompare(vB);
      });
    } else if (catalogSort === 'newest') {
      list.sort((a, b) => (b.id) - (a.id));
    } else if (catalogSort === 'visibility_priority') {
      const priorityOrder: Record<string, number> = { pending: 0, rejected: 1, out_of_stock: 2, hidden: 3, live: 4 };
      list.sort((a, b) => {
        const vA = getProductStorefrontStatus(a, vendors.find(v => v.id === a.vendorId)).status;
        const vB = getProductStorefrontStatus(b, vendors.find(v => v.id === b.vendorId)).status;
        return (priorityOrder[vA] ?? 9) - (priorityOrder[vB] ?? 9);
      });
    }
    return list;
  }, [filteredCatalogProducts, catalogSort, vendors]);

  // Paginated Catalog Products
  const paginatedCatalogProducts = useMemo(() => {
    if (catalogPageSize >= sortedCatalogProducts.length) {
      return sortedCatalogProducts;
    }
    const start = (catalogPage - 1) * catalogPageSize;
    return sortedCatalogProducts.slice(start, start + catalogPageSize);
  }, [sortedCatalogProducts, catalogPage, catalogPageSize]);

  const totalCatalogPages = Math.max(1, Math.ceil(sortedCatalogProducts.length / catalogPageSize));

  // Reset all catalog filters
  const resetCatalogFilters = () => {
    setCatalogSearch('');
    setCatalogCategory('all');
    setCatalogVendor('all');
    setCatalogVisibility('all');
    setCatalogStock('all');
    setCatalogApproval('all');
    setCatalogSort('newest');
    setCatalogPage(1);
  };

  const isCatalogFiltered = Boolean(
    catalogSearch.trim() ||
    catalogCategory !== 'all' ||
    catalogVendor !== 'all' ||
    catalogVisibility !== 'all' ||
    catalogStock !== 'all' ||
    catalogApproval !== 'all'
  );

  // 1. Approve product
  const handleApproveProduct = (product: Product) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            approvalStatus: 'approved',
            rejectionReason: undefined,
            isActive: true,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      })
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: product.id,
      productName: product.name,
      action: 'APPROVE',
      previousState: product.approvalStatus || 'pending',
      newState: 'Live Active',
      reason: 'Approved by admin for live supermarket catalog listing.',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === product.id) {
      setActiveProductDrawer(prev => (prev ? { ...prev, approvalStatus: 'approved', rejectionReason: undefined, isActive: true } : null));
    }

    setAdminNotice({
      text: `Product "${product.name}" approved! It is now live in the customer storefront.`,
      type: 'success'
    });
  };

  // 2. Reject product (mandatory reason)
  const handleConfirmRejectProduct = () => {
    if (!rejectProductModal) return;
    const reason = rejectProductReason.trim();
    if (!reason) {
      alert('A specific reason explaining the rejection is mandatory.');
      return;
    }

    const prodId = rejectProductModal.id;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === prodId) {
          return {
            ...p,
            approvalStatus: 'rejected',
            rejectionReason: reason,
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      })
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: prodId,
      productName: rejectProductModal.name,
      action: 'REJECT',
      previousState: rejectProductModal.approvalStatus || 'pending',
      newState: 'Rejected',
      reason: reason,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === prodId) {
      setActiveProductDrawer(prev => (prev ? { ...prev, approvalStatus: 'rejected', rejectionReason: reason } : null));
    }

    setAdminNotice({
      text: `Product "${rejectProductModal.name}" marked as REJECTED with recorded reason.`,
      type: 'warning'
    });

    setRejectProductModal(null);
    setRejectProductReason('');
  };

  // 3. Toggle visibility (Active / Inactive-Hidden)
  const handleToggleProductVisibility = (product: Product) => {
    const nextActive = !(product.isActive !== false);
    setProducts(prev =>
      prev.map(p => {
        if (p.id === product.id) {
          return {
            ...p,
            isActive: nextActive,
            adminNotes: nextActive ? undefined : 'Manually hidden by admin.',
            updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
          };
        }
        return p;
      })
    );

    const logEntry: CatalogAuditLog = {
      id: `cal-${Date.now()}`,
      adminIdentifier: adminEmail,
      productId: product.id,
      productName: product.name,
      action: nextActive ? 'ACTIVATE' : 'HIDE',
      previousState: product.isActive !== false ? 'Live Active' : 'Inactive / Hidden',
      newState: nextActive ? 'Live Active' : 'Inactive / Hidden',
      reason: nextActive ? 'Reactivated by admin.' : 'Storefront visibility disabled by admin.',
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };
    if (setCatalogAuditLogs) {
      setCatalogAuditLogs(prev => [logEntry, ...prev]);
    }

    if (activeProductDrawer && activeProductDrawer.id === product.id) {
      setActiveProductDrawer(prev => (prev ? { ...prev, isActive: nextActive } : null));
    }

    setAdminNotice({
      text: nextActive
        ? `Product "${product.name}" is now Active in catalog.`
        : `Product "${product.name}" is now Hidden from customer store.`,
      type: nextActive ? 'success' : 'info'
    });
  };

  // Toggle variant list expansion in table
  const toggleVariantExpand = (productId: number) => {
    setExpandedVariantProductIds(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hospete Fresh Super Admin Control</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Management Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review vendor onboarding applications, approve farmer listings, and manage live supermarket fulfillment.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <button
            onClick={onOpenMobileApp}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>Customer Storefront</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenDeliverables}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Updated ZIP</span>
          </button>
        </div>
      </div>

      {/* Admin Notice */}
      {adminNotice && (
        <div
          className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border shadow-xs transition-all ${
            adminNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : adminNotice.type === 'info'
              ? 'bg-blue-50 text-blue-900 border-blue-200'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {adminNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : adminNotice.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{adminNotice.text}</span>
          </div>
          <button
            onClick={() => setAdminNotice(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor Partners</div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{vendors.length} Total</div>
          <div className="text-xs text-slate-500 mt-1">
            <span className="font-semibold text-emerald-600">{statusCounts.approved} Approved</span>
            <span className="mx-1 text-slate-300">·</span>
            <span className="font-semibold text-amber-600">{statusCounts.pending} Pending</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Applications</div>
          <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">{statusCounts.pending} Action Required</div>
          <div className="text-xs text-slate-500 mt-1">Document verification & checklist</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suspended Partners</div>
          <div className="text-2xl font-black text-rose-600 mt-1 tabular-nums">{statusCounts.suspended} Paused</div>
          <div className="text-xs text-slate-500 mt-1">Storefront listings deactivated</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orders Today</div>
          <div className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{orders.length + 18}</div>
          <div className="text-xs text-slate-500 mt-1">100% locally fulfilled in Hospete</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab('vendors')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            adminTab === 'vendors'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Vendor Suppliers</span>
          {statusCounts.pending > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
              {statusCounts.pending}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            adminTab === 'orders'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Live Customer Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('catalog')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            adminTab === 'catalog'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalog Overview ({products.length})</span>
          {pendingCatalogCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
              {pendingCatalogCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('logs')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
            adminTab === 'logs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit & Preview Logs ({adminPreviewLogs.length + catalogAuditLogs.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: REGISTERED VENDOR SUPPLIERS
          ========================================================================= */}
      {adminTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          {/* Section Header & Status Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="font-extrabold text-base text-slate-900">
                  Registered Vendor Suppliers
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review applications, verify type-specific certificates, inspect service areas, and moderate listing privileges.
                </p>
              </div>

              {/* Status Tabs with Supplier Counts */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                {(['all', 'pending', 'approved', 'rejected', 'suspended'] as const).map(tabKey => {
                  const count = statusCounts[tabKey];
                  const isActive = vendorFilter === tabKey;
                  return (
                    <button
                      key={tabKey}
                      onClick={() => setVendorFilter(tabKey)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>{tabKey === 'all' ? 'All Suppliers' : tabKey}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-bold ${
                          isActive
                            ? tabKey === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : tabKey === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search and Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
              {/* Search input */}
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by store name, owner, phone, email, locality..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <div className="lg:col-span-2">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50 text-slate-700 font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="farmer">Farmer / Grower</option>
                  <option value="dairy">Dairy Supplier</option>
                  <option value="grocery">Grocery Mart</option>
                  <option value="snacks">Snacks & Namkeen</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Locality Filter */}
              <div className="lg:col-span-2">
                <select
                  value={localityFilter}
                  onChange={e => setLocalityFilter(e.target.value)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50 text-slate-700 font-medium"
                >
                  <option value="all">All Localities</option>
                  {availableLocalities.map(loc => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting */}
              <div className="lg:col-span-3">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-slate-50/50 text-slate-700 font-medium"
                >
                  <option value="date_desc">Registration Date (Newest first)</option>
                  <option value="date_asc">Registration Date (Oldest first)</option>
                  <option value="name_asc">Business Name (A to Z)</option>
                  <option value="name_desc">Business Name (Z to A)</option>
                  <option value="status">Status Priority</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            {(searchQuery || typeFilter !== 'all' || localityFilter !== 'all' || vendorFilter !== 'all') && (
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div>
                  Showing <strong className="text-slate-900 tabular-nums">{filteredAndSortedVendors.length}</strong> of{' '}
                  <strong className="text-slate-900 tabular-nums">{vendors.length}</strong> suppliers
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setLocalityFilter('all');
                    setVendorFilter('all');
                  }}
                  className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Desktop & Tablet Table (Hidden on narrow mobile < 768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Business & Contact</th>
                  <th className="p-3.5">Type & Compliance</th>
                  <th className="p-3.5">Locality & Service Area</th>
                  <th className="p-3.5">Status & Notice</th>
                  <th className="p-3.5 text-right pr-6">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="max-w-sm mx-auto space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-300" />
                        <div className="font-bold text-slate-700">No suppliers matched your search</div>
                        <div className="text-[11px] text-slate-400">
                          Try adjusting search keywords, clearing locality filters, or resetting the status tab.
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedVendors.map(v => {
                    const isReasonExpanded = expandedReasonVendorIds[v.id];
                    const docCount = v.documents?.length || 0;
                    const requiredRules = BUSINESS_TYPE_DOCUMENT_RULES[v.businessType] || [];
                    const mandatoryRules = requiredRules.filter(r => r.mandatory);
                    const verifiedDocs = v.documents?.filter(d => d.status === 'verified').length || 0;

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Business & Contact */}
                        <td className="p-3.5 pl-5 align-top">
                          <div className="font-black text-slate-900 text-sm">{v.businessName}</div>
                          <div className="text-slate-600 text-xs mt-0.5">
                            <span>Owner: {v.ownerName}</span>
                            <span className="mx-1 text-slate-300">·</span>
                            <span className="font-semibold text-slate-800 tabular-nums">{v.phone}</span>
                          </div>
                          {v.email && (
                            <div className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[220px]">
                              {v.email}
                            </div>
                          )}
                          <div className="text-slate-400 text-[10px] mt-1 tabular-nums">
                            Registered: {v.createdAt}
                          </div>
                        </td>

                        {/* 2. Type & Compliance */}
                        <td className="p-3.5 align-top">
                          <span className="inline-block capitalize font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded text-[11px]">
                            {v.businessType}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {verifiedDocs}/{mandatoryRules.length} mandatory docs verified
                            </span>
                          </div>
                          {docCount > 0 && (
                            <button
                              onClick={() => setActiveVendorDrawer(v)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold mt-1 hover:underline block"
                            >
                              View {docCount} uploaded file{docCount > 1 ? 's' : ''} &rarr;
                            </button>
                          )}
                        </td>

                        {/* 3. Locality & Service Area */}
                        <td className="p-3.5 align-top">
                          <div className="font-semibold text-slate-800">{v.locality}</div>
                          <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2 max-w-[220px]" title={v.serviceArea}>
                            Coverage: {v.serviceArea}
                          </div>
                          <div className="text-slate-400 text-[10px] mt-1 truncate max-w-[220px]">
                            {v.address}
                          </div>
                        </td>

                        {/* 4. Status & Notice */}
                        <td className="p-3.5 align-top">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide ${
                                v.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : v.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : v.status === 'rejected'
                                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-300'
                              }`}
                            >
                              {v.status === 'pending'
                                ? 'Pending Review'
                                : v.status === 'suspended'
                                ? 'Suspended'
                                : v.status}
                            </span>
                          </div>

                          {/* Rejection reason with toggle for long reasons */}
                          {v.status === 'rejected' && v.rejectionReason && (
                            <div className="mt-1.5 text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded-lg border border-rose-100 max-w-[220px]">
                              <div className="font-bold text-[10px] uppercase text-rose-800">Rejection Reason:</div>
                              <div className={isReasonExpanded ? '' : 'line-clamp-2'}>
                                {v.rejectionReason}
                              </div>
                              {v.rejectionReason.length > 60 && (
                                <button
                                  onClick={() => toggleReasonExpand(v.id)}
                                  className="text-[10px] font-bold text-rose-900 hover:underline mt-1"
                                >
                                  {isReasonExpanded ? 'Show less' : 'Read full reason'}
                                </button>
                              )}
                              {v.resubmissionStatus === 'pending_resubmission' && (
                                <div className="text-[10px] font-bold text-amber-700 mt-1">
                                  ⏳ Awaiting vendor document resubmission
                                </div>
                              )}
                            </div>
                          )}

                          {/* Suspension reason */}
                          {v.status === 'suspended' && v.suspensionReason && (
                            <div className="mt-1.5 text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-[220px]">
                              <div className="font-bold text-[10px] uppercase text-slate-800">Suspension Cause:</div>
                              <div className="line-clamp-2">{v.suspensionReason}</div>
                              <div className="text-[10px] text-rose-600 font-bold mt-1">
                                Storefront listings paused
                              </div>
                            </div>
                          )}

                          {/* Additional Info Requested Notice */}
                          {v.additionalInfoRequested && v.status === 'pending' && (
                            <div className="mt-1.5 text-[11px] text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200 max-w-[220px]">
                              <div className="font-bold text-[10px] uppercase text-blue-900">Info Requested:</div>
                              <div className="line-clamp-2">{v.additionalInfoRequested}</div>
                            </div>
                          )}
                        </td>

                        {/* 5. Administrative Actions */}
                        <td className="p-3.5 text-right pr-5 align-top">
                          <div className="flex flex-col items-end gap-1.5">
                            {/* Primary action: Review Details */}
                            <button
                              onClick={() => setActiveVendorDrawer(v)}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs transition-colors"
                            >
                              Review Application
                            </button>

                            {/* Pending Quick Actions */}
                            {v.status === 'pending' && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <button
                                  onClick={() => handleApproveVendor(v.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors"
                                  title="Approve supplier application"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectModalVendor(v);
                                    setRejectReasonInput('');
                                  }}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs transition-colors"
                                  title="Reject with mandatory reason"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setRequestInfoModalVendor(v);
                                    setRequestInfoInput('');
                                  }}
                                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg text-xs transition-colors"
                                  title="Request additional information"
                                >
                                  Req Info
                                </button>
                              </div>
                            )}

                            {/* Approved Quick Actions */}
                            {v.status === 'approved' && (
                              <button
                                onClick={() => {
                                  setSuspendModalVendor(v);
                                  setSuspendReasonInput('');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-transparent text-slate-700 font-bold rounded-lg text-xs transition-colors"
                                title="Suspend supplier from live storefront"
                              >
                                Suspend
                              </button>
                            )}

                            {/* Suspended Quick Actions */}
                            {v.status === 'suspended' && (
                              <button
                                onClick={() => {
                                  setReactivateModalVendor(v);
                                  setReactivateReasonInput('');
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs transition-colors"
                                title="Reactivate suspended vendor"
                              >
                                Reactivate
                              </button>
                            )}

                            {/* Secure Admin Preview */}
                            <button
                              onClick={() => handleLaunchAdminPreview(v)}
                              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold rounded-lg text-[11px] whitespace-nowrap transition-colors inline-flex items-center gap-1"
                              title="Securely preview vendor dashboard without exposing credentials"
                            >
                              <span>Preview Portal</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Narrow Mobile View (< 768px): Responsive Supplier Cards */}
          <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
            {filteredAndSortedVendors.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <div className="font-bold text-slate-700 text-sm">No suppliers matched</div>
                <div className="text-xs text-slate-400">Adjust keywords or clear filters.</div>
              </div>
            ) : (
              filteredAndSortedVendors.map(v => (
                <div key={v.id} className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{v.businessName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {v.ownerName} · <span className="font-semibold text-slate-700">{v.phone}</span>
                      </div>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        v.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : v.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div>
                      <strong className="text-slate-800">Type:</strong>{' '}
                      <span className="capitalize">{v.businessType}</span> · <strong>Locality:</strong> {v.locality}
                    </div>
                    <div>
                      <strong className="text-slate-800">Service:</strong> {v.serviceArea}
                    </div>
                  </div>

                  {v.rejectionReason && v.status === 'rejected' && (
                    <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                      <strong>Rejection reason:</strong> {v.rejectionReason}
                    </div>
                  )}

                  {v.suspensionReason && v.status === 'suspended' && (
                    <div className="text-xs text-slate-700 bg-slate-100 p-2 rounded border border-slate-300">
                      <strong>Suspension cause:</strong> {v.suspensionReason}
                    </div>
                  )}

                  {/* Mobile Actions Button Strip */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
                    <button
                      onClick={() => setActiveVendorDrawer(v)}
                      className="flex-1 py-1.5 px-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-lg text-xs"
                    >
                      Review Application
                    </button>

                    {v.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveVendor(v.id)}
                          className="py-1.5 px-3 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setRejectModalVendor(v);
                            setRejectReasonInput('');
                          }}
                          className="py-1.5 px-3 bg-rose-50 text-rose-700 border border-rose-200 font-bold rounded-lg text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {v.status === 'approved' && (
                      <button
                        onClick={() => {
                          setSuspendModalVendor(v);
                          setSuspendReasonInput('');
                        }}
                        className="py-1.5 px-3 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        Suspend
                      </button>
                    )}

                    {v.status === 'suspended' && (
                      <button
                        onClick={() => {
                          setReactivateModalVendor(v);
                          setReactivateReasonInput('');
                        }}
                        className="py-1.5 px-3 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-lg text-xs"
                      >
                        Reactivate
                      </button>
                    )}

                    <button
                      onClick={() => handleLaunchAdminPreview(v)}
                      className="py-1.5 px-3 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: ORDERS
          ========================================================================= */}
      {adminTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Live Customer Orders</h2>
              <p className="text-xs text-slate-500">
                Track order fulfillment, assigned vendors, and local Hospete deliveries.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
              {orders.length} Active Orders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Locality</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 pl-5 font-bold text-slate-900 tabular-nums">{ord.orderNumber}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{ord.customerName}</div>
                      <div className="text-slate-400 text-[11px] tabular-nums">{ord.phone}</div>
                    </td>
                    <td className="p-3.5">{ord.locality}</td>
                    <td className="p-3.5">
                      {ord.items.map(it => `${it.quantity}x ${it.productName}`).join(', ')}
                    </td>
                    <td className="p-3.5 font-black text-emerald-700 tabular-nums">₹{ord.totalAmount}</td>
                    <td className="p-3.5">{ord.paymentMethod}</td>
                    <td className="p-3.5">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px]">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: CATALOG - SUPERMARKET CATALOG INVENTORY
          ========================================================================= */}
      {adminTab === 'catalog' && (
        <div className="space-y-4">
          {/* Top Catalog Header Card */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-xl text-slate-900 tracking-tight">Supermarket Catalog Inventory</h2>
                <span className="bg-slate-100 text-slate-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full tabular-nums border border-slate-200">
                  {products.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Live products and variants submitted by partner farmers, dairies, and vendors.
              </p>
            </div>

            {/* Catalog Health Quick Counters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>
                  {products.filter(p => getProductStorefrontStatus(p, vendors.find(v => v.id === p.vendorId)).status === 'live').length} Live Active
                </span>
              </div>
              {pendingCatalogCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span>{pendingCatalogCount} Pending Review</span>
                </div>
              )}
              <div className="px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>
                  {products.filter(p => getProductStorefrontStatus(p, vendors.find(v => v.id === p.vendorId)).status === 'out_of_stock').length} Out of Stock
                </span>
              </div>
              <button
                onClick={onOpenMobileApp}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Storefront View</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section: Comprehensive Filter & Search Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Search & Multi-Filter Catalog
                </span>
              </div>

              {isCatalogFiltered && (
                <button
                  onClick={resetCatalogFilters}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              )}
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={e => {
                    setCatalogSearch(e.target.value);
                    setCatalogPage(1);
                  }}
                  placeholder="Search name, brand, SKU (e.g. SKU-VEG-101), vendor..."
                  className="w-full h-10 pl-9 pr-8 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 transition-colors"
                />
                {catalogSearch && (
                  <button
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={catalogCategory}
                  onChange={e => {
                    setCatalogCategory(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">All Categories ({products.length})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({catalogCategoryCounts[cat.slug] || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Filter */}
              <div>
                <select
                  value={catalogVendor}
                  onChange={e => {
                    setCatalogVendor(e.target.value);
                    setCatalogPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">All Vendors ({vendors.length})</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.businessName} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Storefront Visibility Filter */}
              <div>
                <select
                  value={catalogVisibility}
                  onChange={e => {
                    setCatalogVisibility(e.target.value as any);
                    setCatalogPage(1);
                  }}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="all">All Visibility States</option>
                  <option value="live">Live Active</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                  <option value="hidden">Inactive / Hidden</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <select
                  value={catalogSort}
                  onChange={e => setCatalogSort(e.target.value as any)}
                  className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 text-slate-800 font-semibold cursor-pointer"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="name_asc">Sort: Product Name (A &rarr; Z)</option>
                  <option value="name_desc">Sort: Product Name (Z &rarr; A)</option>
                  <option value="category_asc">Sort: Category (A &rarr; Z)</option>
                  <option value="vendor_asc">Sort: Vendor Partner (A &rarr; Z)</option>
                  <option value="visibility_priority">Sort: Visibility Priority</option>
                </select>
              </div>
            </div>

            {/* Secondary Filter Row (Stock Status & Approval Status) */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-400 font-medium text-[11px]">Secondary Filters:</span>
                
                {/* Stock Level Selector */}
                <select
                  value={catalogStock}
                  onChange={e => {
                    setCatalogStock(e.target.value as any);
                    setCatalogPage(1);
                  }}
                  className="h-8 px-2.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Stock: All Levels</option>
                  <option value="in_stock">In Stock (&gt; 0)</option>
                  <option value="low_stock">Low Stock (1 - 10)</option>
                  <option value="out_of_stock">Out of Stock (0)</option>
                </select>

                {/* Approval Status Selector */}
                <select
                  value={catalogApproval}
                  onChange={e => {
                    setCatalogApproval(e.target.value as any);
                    setCatalogPage(1);
                  }}
                  className="h-8 px-2.5 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                >
                  <option value="all">Approval: All</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Result Count */}
              <div className="text-xs font-semibold text-slate-600">
                Showing <span className="font-black text-slate-900 tabular-nums">{filteredCatalogProducts.length}</span> of <span className="font-black text-slate-900 tabular-nums">{products.length}</span> products
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-5">Product</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Vendor Partner</th>
                    <th className="p-3.5">Variants Listed</th>
                    <th className="p-3.5">Storefront Visibility</th>
                    <th className="p-3.5 pr-5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedCatalogProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                            <Search className="w-6 h-6" />
                          </div>
                          <div className="font-extrabold text-sm text-slate-800">
                            No products match your filters
                          </div>
                          <p className="text-xs text-slate-500">
                            Try adjusting your search query, changing the category, or resetting the visibility filter.
                          </p>
                          <button
                            onClick={resetCatalogFilters}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCatalogProducts.map(p => {
                      const vendor = vendors.find(v => v.id === p.vendorId);
                      const statusInfo = getProductStorefrontStatus(p, vendor);
                      const isExpanded = expandedVariantProductIds[p.id];
                      const totalStock = p.variants.reduce((sum, v) => sum + v.stockQty, 0);

                      return (
                        <React.Fragment key={p.id}>
                          <tr className={`hover:bg-slate-50/70 transition-colors ${!statusInfo.canPurchase ? 'bg-slate-50/30' : ''}`}>
                            {/* 1. Product Thumbnail & Info */}
                            <td className="p-3.5 pl-5">
                              <div className="flex items-start gap-3">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  onError={e => handleImageError(e, p.name)}
                                  referrerPolicy="no-referrer"
                                  className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                                />
                                <div className="space-y-0.5">
                                  <div className="font-extrabold text-slate-900 text-sm leading-snug">
                                    {p.name}
                                  </div>
                                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className="font-semibold text-slate-700">{p.brand}</span>
                                    {p.sku && (
                                      <>
                                        <span>·</span>
                                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                                          {p.sku}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Category */}
                            <td className="p-3.5">
                              <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold capitalize bg-slate-100 text-slate-700 border border-slate-200/60">
                                {CATEGORIES.find(c => c.slug === p.categorySlug)?.name || p.categorySlug}
                              </span>
                            </td>

                            {/* 3. Vendor Partner */}
                            <td className="p-3.5">
                              {vendor ? (
                                <div className="space-y-1">
                                  <button
                                    onClick={() => setActiveVendorDrawer(vendor)}
                                    className="font-bold text-slate-900 hover:text-emerald-700 text-left flex items-center gap-1 group"
                                  >
                                    <span>{vendor.businessName}</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-600" />
                                  </button>
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <span>{vendor.ownerName}</span>
                                    <span>·</span>
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                        vendor.status === 'approved'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : vendor.status === 'pending'
                                          ? 'bg-amber-100 text-amber-800'
                                          : vendor.status === 'suspended'
                                          ? 'bg-slate-200 text-slate-800'
                                          : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {vendor.status}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Hospete Central Warehouse</span>
                              )}
                            </td>

                            {/* 4. Variants Listed */}
                            <td className="p-3.5 max-w-xs">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {p.variants.slice(0, 2).map(vr => (
                                    <span
                                      key={vr.id}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px]"
                                    >
                                      <span className="font-bold text-slate-800">{vr.packSize}</span>
                                      <span className="text-emerald-700 font-extrabold">₹{vr.price}</span>
                                      <span className={`text-[10px] font-bold ${vr.stockQty > 0 ? 'text-slate-500' : 'text-rose-600'}`}>
                                        ({vr.stockQty} in stock)
                                      </span>
                                    </span>
                                  ))}
                                  {p.variants.length > 2 && (
                                    <span className="text-[10px] text-slate-500 font-semibold">
                                      +{p.variants.length - 2} more
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => toggleVariantExpand(p.id)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                >
                                  <span>{isExpanded ? 'Hide Variants' : `View All Variants (${p.variants.length})`}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>
                            </td>

                            {/* 5. Storefront Visibility Status */}
                            <td className="p-3.5">
                              <div className="space-y-1">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-black border ${statusInfo.badgeClass}`}
                                >
                                  {statusInfo.label}
                                </span>
                                {statusInfo.detail && (
                                  <div className="text-[10px] text-slate-500 leading-tight max-w-[180px]">
                                    {statusInfo.detail}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 6. Admin Actions */}
                            <td className="p-3.5 pr-5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                {/* View Details */}
                                <button
                                  onClick={() => setActiveProductDrawer(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                  title="View Full Product Details & Variants"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Preview in Customer Store */}
                                {onPreviewProductInStore && (
                                  <button
                                    onClick={() => onPreviewProductInStore(p)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                    title="Preview in Customer Storefront"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Approve (if pending or rejected) */}
                                {(p.approvalStatus === 'pending' || p.approvalStatus === 'rejected') && (
                                  <button
                                    onClick={() => handleApproveProduct(p)}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                    title="Approve Listing for Storefront"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                )}

                                {/* Reject (if pending or approved) */}
                                {p.approvalStatus !== 'rejected' && (
                                  <button
                                    onClick={() => {
                                      setRejectProductModal(p);
                                      setRejectProductReason('');
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-colors border border-rose-200"
                                    title="Reject Product with Reason"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Toggle Active / Inactive */}
                                <button
                                  onClick={() => handleToggleProductVisibility(p)}
                                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors border ${
                                    p.isActive !== false
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                  }`}
                                  title={p.isActive !== false ? 'Hide from Storefront' : 'Activate in Storefront'}
                                >
                                  {p.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable Variants Row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/80 border-y border-slate-200 animate-in fade-in duration-100">
                              <td colSpan={6} className="p-4 pl-14">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                                      <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>All Pack Sizes & Inventory Breakdown for "{p.name}"</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      Total Available Stock: <strong className="text-emerald-700">{totalStock} units</strong>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                                        <tr>
                                          <th className="p-2.5 pl-3">Pack Size</th>
                                          <th className="p-2.5">Selling Price</th>
                                          <th className="p-2.5">MRP</th>
                                          <th className="p-2.5">Discount %</th>
                                          <th className="p-2.5">Stock Units</th>
                                          <th className="p-2.5">Default Pack</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {p.variants.map(v => {
                                          const discountPct = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                                          return (
                                            <tr key={v.id} className="hover:bg-slate-50">
                                              <td className="p-2.5 pl-3 font-bold text-slate-800">{v.packSize}</td>
                                              <td className="p-2.5 font-extrabold text-emerald-700 tabular-nums">₹{v.price}</td>
                                              <td className="p-2.5 text-slate-400 line-through tabular-nums">₹{v.mrp}</td>
                                              <td className="p-2.5">
                                                {discountPct > 0 ? (
                                                  <span className="text-emerald-700 font-bold">{discountPct}% OFF</span>
                                                ) : (
                                                  <span className="text-slate-400">-</span>
                                                )}
                                              </td>
                                              <td className="p-2.5">
                                                <span
                                                  className={`font-black tabular-nums px-2 py-0.5 rounded text-[11px] ${
                                                    v.stockQty > 10
                                                      ? 'bg-emerald-50 text-emerald-800'
                                                      : v.stockQty > 0
                                                      ? 'bg-amber-50 text-amber-800'
                                                      : 'bg-rose-50 text-rose-800'
                                                  }`}
                                                >
                                                  {v.stockQty} {v.stockQty === 0 ? '(Out of Stock)' : 'units'}
                                                </span>
                                              </td>
                                              <td className="p-2.5">
                                                {v.isDefault ? (
                                                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                                    Default
                                                  </span>
                                                ) : (
                                                  <span className="text-slate-400 text-[11px]">Variant</span>
                                                )}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {paginatedCatalogProducts.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No products found matching filters.
                </div>
              ) : (
                paginatedCatalogProducts.map(p => {
                  const vendor = vendors.find(v => v.id === p.vendorId);
                  const statusInfo = getProductStorefrontStatus(p, vendor);
                  const isExpanded = expandedVariantProductIds[p.id];

                  return (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          onError={e => handleImageError(e, p.name)}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{p.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border shrink-0 ${statusInfo.badgeClass}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Brand: <strong className="text-slate-700">{p.brand}</strong>
                          </div>
                          {p.sku && (
                            <div className="font-mono text-[10px] text-slate-500">
                              SKU: {p.sku}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Vendor & Category metadata */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400">Supplier</div>
                          <div className="font-bold text-slate-800">{vendor?.businessName || 'Central Warehouse'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-400">Category</div>
                          <div className="font-bold text-emerald-700 capitalize">{p.categorySlug}</div>
                        </div>
                      </div>

                      {/* Variant chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map(v => (
                          <span key={v.id} className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-700">
                            {v.packSize} · <strong className="text-emerald-700">₹{v.price}</strong> ({v.stockQty} in stock)
                          </span>
                        ))}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        <button
                          onClick={() => setActiveProductDrawer(p)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        {(p.approvalStatus === 'pending' || p.approvalStatus === 'rejected') && (
                          <button
                            onClick={() => handleApproveProduct(p)}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                        )}

                        {p.approvalStatus !== 'rejected' && (
                          <button
                            onClick={() => {
                              setRejectProductModal(p);
                              setRejectProductReason('');
                            }}
                            className="p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {onPreviewProductInStore && (
                          <button
                            onClick={() => onPreviewProductInStore(p)}
                            className="p-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                            title="Preview in Store"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleProductVisibility(p)}
                          className="p-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                          title="Toggle Visibility"
                        >
                          {p.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {sortedCatalogProducts.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <span>Show</span>
                  <select
                    value={catalogPageSize}
                    onChange={e => {
                      setCatalogPageSize(Number(e.target.value));
                      setCatalogPage(1);
                    }}
                    className="h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                  >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={999}>All products</option>
                  </select>
                  <span>
                    (Page <strong className="text-slate-900">{catalogPage}</strong> of <strong className="text-slate-900">{totalCatalogPages}</strong>)
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={catalogPage <= 1}
                    onClick={() => setCatalogPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalCatalogPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      totalCatalogPages <= 5 ||
                      pageNum === 1 ||
                      pageNum === totalCatalogPages ||
                      Math.abs(pageNum - catalogPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCatalogPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                            catalogPage === pageNum
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (pageNum === 2 || pageNum === totalCatalogPages - 1) {
                      return <span key={pageNum} className="text-slate-400 px-1">...</span>;
                    }
                    return null;
                  })}

                  <button
                    disabled={catalogPage >= totalCatalogPages}
                    onClick={() => setCatalogPage(prev => Math.min(totalCatalogPages, prev + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: AUDIT & PREVIEW LOGS
          ========================================================================= */}
      {adminTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4">
          <div className="p-4 sm:p-5 border-b border-slate-200">
            <h2 className="font-extrabold text-base text-slate-900">
              Administrative Status Changes & Preview Logs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable audit history recording all approval decisions, suspensions, reactivations, and admin portal previews.
            </p>
          </div>

          <div className="p-4 sm:p-5 space-y-6">
            {/* Status Change History across all vendors */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Vendor Lifecycle Decisions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 pl-4">Timestamp</th>
                      <th className="p-3">Vendor</th>
                      <th className="p-3">Admin</th>
                      <th className="p-3">Transition</th>
                      <th className="p-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendors.flatMap(v =>
                      (v.statusHistory || []).map(hist => ({
                        ...hist,
                        vendorName: v.businessName
                      }))
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No status changes recorded yet.
                        </td>
                      </tr>
                    ) : (
                      vendors
                        .flatMap(v =>
                          (v.statusHistory || []).map(hist => ({
                            ...hist,
                            vendorName: v.businessName
                          }))
                        )
                        .reverse()
                        .map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3 pl-4 text-slate-500 whitespace-nowrap tabular-nums">
                              {item.timestamp}
                            </td>
                            <td className="p-3 font-bold text-slate-900">{item.vendorName}</td>
                            <td className="p-3 text-slate-600">{item.adminIdentifier}</td>
                            <td className="p-3">
                              <span className="font-semibold capitalize text-slate-600">
                                {item.previousStatus}
                              </span>{' '}
                              &rarr;{' '}
                              <span
                                className={`font-bold capitalize ${
                                  item.newStatus === 'approved'
                                    ? 'text-emerald-700'
                                    : item.newStatus === 'rejected'
                                    ? 'text-rose-700'
                                    : item.newStatus === 'suspended'
                                    ? 'text-amber-700'
                                    : 'text-slate-800'
                                }`}
                              >
                                {item.newStatus}
                              </span>
                            </td>
                            <td className="p-3 text-slate-700 max-w-xs">{item.reason}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Admin Preview Sessions */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Admin Vendor Portal Preview Sessions
              </h3>
              {adminPreviewLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                  No admin preview sessions logged yet. Use "Preview Portal" on any supplier to inspect their dashboard in secure read-only mode.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Timestamp</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">Target Vendor</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Security Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminPreviewLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-4 text-slate-500 whitespace-nowrap tabular-nums">
                            {log.timestamp}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">{log.adminIdentifier}</td>
                          <td className="p-3 font-bold text-slate-900">{log.vendorName}</td>
                          <td className="p-3">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{log.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Catalog Moderation & Visibility Decisions */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Supermarket Catalog Moderation Audit Trail
                </h3>
                <span className="text-xs text-slate-400 font-semibold">
                  {catalogAuditLogs.length} Moderation Decisions
                </span>
              </div>
              {catalogAuditLogs.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl text-xs">
                  No catalog moderation actions logged yet. Approve, reject, or hide products to generate audit logs.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Timestamp</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">State Transition</th>
                        <th className="p-3">Reason / Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {catalogAuditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-3 pl-4 text-slate-500 whitespace-nowrap tabular-nums">
                            {log.timestamp}
                          </td>
                          <td className="p-3 font-bold text-slate-900">{log.productName}</td>
                          <td className="p-3 text-slate-600">{log.adminIdentifier}</td>
                          <td className="p-3">
                            <span
                              className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                log.action === 'APPROVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : log.action === 'REJECT'
                                  ? 'bg-rose-100 text-rose-800'
                                  : log.action === 'HIDE'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700">
                            {log.previousState && log.newState ? (
                              <span>
                                {log.previousState} &rarr; <strong className="text-slate-900">{log.newState}</strong>
                              </span>
                            ) : (
                              <span>-</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs">{log.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER / VIEW DETAILS: SUPPLIER APPLICATION REVIEW
          ========================================================================= */}
      {activeVendorDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black uppercase ${
                      activeVendorDrawer.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : activeVendorDrawer.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : activeVendorDrawer.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {activeVendorDrawer.status}
                  </span>
                  <span className="capitalize font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                    {activeVendorDrawer.businessType}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1.5">
                  {activeVendorDrawer.businessName}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Registered on <span className="tabular-nums font-semibold">{activeVendorDrawer.createdAt}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveVendorDrawer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* 1. Contact & Location Profile */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  <span>Business & Contact Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-slate-400 text-[11px]">Owner / Contact Person</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {activeVendorDrawer.ownerName}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Registered Mobile Number</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5 tabular-nums">
                      {activeVendorDrawer.phone}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Email Address</div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {activeVendorDrawer.email || 'Not provided'}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[11px]">Locality / Operating Hub</div>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {activeVendorDrawer.locality}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-slate-400 text-[11px]">Full Physical Store / Farm Address</div>
                    <div className="text-slate-800 mt-0.5 font-medium">
                      {activeVendorDrawer.address}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-slate-400 text-[11px]">Delivery Service Area Coverage</div>
                    <div className="text-slate-800 mt-0.5 font-semibold">
                      {activeVendorDrawer.serviceArea}
                    </div>
                  </div>

                  {activeVendorDrawer.description && (
                    <div className="sm:col-span-2">
                      <div className="text-slate-400 text-[11px]">Business Description</div>
                      <div className="text-slate-600 mt-0.5 italic">
                        "{activeVendorDrawer.description}"
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Configurable Document Verification Checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Uploaded Documents ({activeVendorDrawer.businessType.toUpperCase()} Requirements)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Configured by business classification
                  </span>
                </div>

                <div className="space-y-2.5">
                  {BUSINESS_TYPE_DOCUMENT_RULES[activeVendorDrawer.businessType]?.map(rule => {
                    const uploadedDoc = activeVendorDrawer.documents?.find(
                      d => d.documentType === rule.type
                    );

                    return (
                      <div
                        key={rule.type}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                          uploadedDoc
                            ? uploadedDoc.status === 'verified'
                              ? 'bg-emerald-50/50 border-emerald-200'
                              : uploadedDoc.status === 'rejected'
                              ? 'bg-rose-50/50 border-rose-200'
                              : 'bg-amber-50/50 border-amber-200'
                            : rule.mandatory
                            ? 'bg-slate-50 border-dashed border-slate-300'
                            : 'bg-slate-50/30 border-dashed border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{rule.name}</span>
                            {rule.mandatory ? (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                                Mandatory
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                Optional
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">{rule.description}</div>

                          {uploadedDoc ? (
                            <div className="text-[11px] text-slate-600 pt-1 flex items-center gap-2 font-mono">
                              <span>📄 {uploadedDoc.fileName}</span>
                              {uploadedDoc.fileSize && <span>({uploadedDoc.fileSize})</span>}
                              <span>· Uploaded {uploadedDoc.uploadedAt}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-700 font-semibold pt-1">
                              ⚠️ Document not yet submitted by supplier.
                            </div>
                          )}
                        </div>

                        {uploadedDoc ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <button
                              onClick={() =>
                                setPreviewDoc({
                                  doc: uploadedDoc,
                                  vendorName: activeVendorDrawer.businessName
                                })
                              }
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold text-xs inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3 h-3 text-slate-500" />
                              <span>View Doc</span>
                            </button>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                uploadedDoc.status === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : uploadedDoc.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {uploadedDoc.status === 'verified'
                                ? '✓ Verified'
                                : uploadedDoc.status === 'rejected'
                                ? '✕ Rejected'
                                : '⏳ Pending Review'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 italic">
                            Missing
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Rejection / Resubmission Status (if rejected) */}
              {activeVendorDrawer.status === 'rejected' && (
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-2">
                  <div className="font-extrabold text-rose-900 text-xs uppercase flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Application Rejection Details</span>
                  </div>
                  <div className="text-xs text-rose-800">
                    <strong>Recorded Reason:</strong> {activeVendorDrawer.rejectionReason}
                  </div>
                  <div className="text-xs text-slate-600 pt-1">
                    <strong>Vendor Resubmission Status:</strong>{' '}
                    {activeVendorDrawer.resubmissionStatus === 'resubmitted' ? (
                      <span className="font-bold text-emerald-700">
                        Revised documents submitted by vendor! Ready for re-evaluation.
                      </span>
                    ) : (
                      <span className="font-bold text-amber-700">
                        Pending resubmission. Vendor has been alerted to provide corrected records.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Suspension Status (if suspended) */}
              {activeVendorDrawer.status === 'suspended' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-2">
                  <div className="font-extrabold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Store Suspension Enforced</span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <strong>Reason for Suspension:</strong> {activeVendorDrawer.suspensionReason}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    All products for this vendor are hidden from customer view. Stock modifications are locked. Active placed orders remain preserved.
                  </div>
                </div>
              )}

              {/* 5. Status Change Audit History */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Status Change & Moderation History</span>
                </h3>

                <div className="space-y-2">
                  {(!activeVendorDrawer.statusHistory || activeVendorDrawer.statusHistory.length === 0) ? (
                    <div className="text-slate-400 italic text-xs">
                      No status transitions recorded yet.
                    </div>
                  ) : (
                    activeVendorDrawer.statusHistory.map(hist => (
                      <div
                        key={hist.id}
                        className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-bold text-slate-800">
                            {hist.previousStatus.toUpperCase()} &rarr; {hist.newStatus.toUpperCase()}
                          </span>
                          <span className="text-slate-400 tabular-nums">{hist.timestamp}</span>
                        </div>
                        <div className="text-slate-600">{hist.reason}</div>
                        <div className="text-[10px] text-slate-400">By: {hist.adminIdentifier}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-2 justify-between items-center sticky bottom-0">
              <button
                onClick={() => handleLaunchAdminPreview(activeVendorDrawer)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Launch Admin Preview</span>
              </button>

              <div className="flex items-center gap-2">
                {activeVendorDrawer.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setRequestInfoModalVendor(activeVendorDrawer);
                        setRequestInfoInput('');
                      }}
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold rounded-xl text-xs"
                    >
                      Request Info
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalVendor(activeVendorDrawer);
                        setRejectReasonInput('');
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveVendor(activeVendorDrawer.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                    >
                      Approve Application
                    </button>
                  </>
                )}

                {activeVendorDrawer.status === 'approved' && (
                  <button
                    onClick={() => {
                      setSuspendModalVendor(activeVendorDrawer);
                      setSuspendReasonInput('');
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-rose-600 hover:text-white text-slate-800 font-bold rounded-xl text-xs transition-colors"
                  >
                    Suspend Partner
                  </button>
                )}

                {activeVendorDrawer.status === 'suspended' && (
                  <button
                    onClick={() => {
                      setReactivateModalVendor(activeVendorDrawer);
                      setReactivateReasonInput('');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                  >
                    Reactivate Partner
                  </button>
                )}

                {activeVendorDrawer.status === 'rejected' && (
                  <button
                    onClick={() => handleApproveVendor(activeVendorDrawer.id, 'Re-evaluated and approved after application review.')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
                  >
                    Re-evaluate & Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: REJECT VENDOR (MANDATORY REASON)
          ========================================================================= */}
      {rejectModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  Reject Vendor Application
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{rejectModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setRejectModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Rejection <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={e => setRejectReasonInput(e.target.value)}
                placeholder="e.g. FSSAI registration document copy is unreadable / Municipal commercial license expired. Please re-submit with clear scanned certificate."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                This explanation will be permanently recorded in the audit history and displayed directly to the vendor in their portal.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SUSPEND VENDOR (MANDATORY REASON & EXPLANATION OF IMPACT)
          ========================================================================= */}
      {suspendModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <span>Suspend Supplier Store</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{suspendModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setSuspendModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Impact Explanation */}
            <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold uppercase text-[10px]">What Happens Upon Suspension:</div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li><strong>Product Listings:</strong> Immediately hidden from customer search and category browsing.</li>
                <li><strong>New Orders:</strong> Customers cannot add items or checkout with this vendor's products.</li>
                <li><strong>Existing Orders:</strong> Orders already placed remain safe in order history for delivery & tracking.</li>
                <li><strong>Vendor Catalog:</strong> Products are never deleted; they are preserved and restored when reactivated.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reason for Suspension <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={suspendReasonInput}
                onChange={e => setSuspendReasonInput(e.target.value)}
                placeholder="e.g. Quality complaint received: expired milk packets supplied on 2026-03-16. Storefront deactivated pending dairy inspection."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSuspendModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Enforce Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: REACTIVATE VENDOR
          ========================================================================= */}
      {reactivateModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-emerald-600" />
                  <span>Reactivate Suspended Vendor</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{reactivateModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setReactivateModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs text-emerald-900">
              Reactivating this supplier will instantly restore all approved products to the customer storefront and allow new customer orders.
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Reactivation Audit Note
              </label>
              <textarea
                rows={3}
                value={reactivateReasonInput}
                onChange={e => setReactivateReasonInput(e.target.value)}
                placeholder="e.g. Warehouse inspection completed satisfactorily. Vendor agreed to strict daily temperature compliance."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setReactivateModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReactivate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Confirm Reactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: REQUEST ADDITIONAL INFORMATION
          ========================================================================= */}
      {requestInfoModalVendor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <span>Request Additional Information</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong className="text-slate-800">{requestInfoModalVendor.businessName}</strong>
                </p>
              </div>
              <button
                onClick={() => setRequestInfoModalVendor(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Specify Missing Information / Requested Documents <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                value={requestInfoInput}
                onChange={e => setRequestInfoInput(e.target.value)}
                placeholder="e.g. Please upload the Livestock Health NOC issued by Hospete Veterinary Hospital, and confirm your morning delivery hours for College Road."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-600 text-slate-800"
              />
              <p className="text-[11px] text-slate-400">
                This notice will appear in the vendor dashboard banner with instructions to submit updates.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRequestInfoModalVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRequestInfo}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DOCUMENT PREVIEW SIMULATOR
          ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span>{previewDoc.doc.documentName}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded by: <strong className="text-slate-800">{previewDoc.vendorName}</strong>
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                <FileCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm font-mono">{previewDoc.doc.fileName}</div>
                <div className="text-xs text-slate-500 mt-1">
                  File Size: {previewDoc.doc.fileSize || '1.2 MB'} · Uploaded: {previewDoc.doc.uploadedAt}
                </div>
                <div className="text-xs text-slate-400 mt-2">
                  [Verified Government Seal · Hospete Taluk Revenue & FSSAI Authority Record]
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded ${
                  previewDoc.doc.status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800'
                    : previewDoc.doc.status === 'rejected'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                Status: {previewDoc.doc.status.toUpperCase()}
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: PRODUCT DETAILS & VARIANT INSPECTION
          ========================================================================= */}
      {activeProductDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/80 sticky top-0 z-10 backdrop-blur-xs">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  {(() => {
                    const vendor = vendors.find(v => v.id === activeProductDrawer.vendorId);
                    const statusInfo = getProductStorefrontStatus(activeProductDrawer, vendor);
                    return (
                      <>
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black border ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                        <span className="capitalize font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded text-[11px]">
                          {CATEGORIES.find(c => c.slug === activeProductDrawer.categorySlug)?.name || activeProductDrawer.categorySlug}
                        </span>
                        {activeProductDrawer.sku && (
                          <span className="font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {activeProductDrawer.sku}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-2">
                  {activeProductDrawer.name}
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  Brand: <strong className="text-slate-800">{activeProductDrawer.brand}</strong> · Added: <span className="tabular-nums font-semibold">{activeProductDrawer.createdAt || '2026-03-01'}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveProductDrawer(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Product Visual & Description */}
              <div className="space-y-3">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <img
                    src={activeProductDrawer.imageUrl}
                    alt={activeProductDrawer.name}
                    onError={e => handleImageError(e, activeProductDrawer.name)}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                  />
                  <div className="space-y-1.5 flex-1">
                    <div className="font-bold text-slate-900 text-sm">Product Overview</div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      {activeProductDrawer.description}
                    </p>
                    {activeProductDrawer.barcode && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        Barcode: {activeProductDrawer.barcode}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Partner Card */}
              {(() => {
                const vendor = vendors.find(v => v.id === activeProductDrawer.vendorId);
                return (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span>Supplier Partner Details</span>
                      </h3>
                      {vendor && (
                        <button
                          onClick={() => {
                            setActiveProductDrawer(null);
                            setActiveVendorDrawer(vendor);
                          }}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <span>Review Supplier Application</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {vendor ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <div className="text-slate-400 text-[11px]">Business Name</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{vendor.businessName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Contact Person / Owner</div>
                          <div className="font-bold text-slate-900 text-sm mt-0.5">{vendor.ownerName}</div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Phone & Locality</div>
                          <div className="font-semibold text-slate-800 mt-0.5">
                            {vendor.phone} · <span className="text-emerald-700">{vendor.locality}</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 text-[11px]">Supplier Compliance Status</div>
                          <div className="mt-0.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                vendor.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : vendor.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : vendor.status === 'suspended'
                                  ? 'bg-slate-200 text-slate-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {vendor.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-slate-500 text-xs">
                        Central Hospete Fresh Inventory Warehouse
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Rejection / Moderation Details if applicable */}
              {activeProductDrawer.rejectionReason && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Listing Rejection Notice</span>
                  </div>
                  <div className="text-rose-800 font-medium">
                    {activeProductDrawer.rejectionReason}
                  </div>
                  <div className="text-[11px] text-rose-600 pt-1">
                    The supplier has been notified and can correct their catalog data to resubmit.
                  </div>
                </div>
              )}

              {activeProductDrawer.adminNotes && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  <span className="font-bold">Admin Note:</span> {activeProductDrawer.adminNotes}
                </div>
              )}

              {/* Complete Variants Inspection Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>Pack Sizes & Variant Inventory ({activeProductDrawer.variants.length} Listed)</span>
                  </h3>
                  <div className="text-xs text-slate-500">
                    Total Units: <strong className="text-emerald-700">
                      {activeProductDrawer.variants.reduce((sum, v) => sum + v.stockQty, 0)} units
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 pl-4">Pack Size</th>
                        <th className="p-3">Selling Price</th>
                        <th className="p-3">MRP</th>
                        <th className="p-3">Discount</th>
                        <th className="p-3">Stock Units</th>
                        <th className="p-3 pr-4">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeProductDrawer.variants.map(v => {
                        const discountPct = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0;
                        return (
                          <tr key={v.id} className="hover:bg-slate-50">
                            <td className="p-3 pl-4 font-bold text-slate-900">{v.packSize}</td>
                            <td className="p-3 font-black text-emerald-700 tabular-nums">₹{v.price}</td>
                            <td className="p-3 text-slate-400 line-through tabular-nums">₹{v.mrp}</td>
                            <td className="p-3">
                              {discountPct > 0 ? (
                                <span className="font-bold text-emerald-700">{discountPct}% OFF</span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <span
                                className={`font-black tabular-nums px-2.5 py-1 rounded text-xs ${
                                  v.stockQty > 10
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : v.stockQty > 0
                                    ? 'bg-amber-50 text-amber-800'
                                    : 'bg-rose-50 text-rose-800'
                                }`}
                              >
                                {v.stockQty} {v.stockQty === 0 ? '(Out of Stock)' : 'units'}
                              </span>
                            </td>
                            <td className="p-3 pr-4">
                              {v.isDefault ? (
                                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  Default
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Variant</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/80 sticky bottom-0 z-10 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {(activeProductDrawer.approvalStatus === 'pending' || activeProductDrawer.approvalStatus === 'rejected') && (
                  <button
                    onClick={() => handleApproveProduct(activeProductDrawer)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Product</span>
                  </button>
                )}

                {activeProductDrawer.approvalStatus !== 'rejected' && (
                  <button
                    onClick={() => {
                      setRejectProductModal(activeProductDrawer);
                      setRejectProductReason('');
                    }}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Listing...</span>
                  </button>
                )}

                <button
                  onClick={() => handleToggleProductVisibility(activeProductDrawer)}
                  className={`px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors border flex items-center gap-1.5 ${
                    activeProductDrawer.isActive !== false
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {activeProductDrawer.isActive !== false ? (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-500" />
                      <span>Hide from Store</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>Make Live</span>
                    </>
                  )}
                </button>

                {onPreviewProductInStore && (
                  <button
                    onClick={() => {
                      onPreviewProductInStore(activeProductDrawer);
                      setActiveProductDrawer(null);
                    }}
                    className="px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors border bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 flex items-center gap-1.5"
                    title="Preview in Customer Storefront"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-600" />
                    <span>Preview in Store</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveProductDrawer(null)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REJECT PRODUCT WITH MANDATORY REASON
          ========================================================================= */}
      {rejectProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  <span>Reject Catalog Product Listing</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Product: <strong className="text-slate-800">{rejectProductModal.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setRejectProductModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold uppercase text-[10px]">Mandatory Moderation Feedback:</div>
              <p className="text-[11px] leading-relaxed">
                Provide a clear reason explaining why this item cannot be published. The vendor partner will see this reason on their dashboard so they can adjust packaging, pricing, or licenses and resubmit.
              </p>
            </div>

            {/* Quick Reason Presets */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Quick Preset Templates:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Nutritional facts label missing; packaging photos do not show batch number or FSSAI license.',
                  'Selling price exceeds Hospete APMC local market benchmark rate.',
                  'Product packaging image is blurry; please upload a clear, uncropped photo.',
                  'Cold chain NOC required for perishable dairy and meat derivative products.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectProductReason(preset)}
                    className="text-[11px] text-left p-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200/60"
                  >
                    {preset.slice(0, 48)}...
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Detailed Rejection Reason <span className="text-rose-600">* (Mandatory)</span>
              </label>
              <textarea
                rows={3}
                value={rejectProductReason}
                onChange={e => setRejectProductReason(e.target.value)}
                placeholder="Enter specific feedback for the vendor explaining what needs to be changed..."
                className="w-full p-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-rose-600 text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectProductModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectProduct}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
