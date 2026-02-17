import { z } from 'zod';

// ==================== Auth ====================
export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов').max(100),
  firstName: z.string().min(2, 'Минимум 2 символа').max(50),
  lastName: z.string().min(2, 'Минимум 2 символа').max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});

// ==================== Products ====================
export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  price: z.number().positive('Цена должна быть положительной'),
  oldPrice: z.number().positive().optional().nullable(),
  sku: z.string().min(1),
  stock: z.number().int().min(0).default(0),
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive(),
  specifications: z.record(z.any()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  brandId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest', 'popular']).default('newest'),
  isNew: z.coerce.boolean().optional(),
  isFeatured: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
});

// ==================== Categories ====================
export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  parentId: z.number().int().positive().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ==================== Brands ====================
export const createBrandSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateBrandSchema = createBrandSchema.partial();

// ==================== Reviews ====================
export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(200).optional(),
  comment: z.string().max(2000).optional(),
  pros: z.string().max(500).optional(),
  cons: z.string().max(500).optional(),
});

// ==================== Cart ====================
export const cartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99).default(1),
});

// ==================== Orders ====================
export const createOrderSchema = z.object({
  addressId: z.number().int().positive().optional(),
  paymentMethod: z.enum(['CARD', 'CASH', 'ONLINE']).default('CASH'),
  comment: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1),
  })).min(1, 'Корзина пуста'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

// ==================== Address ====================
export const createAddressSchema = z.object({
  title: z.string().max(50).default('Основной'),
  city: z.string().min(2).max(100),
  street: z.string().min(2).max(200),
  house: z.string().min(1).max(20),
  apartment: z.string().max(20).optional(),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().default(false),
});

// ==================== Pagination ====================
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
