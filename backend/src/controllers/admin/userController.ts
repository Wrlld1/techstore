import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, NotFoundError } from '../../utils/apiResponse';

// GET /admin/users — list all users with pagination and search
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true, reviews: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, users, undefined, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// GET /admin/users/:id — get user details
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, rating: true, comment: true, createdAt: true, product: { select: { name: true } } },
        },
        _count: { select: { orders: true, reviews: true, favorites: true } },
      },
    });

    if (!user) throw new NotFoundError('Пользователь не найден');
    sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
};

// PUT /admin/users/:id/role — change user role
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['CUSTOMER', 'ADMIN'].includes(role)) {
      throw new NotFoundError('Недопустимая роль');
    }

    // Prevent self-demotion
    if (parseInt(id) === req.user!.userId) {
      throw new NotFoundError('Нельзя изменить свою роль');
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    sendSuccess(res, user, `Роль изменена на ${role}`);
  } catch (error) {
    next(error);
  }
};

// PUT /admin/users/:id/toggle-active — block/unblock user
export const toggleUserActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Prevent self-blocking
    if (parseInt(id) === req.user!.userId) {
      throw new NotFoundError('Нельзя заблокировать себя');
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: { isActive: true },
    });

    if (!user) throw new NotFoundError('Пользователь не найден');

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
    });

    sendSuccess(res, updated, updated.isActive ? 'Пользователь разблокирован' : 'Пользователь заблокирован');
  } catch (error) {
    next(error);
  }
};
