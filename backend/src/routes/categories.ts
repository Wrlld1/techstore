import { Router } from 'express';
import {
  getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
} from '../controllers/categories/categoryController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../utils/validators';

const router = Router();

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.post('/', authenticate, requireAdmin, validate(createCategorySchema), createCategory);
router.put('/:id', authenticate, requireAdmin, validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
