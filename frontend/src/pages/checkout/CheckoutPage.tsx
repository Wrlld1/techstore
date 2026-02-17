import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, Button, TextField,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel,
  Divider, Breadcrumbs, useTheme, alpha, Alert, Stepper, Step, StepLabel,
} from '@mui/material';
import { ShoppingBag, CheckCircle } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { clearCart } from '../../store/slices/cartSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₸';

const CheckoutPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items } = useAppSelector((s) => s.cart);
  const { user } = useAppSelector((s) => s.auth);

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [comment, setComment] = useState('');
  const [address, setAddress] = useState({
    city: 'Астана', street: '', house: '', apartment: '', postalCode: '',
  });

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= 50000 ? 0 : 2000;
  const total = subtotal + deliveryFee;

  const handleSubmit = async () => {
    if (!address.street || !address.house) {
      toast.error('Заполните адрес доставки');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        paymentMethod,
        comment: comment || undefined,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      setOrderNumber(res.data.data.orderNumber);
      dispatch(clearCart());
      setActiveStep(2);
      toast.success('Заказ оформлен!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !orderNumber) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '4rem', mb: 2 }}>🛒</Typography>
        <Typography variant="h5" fontWeight={600}>Корзина пуста</Typography>
        <Button component={Link} to="/catalog" variant="contained" sx={{ mt: 3 }}>В каталог</Button>
      </Container>
    );
  }

  // Success step
  if (activeStep === 2) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>Заказ оформлен!</Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Номер заказа: <strong>{orderNumber}</strong>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Мы отправим уведомление о статусе заказа на ваш email
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button component={Link} to="/profile/orders" variant="contained">Мои заказы</Button>
          <Button component={Link} to="/catalog" variant="outlined">Продолжить покупки</Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Главная</Typography>
        <Typography component={Link} to="/cart" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Корзина</Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>Оформление заказа</Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Оформление заказа</Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step><StepLabel>Доставка</StepLabel></Step>
        <Step><StepLabel>Подтверждение</StepLabel></Step>
        <Step><StepLabel>Готово</StepLabel></Step>
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {activeStep === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Contact */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Контактные данные</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Имя" value={user?.firstName || ''} disabled size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Фамилия" value={user?.lastName || ''} disabled size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Email" value={user?.email || ''} disabled size="small" />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Телефон" value={user?.phone || ''} disabled size="small" />
                  </Grid>
                </Grid>
              </Card>

              {/* Address */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Адрес доставки</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Город" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} size="small" required />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Улица" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} size="small" required />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField fullWidth label="Дом" value={address.house} onChange={(e) => setAddress({ ...address, house: e.target.value })} size="small" required />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField fullWidth label="Кв." value={address.apartment} onChange={(e) => setAddress({ ...address, apartment: e.target.value })} size="small" />
                  </Grid>
                </Grid>
              </Card>

              {/* Payment */}
              <Card sx={{ p: 3 }}>
                <FormControl>
                  <FormLabel sx={{ fontWeight: 600, mb: 1, fontSize: '1.1rem', color: 'text.primary' }}>Способ оплаты</FormLabel>
                  <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <FormControlLabel value="CASH" control={<Radio />} label="Наличными при получении" />
                    <FormControlLabel value="CARD" control={<Radio />} label="Картой при получении" />
                    <FormControlLabel value="ONLINE" control={<Radio />} label="Онлайн оплата" />
                  </RadioGroup>
                </FormControl>
              </Card>

              {/* Comment */}
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Комментарий</Typography>
                <TextField
                  fullWidth multiline rows={3} placeholder="Пожелания к заказу или доставке..."
                  value={comment} onChange={(e) => setComment(e.target.value)} size="small"
                />
              </Card>

              <Button variant="contained" size="large" onClick={() => setActiveStep(1)} sx={{ py: 1.5, alignSelf: 'flex-end' }}>
                Перейти к подтверждению
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                Проверьте данные заказа и нажмите «Подтвердить заказ»
              </Alert>

              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Товары</Typography>
                {items.map((item) => (
                  <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{item.product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.quantity} шт × {formatPrice(item.product.price)}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={600}>{formatPrice(item.product.price * item.quantity)}</Typography>
                  </Box>
                ))}
              </Card>

              <Card sx={{ p: 3 }}>
                <Typography variant="body2"><strong>Адрес:</strong> г. {address.city}, ул. {address.street}, д. {address.house}{address.apartment ? `, кв. ${address.apartment}` : ''}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}><strong>Оплата:</strong> {paymentMethod === 'CASH' ? 'Наличными' : paymentMethod === 'CARD' ? 'Картой' : 'Онлайн'}</Typography>
                {comment && <Typography variant="body2" sx={{ mt: 1 }}><strong>Комментарий:</strong> {comment}</Typography>}
              </Card>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => setActiveStep(0)}>Назад</Button>
                <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading}
                  startIcon={<ShoppingBag />} sx={{ py: 1.5, px: 4 }}>
                  {loading ? 'Оформление...' : 'Подтвердить заказ'}
                </Button>
              </Box>
            </Box>
          )}
        </Grid>

        {/* Summary sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, position: 'sticky', top: 90 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Ваш заказ</Typography>
            {items.map((item) => (
              <Box key={item.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '70%' }} noWrap>
                  {item.product.name} × {item.quantity}
                </Typography>
                <Typography variant="body2" fontWeight={500}>{formatPrice(item.product.price * item.quantity)}</Typography>
              </Box>
            ))}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Подытог</Typography>
              <Typography variant="body2">{formatPrice(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">Доставка</Typography>
              <Typography variant="body2" color={deliveryFee === 0 ? 'success.main' : 'text.primary'}>
                {deliveryFee === 0 ? 'Бесплатно' : formatPrice(deliveryFee)}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>Итого</Typography>
              <Typography variant="h5" fontWeight={800} color="primary.main">{formatPrice(total)}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;
