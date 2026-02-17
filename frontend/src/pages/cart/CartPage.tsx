import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, Button, IconButton,
  Divider, useTheme, alpha, Breadcrumbs,
} from '@mui/material';
import { Add, Remove, Delete, ShoppingCart, ArrowForward } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { updateQuantity, removeFromCart, clearCart } from '../../store/slices/cartSlice';
import { getImageUrl, formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CartPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items } = useAppSelector((s) => s.cart);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= 50000 ? 0 : 2000;
  const total = subtotal + deliveryFee;
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const discount = items.reduce((sum, item) => {
    if (item.product.oldPrice) {
      return sum + (item.product.oldPrice - item.product.price) * item.quantity;
    }
    return sum;
  }, 0);

  if (items.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '5rem', mb: 2 }}>🛒</Typography>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Корзина пуста</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Добавьте товары из каталога, чтобы оформить заказ
        </Typography>
        <Button component={Link} to="/catalog" variant="contained" size="large" startIcon={<ShoppingCart />}>
          Перейти в каталог
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Главная</Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>Корзина</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Корзина ({totalItems})</Typography>
        <Button color="error" size="small" onClick={() => { dispatch(clearCart()); toast.success('Корзина очищена'); }}>
          Очистить корзину
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map((item) => (
              <Card key={item.productId} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {/* Image */}
                  <Box
                    component={Link} to={`/product/${item.product.slug}`}
                    sx={{
                      width: 100, height: 100, borderRadius: 2, overflow: 'hidden', flexShrink: 0,
                      bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {item.product.images?.[0]?.url ? (
                      <Box component="img" src={getImageUrl(item.product.images[0].url)} alt={item.product.name}
                        sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    ) : (
                      <Typography sx={{ fontSize: '2rem', opacity: 0.2 }}>📱</Typography>
                    )}
                  </Box>

                  {/* Info */}
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary">{item.product.brand?.name}</Typography>
                    <Typography
                      variant="body1" fontWeight={600}
                      component={Link} to={`/product/${item.product.slug}`}
                      sx={{ textDecoration: 'none', color: 'text.primary', display: 'block',
                        '&:hover': { color: 'primary.main' },
                      }}
                    >
                      {item.product.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: item.product.stock > 0 ? 'success.main' : 'error.main' }}>
                      {item.product.stock > 0 ? '✓ В наличии' : '✗ Нет в наличии'}
                    </Typography>
                  </Box>

                  {/* Quantity */}
                  <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                    <IconButton size="small"
                      onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: Math.max(1, item.quantity - 1) }))}>
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography sx={{ px: 1.5, minWidth: 30, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</Typography>
                    <IconButton size="small"
                      onClick={() => dispatch(updateQuantity({ productId: item.productId, quantity: Math.min(item.product.stock, item.quantity + 1) }))}>
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Price */}
                  <Box sx={{ textAlign: 'right', minWidth: 120 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main">
                      {formatPrice(item.product.price * item.quantity)}
                    </Typography>
                    {item.quantity > 1 && (
                      <Typography variant="caption" color="text.secondary">{formatPrice(item.product.price)} / шт</Typography>
                    )}
                  </Box>

                  {/* Delete */}
                  <IconButton color="error" onClick={() => { dispatch(removeFromCart(item.productId)); toast.success('Товар удалён'); }}>
                    <Delete />
                  </IconButton>
                </Box>
              </Card>
            ))}
          </Box>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, position: 'sticky', top: 90 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Итого</Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Товары ({totalItems})</Typography>
              <Typography variant="body2">{formatPrice(subtotal + discount)}</Typography>
            </Box>

            {discount > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="error.main">Скидка</Typography>
                <Typography variant="body2" color="error.main">-{formatPrice(discount)}</Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Доставка</Typography>
              <Typography variant="body2" color={deliveryFee === 0 ? 'success.main' : 'text.primary'}>
                {deliveryFee === 0 ? 'Бесплатно' : formatPrice(deliveryFee)}
              </Typography>
            </Box>

            {deliveryFee > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Бесплатно при заказе от 50 000 ₸ (ещё {formatPrice(50000 - subtotal)})
              </Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>К оплате</Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">{formatPrice(total)}</Typography>
            </Box>

            <Button
              variant="contained" fullWidth size="large" endIcon={<ArrowForward />}
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error('Войдите в аккаунт для оформления заказа');
                  navigate('/auth/login');
                  return;
                }
                navigate('/checkout');
              }}
              sx={{ py: 1.5 }}
            >
              Оформить заказ
            </Button>

            <Button component={Link} to="/catalog" fullWidth sx={{ mt: 1 }}>
              Продолжить покупки
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CartPage;
