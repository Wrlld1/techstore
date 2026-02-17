import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, NotFoundError } from '../../utils/apiResponse';
import { generateSlug } from '../../utils/helpers';

export const getBrands = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    sendSuccess(res, brands);
  } catch (error) {
    next(error);
  }
};

export const createBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, logo } = req.body;
    const brand = await prisma.brand.create({
      data: { name, slug: generateSlug(name), description, logo },
    });
    sendSuccess(res, brand, 'Бренд создан', 201);
  } catch (error) {
    next(error);
  }
};

export const updateBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.name) data.slug = generateSlug(data.name);
    const brand = await prisma.brand.update({ where: { id: parseInt(id) }, data });
    sendSuccess(res, brand, 'Бренд обновлён');
  } catch (error) {
    next(error);
  }
};

export const deleteBrand = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id);
    const productCount = await prisma.product.count({ where: { brandId: id } });
    if (productCount > 0) {
      throw new NotFoundError(`Нельзя удалить: ${productCount} товаров привязано`);
    }
    await prisma.brand.delete({ where: { id } });
    sendSuccess(res, null, 'Бренд удалён');
  } catch (error) {
    next(error);
  }
};
