import { Router } from 'express';
import {
  getProducts, getProductBySlug, getRelatedProducts, searchSuggestions,
  createProduct, updateProduct, deleteProduct, uploadImages, deleteImage,
} from '../controllers/products/productController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProductSchema, updateProductSchema, productQuerySchema } from '../utils/validators';
import { uploadProductImages } from '../middleware/upload';

const router = Router();

// Public
router.get('/', validate(productQuerySchema, 'query'), getProducts);
router.get('/search/suggestions', searchSuggestions);
router.get('/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);

// Admin
router.post('/', authenticate, requireAdmin, validate(createProductSchema), createProduct);
router.put('/:id', authenticate, requireAdmin, validate(updateProductSchema), updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

// Image management (Admin)
router.post('/:id/images', authenticate, requireAdmin, uploadProductImages.array('images', 10), uploadImages);
router.delete('/:id/images/:imageId', authenticate, requireAdmin, deleteImage);

export default router;
