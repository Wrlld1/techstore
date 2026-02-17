import React, { useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './hooks/useRedux';
import { fetchProfile } from './store/slices/authSlice';
import getTheme from './styles/theme';

// Layout
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ScrollToTop from './components/common/ScrollToTop';
import ScrollToTopButton from './components/common/ScrollToTopButton';

// Pages (lazy loaded)
const HomePage = React.lazy(() => import('./pages/home/HomePage'));
const CatalogPage = React.lazy(() => import('./pages/catalog/CatalogPage'));
const ProductPage = React.lazy(() => import('./pages/product/ProductPage'));
const CartPage = React.lazy(() => import('./pages/cart/CartPage'));
const CheckoutPage = React.lazy(() => import('./pages/checkout/CheckoutPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const ProfilePage = React.lazy(() => import('./pages/profile/ProfilePage'));
const OrdersPage = React.lazy(() => import('./pages/profile/OrdersPage'));
const FavoritesPage = React.lazy(() => import('./pages/favorites/FavoritesPage'));
const ComparePage = React.lazy(() => import('./pages/compare/ComparePage'));

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/DashboardPage'));
const AdminProducts = React.lazy(() => import('./pages/admin/ProductsPage'));
const AdminOrders = React.lazy(() => import('./pages/admin/OrdersPage'));
const AdminReviews = React.lazy(() => import('./pages/admin/ReviewsPage'));
const AdminUsers = React.lazy(() => import('./pages/admin/UsersPage'));
const AdminCategories = React.lazy(() => import('./pages/admin/CategoriesPage'));
const AdminBrands = React.lazy(() => import('./pages/admin/BrandsPage'));

function AppContent() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProfile());
    }
  }, [dispatch, isAuthenticated]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      />
      <BrowserRouter>
        <ScrollToTop />
        <React.Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Routes>
            {/* Public routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/catalog/:slug" element={<CatalogPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/orders" element={<OrdersPage />} />
                <Route path="/favorites" element={<FavoritesPage />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute requireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/reviews" element={<AdminReviews />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/brands" element={<AdminBrands />} />
              </Route>
            </Route>
          </Routes>
          <ScrollToTopButton />
        </React.Suspense>
      </BrowserRouter>
    </ThemeProvider>
  );
}

function App() {
  return (
    <HelmetProvider>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </HelmetProvider>
  );
}

export default App;
