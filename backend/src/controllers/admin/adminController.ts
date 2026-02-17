import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess } from '../../utils/apiResponse';

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalProducts,
      totalOrders,
      recentOrders,
      revenue,
      topProducts,
      ordersByStatus,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.order.aggregate({
        where: { status: { not: 'CANCELLED' } },
        _sum: { total: true },
      }),
      prisma.product.findMany({
        orderBy: { salesCount: 'desc' },
        take: 10,
        select: {
          id: true, name: true, slug: true, price: true,
          salesCount: true, rating: true,
          brand: { select: { name: true } },
          images: { where: { isMain: true }, take: 1 },
        },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo }, role: 'CUSTOMER' },
      }),
    ]);

    const revenueThisMonth = await prisma.order.aggregate({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    sendSuccess(res, {
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        recentOrders,
        totalRevenue: revenue._sum.total || 0,
        revenueThisMonth: revenueThisMonth._sum.total || 0,
        newUsersThisMonth,
      },
      topProducts,
      ordersByStatus: ordersByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const chartData: Record<string, number> = {};
    orders.forEach((order) => {
      const date = order.createdAt.toISOString().split('T')[0];
      chartData[date] = (chartData[date] || 0) + Number(order.total);
    });

    const result = Object.entries(chartData).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};
