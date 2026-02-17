import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Box, Typography, Card, Chip, Button, Pagination, Skeleton,
  Divider, useTheme, alpha, Breadcrumbs, Collapse, IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess, ShoppingBag } from '@mui/icons-material';
import api from '../../services/api';
import { Order, PaginationMeta } from '../../types';

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₸';

const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'primary' | 'success' | 'error' }> = {
  PENDING: { label: 'Ожидает', color: 'warning' },
  CONFIRMED: { label: 'Подтверждён', color: 'info' },
  PROCESSING: { label: 'Собирается', color: 'primary' },
  SHIPPED: { label: 'Отправлен', color: 'info' },
  DELIVERED: { label: 'Доставлен', color: 'success' },
  CANCELLED: { label: 'Отменён', color: 'error' },
};

const OrdersPage: React.FC = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders/my?page=${page}&limit=10`);
        setOrders(res.data.data);
        setMeta(res.data.meta);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Главная</Typography>
        <Typography component={Link} to="/profile" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Профиль</Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>Мои заказы</Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Мои заказы</Typography>

      {loading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ mb: 2, borderRadius: 3 }} />
        ))
      ) : orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ShoppingBag sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" fontWeight={600}>Заказов пока нет</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Оформите первый заказ в каталоге</Typography>
          <Button component={Link} to="/catalog" variant="contained">В каталог</Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map((order) => {
            const status = statusConfig[order.status] || { label: order.status, color: 'default' as const };
            const isExpanded = expanded === order.id;

            return (
              <Card key={order.id} sx={{ overflow: 'visible' }}>
                <Box
                  sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', flexWrap: 'wrap', gap: 1 }}
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box>
                      <Typography variant="body1" fontWeight={700}>#{order.orderNumber}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Typography>
                    </Box>
                    <Chip label={status.label} color={status.color} size="small" />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main">{formatPrice(Number(order.total))}</Typography>
                    <IconButton size="small">{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
                  </Box>
                </Box>

                <Collapse in={isExpanded}>
                  <Divider />
                  <Box sx={{ p: 2 }}>
                    {order.items?.map((item) => (
                      <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            width: 50, height: 50, borderRadius: 1, overflow: 'hidden',
                            bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {item.product?.images?.[0]?.url ? (
                              <Box component="img" src={item.product.images[0].url} alt="" sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                              <Typography sx={{ fontSize: '1.2rem', opacity: 0.3 }}>📱</Typography>
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={500}
                              component={Link} to={`/product/${item.product?.slug}`}
                              sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}>
                              {item.product?.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.quantity} шт × {formatPrice(Number(item.price))}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="body2" fontWeight={600}>{formatPrice(Number(item.total))}</Typography>
                      </Box>
                    ))}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Оплата: {order.paymentMethod === 'CASH' ? 'Наличными' : order.paymentMethod === 'CARD' ? 'Картой' : 'Онлайн'}
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>Итого: {formatPrice(Number(order.total))}</Typography>
                    </Box>
                  </Box>
                </Collapse>
              </Card>
            );
          })}

          {meta && meta.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={meta.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
};

export default OrdersPage;
