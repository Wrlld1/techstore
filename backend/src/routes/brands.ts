import { Router } from 'express';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../controllers/brands/brandController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getBrands);
router.post('/', authenticate, requireAdmin, createBrand);
router.put('/:id', authenticate, requireAdmin, updateBrand);
router.delete('/:id', authenticate, requireAdmin, deleteBrand);

export default router;
