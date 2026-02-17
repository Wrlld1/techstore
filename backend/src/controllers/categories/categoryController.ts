import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, NotFoundError } from '../../utils/apiResponse';
import { generateSlug } from '../../utils/helpers';

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: { select: { products: true } },
          },
        },
        _count: { select: { products: true } },
      },
    });
    sendSuccess(res, categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        parent: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!category) throw new NotFoundError('Категория не найдена');
    sendSuccess(res, category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, parentId, sortOrder, isActive } = req.body;
    const category = await prisma.category.create({
      data: { name, slug: generateSlug(name), description, parentId, sortOrder, isActive },
    });
    sendSuccess(res, category, 'Категория создана', 201);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if (data.name) data.slug = generateSlug(data.name);
    const category = await prisma.category.update({ where: { id: parseInt(id) }, data });
    sendSuccess(res, category, 'Категория обновлена');
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.category.delete({ where: { id: parseInt(req.params.id) } });
    sendSuccess(res, null, 'Категория удалена');
  } catch (error) {
    next(error);
  }
};
