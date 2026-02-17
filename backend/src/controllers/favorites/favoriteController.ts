import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/apiResponse';

export const getFavorites = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true, oldPrice: true,
            rating: true, reviewCount: true, stock: true,
            brand: { select: { name: true } },
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, favorites);
  } catch (error) {
    next(error);
  }
};

export const toggleFavorite = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { productId } = req.body;

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      sendSuccess(res, { isFavorite: false }, 'Удалено из избранного');
    } else {
      await prisma.favorite.create({ data: { userId, productId } });
      sendSuccess(res, { isFavorite: true }, 'Добавлено в избранное');
    }
  } catch (error) {
    next(error);
  }
};
