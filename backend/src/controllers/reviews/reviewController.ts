import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, ConflictError } from '../../utils/apiResponse';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { productId, rating, title, comment, pros, cons } = req.body;

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });
    if (existing) throw new ConflictError('Вы уже оставили отзыв на этот товар');

    const review = await prisma.review.create({
      data: { productId, userId, rating, title, comment, pros, cons },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    // Recalculate product rating
    const stats = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    sendSuccess(res, review, 'Отзыв отправлен на модерацию', 201);
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId: parseInt(productId), isApproved: true },
        include: { user: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where: { productId: parseInt(productId), isApproved: true } }),
    ]);

    sendSuccess(res, reviews, undefined, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// Admin
export const moderateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    const review = await prisma.review.update({
      where: { id: parseInt(id) },
      data: { isApproved },
    });

    // Recalculate rating
    const stats = await prisma.review.aggregate({
      where: { productId: review.productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: review.productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count.rating,
      },
    });

    sendSuccess(res, review, `Отзыв ${isApproved ? 'одобрен' : 'отклонён'}`);
  } catch (error) {
    next(error);
  }
};

export const getPendingReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, reviews);
  } catch (error) {
    next(error);
  }
};
