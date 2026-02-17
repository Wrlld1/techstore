import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Pagination, Select, MenuItem,
  FormControl, InputLabel, useTheme, alpha, Button,
} from '@mui/material';
import api from '../../services/api';
import { Order, PaginationMeta } from '../../types';
import toast from 'react-hot-toast';

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₸';

const statusConfig: Record<string, { label: string; color: 'warning' | 'info' | 'primary' | 'success' | 'error' | 'default' }> = {
  PENDING: { label: 'Ожидает', color: 'warning' },
  CONFIRMED: { label: 'Подтверждён', color: 'info' },
  PROCESSING: { label: 'Собирается', color: 'primary' },
  SHIPPED: { label: 'Отправлен', color: 'info' },
  DELIVERED: { label: 'Доставлен', color: 'success' },
  CANCELLED: { label: 'Отменён', color: 'error' },
};

const allStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const OrdersPage: React.FC = () => {
  const theme = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/orders?${params}`);
      setOrders(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Статус обновлён');
      fetchOrders();
    } catch (err) {
      toast.error('Ошибка обновления статуса');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Управление заказами</Typography>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Фильтр по статусу</InputLabel>
          <Select value={statusFilter} label="Фильтр по статусу" onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <MenuItem value="">Все заказы</MenuItem>
            {allStatuses.map((s) => (
              <MenuItem key={s} value={s}>{statusConfig[s]?.label || s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Card>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 600 }}>Номер</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Клиент</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Товаров</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Сумма</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Статус</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Изменить</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => {
                const st = statusConfig[order.status] || { label: order.status, color: 'default' as const };
                return (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>#{order.orderNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {(order as any).user?.firstName} {(order as any).user?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{(order as any).user?.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={(order as any)._count?.items || '—'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {formatPrice(Number(order.total))}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={st.label} color={st.color} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          size="small"
                        >
                          {allStatuses.map((s) => (
                            <MenuItem key={s} value={s}>{statusConfig[s]?.label || s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {meta && meta.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={meta.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default OrdersPage;
