import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Grid, Divider, useTheme } from '@mui/material';

const Footer: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1E293B',
        color: '#CBD5E1',
        mt: 'auto',
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 2 }}>
              TechStore
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 300 }}>
              Интернет-магазин техники и электроники. Лучшие цены на смартфоны, ноутбуки и аксессуары.
            </Typography>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Каталог</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography component={Link} to="/catalog/smartphones" sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#fff' } }}>Смартфоны</Typography>
              <Typography component={Link} to="/catalog/laptops" sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#fff' } }}>Ноутбуки</Typography>
              <Typography component={Link} to="/catalog/tablets" sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#fff' } }}>Планшеты</Typography>
              <Typography component={Link} to="/catalog/audio" sx={{ color: '#CBD5E1', textDecoration: 'none', '&:hover': { color: '#fff' } }}>Аудиотехника</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Покупателю</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ color: '#CBD5E1' }}>Доставка</Typography>
              <Typography sx={{ color: '#CBD5E1' }}>Оплата</Typography>
              <Typography sx={{ color: '#CBD5E1' }}>Гарантия</Typography>
              <Typography sx={{ color: '#CBD5E1' }}>Возврат</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>Контакты</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>📞 +7 (777) 123-45-67</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>✉️ info@techstore.kz</Typography>
            <Typography variant="body2">📍 г. Астана, ул. Мангилик Ел, 55</Typography>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
        <Typography variant="body2" textAlign="center" sx={{ color: '#64748B' }}>
          © {new Date().getFullYear()} TechStore. Все права защищены. Дипломный проект.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;