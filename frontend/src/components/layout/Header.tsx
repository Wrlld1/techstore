import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Box, Button,
  InputBase, Container, Menu, MenuItem, Avatar, Tooltip, useTheme, alpha,
  Paper, Popper, ClickAwayListener, CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon, ShoppingCart, FavoriteBorder, Person,
  Compare, Close, TrendingUp,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useRedux';
import { logout } from '../../store/slices/authSlice';
import api from '../../services/api';

interface Suggestion {
  id: number;
  name: string;
  slug: string;
  price: number;
  image?: string;
  brand?: string;
}

const Header: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const cartItems = useAppSelector((s) => s.cart.items);
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₸';

  // Debounced search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await api.get(`/products/search/suggestions?q=${encodeURIComponent(query)}`);
      const data = res.data.data || [];
      setSuggestions(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        image: p.images?.[0]?.url,
        brand: p.brand?.name,
      })));
      setShowSuggestions(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (slug: string) => {
    navigate(`/product/${slug}`);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setAnchorEl(null);
    navigate('/');
  };

  return (
    <AppBar
      position="sticky"
      sx={{ bgcolor: 'background.paper', color: 'text.primary', borderBottom: `1px solid ${theme.palette.divider}` }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ gap: 2, py: 0.5 }}>
          {/* Logo */}
          <Typography component={Link} to="/" variant="h5"
            sx={{ textDecoration: 'none', color: 'primary.main', fontWeight: 800, letterSpacing: '-0.5px', mr: 3 }}>
            TechStore
          </Typography>

          {/* Catalog button */}
          <Button component={Link} to="/catalog" variant="contained" size="small"
            sx={{ display: { xs: 'none', md: 'flex' }, minWidth: 'auto' }}>
            Каталог
          </Button>

          {/* Search with autocomplete */}
          <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
            <Box ref={searchRef} sx={{ flexGrow: 1, position: 'relative', maxWidth: 600 }}>
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{
                  display: 'flex', alignItems: 'center',
                  bgcolor: '#F1F5F9',
                  borderRadius: showSuggestions && suggestions.length > 0 ? '12px 12px 0 0' : 2,
                  px: 2,
                  border: showSuggestions && suggestions.length > 0 ? `1px solid ${theme.palette.primary.main}` : 'none',
                  borderBottom: showSuggestions && suggestions.length > 0 ? 'none' : undefined,
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <InputBase
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  sx={{ flexGrow: 1, py: 0.8 }}
                  fullWidth
                />
                {loadingSuggestions && <CircularProgress size={18} sx={{ mr: 1 }} />}
                {searchQuery && (
                  <IconButton size="small" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}>
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <Paper sx={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1300,
                  borderRadius: '0 0 12px 12px', overflow: 'hidden',
                  border: `1px solid ${theme.palette.primary.main}`, borderTop: 'none',
                  maxHeight: 400, overflowY: 'auto',
                }}>
                  {suggestions.map((s) => (
                    <Box
                      key={s.id}
                      onClick={() => handleSelectSuggestion(s.slug)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2,
                        cursor: 'pointer', transition: 'background 0.15s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      {/* Thumbnail */}
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 1, overflow: 'hidden', flexShrink: 0,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {s.image ? (
                          <Box component="img" src={`http://localhost:5000${s.image}`} alt=""
                            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Typography sx={{ fontSize: '1rem', opacity: 0.3 }}>📱</Typography>
                        )}
                      </Box>
                      {/* Info */}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={500} noWrap>{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.brand}</Typography>
                      </Box>
                      {/* Price */}
                      <Typography variant="body2" fontWeight={700} color="primary.main" sx={{ flexShrink: 0 }}>
                        {formatPrice(s.price)}
                      </Typography>
                    </Box>
                  ))}

                  {/* Show all results */}
                  <Box
                    onClick={handleSearch as any}
                    sx={{
                      px: 2, py: 1.5, cursor: 'pointer', textAlign: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.03),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                    }}
                  >
                    <Typography variant="body2" color="primary.main" fontWeight={600}>
                      Показать все результаты по «{searchQuery}»
                    </Typography>
                  </Box>
                </Paper>
              )}
            </Box>
          </ClickAwayListener>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Сравнение">
              <IconButton component={Link} to="/compare" size="small"><Compare /></IconButton>
            </Tooltip>

            {isAuthenticated && (
              <Tooltip title="Избранное">
                <IconButton component={Link} to="/favorites" size="small"><FavoriteBorder /></IconButton>
              </Tooltip>
            )}

            <Tooltip title="Корзина">
              <IconButton component={Link} to="/cart" size="small">
                <Badge badgeContent={cartCount} color="primary"><ShoppingCart /></Badge>
              </IconButton>
            </Tooltip>

            {isAuthenticated ? (
              <>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>Профиль</MenuItem>
                  <MenuItem component={Link} to="/profile/orders" onClick={() => setAnchorEl(null)}>Мои заказы</MenuItem>
                  {user?.role === 'ADMIN' && (
                    <MenuItem component={Link} to="/admin" onClick={() => setAnchorEl(null)}>Админ-панель</MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>Выйти</MenuItem>
                </Menu>
              </>
            ) : (
              <Button component={Link} to="/auth/login" variant="outlined" size="small" startIcon={<Person />}>
                Войти
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
