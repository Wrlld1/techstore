import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Grid, Card, CardMedia, CardContent,
  CardActions, IconButton, Chip, Rating, Skeleton, useTheme, alpha,
} from '@mui/material';
import {
  ShoppingCart, FavoriteBorder, Favorite, ArrowForward,
  LocalShipping, Security, CreditCard, Headset,
  Smartphone, Laptop, Tablet, Headphones, Cable,
} from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../services/api';
import { Product, Category } from '../../types';
import { getImageUrl, formatPrice } from '../../utils/helpers';
import AnimatedBox from '../../components/common/AnimatedBox';
import toast from 'react-hot-toast';

const categoryIcons: Record<string, React.ReactNode> = {
  smartphones: <Smartphone sx={{ fontSize: 40 }} />,
  laptops: <Laptop sx={{ fontSize: 40 }} />,
  tablets: <Tablet sx={{ fontSize: 40 }} />,
  audio: <Headphones sx={{ fontSize: 40 }} />,
  accessories: <Cable sx={{ fontSize: 40 }} />,
};

// ==================== PRODUCT CARD ====================
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isFav, setIsFav] = useState(false);

  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const mainImage = product.images?.find((img) => img.isMain)?.url || product.images?.[0]?.url;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addToCart({
      productId: product.id, quantity: 1,
      product: {
        id: product.id, name: product.name, slug: product.slug,
        price: product.price, oldPrice: product.oldPrice, stock: product.stock,
        isActive: product.isActive, images: mainImage ? [{ url: mainImage }] : [], brand: product.brand,
      },
    }));
    toast.success('Добавлено в корзину');
  };

  return (
    <Card
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative',
        '&:hover .product-image': { transform: 'scale(1.05)' },
      }}
      onClick={() => navigate(`/product/${product.slug}`)}
    >
      <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'flex', gap: 0.5 }}>
        {product.isNew && <Chip label="NEW" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
        {discount > 0 && <Chip label={`-${discount}%`} size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
      </Box>
      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setIsFav(!isFav); }}
        sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: alpha(theme.palette.background.paper, 0.8), '&:hover': { bgcolor: theme.palette.background.paper } }}>
        {isFav ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" />}
      </IconButton>

      <Box sx={{ p: 2, pt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
        {mainImage ? (
          <CardMedia component="img" className="product-image" image={getImageUrl(mainImage)} alt={product.name}
            sx={{ maxHeight: 160, objectFit: 'contain', transition: 'transform 0.3s ease' }} />
        ) : (
          <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Typography variant="h3" sx={{ color: alpha(theme.palette.primary.main, 0.2) }}>📱</Typography>
          </Box>
        )}
      </Box>

      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {product.brand?.name}
        </Typography>
        <Typography variant="body2" fontWeight={600}
          sx={{ mt: 0.5, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5em' }}>
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <Rating value={Number(product.rating)} precision={0.5} size="small" readOnly />
          <Typography variant="caption" color="text.secondary">({product.reviewCount})</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={700} color="primary.main">{formatPrice(product.price)}</Typography>
          {product.oldPrice && (
            <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.oldPrice)}</Typography>
          )}
        </Box>
        <Typography variant="caption" sx={{ color: product.stock > 0 ? 'success.main' : 'error.main', mt: 0.5, display: 'block' }}>
          {product.stock > 0 ? '✓ В наличии' : '✗ Нет в наличии'}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button variant="contained" fullWidth size="small" startIcon={<ShoppingCart />} onClick={handleAddToCart} disabled={product.stock === 0}>
          В корзину
        </Button>
      </CardActions>
    </Card>
  );
};

// ==================== HOME PAGE ====================
const HomePage: React.FC = () => {
  const theme = useTheme();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, catRes] = await Promise.all([
          api.get('/products?isFeatured=true&limit=4'),
          api.get('/products?sort=newest&limit=8'),
          api.get('/categories'),
        ]);
        setFeaturedProducts(featuredRes.data.data);
        setNewProducts(newRes.data.data);
        setCategories(catRes.data.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <Box>
      {/* HERO */}
      <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`, color: '#fff', py: { xs: 6, md: 10 }, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', bgcolor: alpha('#fff', 0.05) }} />
        <Container maxWidth="xl">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip label="🔥 Скидки до 20%" sx={{ mb: 2, bgcolor: alpha('#fff', 0.15), color: '#fff', fontWeight: 600 }} />
              <Typography variant="h2" fontWeight={800} sx={{ mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
                Техника и электроника<br />
                <Box component="span" sx={{ color: alpha('#fff', 0.7) }}>по лучшим ценам</Box>
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, color: alpha('#fff', 0.8), fontWeight: 400, maxWidth: 500 }}>
                Смартфоны, ноутбуки, планшеты и аксессуары с гарантией и быстрой доставкой по Казахстану
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button component={Link} to="/catalog" variant="contained" size="large"
                  sx={{ bgcolor: '#fff', color: theme.palette.primary.dark, '&:hover': { bgcolor: alpha('#fff', 0.9) }, px: 4, py: 1.5 }}>
                  Перейти в каталог
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '10rem', opacity: 0.2, userSelect: 'none' }}>🛒</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ADVANTAGES */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={2}>
          {[
            { icon: <LocalShipping />, title: 'Бесплатная доставка', desc: 'При заказе от 50 000 ₸' },
            { icon: <Security />, title: 'Гарантия', desc: 'Официальная гарантия' },
            { icon: <CreditCard />, title: 'Удобная оплата', desc: 'Наличные, карта, онлайн' },
            { icon: <Headset />, title: 'Поддержка 24/7', desc: 'Поможем с выбором' },
          ].map((item, i) => (
            <Grid item xs={6} md={3} key={i}>
              <AnimatedBox delay={i * 0.1} animation="slideInRight">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex' }}>{item.icon}</Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                </Box>
              </Box>
              </AnimatedBox>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CATEGORIES */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Категории</Typography>
          <Button component={Link} to="/catalog" endIcon={<ArrowForward />} size="small">Все категории</Button>
        </Box>
        <Grid container spacing={2}>
          {categories.map((cat, i) => (
            <Grid item xs={4} sm={4} md key={cat.id}>
              <AnimatedBox delay={i * 0.1}>
              <Card component={Link} to={`/catalog/${cat.slug}`}
                sx={{
                  textDecoration: 'none', textAlign: 'center', p: { xs: 2, md: 3 }, transition: 'all 0.3s',
                  border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  '&:hover': { transform: 'translateY(-4px)', bgcolor: alpha(theme.palette.primary.main, 0.05) },
                }}>
                <Box sx={{ color: 'primary.main', mb: 1 }}>{categoryIcons[cat.slug] || <Smartphone sx={{ fontSize: 40 }} />}</Box>
                <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>{cat.name}</Typography>
                {cat._count && <Typography variant="caption" color="text.secondary">{cat._count.products} товаров</Typography>}
              </Card>
              </AnimatedBox>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* FEATURED */}
      <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03), py: 6 }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={700}>Хиты продаж</Typography>
              <Typography variant="body2" color="text.secondary">Самые популярные товары</Typography>
            </Box>
            <Button component={Link} to="/catalog?isFeatured=true" endIcon={<ArrowForward />} size="small">Все хиты</Button>
          </Box>
          <Grid container spacing={3}>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (<Grid item xs={6} md={3} key={i}><Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} /></Grid>))
              : featuredProducts.map((product, i) => (<Grid item xs={6} md={3} key={product.id}><AnimatedBox delay={i * 0.1}><ProductCard product={product} /></AnimatedBox></Grid>))}
          </Grid>
        </Container>
      </Box>

      {/* NEW ARRIVALS */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Новинки</Typography>
            <Typography variant="body2" color="text.secondary">Недавно добавленные товары</Typography>
          </Box>
          <Button component={Link} to="/catalog?sort=newest" endIcon={<ArrowForward />} size="small">Все новинки</Button>
        </Box>
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (<Grid item xs={6} sm={4} md={3} key={i}><Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} /></Grid>))
            : newProducts.map((product, i) => (<Grid item xs={6} sm={4} md={3} key={product.id}><AnimatedBox delay={i * 0.08}><ProductCard product={product} /></AnimatedBox></Grid>))}
        </Grid>
      </Container>

      {/* CTA */}
      <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 100%)`, color: '#fff', py: 8, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>Не нашли что искали?</Typography>
          <Typography variant="body1" sx={{ mb: 4, color: alpha('#fff', 0.8) }}>Напишите нам, и мы поможем подобрать технику</Typography>
          <Button variant="contained" size="large" sx={{ bgcolor: '#fff', color: theme.palette.primary.dark, '&:hover': { bgcolor: alpha('#fff', 0.9) }, px: 5, py: 1.5 }}>
            Связаться с нами
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
