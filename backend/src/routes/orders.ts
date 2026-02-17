import { Router } from 'express';
import {
  createOrder, getUserOrders, getOrderById,
  updateOrderStatus, getAllOrders,
} from '../controllers/orders/orderController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../utils/validators';

const router = Router();

// Customer
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.get('/my', authenticate, getUserOrders);
router.get('/:id', authenticate, getOrderById);

// Admin
router.get('/', authenticate, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticate, requireAdmin, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
