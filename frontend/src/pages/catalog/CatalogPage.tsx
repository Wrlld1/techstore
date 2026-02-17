import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Container, Box, Typography, Grid, Card, CardMedia, CardContent, CardActions,
  Button, IconButton, Chip, Rating, Slider, TextField, FormControlLabel, Checkbox,
  Select, MenuItem, Pagination, Skeleton, Drawer, useTheme, alpha, Breadcrumbs,
  InputAdornment, Collapse, FormControl, InputLabel, Divider,
} from '@mui/material';
import {
  ShoppingCart, FavoriteBorder, Favorite, FilterList, Close,
  ExpandMore, ExpandLess, Search,
} from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import api from '../../services/api';
import { Product, Category, Brand, PaginationMeta } from '../../types';
import { getImageUrl, formatPrice } from '../../utils/helpers';
import AnimatedBox from '../../components/common/AnimatedBox';
import toast from 'react-hot-toast';

// ==================== PRODUCT CARD ====================
const ProductCardGrid: React.FC<{ product: Product }> = ({ product }) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0;
  const mainImage = product.images?.find((img) => img.isMain)?.url || product.images?.[0]?.url;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(addToCart({
      productId: product.id, quantity: 1,
      product: { id: product.id, name: product.name, slug: product.slug, price: product.price, oldPrice: product.oldPrice, stock: product.stock, isActive: product.isActive, images: mainImage ? [{ url: mainImage }] : [], brand: product.brand },
    }));
    toast.success('Добавлено в корзину');
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer', position: 'relative', '&:hover .product-image': { transform: 'scale(1.05)' } }}
      onClick={() => navigate(`/product/${product.slug}`)}>
      <Box sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1, display: 'flex', gap: 0.5 }}>
        {product.isNew && <Chip label="NEW" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
        {discount > 0 && <Chip label={`-${discount}%`} size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />}
      </Box>
      <Box sx={{ p: 2, pt: 4, display: 'flex', justifyContent: 'center', minHeight: 180 }}>
        {mainImage ? (
          <CardMedia component="img" className="product-image" image={getImageUrl(mainImage)} alt={product.name}
            sx={{ maxHeight: 160, objectFit: 'contain', transition: 'transform 0.3s' }} />
        ) : (
          <Box sx={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
            <Typography variant="h3" sx={{ color: alpha(theme.palette.primary.main, 0.2) }}>📱</Typography>
          </Box>
        )}
      </Box>
      <CardContent sx={{ flexGrow: 1, pt: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{product.brand?.name}</Typography>
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
          {product.oldPrice && <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{formatPrice(product.oldPrice)}</Typography>}
        </Box>
        <Typography variant="caption" sx={{ color: product.stock > 0 ? 'success.main' : 'error.main', mt: 0.5, display: 'block' }}>
          {product.stock > 0 ? '✓ В наличии' : '✗ Нет в наличии'}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button variant="contained" fullWidth size="small" startIcon={<ShoppingCart />} onClick={handleAddToCart} disabled={product.stock === 0}>В корзину</Button>
      </CardActions>
    </Card>
  );
};

// ==================== CATALOG PAGE ====================
const CatalogPage: React.FC = () => {
  const theme = useTheme();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ categories: true, price: true, other: true });

  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const brandId = searchParams.get('brandId') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const isNew = searchParams.get('isNew') === 'true';

  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice ? parseInt(minPrice) : 0, maxPrice ? parseInt(maxPrice) : 2000000]);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (slug) {
      api.get(`/categories/${slug}`).then((res) => setCurrentCategory(res.data.data)).catch(() => setCurrentCategory(null));
    } else { setCurrentCategory(null); }
  }, [slug]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', '12');
        params.set('sort', sort);
        if (search) params.set('search', search);
        if (slug) {
          try {
            const catRes = await api.get(`/categories/${slug}`);
            if (catRes.data.data) params.set('categoryId', String(catRes.data.data.id));
          } catch {}
        }
        if (brandId) params.set('brandId', brandId);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (inStock) params.set('inStock', 'true');
        if (isNew) params.set('isNew', 'true');
        if (searchParams.get('isFeatured')) params.set('isFeatured', 'true');

        const res = await api.get(`/products?${params.toString()}`);
        setProducts(res.data.data);
        setMeta(res.data.meta);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, [page, sort, search, slug, brandId, minPrice, maxPrice, inStock, isNew, searchParams]);

  const updateFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.set('page', '1');
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const applyPriceRange = () => {
    const params = new URLSearchParams(searchParams);
    if (priceRange[0] > 0) { params.set('minPrice', String(priceRange[0])); } else { params.delete('minPrice'); }
    if (priceRange[1] < 2000000) { params.set('maxPrice', String(priceRange[1])); } else { params.delete('maxPrice'); }
    params.set('page', '1');
    setSearchParams(params);
  };

  const clearFilters = () => { setSearchParams({}); setPriceRange([0, 2000000]); setSearchInput(''); };
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); updateFilter('search', searchInput); };
  const toggleSection = (key: string) => setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const activeFilterCount = [search, brandId, minPrice, maxPrice, inStock ? 'y' : '', isNew ? 'y' : ''].filter(Boolean).length;

  // Filter sidebar
  const filterContent = (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>Фильтры</Typography>
        {activeFilterCount > 0 && <Button size="small" onClick={clearFilters}>Сбросить ({activeFilterCount})</Button>}
      </Box>

      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField fullWidth size="small" placeholder="Поиск..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
          InputProps={{ endAdornment: <InputAdornment position="end"><IconButton size="small" type="submit"><Search fontSize="small" /></IconButton></InputAdornment> }} />
      </Box>

      {/* Categories */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', py: 1 }} onClick={() => toggleSection('categories')}>
          <Typography variant="subtitle2" fontWeight={600}>Категории</Typography>
          {expandedSections.categories ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </Box>
        <Collapse in={expandedSections.categories}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" component={Link} to="/catalog"
              sx={{ textDecoration: 'none', color: !slug ? 'primary.main' : 'text.primary', fontWeight: !slug ? 600 : 400, py: 0.5, px: 1, borderRadius: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
              Все товары
            </Typography>
            {categories.map((cat) => (
              <Box key={cat.id}>
                <Typography variant="body2" component={Link} to={`/catalog/${cat.slug}`}
                  sx={{ textDecoration: 'none', color: slug === cat.slug ? 'primary.main' : 'text.primary', fontWeight: slug === cat.slug ? 600 : 400, py: 0.5, px: 1, borderRadius: 1, display: 'block', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                  {cat.name} {cat._count && <Typography component="span" variant="caption" color="text.secondary">({cat._count.products})</Typography>}
                </Typography>
                {cat.children?.map((child) => (
                  <Typography key={child.id} variant="body2" component={Link} to={`/catalog/${child.slug}`}
                    sx={{ textDecoration: 'none', color: slug === child.slug ? 'primary.main' : 'text.secondary', fontWeight: slug === child.slug ? 600 : 400, py: 0.3, px: 1, pl: 3, borderRadius: 1, display: 'block', fontSize: '0.8rem', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) } }}>
                    {child.name}
                  </Typography>
                ))}
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Price */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', py: 1 }} onClick={() => toggleSection('price')}>
          <Typography variant="subtitle2" fontWeight={600}>Цена (₸)</Typography>
          {expandedSections.price ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </Box>
        <Collapse in={expandedSections.price}>
          <Slider value={priceRange} onChange={(_, val) => setPriceRange(val as [number, number])}
            onChangeCommitted={() => applyPriceRange()}
            min={0} max={2000000} step={10000} valueLabelDisplay="auto" valueLabelFormat={(v) => formatPrice(v)} sx={{ mx: 1 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField size="small" label="От" type="number" value={priceRange[0]}
              onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
              onBlur={applyPriceRange} />
            <TextField size="small" label="До" type="number" value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 2000000])}
              onBlur={applyPriceRange} />
          </Box>
        </Collapse>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Other */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', py: 1 }} onClick={() => toggleSection('other')}>
          <Typography variant="subtitle2" fontWeight={600}>Другое</Typography>
          {expandedSections.other ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </Box>
        <Collapse in={expandedSections.other}>
          <FormControlLabel control={<Checkbox checked={inStock} onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : '')} size="small" />}
            label={<Typography variant="body2">Только в наличии</Typography>} />
          <FormControlLabel control={<Checkbox checked={isNew} onChange={(e) => updateFilter('isNew', e.target.checked ? 'true' : '')} size="small" />}
            label={<Typography variant="body2">Новинки</Typography>} />
        </Collapse>
      </Box>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>Главная</Typography>
        <Typography component={Link} to="/catalog" variant="body2" sx={{ textDecoration: 'none', color: slug ? 'text.secondary' : 'text.primary', '&:hover': { color: 'primary.main' } }}>Каталог</Typography>
        {currentCategory && <Typography variant="body2" color="text.primary" fontWeight={600}>{currentCategory.name}</Typography>}
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{search ? `Поиск: "${search}"` : currentCategory?.name || 'Каталог'}</Typography>
          {meta && <Typography variant="body2" color="text.secondary">{meta.total} товаров</Typography>}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 180, display: { xs: 'none', md: 'flex' } }}>
            <InputLabel>Сортировка</InputLabel>
            <Select value={sort} label="Сортировка" onChange={(e) => updateFilter('sort', e.target.value)}>
              <MenuItem value="newest">Новые</MenuItem><MenuItem value="popular">Популярные</MenuItem>
              <MenuItem value="price_asc">Дешевле</MenuItem><MenuItem value="price_desc">Дороже</MenuItem>
              <MenuItem value="rating">По рейтингу</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<FilterList />} onClick={() => setMobileFilterOpen(true)} sx={{ display: { md: 'none' } }}>
            Фильтры {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}><Card sx={{ position: 'sticky', top: 80 }}>{filterContent}</Card></Grid>
        <Drawer anchor="left" open={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)} sx={{ display: { md: 'none' } }} PaperProps={{ sx: { width: 300 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="h6">Фильтры</Typography>
            <IconButton onClick={() => setMobileFilterOpen(false)}><Close /></IconButton>
          </Box>
          {filterContent}
        </Drawer>

        <Grid item xs={12} md={9}>
          {activeFilterCount > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              {search && <Chip label={`Поиск: ${search}`} size="small" onDelete={() => { updateFilter('search', ''); setSearchInput(''); }} />}
              {minPrice && <Chip label={`От ${formatPrice(parseInt(minPrice))}`} size="small" onDelete={() => { updateFilter('minPrice', ''); setPriceRange([0, priceRange[1]]); }} />}
              {maxPrice && <Chip label={`До ${formatPrice(parseInt(maxPrice))}`} size="small" onDelete={() => { updateFilter('maxPrice', ''); setPriceRange([priceRange[0], 2000000]); }} />}
              {inStock && <Chip label="В наличии" size="small" onDelete={() => updateFilter('inStock', '')} />}
              {isNew && <Chip label="Новинки" size="small" onDelete={() => updateFilter('isNew', '')} />}
            </Box>
          )}

          {loading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 12 }).map((_, i) => (<Grid item xs={6} sm={4} md={4} key={i}><Skeleton variant="rounded" height={360} sx={{ borderRadius: 4 }} /></Grid>))}
            </Grid>
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h1" sx={{ fontSize: '4rem', mb: 2 }}>🔍</Typography>
              <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>Товары не найдены</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Попробуйте изменить параметры</Typography>
              <Button variant="contained" onClick={clearFilters}>Сбросить фильтры</Button>
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {products.map((product, i) => (<Grid item xs={6} sm={4} md={4} key={product.id}><AnimatedBox delay={i * 0.05}><ProductCardGrid product={product} /></AnimatedBox></Grid>))}
              </Grid>
              {meta && meta.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination count={meta.totalPages} page={page} onChange={(_, p) => updateFilter('page', String(p))} color="primary" size="large" showFirstButton showLastButton />
                </Box>
              )}
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default CatalogPage;
