// ==================== API Response ====================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== User ====================
export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  createdAt: string;
  addresses?: Address[];
}

export interface Address {
  id: number;
  title: string;
  city: string;
  street: string;
  house: string;
  apartment?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ==================== Catalog ====================
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  sortOrder: number;
  isActive?: boolean;
  children?: Category[];
  parent?: Pick<Category, 'id' | 'name' | 'slug'>;
  _count?: { products: number };
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
}

// ==================== Product ====================
export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  oldPrice?: number;
  sku: string;
  stock: number;
  categoryId: number;
  brandId: number;
  specifications?: Record<string, string>;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  viewCount: number;
  salesCount: number;
  createdAt: string;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  brand: Pick<Brand, 'id' | 'name' | 'slug'>;
  images: ProductImage[];
  reviews?: Review[];
}

export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  sortOrder: number;
  isMain: boolean;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  isNew?: boolean;
  isFeatured?: boolean;
  inStock?: boolean;
}

// ==================== Review ====================
export interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  title?: string;
  comment?: string;
  pros?: string;
  cons?: string;
  isApproved: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string };
  product?: { name: string; slug: string };
}

// ==================== Cart ====================
export interface CartItem {
  id?: number;
  productId: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    oldPrice?: number;
    stock: number;
    isActive: boolean;
    images: { url: string }[];
    brand?: { name: string };
  };
}

// ==================== Order ====================
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CARD' | 'CASH' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  comment?: string;
  createdAt: string;
  items: OrderItem[];
  address?: Address;
  user?: Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  product: {
    name: string;
    slug: string;
    images?: { url: string }[];
  };
}

// ==================== Admin Dashboard ====================
export interface DashboardStats {
  overview: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    recentOrders: number;
    totalRevenue: number;
    revenueThisMonth: number;
    newUsersThisMonth: number;
  };
  topProducts: Product[];
  ordersByStatus: { status: OrderStatus; count: number }[];
}

// ==================== Notification ====================
export interface Notification {
  id: string;
  type: 'order_status' | 'new_order' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ==================== Compare ====================
export interface CompareItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  rating: number;
  specifications: Record<string, string>;
  image?: string;
  brand: string;
}