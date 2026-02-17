import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { Product, ProductFilters, PaginationMeta } from '../../types';

interface ProductState {
  items: Product[];
  currentProduct: Product | null;
  filters: ProductFilters;
  meta: PaginationMeta | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  currentProduct: null,
  filters: { page: 1, limit: 12, sort: 'newest' },
  meta: null,
  isLoading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (filters: ProductFilters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const { data } = await api.get(`/products?${params.toString()}`);
    return { items: data.data as Product[], meta: data.meta as PaginationMeta };
  }
);

export const fetchProductBySlug = createAsyncThunk(
  'products/fetchBySlug',
  async (slug: string) => {
    const { data } = await api.get(`/products/${slug}`);
    return data.data as Product;
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = { page: 1, limit: 12, sort: 'newest' };
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.meta = action.payload.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка загрузки';
      })
      .addCase(fetchProductBySlug.pending, (state) => { state.isLoading = true; })
      .addCase(fetchProductBySlug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductBySlug.rejected, (state) => { state.isLoading = false; });
  },
});

export const { setFilters, resetFilters, clearCurrentProduct } = productSlice.actions;
export default productSlice.reducer;
