import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardContent, Button, IconButton, Chip, Rating,
  Tabs, Tab, Table, TableBody, TableRow, TableCell, Divider, Breadcrumbs,
  Skeleton, useTheme, alpha, Avatar, Snackbar,
} from '@mui/material';
import {
  ShoppingCart, FavoriteBorder, Favorite, Compare, Share, Add, Remove,
  CheckCircle, LocalShipping, Security,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../services/api';
import { Product } from '../../types';
import { getImageUrl, formatPrice, addToCompare, isInCompare, CompareItem } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ProductPage: React.FC = () => {
  const theme = useTheme();
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [inCompare, setInCompare] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/products/${slug}`);
        const p = res.data.data;
        setProduct(p);
        setSelectedImage(0);
        setQuantity(1);
        setInCompare(isInCompare(p.id));

        // Check if in favorites
        if (isAuthenticated) {
          try {
            const favRes = await api.get('/favorites');
            const favIds = (favRes.data.data || []).map((f: any) => f.productId || f.product?.id);
            setIsFav(favIds.includes(p.id));
          } catch {}
        }

        // Fetch related
        if (p?.id) {
          try {
            const relRes = await api.get(`/products/${p.id}/related`);
            setRelatedProducts(relRes.data.data);
          } catch {}
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    if (slug) fetchProduct();
  }, [slug, isAuthenticated]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}><Skeleton variant="rounded" height={500} sx={{ borderRadius: 4 }} /></Grid>
          <Grid item xs={12} md={6}>
            <Skeleton width="60%" height={40} />
            <Skeleton width="80%" height={60} sx={{ mt: 2 }} />
            <Skeleton width="40%" height={50} sx={{ mt: 2 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>😕</Typography>
        <Typography variant="h5" fontWeight={600}>Товар не найден</Typography>
        <Button component={Link} to="/catalog" variant="contained" sx={{ mt: 3 }}>В каталог</Button>
      </Container>
    );
  }

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const specs = product.specifications as Record<string, string> | null;
  const mainImage = product.images?.[selectedImage]?.url;

  const handleAddToCart = () => {
    const img = product.images?.find((i) => i.isMain)?.url || product.images?.[0]?.url;
    dispatch(addToCart({
      productId: product.id, quantity,
      product: {
        id: product.id, name: product.name, slug: product.slug,
        price: product.price, oldPrice: product.oldPrice, stock: product.stock,
        isActive: product.isActive, images: img ? [{ url: img }] : [], brand: product.brand,
      },
    }));
    toast.success(`${product.name} добавлен в корзину`);
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) { toast.error('Войдите для добавления в избранное'); navigate('/auth/login'); return; }
    try {
      await api.post('/favorites/toggle', { productId: product.id });
      setIsFav(!isFav);
      toast.success(isFav ? 'Удалено из избранного' : 'Добавлено в избранное');
    } catch { toast.error('Ошибка'); }
  };

  const handleCompare = () => {
    if (inCompare) {
      toast('Товар уже в сравнении');
      return;
    }
    const item: CompareItem = {
      id: product.id, name: product.name, slug: product.slug,
      price: product.price, rating: Number(product.rating),
      image: product.images?.[0]?.url,
      brand: product.brand?.name,
      specifications: specs || undefined,
    };
    if (addToCompare(item)) {
      setInCompare(true);
      toast.success('Добавлено в сравнение');
    } else {
      toast.error('Максимум 4 товара для сравнения');
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Ссылка скопирована');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Главная</Typography>
        <Typography component={Link} to="/catalog" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Каталог</Typography>
        {product.category && (
          <Typography component={Link} to={`/catalog/${product.category.slug}`} variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>
            {product.category.name}
          </Typography>
        )}
        <Typography variant="body2" color="text.primary" fontWeight={500}>{product.name}</Typography>
      </Breadcrumbs>

      <Grid container spacing={4}>
        {/* IMAGES */}
        <Grid item xs={12} md={6}>
          <Box sx={{ position: 'sticky', top: 90 }}>
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 4, p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, border: `1px solid ${theme.palette.divider}`, mb: 2 }}>
              {mainImage ? (
                <Box component="img" src={getImageUrl(mainImage)} alt={product.name}
                  sx={{ maxWidth: '100%', maxHeight: 380, objectFit: 'contain' }} />
              ) : (
                <Typography sx={{ fontSize: '8rem', opacity: 0.1 }}>📱</Typography>
              )}
            </Box>
            {product.images && product.images.length > 1 && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {product.images.map((img, i) => (
                  <Box key={img.id} onClick={() => setSelectedImage(i)}
                    sx={{ width: 64, height: 64, borderRadius: 2, overflow: 'hidden', cursor: 'pointer',
                      border: `2px solid ${i === selectedImage ? theme.palette.primary.main : theme.palette.divider}` }}>
                    <Box component="img" src={getImageUrl(img.url)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Grid>

        {/* INFO */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {product.isNew && <Chip label="Новинка" color="primary" size="small" />}
            {discount > 0 && <Chip label={`Скидка ${discount}%`} color="error" size="small" />}
            <Chip icon={<CheckCircle />} label={product.stock > 0 ? 'В наличии' : 'Нет в наличии'}
              color={product.stock > 0 ? 'success' : 'default'} size="small" variant="outlined" />
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{product.brand?.name}</Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 0.5, mb: 2 }}>{product.name}</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Rating value={Number(product.rating)} precision={0.5} readOnly />
            <Typography variant="body2" color="text.secondary">{Number(product.rating).toFixed(1)} ({product.reviewCount} отзывов)</Typography>
            <Typography variant="body2" color="text.secondary">• SKU: {product.sku}</Typography>
          </Box>

          {product.shortDescription && <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>{product.shortDescription}</Typography>}

          {/* Price */}
          <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 3, p: 3, mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
              <Typography variant="h3" fontWeight={800} color="primary.main">{formatPrice(product.price)}</Typography>
              {product.oldPrice && <Typography variant="h5" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.oldPrice)}</Typography>}
            </Box>
            {discount > 0 && <Typography variant="body2" color="error.main" fontWeight={600} sx={{ mt: 0.5 }}>Экономия: {formatPrice(product.oldPrice! - product.price)}</Typography>}
          </Box>

          {/* Quantity + Cart */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
              <IconButton size="small" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Remove /></IconButton>
              <Typography sx={{ px: 2, minWidth: 40, textAlign: 'center', fontWeight: 600 }}>{quantity}</Typography>
              <IconButton size="small" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}><Add /></IconButton>
            </Box>
            <Button variant="contained" size="large" startIcon={<ShoppingCart />} onClick={handleAddToCart} disabled={product.stock === 0} sx={{ flexGrow: 1, py: 1.5 }}>
              Добавить в корзину
            </Button>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button variant="outlined" startIcon={isFav ? <Favorite color="error" /> : <FavoriteBorder />} onClick={handleToggleFavorite} size="small">
              {isFav ? 'В избранном' : 'В избранное'}
            </Button>
            <Button variant="outlined" startIcon={<Compare />} onClick={handleCompare} size="small"
              color={inCompare ? 'success' : 'primary'}>
              {inCompare ? 'В сравнении' : 'Сравнить'}
            </Button>
            <Button variant="outlined" startIcon={<Share />} onClick={handleShare} size="small">Поделиться</Button>
          </Box>

          {/* Delivery */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, borderRadius: 2, bgcolor: 'background.paper', border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <LocalShipping fontSize="small" color="primary" />
              <Box><Typography variant="body2" fontWeight={600}>Доставка</Typography><Typography variant="caption" color="text.secondary">Бесплатно при заказе от 50 000 ₸</Typography></Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Security fontSize="small" color="primary" />
              <Box><Typography variant="body2" fontWeight={600}>Гарантия</Typography><Typography variant="caption" color="text.secondary">Официальная гарантия производителя</Typography></Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* TABS */}
      <Box sx={{ mt: 6 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tab label="Описание" />
          <Tab label="Характеристики" />
          <Tab label={`Отзывы (${product.reviewCount})`} />
        </Tabs>

        {activeTab === 0 && (
          <Box sx={{ py: 3 }}><Typography variant="body1" sx={{ lineHeight: 1.8, maxWidth: 800 }}>{product.description || 'Описание скоро будет добавлено.'}</Typography></Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ py: 3, maxWidth: 700 }}>
            {specs && Object.keys(specs).length > 0 ? (
              <Table>
                <TableBody>
                  {Object.entries(specs).map(([key, value], i) => (
                    <TableRow key={key} sx={{ bgcolor: i % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent' }}>
                      <TableCell sx={{ fontWeight: 500, color: 'text.secondary', width: '40%', border: 'none', py: 1.5 }}>{key}</TableCell>
                      <TableCell sx={{ fontWeight: 500, border: 'none', py: 1.5 }}>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <Typography color="text.secondary">Характеристики не указаны</Typography>}
          </Box>
        )}

        {activeTab === 2 && (
          <Box sx={{ py: 3 }}>
            {product.reviews && product.reviews.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 700 }}>
                {product.reviews.map((review) => (
                  <Box key={review.id} sx={{ p: 2, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14 }}>{review.user.firstName[0]}{review.user.lastName[0]}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{review.user.firstName} {review.user.lastName}</Typography>
                        <Rating value={review.rating} size="small" readOnly />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>{new Date(review.createdAt).toLocaleDateString('ru-RU')}</Typography>
                    </Box>
                    {review.title && <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{review.title}</Typography>}
                    {review.comment && <Typography variant="body2" color="text.secondary">{review.comment}</Typography>}
                    {review.pros && <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}><strong>Достоинства:</strong> {review.pros}</Typography>}
                    {review.cons && <Typography variant="body2" sx={{ color: 'error.main' }}><strong>Недостатки:</strong> {review.cons}</Typography>}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">Отзывов пока нет</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Будьте первым, кто оставит отзыв</Typography>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* RELATED */}
      {relatedProducts.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Похожие товары</Typography>
          <Grid container spacing={3}>
            {relatedProducts.slice(0, 4).map((p) => (
              <Grid item xs={6} sm={3} key={p.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-4px)' }, transition: 'transform 0.2s' }}
                  onClick={() => navigate(`/product/${p.slug}`)}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', minHeight: 140 }}>
                    {p.images?.[0] ? (
                      <Box component="img" src={getImageUrl(p.images[0].url)} alt={p.name} sx={{ maxHeight: 120, objectFit: 'contain' }} />
                    ) : <Typography sx={{ fontSize: '3rem', opacity: 0.1 }}>📱</Typography>}
                  </Box>
                  <CardContent sx={{ pt: 0 }}>
                    <Typography variant="caption" color="text.secondary">{(p.brand as any)?.name}</Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.name}</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mt: 1 }}>{formatPrice(p.price)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default ProductPage;
