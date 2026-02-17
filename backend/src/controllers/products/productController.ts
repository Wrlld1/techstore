import { Request, Response, NextFunction } from 'express';
import prisma from '../../config/database';
import { sendSuccess, NotFoundError } from '../../utils/apiResponse';
import { ProductQueryInput, CreateProductInput } from '../../utils/validators';
import { generateSlug } from '../../utils/helpers';
import { Prisma } from '@prisma/client';

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      categoryId,
      brandId,
      minPrice,
      maxPrice,
      sort = 'newest',
      isNew,
      isFeatured,
      inStock,
    } = req.query as unknown as ProductQueryInput;

    // Build price filter properly
    const priceFilter: any = {};
    if (minPrice !== undefined && minPrice !== null) priceFilter.gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== null) priceFilter.lte = Number(maxPrice);

    // Build category filter: include child categories AND parent products
    let categoryFilter: any = undefined;
    if (categoryId) {
      const catId = Number(categoryId);
      // Get the category to check if it has a parent
      const category = await prisma.category.findUnique({
        where: { id: catId },
        select: { id: true, parentId: true },
      });
      
      // Get child categories
      const childCategories = await prisma.category.findMany({
        where: { parentId: catId },
        select: { id: true },
      });
      
      // If it's a subcategory (has parent), search only in this subcategory
      // If it's a parent category, search in parent + all children
      const categoryIds = [catId, ...childCategories.map(c => c.id)];
      categoryFilter = { categoryId: { in: categoryIds } };
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...categoryFilter,
      ...(brandId && { brandId: Number(brandId) }),
      ...(Object.keys(priceFilter).length > 0 && { price: priceFilter }),
      ...(isNew !== undefined && { isNew }),
      ...(isFeatured !== undefined && { isFeatured }),
      ...(inStock && { stock: { gt: 0 } }),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (sort) {
        case 'price_asc': return { price: 'asc' };
        case 'price_desc': return { price: 'desc' };
        case 'rating': return { rating: 'desc' };
        case 'popular': return { salesCount: 'desc' };
        default: return { createdAt: 'desc' };
      }
    })();

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true, slug: true } },
          images: {
            orderBy: { sortOrder: 'asc' },
            select: { id: true, url: true, alt: true, isMain: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    sendSuccess(res, products, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true, parentId: true } },
        brand: { select: { id: true, name: true, slug: true, logo: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Товар не найден');
    }

    // Increment view count
    await prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
};

export const getRelatedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, brandId: true },
    });

    if (!product) {
      throw new NotFoundError('Товар не найден');
    }

    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: [
          { categoryId: product.categoryId },
          { brandId: product.brandId },
        ],
      },
      take: 8,
      orderBy: { rating: 'desc' },
      include: {
        brand: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, alt: true, isMain: true } },
      },
    });

    sendSuccess(res, related);
  } catch (error) {
    next(error);
  }
};

export const searchSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return sendSuccess(res, []);
    }

    const suggestions = await prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true, name: true, slug: true, price: true,
        brand: { select: { name: true } },
        images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
      },
      take: 6,
      orderBy: { salesCount: 'desc' },
    });

    sendSuccess(res, suggestions);
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN ====================
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body as CreateProductInput;
    const slug = generateSlug(data.name);

    const product = await prisma.product.create({
      data: {
        ...data,
        slug,
        price: new Prisma.Decimal(data.price),
        oldPrice: data.oldPrice ? new Prisma.Decimal(data.oldPrice) : null,
      },
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
      },
    });

    sendSuccess(res, product, 'Товар создан', 201);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updateData: any = { ...data };
    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }
    if (data.price !== undefined) {
      updateData.price = new Prisma.Decimal(data.price);
    }
    if (data.oldPrice !== undefined) {
      updateData.oldPrice = data.oldPrice ? new Prisma.Decimal(data.oldPrice) : null;
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: true,
      },
    });

    sendSuccess(res, product, 'Товар обновлён');
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ where: { id: parseInt(id) } });

    sendSuccess(res, null, 'Товар удалён');
  } catch (error) {
    next(error);
  }
};

// ==================== IMAGE MANAGEMENT ====================
import fs from 'fs';
import path from 'path';

export const uploadImages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'Файлы не загружены' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundError('Товар');

    // Check existing image count
    const existingCount = await prisma.productImage.count({ where: { productId } });

    const images = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const image = await prisma.productImage.create({
        data: {
          productId,
          url: `/uploads/products/${file.filename}`,
          alt: product.name,
          isMain: existingCount === 0 && i === 0, // first image = main if no images exist
          sortOrder: existingCount + i,
        },
      });
      images.push(image);
    }

    sendSuccess(res, images, `${images.length} изображений загружено`);
  } catch (error) {
    next(error);
  }
};

export const deleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, imageId } = req.params;

    const image = await prisma.productImage.findFirst({
      where: { id: parseInt(imageId), productId: parseInt(id) },
    });

    if (!image) throw new NotFoundError('Изображение');

    // Delete file from disk
    const filePath = path.join(__dirname, '..', '..', '..', image.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.productImage.delete({ where: { id: image.id } });

    // If deleted image was main, set first remaining image as main
    if (image.isMain) {
      const firstImage = await prisma.productImage.findFirst({
        where: { productId: parseInt(id) },
        orderBy: { sortOrder: 'asc' },
      });
      if (firstImage) {
        await prisma.productImage.update({ where: { id: firstImage.id }, data: { isMain: true } });
      }
    }

    sendSuccess(res, null, 'Изображение удалено');
  } catch (error) {
    next(error);
  }
};
