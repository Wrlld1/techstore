import { Router } from 'express';
import {
  getCart, addToCart, updateCartItem, removeFromCart, clearCart, syncCart,
} from '../controllers/cart/cartController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { cartItemSchema } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', validate(cartItemSchema), addToCart);
router.post('/sync', syncCart);
router.put('/:productId', updateCartItem);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

export default router;
