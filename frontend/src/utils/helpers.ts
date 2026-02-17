// API base URL for images
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getImageUrl = (url?: string | null): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};

export const formatPrice = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('ru-RU').format(num) + ' ₸';
};

// ==================== COMPARE ====================
export interface CompareItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  rating: number;
  image?: string;
  brand?: string;
  specifications?: Record<string, string>;
}

export const getCompareItems = (): CompareItem[] => {
  try {
    return JSON.parse(localStorage.getItem('techstore_compare') || '[]');
  } catch { return []; }
};

export const saveCompareItems = (items: CompareItem[]) => {
  localStorage.setItem('techstore_compare', JSON.stringify(items));
};

export const addToCompare = (item: CompareItem): boolean => {
  const items = getCompareItems();
  if (items.length >= 4) return false;
  if (items.find((i) => i.id === item.id)) return false;
  items.push(item);
  saveCompareItems(items);
  return true;
};

export const removeFromCompare = (id: number) => {
  const items = getCompareItems().filter((i) => i.id !== id);
  saveCompareItems(items);
};

export const isInCompare = (id: number): boolean => {
  return getCompareItems().some((i) => i.id === id);
};
