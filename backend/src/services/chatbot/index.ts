// Main chatbot orchestrator

import { classifyIntent, Intent } from './intentClassifier';
import { searchProducts, getProductByName, formatPrice, detectCategory, detectBrand } from './productMatcher';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductCard[];
  timestamp: string;
}

export interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  shortDescription: string | null;
  rating: number;
  stock: number;
  image: string | null;
  brand: string;
  category: string;
}

interface ChatContext {
  lastIntent?: Intent;
  lastCategory?: string;
  lastBrand?: string;
  lastProducts?: ProductCard[];
  messageCount: number;
}

// In-memory session storage (per-session context)
const sessions = new Map<string, ChatContext>();

function getContext(sessionId: string): ChatContext {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { messageCount: 0 });
  }
  return sessions.get(sessionId)!;
}

// Response templates
const GREETINGS = [
  'Здравствуйте! Я ваш AI-помощник TechStore. Помогу подобрать технику, сравнить товары или узнать цены. Что вас интересует?',
  'Привет! Я AI-ассистент TechStore. Расскажите, что вы ищете, и я помогу с выбором!',
  'Добро пожаловать! Я помогу вам найти идеальную технику. Какой товар вас интересует?',
];

const FAREWELLS = [
  'До свидания! Буду рад помочь снова. Удачных покупок!',
  'Всего доброго! Если возникнут вопросы - я всегда здесь.',
  'Пока! Надеюсь, смог помочь. Возвращайтесь!',
];

const THANKS_RESPONSES = [
  'Пожалуйста! Если нужна ещё помощь - обращайтесь.',
  'Рад помочь! Есть ещё вопросы?',
  'Не за что! Обращайтесь в любое время.',
];

const HELP_TEXT = `Я AI-помощник TechStore. Вот что я умею:

- Найти товары: "Покажи смартфоны Samsung"
- Подобрать по бюджету: "Ноутбук до 500000 тенге"
- Посоветовать: "Какой телефон лучше для фото?"
- Рассказать о товаре: "Расскажи про iPhone 15 Pro"
- Сравнить: "Сравни iPhone и Samsung"
- Проверить наличие: "Есть ли MacBook в наличии?"

Просто напишите, что вас интересует!`;

const NO_RESULTS = [
  'К сожалению, по вашему запросу ничего не нашлось. Попробуйте изменить критерии поиска или спросите о другой категории товаров.',
  'Не удалось найти подходящие товары. Попробуйте уточнить запрос - укажите категорию, бренд или ценовой диапазон.',
];

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildProductCards(products: any[]): ProductCard[] {
  return products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    oldPrice: p.oldPrice,
    shortDescription: p.shortDescription,
    rating: p.rating,
    stock: p.stock,
    image: p.image,
    brand: p.brand,
    category: p.category,
  }));
}

function formatProductList(products: any[]): string {
  if (products.length === 0) return '';

  const lines = products.map((p, i) => {
    let line = `${i + 1}. ${p.name} - ${formatPrice(p.price)}`;
    if (p.oldPrice) line += ` (было ${formatPrice(p.oldPrice)})`;
    if (p.shortDescription) line += `\n   ${p.shortDescription}`;
    if (p.stock > 0) line += ' | В наличии';
    else line += ' | Нет в наличии';
    return line;
  });

  return lines.join('\n\n');
}

export async function processMessage(sessionId: string, userMessage: string): Promise<ChatMessage> {
  const ctx = getContext(sessionId);
  ctx.messageCount++;

  const { intent, confidence } = classifyIntent(userMessage);
  ctx.lastIntent = intent;

  // Track detected entities
  const category = detectCategory(userMessage);
  const brand = detectBrand(userMessage);
  if (category) ctx.lastCategory = category;
  if (brand) ctx.lastBrand = brand;

  let responseText = '';
  let products: ProductCard[] = [];

  switch (intent) {
    case 'greeting': {
      responseText = randomPick(GREETINGS);
      break;
    }

    case 'farewell': {
      responseText = randomPick(FAREWELLS);
      break;
    }

    case 'thanks': {
      responseText = randomPick(THANKS_RESPONSES);
      break;
    }

    case 'help': {
      responseText = HELP_TEXT;
      break;
    }

    case 'product_search': {
      const results = await searchProducts({ query: userMessage, limit: 5 });
      if (results.length > 0) {
        products = buildProductCards(results);
        ctx.lastProducts = products;
        const catName = results[0].category;
        responseText = `Вот что я нашёл по вашему запросу:`;
      } else {
        responseText = randomPick(NO_RESULTS);
      }
      break;
    }

    case 'price_query': {
      const results = await searchProducts({ query: userMessage, limit: 5 });
      if (results.length > 0) {
        products = buildProductCards(results);
        ctx.lastProducts = products;

        const minP = Math.min(...results.map(r => r.price));
        const maxP = Math.max(...results.map(r => r.price));

        if (results.length === 1) {
          const p = results[0];
          responseText = `${p.name} стоит ${formatPrice(p.price)}`;
          if (p.oldPrice) responseText += ` (скидка с ${formatPrice(p.oldPrice)})`;
          responseText += '.';
          if (p.stock > 0) responseText += ' Товар в наличии!';
        } else {
          responseText = `Нашёл ${results.length} товаров в диапазоне от ${formatPrice(minP)} до ${formatPrice(maxP)}:`;
        }
      } else {
        responseText = 'Не нашёл товаров в указанном ценовом диапазоне. Попробуйте изменить бюджет или категорию.';
      }
      break;
    }

    case 'recommendation': {
      const results = await searchProducts({ query: userMessage, limit: 5 });
      if (results.length > 0) {
        products = buildProductCards(results);
        ctx.lastProducts = products;

        const top = results[0];
        responseText = `Рекомендую обратить внимание на ${top.name} (${formatPrice(top.price)})`;
        if (top.rating > 0) responseText += ` с рейтингом ${top.rating}/5`;
        responseText += '.';

        if (results.length > 1) {
          responseText += ` Также стоит рассмотреть ещё ${results.length - 1} вариант(ов):`;
        }
      } else {
        responseText = 'Пока не могу подобрать подходящий вариант. Расскажите подробнее, для каких задач нужна техника и какой у вас бюджет?';
      }
      break;
    }

    case 'comparison': {
      const results = await searchProducts({ query: userMessage, limit: 2 });
      if (results.length >= 2) {
        products = buildProductCards(results);
        ctx.lastProducts = products;

        const [a, b] = results;
        responseText = `Сравнение ${a.name} и ${b.name}:\n\n`;
        responseText += `Цена: ${formatPrice(a.price)} vs ${formatPrice(b.price)}\n`;
        responseText += `Рейтинг: ${a.rating}/5 vs ${b.rating}/5\n`;
        responseText += `Наличие: ${a.stock > 0 ? 'Да' : 'Нет'} vs ${b.stock > 0 ? 'Да' : 'Нет'}\n`;

        // Compare specs if available
        if (a.specifications && b.specifications) {
          const allKeys = new Set([
            ...Object.keys(a.specifications),
            ...Object.keys(b.specifications),
          ]);
          responseText += '\nХарактеристики:\n';
          for (const key of allKeys) {
            const aVal = a.specifications[key] || '-';
            const bVal = b.specifications[key] || '-';
            if (aVal !== bVal) {
              responseText += `  ${key}: ${aVal} vs ${bVal}\n`;
            }
          }
        }
      } else if (results.length === 1) {
        products = buildProductCards(results);
        responseText = `Нашёл только один товар: ${results[0].name}. Уточните, с чем хотите сравнить?`;
      } else {
        responseText = 'Не удалось найти товары для сравнения. Укажите конкретные модели, например: "Сравни iPhone 15 и Samsung S24".';
      }
      break;
    }

    case 'specs_query': {
      const product = await getProductByName(userMessage);
      if (product) {
        products = buildProductCards([product]);
        ctx.lastProducts = products;

        responseText = `${product.name} (${product.brand}):\n\n`;
        if (product.specifications) {
          for (const [key, value] of Object.entries(product.specifications)) {
            responseText += `  ${key}: ${value}\n`;
          }
        }
        responseText += `\nЦена: ${formatPrice(product.price)}`;
        if (product.stock > 0) responseText += ' | В наличии';
      } else {
        // Try broader search
        const results = await searchProducts({ query: userMessage, limit: 3 });
        if (results.length > 0) {
          products = buildProductCards(results);
          responseText = 'Уточните, о каком товаре хотите узнать характеристики:';
        } else {
          responseText = 'Не нашёл этот товар. Попробуйте указать точное название или бренд.';
        }
      }
      break;
    }

    case 'availability': {
      const results = await searchProducts({ query: userMessage, limit: 5 });
      if (results.length > 0) {
        products = buildProductCards(results);
        ctx.lastProducts = products;

        const inStock = results.filter(r => r.stock > 0);
        const outOfStock = results.filter(r => r.stock === 0);

        if (inStock.length > 0) {
          responseText = `В наличии ${inStock.length} товар(ов):`;
        } else {
          responseText = 'К сожалению, эти товары сейчас не в наличии. Вот похожие варианты:';
        }
      } else {
        responseText = 'Не нашёл такой товар. Уточните название или категорию.';
      }
      break;
    }

    default: {
      // Unknown intent - try product search as fallback
      if (userMessage.length > 2) {
        const results = await searchProducts({ query: userMessage, limit: 3 });
        if (results.length > 0 && results[0].score > 0.15) {
          products = buildProductCards(results);
          ctx.lastProducts = products;
          responseText = 'Возможно, вас заинтересует:';
        } else {
          responseText = 'Не совсем понял ваш вопрос. Я могу помочь найти товары, сравнить их, подсказать цены или характеристики. Попробуйте спросить, например: "Покажи смартфоны Samsung" или "Посоветуй ноутбук для работы".';
        }
      } else {
        responseText = 'Напишите подробнее, что вас интересует, и я постараюсь помочь!';
      }
    }
  }

  return {
    role: 'assistant',
    content: responseText,
    products: products.length > 0 ? products : undefined,
    timestamp: new Date().toISOString(),
  };
}

// Clean old sessions periodically
setInterval(() => {
  const maxAge = 30 * 60 * 1000; // 30 min
  const now = Date.now();
  for (const [id, ctx] of sessions) {
    if (ctx.messageCount === 0) sessions.delete(id);
  }
  // Keep max 1000 sessions
  if (sessions.size > 1000) {
    const toDelete = sessions.size - 500;
    let deleted = 0;
    for (const id of sessions.keys()) {
      if (deleted >= toDelete) break;
      sessions.delete(id);
      deleted++;
    }
  }
}, 5 * 60 * 1000);
