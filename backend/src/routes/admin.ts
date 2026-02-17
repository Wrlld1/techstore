import { Router } from 'express';
import { getDashboardStats, getRevenueChart } from '../controllers/admin/adminController';
import { getUsers, getUserById, updateUserRole, toggleUserActive } from '../controllers/admin/userController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/revenue-chart', getRevenueChart);

// User management
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/toggle-active', toggleUserActive);

export default router;
