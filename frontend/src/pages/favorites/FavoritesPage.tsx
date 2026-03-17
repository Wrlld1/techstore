import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardContent, CardActions,
  Button, IconButton, Rating, Skeleton, Breadcrumbs, useTheme, alpha,
} from '@mui/material';
import { ShoppingCart, Delete, FavoriteBorder } from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { getImageUrl, formatPrice } from '../../utils/helpers';

const FavoritesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/favorites');
        setFavorites(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      await api.post('/favorites/toggle', { productId });
      setFavorites((prev) => prev.filter((f) => f.product.id !== productId));
      toast.success('Удалено из избранного');
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({
      productId: product.id, quantity: 1,
      product: {
        id: product.id, name: product.name, slug: product.slug,
        price: product.price, oldPrice: product.oldPrice, stock: product.stock,
        isActive: true, images: product.images || [], brand: product.brand,
      },
    }));
    toast.success('Добавлено в корзину');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Главная</Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>Избранное</Typography>
      </Breadcrumbs>

      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Избранное {!loading && `(${favorites.length})`}
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} /></Grid>
          ))}
        </Grid>
      ) : favorites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteBorder sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" fontWeight={600}>Список избранного пуст</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Добавляйте товары, нажимая на ♡ в каталоге
          </Typography>
          <Button component={Link} to="/catalog" variant="contained">В каталог</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((fav) => {
            const p = fav.product;
            const mainImg = p.images?.[0]?.url;
            return (
              <Grid item xs={6} sm={4} md={3} key={fav.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  <IconButton size="small" onClick={() => handleRemove(p.id)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
                    <Delete fontSize="small" color="error" />
                  </IconButton>
                  <Box
                    sx={{ p: 2, display: 'flex', justifyContent: 'center', minHeight: 160, cursor: 'pointer' }}
                    onClick={() => navigate(`/product/${p.slug}`)}
                  >
                    {mainImg ? (
                      <Box component="img" src={getImageUrl(mainImg)} alt={p.name} sx={{ maxHeight: 140, objectFit: 'contain' }} />
                    ) : (
                      <Typography sx={{ fontSize: '3rem', opacity: 0.1 }}>📱</Typography>
                    )}
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                    <Typography variant="caption" color="text.secondary">{p.brand?.name}</Typography>
                    <Typography variant="body2" fontWeight={600}
                      sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {p.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, my: 0.5 }}>
                      <Rating value={Number(p.rating)} size="small" readOnly precision={0.5} />
                      <Typography variant="caption" color="text.secondary">({p.reviewCount})</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700} color="primary.main">{formatPrice(p.price)}</Typography>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button variant="contained" fullWidth size="small" startIcon={<ShoppingCart />}
                      onClick={() => handleAddToCart(p)} disabled={p.stock === 0}>
                      В корзину
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default FavoritesPage;
