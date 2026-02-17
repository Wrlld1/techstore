import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Generate a nice placeholder product image as SVG
function generateProductImage(name: string, color: string, emoji: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color};stop-opacity:0.15"/>
      <stop offset="100%" style="stop-color:${color};stop-opacity:0.05"/>
    </linearGradient>
  </defs>
  <rect width="600" height="600" fill="url(#bg)" rx="20"/>
  <text x="300" y="260" text-anchor="middle" font-size="120">${emoji}</text>
  <text x="300" y="380" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="${color}">${escapeXml(name.length > 30 ? name.substring(0, 30) + '...' : name)}</text>
  <text x="300" y="420" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#999">TechStore</text>
</svg>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Ensure uploads directory
  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'products');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // ==================== ADMIN USER ====================
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@techstore.kz' },
    update: {},
    create: {
      email: 'admin@techstore.kz',
      password: adminPassword,
      firstName: 'Админ',
      lastName: 'TechStore',
      role: UserRole.ADMIN,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Test customer
  const customerPassword = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.upsert({
    where: { email: 'user@techstore.kz' },
    update: {},
    create: {
      email: 'user@techstore.kz',
      password: customerPassword,
      firstName: 'Тест',
      lastName: 'Покупатель',
      phone: '+7 777 123 4567',
      role: UserRole.CUSTOMER,
    },
  });
  console.log(`✅ Customer: ${customer.email}`);

  // ==================== BRANDS ====================
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { slug: 'apple' }, update: {}, create: { name: 'Apple', slug: 'apple', description: 'Think Different' } }),
    prisma.brand.upsert({ where: { slug: 'samsung' }, update: {}, create: { name: 'Samsung', slug: 'samsung', description: 'Galaxy of possibilities' } }),
    prisma.brand.upsert({ where: { slug: 'xiaomi' }, update: {}, create: { name: 'Xiaomi', slug: 'xiaomi', description: 'Innovation for everyone' } }),
    prisma.brand.upsert({ where: { slug: 'asus' }, update: {}, create: { name: 'ASUS', slug: 'asus', description: 'In Search of Incredible' } }),
    prisma.brand.upsert({ where: { slug: 'lenovo' }, update: {}, create: { name: 'Lenovo', slug: 'lenovo', description: 'Smarter Technology for All' } }),
    prisma.brand.upsert({ where: { slug: 'sony' }, update: {}, create: { name: 'Sony', slug: 'sony', description: 'Be Moved' } }),
    prisma.brand.upsert({ where: { slug: 'jbl' }, update: {}, create: { name: 'JBL', slug: 'jbl', description: 'Dare to Listen' } }),
    prisma.brand.upsert({ where: { slug: 'logitech' }, update: {}, create: { name: 'Logitech', slug: 'logitech', description: 'Designed to Move You' } }),
  ]);
  console.log(`✅ ${brands.length} brands created`);

  // ==================== CATEGORIES ====================
  const smartphones = await prisma.category.upsert({ where: { slug: 'smartphones' }, update: {}, create: { name: 'Смартфоны', slug: 'smartphones', sortOrder: 1 } });
  const laptops = await prisma.category.upsert({ where: { slug: 'laptops' }, update: {}, create: { name: 'Ноутбуки', slug: 'laptops', sortOrder: 2 } });
  const tablets = await prisma.category.upsert({ where: { slug: 'tablets' }, update: {}, create: { name: 'Планшеты', slug: 'tablets', sortOrder: 3 } });
  const audio = await prisma.category.upsert({ where: { slug: 'audio' }, update: {}, create: { name: 'Аудиотехника', slug: 'audio', sortOrder: 4 } });
  const accessories = await prisma.category.upsert({ where: { slug: 'accessories' }, update: {}, create: { name: 'Аксессуары', slug: 'accessories', sortOrder: 5 } });

  const [headphones, speakers, cases, chargers, keyboardsMice] = await Promise.all([
    prisma.category.upsert({ where: { slug: 'headphones' }, update: {}, create: { name: 'Наушники', slug: 'headphones', parentId: audio.id, sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'speakers' }, update: {}, create: { name: 'Колонки', slug: 'speakers', parentId: audio.id, sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'cases' }, update: {}, create: { name: 'Чехлы', slug: 'cases', parentId: accessories.id, sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: 'chargers' }, update: {}, create: { name: 'Зарядные устройства', slug: 'chargers', parentId: accessories.id, sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: 'keyboards-mice' }, update: {}, create: { name: 'Клавиатуры и мыши', slug: 'keyboards-mice', parentId: accessories.id, sortOrder: 3 } }),
  ]);
  console.log('✅ Categories created');

  const [apple, samsung, xiaomi, asus, lenovo, sony, jbl, logitech] = brands;

  // ==================== PRODUCTS WITH IMAGES ====================
  interface ProductSeed {
    name: string; slug: string; description: string; shortDescription: string;
    price: number; oldPrice?: number; sku: string; stock: number;
    categoryId: number; brandId: number; isNew?: boolean; isFeatured?: boolean;
    specifications: Record<string, string>;
    imageEmoji: string; imageColor: string;
  }

  const products: ProductSeed[] = [
    {
      name: 'iPhone 15 Pro Max 256GB', slug: 'iphone-15-pro-max-256gb',
      description: 'Флагманский смартфон Apple с чипом A17 Pro, титановым корпусом и камерой 48 Мп. Поддержка USB-C и Action Button.',
      shortDescription: 'A17 Pro • 6.7" OLED • 48 Мп • Титан',
      price: 699990, oldPrice: 749990, sku: 'APIP15PM256', stock: 25,
      categoryId: smartphones.id, brandId: apple.id, isNew: true, isFeatured: true,
      specifications: { 'Дисплей': '6.7" Super Retina XDR OLED', 'Процессор': 'Apple A17 Pro', 'ОЗУ': '8 ГБ', 'Память': '256 ГБ', 'Камера': '48 + 12 + 12 Мп', 'Аккумулятор': '4422 мАч', 'ОС': 'iOS 17', 'Цвет': 'Натуральный титан', 'Вес': '221 г' },
      imageEmoji: '📱', imageColor: '#5B5B5B',
    },
    {
      name: 'Samsung Galaxy S24 Ultra 512GB', slug: 'samsung-galaxy-s24-ultra-512gb',
      description: 'Премиальный смартфон Samsung с встроенным S Pen, камерой 200 Мп и AI Galaxy AI.',
      shortDescription: 'Snapdragon 8 Gen 3 • 6.8" AMOLED • 200 Мп • S Pen',
      price: 649990, sku: 'SMS24U512', stock: 30,
      categoryId: smartphones.id, brandId: samsung.id, isNew: true, isFeatured: true,
      specifications: { 'Дисплей': '6.8" Dynamic AMOLED 2X, 120 Гц', 'Процессор': 'Snapdragon 8 Gen 3', 'ОЗУ': '12 ГБ', 'Память': '512 ГБ', 'Камера': '200 + 50 + 12 + 10 Мп', 'Аккумулятор': '5000 мАч', 'ОС': 'Android 14', 'Цвет': 'Titanium Black' },
      imageEmoji: '📱', imageColor: '#1428A0',
    },
    {
      name: 'Xiaomi 14 Ultra 512GB', slug: 'xiaomi-14-ultra-512gb',
      description: 'Флагман Xiaomi с камерой Leica, чипом Snapdragon 8 Gen 3 и быстрой зарядкой 90W.',
      shortDescription: 'Snapdragon 8 Gen 3 • Leica камера • 90W зарядка',
      price: 499990, oldPrice: 549990, sku: 'XM14U512', stock: 15,
      categoryId: smartphones.id, brandId: xiaomi.id, isFeatured: true,
      specifications: { 'Дисплей': '6.73" LTPO AMOLED, 120 Гц', 'Процессор': 'Snapdragon 8 Gen 3', 'ОЗУ': '16 ГБ', 'Память': '512 ГБ', 'Камера': '50 + 50 + 50 Мп (Leica)', 'Аккумулятор': '5000 мАч', 'Зарядка': '90W / 50W беспроводная' },
      imageEmoji: '📱', imageColor: '#FF6700',
    },
    {
      name: 'MacBook Pro 14" M3 Pro', slug: 'macbook-pro-14-m3-pro',
      description: 'Профессиональный ноутбук Apple с чипом M3 Pro и дисплеем Liquid Retina XDR.',
      shortDescription: 'M3 Pro • 14.2" Liquid Retina XDR • 18 ГБ • 512 ГБ',
      price: 1099990, sku: 'APMBP14M3P', stock: 10,
      categoryId: laptops.id, brandId: apple.id, isFeatured: true,
      specifications: { 'Дисплей': '14.2" Liquid Retina XDR, 3024×1964', 'Процессор': 'Apple M3 Pro (11 ядер)', 'ОЗУ': '18 ГБ', 'Накопитель': '512 ГБ SSD', 'GPU': 'M3 Pro (14 ядер)', 'Автономность': 'до 18 часов', 'Вес': '1.61 кг', 'Порты': 'Thunderbolt 4, HDMI, SD, MagSafe' },
      imageEmoji: '💻', imageColor: '#333333',
    },
    {
      name: 'ASUS ROG Strix G16 (2024)', slug: 'asus-rog-strix-g16-2024',
      description: 'Игровой ноутбук с Intel Core i9-14900HX, RTX 4070 и экраном 240 Гц.',
      shortDescription: 'i9-14900HX • RTX 4070 • 16" QHD+ 240 Гц',
      price: 899990, oldPrice: 949990, sku: 'ASROGG16', stock: 8,
      categoryId: laptops.id, brandId: asus.id, isNew: true,
      specifications: { 'Дисплей': '16" QHD+ IPS, 240 Гц', 'Процессор': 'Intel Core i9-14900HX', 'ОЗУ': '32 ГБ DDR5', 'Накопитель': '1 ТБ SSD NVMe', 'GPU': 'NVIDIA RTX 4070 8 ГБ', 'ОС': 'Windows 11', 'Вес': '2.5 кг' },
      imageEmoji: '🎮', imageColor: '#E4002B',
    },
    {
      name: 'Lenovo IdeaPad 5 Pro 16"', slug: 'lenovo-ideapad-5-pro-16',
      description: 'Универсальный ноутбук для работы и учёбы с дисплеем 2.5K.',
      shortDescription: 'Ryzen 7 7730U • 16" 2.5K • 16 ГБ • 512 ГБ SSD',
      price: 399990, sku: 'LNIP5P16', stock: 20,
      categoryId: laptops.id, brandId: lenovo.id,
      specifications: { 'Дисплей': '16" IPS, 2560×1600, 120 Гц', 'Процессор': 'AMD Ryzen 7 7730U', 'ОЗУ': '16 ГБ DDR4', 'Накопитель': '512 ГБ SSD', 'GPU': 'AMD Radeon Graphics', 'Автономность': 'до 14 часов', 'Вес': '1.89 кг' },
      imageEmoji: '💻', imageColor: '#E2231A',
    },
    {
      name: 'iPad Pro 11" M4 256GB', slug: 'ipad-pro-11-m4-256',
      description: 'Самый тонкий iPad с чипом M4 и дисплеем Ultra Retina XDR.',
      shortDescription: 'M4 • 11" Ultra Retina XDR • 256 ГБ',
      price: 499990, sku: 'APIPP11M4', stock: 12,
      categoryId: tablets.id, brandId: apple.id, isNew: true,
      specifications: { 'Дисплей': '11" Ultra Retina XDR OLED', 'Процессор': 'Apple M4', 'Память': '256 ГБ', 'Камера': '12 Мп', 'Автономность': 'до 10 часов' },
      imageEmoji: '📋', imageColor: '#555555',
    },
    {
      name: 'Samsung Galaxy Tab S9 FE', slug: 'samsung-galaxy-tab-s9-fe',
      description: 'Планшет Samsung с IP68, S Pen в комплекте и дисплеем 10.9".',
      shortDescription: 'Exynos 1380 • 10.9" • S Pen • IP68',
      price: 199990, oldPrice: 229990, sku: 'SMTS9FE128', stock: 18,
      categoryId: tablets.id, brandId: samsung.id,
      specifications: { 'Дисплей': '10.9" TFT, 2304×1440', 'Процессор': 'Exynos 1380', 'ОЗУ': '6 ГБ', 'Память': '128 ГБ', 'Аккумулятор': '8000 мАч' },
      imageEmoji: '📋', imageColor: '#1428A0',
    },
    {
      name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5',
      description: 'Премиальные наушники с лучшим в классе шумоподавлением, 30 часов.',
      shortDescription: 'ANC • LDAC • 30 часов • Multipoint',
      price: 179990, sku: 'SNWH1000XM5', stock: 22,
      categoryId: headphones.id, brandId: sony.id, isFeatured: true,
      specifications: { 'Тип': 'Полноразмерные, закрытые', 'ANC': 'Adaptive ANC', 'Кодеки': 'SBC, AAC, LDAC', 'Автономность': 'до 30 часов', 'Быстрая зарядка': '3 мин = 3 часа', 'Вес': '250 г' },
      imageEmoji: '🎧', imageColor: '#000000',
    },
    {
      name: 'JBL Charge 5', slug: 'jbl-charge-5',
      description: 'Портативная Bluetooth-колонка с мощным басом, IP67 и функцией павербанка.',
      shortDescription: 'IP67 • 20 часов • Powerbank • JBL Pro Sound',
      price: 79990, oldPrice: 89990, sku: 'JBLCH5', stock: 35,
      categoryId: speakers.id, brandId: jbl.id,
      specifications: { 'Мощность': '30 Вт', 'Автономность': 'до 20 часов', 'Защита': 'IP67', 'Bluetooth': '5.1', 'Powerbank': 'Да, 7500 мАч' },
      imageEmoji: '🔊', imageColor: '#FF6600',
    },
    {
      name: 'Logitech MX Master 3S', slug: 'logitech-mx-master-3s',
      description: 'Эргономичная беспроводная мышь для профессионалов. Тихие клики, 8000 DPI.',
      shortDescription: '8000 DPI • Тихие клики • USB-C • Multi-device',
      price: 49990, sku: 'LGMXM3S', stock: 40,
      categoryId: keyboardsMice.id, brandId: logitech.id,
      specifications: { 'Датчик': '8000 DPI', 'Подключение': 'Bluetooth, Logi Bolt', 'Автономность': 'до 70 дней', 'Зарядка': 'USB-C', 'Кнопки': '7', 'Multi-device': 'до 3 устройств' },
      imageEmoji: '🖱️', imageColor: '#00B953',
    },
    {
      name: 'Apple AirPods Pro 2 (USB-C)', slug: 'apple-airpods-pro-2-usbc',
      description: 'Беспроводные наушники Apple с ANC, адаптивным звуком и чехлом USB-C.',
      shortDescription: 'ANC • H2 чип • USB-C • IP54',
      price: 129990, sku: 'APAPP2UC', stock: 28,
      categoryId: headphones.id, brandId: apple.id, isFeatured: true,
      specifications: { 'Тип': 'TWS вкладыши', 'Чип': 'Apple H2', 'ANC': 'Активное шумоподавление', 'Автономность': '6 ч / 30 ч с кейсом', 'Защита': 'IP54', 'Зарядка': 'USB-C, MagSafe, Qi' },
      imageEmoji: '🎵', imageColor: '#555555',
    },
  ];

  let imageCount = 0;

  for (const productData of products) {
    const { imageEmoji, imageColor, ...data } = productData;

    let product = await prisma.product.findUnique({ where: { slug: data.slug } });
    if (!product) {
      product = await prisma.product.create({ data });
    }

    // Generate and save product image
    const existingImages = await prisma.productImage.count({ where: { productId: product.id } });
    if (existingImages === 0) {
      const svgContent = generateProductImage(data.name, imageColor, imageEmoji);
      const filename = `${data.slug}.svg`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, svgContent);

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: `/uploads/products/${filename}`,
          alt: data.name,
          isMain: true,
          sortOrder: 0,
        },
      });
      imageCount++;
    }
  }
  console.log(`✅ ${products.length} products created with ${imageCount} images`);

  // ==================== SAMPLE REVIEWS ====================
  const allProducts = await prisma.product.findMany({ take: 6 });
  const reviewData = [
    { rating: 5, title: 'Отличный товар!', comment: 'Очень доволен покупкой, всё работает отлично. Рекомендую!', pros: 'Качество, дизайн, производительность', cons: 'Цена немного высокая' },
    { rating: 4, title: 'Хорошее соотношение цена/качество', comment: 'В целом хороший продукт за свою цену.', pros: 'Надёжный, быстрый', cons: 'Комплектация могла быть лучше' },
    { rating: 5, title: 'Лучший в своём классе', comment: 'Пользуюсь уже месяц — нареканий нет вообще.', pros: 'Всё отлично', cons: 'Нет' },
  ];

  for (let i = 0; i < Math.min(allProducts.length, 3); i++) {
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: allProducts[i].id, userId: customer.id } },
    });
    if (!existing) {
      await prisma.review.create({
        data: {
          productId: allProducts[i].id,
          userId: customer.id,
          ...reviewData[i],
          isApproved: true,
        },
      });

      // Update product rating
      await prisma.product.update({
        where: { id: allProducts[i].id },
        data: { rating: reviewData[i].rating, reviewCount: 1 },
      });
    }
  }
  console.log('✅ Sample reviews created');

  // ==================== Address ====================
  await prisma.address.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: customer.id,
      title: 'Дом',
      city: 'Астана',
      street: 'ул. Мангилик Ел',
      house: '55',
      apartment: '42',
      postalCode: '010000',
      isDefault: true,
    },
  });
  console.log('✅ Test address created');

  console.log('\n🎉 Seeding completed!');
  console.log('Admin: admin@techstore.kz / admin123');
  console.log('Customer: user@techstore.kz / customer123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
