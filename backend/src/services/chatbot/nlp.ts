// Russian NLP utilities: tokenization, stemming, stopwords

const STOPWORDS = new Set([
  'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все',
  'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по',
  'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из',
  'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или',
  'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам',
  'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где',
  'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб',
  'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж', 'тогда',
  'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь',
  'этом', 'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда',
  'зачем', 'всех', 'никогда', 'можно', 'при', 'наконец', 'два', 'об', 'другой',
  'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего',
  'них', 'какая', 'много', 'разве', 'три', 'эту', 'моя', 'впрочем', 'хорошо',
  'свою', 'этой', 'перед', 'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой',
  'им', 'более', 'всегда', 'конечно', 'всю', 'между',
]);

// Simple Russian stemmer (Porter-like suffix stripping)
const SUFFIXES = [
  'ейший', 'ейшая', 'ейшее', 'ейшие',
  'ивший', 'ившая', 'ившее', 'ившие',
  'ающий', 'ающая', 'ающее', 'ающие',
  'ность', 'ские', 'ский', 'ская', 'ское',
  'ного', 'ному', 'нной', 'нное', 'нные',
  'тель', 'ость', 'ести', 'ться',
  'ами', 'ями', 'ого', 'ому', 'ить', 'ать', 'ять',
  'ной', 'ный', 'ная', 'ное', 'ные', 'нно',
  'ает', 'ить', 'ции', 'ция',
  'ов', 'ев', 'ей', 'ий', 'ый', 'ая', 'ое', 'ые', 'ие',
  'ам', 'ям', 'ом', 'ем', 'ах', 'ях', 'ую', 'юю',
  'ка', 'ки', 'ку', 'ке', 'ок', 'ек',
  'а', 'о', 'е', 'и', 'у', 'ю', 'ы',
];

export function stem(word: string): string {
  if (word.length <= 3) return word;
  for (const suffix of SUFFIXES) {
    if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0);
}

export function removeStopwords(tokens: string[]): string[] {
  return tokens.filter(t => !STOPWORDS.has(t) && t.length > 1);
}

export function processText(text: string): string[] {
  const tokens = tokenize(text);
  const filtered = removeStopwords(tokens);
  return filtered.map(stem);
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, val] of a) {
    normA += val * val;
    const bVal = b.get(key);
    if (bVal) dot += val * bVal;
  }
  for (const val of b.values()) {
    normB += val * val;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function buildTfVector(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  const len = tokens.length || 1;
  const tf = new Map<string, number>();
  for (const [word, count] of freq) {
    tf.set(word, count / len);
  }
  return tf;
}

// Extract numbers from text (for price parsing)
export function extractNumbers(text: string): number[] {
  const matches = text.match(/\d[\d\s]*\d|\d+/g);
  if (!matches) return [];
  return matches.map(m => parseInt(m.replace(/\s/g, ''), 10)).filter(n => !isNaN(n));
}
