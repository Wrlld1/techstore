// Intent classification via keyword/pattern scoring

export type Intent =
  | 'greeting'
  | 'farewell'
  | 'thanks'
  | 'product_search'
  | 'price_query'
  | 'recommendation'
  | 'comparison'
  | 'specs_query'
  | 'availability'
  | 'help'
  | 'unknown';

interface IntentPattern {
  intent: Intent;
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'greeting',
    patterns: [
      /^(привет|здравствуй|добр(ый|ое|ая)|хай|хеллоу|салам|приветствую|здарова)/i,
      /^(hi|hello|hey)[\s!.,)?]*$/i,
    ],
    keywords: ['привет', 'здравствуй', 'добрый', 'доброе', 'добрая'],
    weight: 2,
  },
  {
    intent: 'farewell',
    patterns: [
      /^пока[\s!.,)?]*$/i,
      /^(до свидания|прощай|удачи|всего доброго|до встречи)/i,
      /^(bye|goodbye)[\s!.,)?]*$/i,
    ],
    keywords: ['до свидания', 'прощай', 'всего доброго'],
    weight: 2,
  },
  {
    intent: 'thanks',
    patterns: [
      /(спасибо|благодар|спс|сенк|thanks|thank you)/i,
    ],
    keywords: ['спасибо', 'благодарю', 'спс'],
    weight: 2,
  },
  {
    intent: 'product_search',
    patterns: [
      /(ищу|найди|найти|покажи|подскажи|есть ли|поиск|хочу купить|хочу найти|нужен|нужна|нужно|нужны)/i,
      /(покажите|подскажите|найдите|ищем|подыскиваю|присмотр)/i,
    ],
    keywords: ['ищу', 'найти', 'найди', 'покажи', 'купить', 'нужен', 'нужна', 'нужно', 'поиск', 'покажите'],
    weight: 1.5,
  },
  {
    intent: 'price_query',
    patterns: [
      /(сколько стоит|какая цена|цена|стоимость|бюджет|дешев|дорог|недорог|доступн)/i,
      /(за \d|от \d|до \d|\d\s*(тг|тенге|руб))/i,
      /(по цене|ценовой|прайс)/i,
    ],
    keywords: ['цена', 'стоит', 'стоимость', 'бюджет', 'дешев', 'дорог', 'недорог', 'тенге', 'прайс'],
    weight: 1.5,
  },
  {
    intent: 'recommendation',
    patterns: [
      /(посоветуй|рекоменд|что лучше|какой лучше|какая лучше|какое лучше|что выбрать|помоги выбрать|подбер)/i,
      /(лучший|лучшая|лучшее|лучшие|топ\b|топовый|оптимальн)/i,
      /(для (игр|работ|учеб|фото|видео|музык|дом))/i,
    ],
    keywords: ['посоветуй', 'рекомендуй', 'лучше', 'лучший', 'выбрать', 'подбери', 'топ', 'оптимальн'],
    weight: 1.3,
  },
  {
    intent: 'comparison',
    patterns: [
      /(сравни|сравнить|сравнение|отличия|разница|или\b.*или\b|vs\b|versus)/i,
      /(чем отличается|чем отличаются|в чем разница)/i,
    ],
    keywords: ['сравни', 'сравнить', 'сравнение', 'отличия', 'разница'],
    weight: 1.5,
  },
  {
    intent: 'specs_query',
    patterns: [
      /(характеристик|параметр|спецификац|какой (процессор|экран|камер|аккумулятор|батаре|памят|озу|дисплей))/i,
      /(разрешение|частота|емкость|объем (памяти|озу|батаре)|диагональ|размер экран)/i,
    ],
    keywords: ['характеристик', 'параметр', 'процессор', 'экран', 'камер', 'батаре', 'памят', 'озу', 'дисплей'],
    weight: 1.3,
  },
  {
    intent: 'availability',
    patterns: [
      /(в наличии|есть в наличии|в продаже|доступен|доступна|доступно|есть ли|остал)/i,
      /(на складе|можно заказать|когда будет|поступлени)/i,
    ],
    keywords: ['наличии', 'наличие', 'складе', 'доступен', 'продаже'],
    weight: 1.5,
  },
  {
    intent: 'help',
    patterns: [
      /^(помо(гите|ги|щь)|что (ты |вы )?(умеешь|можешь|можете|делаешь)|как (работаешь|пользоваться))/i,
      /^(что это|кто ты|зачем ты)/i,
    ],
    keywords: ['помощь', 'помоги', 'умеешь', 'можешь'],
    weight: 1.5,
  },
];

export function classifyIntent(text: string): { intent: Intent; confidence: number } {
  const lower = text.toLowerCase().trim();
  let bestIntent: Intent = 'unknown';
  let bestScore = 0;

  for (const ip of INTENT_PATTERNS) {
    let score = 0;

    // Pattern matching (strong signal)
    for (const pattern of ip.patterns) {
      if (pattern.test(lower)) {
        score += 3 * ip.weight;
        break;
      }
    }

    // Keyword matching
    for (const keyword of ip.keywords) {
      if (lower.includes(keyword)) {
        score += 1 * ip.weight;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = ip.intent;
    }
  }

  // If nothing matched well, check if there are product-related terms
  if (bestScore < 2) {
    const productTerms = [
      'смартфон', 'телефон', 'ноутбук', 'планшет', 'наушник', 'колонк', 'мыш', 'клавиатур',
      'iphone', 'samsung', 'xiaomi', 'apple', 'asus', 'lenovo', 'sony', 'jbl', 'logitech',
      'macbook', 'airpods', 'galaxy', 'ipad',
    ];
    for (const term of productTerms) {
      if (lower.includes(term)) {
        bestIntent = 'product_search';
        bestScore = 2;
        break;
      }
    }
  }

  const confidence = Math.min(bestScore / 6, 1);
  return { intent: bestIntent, confidence };
}
