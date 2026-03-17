// Product matching and recommendation engine using TF-IDF similarity

import prisma from '../../config/database';
import { processText, buildTfVector, cosineSimilarity, extractNumbers } from './nlp';

interface MatchedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  shortDescription: string | null;
  rating: number;
  stock: number;
  category: string;
  brand: string;
  image: string | null;
  specifications: Record<string, string> | null;
  score: number;
}

interface SearchParams {
  query: string;
  categoryHint?: string;
  brandHint?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

// Category name mappings (user terms -> database slugs)
const CATEGORY_ALIASES: Record<string, string[]> = {
  smartphones: ['смартфон', 'телефон', 'мобильн', 'phone', 'iphone', 'galaxy', 'сотов'],
  laptops: ['ноутбук', 'ноут', 'laptop', 'macbook', 'лэптоп', 'ультрабук', 'игровой ноутбук'],
  tablets: ['планшет', 'tablet', 'ipad', 'таблет'],
  headphones: ['наушник', 'headphone', 'airpods', 'гарнитур', 'earbud'],
  speakers: ['колонк', 'speaker', 'динамик', 'портативн', 'bluetooth колонк', 'акустик'],
  'keyboards-mice': ['мыш', 'клавиатур', 'keyboard', 'mouse', 'мышк'],
  cases: ['чехол', 'case', 'кейс', 'бампер'],
  chargers: ['заряд', 'зарядк', 'charger', 'кабель', 'адаптер', 'powerbank', 'павербанк'],
  audio: ['аудио', 'audio', 'звук', 'музык'],
  accessories: ['аксессуар', 'accessor', 'периферия'],
};

// Brand aliases
const BRAND_ALIASES: Record<string, string[]> = {
  apple: ['apple', 'эпл', 'яблок', 'iphone', 'macbook', 'ipad', 'airpods'],
  samsung: ['samsung', 'самсунг', 'galaxy'],
  xiaomi: ['xiaomi', 'сяоми', 'ксиаоми', 'redmi'],
  asus: ['asus', 'асус', 'rog'],
  lenovo: ['lenovo', 'леново'],
  sony: ['sony', 'сони'],
  jbl: ['jbl', 'джибиэл'],
  logitech: ['logitech', 'логитек', 'логитеч', 'logi'],
};

// Use-case keywords -> recommended specs/categories
const USE_CASE_MAP: Record<string, { categories: string[]; keywords: string[] }> = {
  gaming: {
    categories: ['laptops'],
    keywords: ['игр', 'гейм', 'gaming', 'rtx', 'fps', 'game', 'играть', 'игровой'],
  },
  work: {
    categories: ['laptops', 'tablets', 'keyboards-mice'],
    keywords: ['работ', 'офис', 'бизнес', 'программир', 'разработ', 'work', 'office'],
  },
  study: {
    categories: ['laptops', 'tablets'],
    keywords: ['учеб', 'студент', 'школ', 'универ', 'study'],
  },
  photo: {
    categories: ['smartphones'],
    keywords: ['фото', 'камер', 'снимк', 'photo', 'camera', 'съемк'],
  },
  music: {
    categories: ['headphones', 'speakers'],
    keywords: ['музык', 'звук', 'слуша', 'music', 'audio', 'аудио', 'бас'],
  },
};

function detectCategory(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [slug, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) return slug;
    }
  }
  // Check use cases
  for (const useCase of Object.values(USE_CASE_MAP)) {
    for (const keyword of useCase.keywords) {
      if (lower.includes(keyword)) return useCase.categories[0];
    }
  }
  return undefined;
}

function detectBrand(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [slug, aliases] of Object.entries(BRAND_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) return slug;
    }
  }
  return undefined;
}

function detectPriceRange(text: string): { min?: number; max?: number } {
  const lower = text.toLowerCase();
  const result: { min?: number; max?: number } = {};

  // "от X до Y"
  const rangeMatch = lower.match(/от\s+(\d[\d\s]*\d|\d+)\s*(тг|тенге|руб)?\s*(до\s+(\d[\d\s]*\d|\d+))?/);
  if (rangeMatch) {
    result.min = parseInt(rangeMatch[1].replace(/\s/g, ''), 10);
    if (rangeMatch[4]) {
      result.max = parseInt(rangeMatch[4].replace(/\s/g, ''), 10);
    }
    // Normalize small numbers (assume thousands)
    if (result.min && result.min < 1000) result.min *= 1000;
    if (result.max && result.max < 1000) result.max *= 1000;
    return result;
  }

  // "до X"
  const maxMatch = lower.match(/до\s+(\d[\d\s]*\d|\d+)\s*(тг|тенге|руб)?/);
  if (maxMatch) {
    result.max = parseInt(maxMatch[1].replace(/\s/g, ''), 10);
    if (result.max < 1000) result.max *= 1000;
    return result;
  }

  // "за X", "около X", "примерно X"
  const approxMatch = lower.match(/(за|около|примерно|бюджет)\s+(\d[\d\s]*\d|\d+)\s*(тг|тенге|руб)?/);
  if (approxMatch) {
    const price = parseInt(approxMatch[2].replace(/\s/g, ''), 10);
    const normalized = price < 1000 ? price * 1000 : price;
    result.min = Math.floor(normalized * 0.7);
    result.max = Math.ceil(normalized * 1.3);
    return result;
  }

  // Keywords for budget
  if (/(дешев|недорог|бюджетн|эконом)/i.test(lower)) {
    result.max = 200000;
  } else if (/(дорог|премиум|премиальн|флагман|топов)/i.test(lower)) {
    result.min = 400000;
  } else if (/(средн|оптимальн)/i.test(lower)) {
    result.min = 150000;
    result.max = 500000;
  }

  return result;
}

export async function searchProducts(params: SearchParams): Promise<MatchedProduct[]> {
  const { query, limit = 5 } = params;

  const categorySlug = params.categoryHint || detectCategory(query);
  const brandSlug = params.brandHint || detectBrand(query);
  const priceRange = detectPriceRange(query);
  const minPrice = params.minPrice ?? priceRange.min;
  const maxPrice = params.maxPrice ?? priceRange.max;

  // Build Prisma where clause
  const where: any = { isActive: true };

  if (categorySlug) {
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
      select: { id: true },
    });
    if (category) {
      const children = await prisma.category.findMany({
        where: { parentId: category.id },
        select: { id: true },
      });
      where.categoryId = { in: [category.id, ...children.map(c => c.id)] };
    }
  }

  if (brandSlug) {
    const brand = await prisma.brand.findUnique({
      where: { slug: brandSlug },
      select: { id: true },
    });
    if (brand) where.brandId = brand.id;
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = minPrice;
    if (maxPrice) where.price.lte = maxPrice;
  }

  // Fetch candidate products
  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      images: { orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
    },
    take: 50,
  });

  // Score products with TF-IDF similarity
  const queryTokens = processText(query);
  const queryVector = buildTfVector(queryTokens);

  const scored: MatchedProduct[] = products.map(p => {
    // Build product text from all fields
    const productText = [
      p.name,
      p.shortDescription || '',
      p.description || '',
      p.category.name,
      p.brand.name,
      ...(p.specifications
        ? Object.entries(p.specifications as Record<string, string>).map(([k, v]) => `${k} ${v}`)
        : []),
    ].join(' ');

    const productTokens = processText(productText);
    const productVector = buildTfVector(productTokens);
    const similarity = cosineSimilarity(queryVector, productVector);

    // Bonus scoring
    let bonus = 0;
    if (p.isFeatured) bonus += 0.05;
    if (p.isNew) bonus += 0.03;
    if (Number(p.rating) >= 4) bonus += 0.03;
    if (p.stock > 0) bonus += 0.02;

    // Use-case relevance boost
    const queryLowerForUse = query.toLowerCase();
    for (const [, useCase] of Object.entries(USE_CASE_MAP)) {
      const queryMatchesUse = useCase.keywords.some(k => queryLowerForUse.includes(k));
      if (queryMatchesUse) {
        const productText = `${p.name} ${p.description || ''} ${p.shortDescription || ''}`.toLowerCase();
        const productMatchesUse = useCase.keywords.some(k => productText.includes(k));
        if (productMatchesUse) bonus += 0.3;
      }
    }

    // Direct name match bonus
    const nameLower = p.name.toLowerCase();
    const queryLower = query.toLowerCase();
    if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
      bonus += 0.3;
    }

    // Partial word match in name
    for (const token of queryTokens) {
      if (nameLower.includes(token)) bonus += 0.1;
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      oldPrice: p.oldPrice ? Number(p.oldPrice) : null,
      shortDescription: p.shortDescription,
      rating: Number(p.rating),
      stock: p.stock,
      category: p.category.name,
      brand: p.brand.name,
      image: p.images[0]?.url || null,
      specifications: p.specifications as Record<string, string> | null,
      score: similarity + bonus,
    };
  });

  // Sort by score and return top results
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

export async function getProductByName(query: string): Promise<MatchedProduct | null> {
  const results = await searchProducts({ query, limit: 1 });
  return results.length > 0 && results[0].score > 0.1 ? results[0] : null;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price) + ' тг';
}

export { detectCategory, detectBrand, detectPriceRange };
