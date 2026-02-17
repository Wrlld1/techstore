import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, NotFoundError, ValidationError } from '../../utils/apiResponse';
import { generateOrderNumber } from '../../utils/helpers';
import { notifyUser, notifyAdmins } from '../../sockets';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../../services/email';
import { Prisma } from '@prisma/client';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { items, addressId, paymentMethod, comment } = req.body;

    // Validate products and calculate totals
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== items.length) {
      throw new ValidationError('Некоторые товары не найдены или недоступны');
    }

    let subtotal = new Prisma.Decimal(0);
    const orderItems = items.map((item: any) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        throw new ValidationError(`Недостаточно товара "${product.name}" на складе`);
      }
      const itemTotal = product.price.mul(item.quantity);
      subtotal = subtotal.add(itemTotal);
      return {
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal,
      };
    });

    const deliveryFee = subtotal.greaterThanOrEqualTo(50000) ? new Prisma.Decimal(0) : new Prisma.Decimal(2000);
    const total = subtotal.add(deliveryFee);

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId,
          paymentMethod,
          comment,
          subtotal,
          deliveryFee,
          total,
          items: { create: orderItems },
        },
        include: {
          items: {
            include: { product: { select: { name: true, slug: true } } },
          },
        },
      });

      // Decrease stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity },
          },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    // Real-time notifications
    notifyAdmins('new_order', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
    });

    // Email notification
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, email: true } });
    if (user) {
      sendOrderConfirmation({
        orderNumber: order.orderNumber,
        customerName: user.firstName,
        customerEmail: user.email,
        items: order.items.map((item: any) => ({
          name: item.product?.name || 'Товар',
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal, deliveryFee, total,
        paymentMethod,
      });
    }

    sendSuccess(res, order, 'Заказ оформлен', 201);
  } catch (error) {
    next(error);
  }
};

export const getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, slug: true, images: { where: { isMain: true }, take: 1 } },
              },
            },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    sendSuccess(res, orders, undefined, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: { select: { name: true, slug: true, images: { where: { isMain: true }, take: 1 } } },
          },
        },
        address: true,
        user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    if (!order) throw new NotFoundError('Заказ не найден');

    // Check authorization
    if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.userId) {
      throw new NotFoundError('Заказ не найден');
    }

    sendSuccess(res, order);
  } catch (error) {
    next(error);
  }
};

// Admin: update order status
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status },
      select: { id: true, orderNumber: true, userId: true, status: true, total: true },
    });

    // Notify customer via WebSocket
    notifyUser(order.userId, 'order_status_update', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });

    // Email notification
    const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { firstName: true, email: true } });
    if (user) {
      sendOrderStatusUpdate({
        orderNumber: order.orderNumber,
        customerName: user.firstName,
        customerEmail: user.email,
        status: order.status,
        total: order.total,
      });
    }

    sendSuccess(res, order, 'Статус заказа обновлён');
  } catch (error) {
    next(error);
  }
};

// Admin: get all orders
export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;

    const where = status ? { status: status as any } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    sendSuccess(res, orders, undefined, 200, {
      page, limit, total, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};
