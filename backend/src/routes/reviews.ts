import { Router } from 'express';
import {
  createReview, getProductReviews, moderateReview, getPendingReviews,
} from '../controllers/reviews/reviewController';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createReviewSchema } from '../utils/validators';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/', authenticate, validate(createReviewSchema), createReview);

// Admin
router.get('/pending', authenticate, requireAdmin, getPendingReviews);
router.patch('/:id/moderate', authenticate, requireAdmin, moderateReview);

export default router;
