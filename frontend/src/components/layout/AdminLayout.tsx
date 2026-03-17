import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Toolbar, AppBar, IconButton, useTheme,
} from '@mui/material';
import {
  Dashboard, Inventory, ShoppingBag, RateReview, People,
  ArrowBack, Category, Storefront,
} from '@mui/icons-material';
import { useAppSelector } from '../../hooks/useRedux';

const DRAWER_WIDTH = 260;

const menuItems = [
  { text: 'Дашборд', icon: <Dashboard />, path: '/admin' },
  { text: 'Товары', icon: <Inventory />, path: '/admin/products' },
  { text: 'Категории', icon: <Category />, path: '/admin/categories' },
  { text: 'Бренды', icon: <Storefront />, path: '/admin/brands' },
  { text: 'Заказы', icon: <ShoppingBag />, path: '/admin/orders' },
  { text: 'Отзывы', icon: <RateReview />, path: '/admin/reviews' },
  { text: 'Пользователи', icon: <People />, path: '/admin/users' },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: '#1E293B',
            color: '#fff',
            borderRight: 'none',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={800} color="primary.light">
            TechStore
          </Typography>
          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
            Админ-панель
          </Typography>
        </Box>
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'rgba(37, 99, 235, 0.2)',
                  '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.3)' },
                },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#60A5FA' : '#94A3B8', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <ListItemButton
            component={Link}
            to="/"
            sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
          >
            <ListItemIcon sx={{ color: '#94A3B8', minWidth: 40 }}>
              <ArrowBack />
            </ListItemIcon>
            <ListItemText primary="На сайт" />
          </ListItemButton>
        </Box>
      </Drawer>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {menuItems.find((i) => i.path === location.pathname)?.text || 'Админ'}
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ flexGrow: 1, p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
