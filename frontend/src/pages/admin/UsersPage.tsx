import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Button, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Grid,
  useTheme, alpha, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Tooltip, List, ListItem, ListItemText, Rating, Divider,
} from '@mui/material';
import {
  Search, Block, CheckCircle, AdminPanelSettings, Person,
  Close, ShoppingBag, RateReview, Favorite, Email, Phone, CalendarMonth,
} from '@mui/icons-material';
import api from '../../services/api';
import { PaginationMeta } from '../../types';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

interface UserItem {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: { orders: number; reviews: number };
}

interface UserDetails extends UserItem {
  updatedAt: string;
  orders: Array<{ id: number; orderNumber: string; total: string; status: string; createdAt: string }>;
  reviews: Array<{ id: number; rating: number; comment: string; createdAt: string; product: { name: string } }>;
  _count: { orders: number; reviews: number; favorites: number };
}

const statusColors: Record<string, 'default' | 'primary' | 'warning' | 'success' | 'error' | 'info'> = {
  PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'primary',
  SHIPPED: 'info', DELIVERED: 'success', CANCELLED: 'error',
};

const UsersPage: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [detailsDialog, setDetailsDialog] = useState<UserDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      await api.put(`/admin/users/${user.id}/toggle-active`);
      toast.success(user.isActive ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    }
  };

  const handleChangeRole = async (user: UserItem, newRole: string) => {
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      toast.success(`Роль изменена на ${newRole === 'ADMIN' ? 'Админ' : 'Покупатель'}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    }
  };

  const openDetails = async (userId: number) => {
    setDetailsLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setDetailsDialog(res.data.data);
    } catch (err) {
      toast.error('Не удалось загрузить данные');
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Управление пользователями</Typography>
        <Typography variant="body2" color="text.secondary">{meta?.total || 0} пользователей</Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField size="small" placeholder="Поиск по email, имени, телефону..." value={search}
            onChange={(e) => setSearch(e.target.value)} sx={{ flexGrow: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Роль</InputLabel>
            <Select value={roleFilter} label="Роль" onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">Все</MenuItem>
              <MenuItem value="CUSTOMER">Покупатели</MenuItem>
              <MenuItem value="ADMIN">Админы</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="outlined">Найти</Button>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Пользователь</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Телефон</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Роль</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Заказы</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Статус</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Дата рег.</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover sx={{ opacity: user.isActive ? 1 : 0.5 }}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
                      onClick={() => openDetails(user.id)}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: user.role === 'ADMIN' ? 'secondary.main' : 'primary.main', fontSize: 14 }}>
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{user.firstName} {user.lastName}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{user.email}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{user.phone || '—'}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip
                      icon={user.role === 'ADMIN' ? <AdminPanelSettings sx={{ fontSize: 16 }} /> : <Person sx={{ fontSize: 16 }} />}
                      label={user.role === 'ADMIN' ? 'Админ' : 'Покупатель'}
                      size="small"
                      color={user.role === 'ADMIN' ? 'secondary' : 'default'}
                      variant={user.role === 'ADMIN' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{user._count.orders}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={user.isActive ? 'Активен' : 'Заблокирован'}
                      size="small"
                      color={user.isActive ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      <Tooltip title={user.role === 'ADMIN' ? 'Сделать покупателем' : 'Сделать админом'}>
                        <IconButton size="small"
                          onClick={() => handleChangeRole(user, user.role === 'ADMIN' ? 'CUSTOMER' : 'ADMIN')}
                          color={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          <AdminPanelSettings fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isActive ? 'Заблокировать' : 'Разблокировать'}>
                        <IconButton size="small" onClick={() => handleToggleActive(user)}
                          color={user.isActive ? 'error' : 'success'}>
                          {user.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {meta && meta.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={meta.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      {/* User Details Dialog */}
      <Dialog open={!!detailsDialog} onClose={() => setDetailsDialog(null)} maxWidth="md" fullWidth>
        {detailsDialog && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" fontWeight={700}>Профиль пользователя</Typography>
              <IconButton onClick={() => setDetailsDialog(null)}><Close /></IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Info */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 1, bgcolor: detailsDialog.role === 'ADMIN' ? 'secondary.main' : 'primary.main', fontSize: 28 }}>
                      {detailsDialog.firstName?.[0]}{detailsDialog.lastName?.[0]}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>{detailsDialog.firstName} {detailsDialog.lastName}</Typography>
                    <Chip
                      icon={detailsDialog.role === 'ADMIN' ? <AdminPanelSettings sx={{ fontSize: 16 }} /> : <Person sx={{ fontSize: 16 }} />}
                      label={detailsDialog.role === 'ADMIN' ? 'Администратор' : 'Покупатель'}
                      size="small" color={detailsDialog.role === 'ADMIN' ? 'secondary' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body2">{detailsDialog.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" color="action" />
                      <Typography variant="body2">{detailsDialog.phone || 'Не указан'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth fontSize="small" color="action" />
                      <Typography variant="body2">Регистрация: {new Date(detailsDialog.createdAt).toLocaleDateString('ru-RU')}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2, justifyContent: 'center' }}>
                    <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, minWidth: 80 }}>
                      <ShoppingBag fontSize="small" color="primary" />
                      <Typography variant="h6" fontWeight={700}>{detailsDialog._count.orders}</Typography>
                      <Typography variant="caption" color="text.secondary">Заказов</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, minWidth: 80 }}>
                      <RateReview fontSize="small" color="primary" />
                      <Typography variant="h6" fontWeight={700}>{detailsDialog._count.reviews}</Typography>
                      <Typography variant="caption" color="text.secondary">Отзывов</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center', p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, minWidth: 80 }}>
                      <Favorite fontSize="small" color="primary" />
                      <Typography variant="h6" fontWeight={700}>{detailsDialog._count.favorites}</Typography>
                      <Typography variant="caption" color="text.secondary">Избранного</Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Orders & Reviews */}
                <Grid item xs={12} md={7}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Последние заказы</Typography>
                  {detailsDialog.orders.length > 0 ? (
                    <List dense disablePadding>
                      {detailsDialog.orders.map((order) => (
                        <ListItem key={order.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={<Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2" fontWeight={500}>#{order.orderNumber}</Typography>
                              <Typography variant="body2" fontWeight={600} color="primary.main">{formatPrice(order.total)}</Typography>
                            </Box>}
                            secondary={<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                              <Chip label={order.status} size="small" color={statusColors[order.status] || 'default'} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                              <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleDateString('ru-RU')}</Typography>
                            </Box>}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="text.secondary">Нет заказов</Typography>}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Последние отзывы</Typography>
                  {detailsDialog.reviews.length > 0 ? (
                    <List dense disablePadding>
                      {detailsDialog.reviews.map((review) => (
                        <ListItem key={review.id} sx={{ px: 0 }}>
                          <ListItemText
                            primary={<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" fontWeight={500}>{review.product.name}</Typography>
                              <Rating value={review.rating} size="small" readOnly />
                            </Box>}
                            secondary={review.comment || 'Без комментария'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : <Typography variant="body2" color="text.secondary">Нет отзывов</Typography>}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailsDialog(null)}>Закрыть</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default UsersPage;
