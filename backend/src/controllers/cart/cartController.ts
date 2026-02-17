import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/apiResponse';

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true, oldPrice: true,
            stock: true, isActive: true,
            images: { where: { isMain: true }, take: 1 },
            brand: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user!.userId;

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
      include: {
        product: {
          select: { id: true, name: true, price: true, stock: true },
        },
      },
    });

    sendSuccess(res, item, 'Товар добавлен в корзину');
  } catch (error) {
    next(error);
  }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const userId = req.user!.userId;

    const item = await prisma.cartItem.update({
      where: { userId_productId: { userId, productId: parseInt(productId) } },
      data: { quantity },
    });

    sendSuccess(res, item, 'Корзина обновлена');
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    await prisma.cartItem.delete({
      where: { userId_productId: { userId: req.user!.userId, productId: parseInt(productId) } },
    });
    sendSuccess(res, null, 'Товар удалён из корзины');
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
    sendSuccess(res, null, 'Корзина очищена');
  } catch (error) {
    next(error);
  }
};

export const syncCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { items } = req.body; // [{productId, quantity}]

    if (!Array.isArray(items)) {
      return sendSuccess(res, [], 'Нет данных для синхронизации');
    }

    for (const item of items) {
      await prisma.cartItem.upsert({
        where: { userId_productId: { userId, productId: item.productId } },
        update: { quantity: item.quantity },
        create: { userId, productId: item.productId, quantity: item.quantity },
      });
    }

    const cart = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true, stock: true,
            images: { where: { isMain: true }, take: 1 },
          },
        },
      },
    });

    sendSuccess(res, cart, 'Корзина синхронизирована');
  } catch (error) {
    next(error);
  }
};
