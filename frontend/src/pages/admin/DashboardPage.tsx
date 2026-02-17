import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, Skeleton, useTheme, alpha,
} from '@mui/material';
import {
  People, Inventory, ShoppingBag, TrendingUp, AttachMoney, PersonAdd,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { DashboardStats } from '../../types';

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₸';

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, revenueRes] = await Promise.all([
          api.get('/admin/dashboard'),
          api.get('/admin/revenue-chart?days=30'),
        ]);
        setStats(statsRes.data.data);
        setRevenueData(revenueRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={6} md={4} lg={2} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} sx={{ mt: 3, borderRadius: 3 }} />
      </Box>
    );
  }

  if (!stats) return <Typography>Ошибка загрузки данных</Typography>;

  const statCards = [
    { icon: <People />, label: 'Пользователи', value: stats.overview.totalUsers, color: '#2563EB' },
    { icon: <Inventory />, label: 'Товары', value: stats.overview.totalProducts, color: '#7C3AED' },
    { icon: <ShoppingBag />, label: 'Заказы', value: stats.overview.totalOrders, color: '#F59E0B' },
    { icon: <TrendingUp />, label: 'Заказов (30 дн)', value: stats.overview.recentOrders, color: '#10B981' },
    { icon: <AttachMoney />, label: 'Выручка (всего)', value: formatPrice(Number(stats.overview.totalRevenue)), color: '#EF4444' },
    { icon: <PersonAdd />, label: 'Новые (30 дн)', value: stats.overview.newUsersThisMonth, color: '#06B6D4' },
  ];

  const COLORS = ['#F59E0B', '#2563EB', '#7C3AED', '#10B981', '#EF4444', '#64748B'];

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, i) => (
          <Grid item xs={6} md={4} lg={2} key={i}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{
                p: 1.5, borderRadius: 2, bgcolor: alpha(card.color, 0.1), color: card.color, display: 'flex',
              }}>
                {card.icon}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight={700}>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Выручка за 30 дней</Typography>
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatPrice(value)} labelFormatter={(l) => `Дата: ${l}`} />
                  <Bar dataKey="revenue" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Нет данных за период</Typography>
              </Box>
            )}
          </Card>
        </Grid>

        {/* Orders by Status */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Заказы по статусу</Typography>
            {stats.ordersByStatus.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={stats.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      {stats.ordersByStatus.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 1 }}>
                  {stats.ordersByStatus.map((s, i) => (
                    <Box key={s.status} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                        <Typography variant="caption">{s.status}</Typography>
                      </Box>
                      <Typography variant="caption" fontWeight={600}>{s.count}</Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>Нет данных</Typography>
            )}
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12}>
          <Card sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Топ товаров по продажам</Typography>
            <Box sx={{ overflowX: 'auto' }}>
              {stats.topProducts.map((p, i) => (
                <Box key={p.id} sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5,
                  borderBottom: i < stats.topProducts.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 24, color: 'text.secondary' }}>#{i + 1}</Typography>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{(p.brand as any)?.name}</Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Продаж</Typography>
                      <Typography variant="body2" fontWeight={600}>{p.salesCount}</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">Цена</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">{formatPrice(Number(p.price))}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
