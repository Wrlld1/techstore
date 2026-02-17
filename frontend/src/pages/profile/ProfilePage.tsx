import React from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, Avatar, Button, Chip, Divider,
  useTheme, alpha,
} from '@mui/material';
import {
  ShoppingBag, Favorite, Settings, LocationOn, Email, Phone, CalendarMonth,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/useRedux';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAppSelector((s) => s.auth);

  if (!user) return null;

  const menuItems = [
    { icon: <ShoppingBag />, title: 'Мои заказы', desc: 'История и статус заказов', link: '/profile/orders' },
    { icon: <Favorite />, title: 'Избранное', desc: 'Сохранённые товары', link: '/favorites' },
    { icon: <Settings />, title: 'Настройки', desc: 'Изменить данные аккаунта', link: '/profile' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 4 }}>Личный кабинет</Typography>

      <Grid container spacing={3}>
        {/* Profile card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 28 }}>
              {user.firstName[0]}{user.lastName[0]}
            </Avatar>
            <Typography variant="h5" fontWeight={700}>{user.firstName} {user.lastName}</Typography>
            <Chip label={user.role === 'ADMIN' ? 'Администратор' : 'Покупатель'} size="small" color={user.role === 'ADMIN' ? 'secondary' : 'default'} sx={{ mt: 1 }} />

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{user.email}</Typography>
              </Box>
              {user.phone && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Phone fontSize="small" color="action" />
                  <Typography variant="body2">{user.phone}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarMonth fontSize="small" color="action" />
                <Typography variant="body2">
                  Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </Typography>
              </Box>
            </Box>

            {user.role === 'ADMIN' && (
              <Button component={Link} to="/admin" variant="contained" color="secondary" fullWidth sx={{ mt: 3 }}>
                Админ-панель
              </Button>
            )}
          </Card>
        </Grid>

        {/* Menu */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {menuItems.map((item) => (
              <Grid item xs={12} sm={6} key={item.title}>
                <Card
                  component={Link} to={item.link}
                  sx={{
                    p: 3, display: 'flex', alignItems: 'center', gap: 2,
                    textDecoration: 'none', color: 'text.primary', transition: 'all 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', borderColor: theme.palette.primary.main },
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }}>
                    {item.icon}
                  </Box>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Addresses */}
          {user.addresses && user.addresses.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Адреса доставки</Typography>
              <Grid container spacing={2}>
                {user.addresses.map((addr) => (
                  <Grid item xs={12} sm={6} key={addr.id}>
                    <Card sx={{ p: 2, border: addr.isDefault ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}` }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn fontSize="small" color="primary" />
                          <Typography variant="body2" fontWeight={600}>{addr.title}</Typography>
                        </Box>
                        {addr.isDefault && <Chip label="Основной" size="small" color="primary" variant="outlined" />}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        г. {addr.city}, ул. {addr.street}, д. {addr.house}
                        {addr.apartment ? `, кв. ${addr.apartment}` : ''}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;
