import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Card, Button, IconButton, Table,
  TableBody, TableRow, TableCell, TableHead, Rating, Breadcrumbs,
  useTheme, alpha,
} from '@mui/material';
import { Delete, ShoppingCart, Compare } from '@mui/icons-material';
import { useAppDispatch } from '../../hooks/useRedux';
import { addToCart } from '../../store/slices/cartSlice';
import { getCompareItems, saveCompareItems, getImageUrl, formatPrice, CompareItem } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ComparePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [items, setItems] = useState<CompareItem[]>(getCompareItems());

  const handleRemove = (id: number) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    saveCompareItems(updated);
    toast.success('Товар убран из сравнения');
  };

  const handleClear = () => { setItems([]); saveCompareItems([]); };

  const allSpecKeys = Array.from(new Set(items.flatMap((item) => Object.keys(item.specifications || {}))));

  if (items.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <Compare sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" fontWeight={600}>Нет товаров для сравнения</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>Добавляйте товары из каталога</Typography>
        <Button component={Link} to="/catalog" variant="contained">В каталог</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Typography component={Link} to="/" variant="body2" sx={{ textDecoration: 'none', color: 'text.secondary' }}>Главная</Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>Сравнение</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Сравнение ({items.length})</Typography>
        <Button color="error" size="small" onClick={handleClear}>Очистить</Button>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: items.length * 250 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 150, border: 'none', fontWeight: 600 }}>Товар</TableCell>
              {items.map((item) => (
                <TableCell key={item.id} align="center" sx={{ border: 'none', minWidth: 200 }}>
                  <Box sx={{ position: 'relative' }}>
                    <IconButton size="small" onClick={() => handleRemove(item.id)} sx={{ position: 'absolute', top: -8, right: -8 }}>
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                    <Box sx={{ height: 140, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => navigate(`/product/${item.slug}`)}>
                      {item.image ? (
                        <Box component="img" src={getImageUrl(item.image)} alt={item.name} sx={{ maxHeight: 120, objectFit: 'contain' }} />
                      ) : <Typography sx={{ fontSize: '3rem', opacity: 0.1 }}>📱</Typography>}
                    </Box>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ border: 'none' }} />
              {items.map((item) => (
                <TableCell key={item.id} align="center" sx={{ border: 'none' }}>
                  <Typography variant="caption" color="text.secondary">{item.brand}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                    onClick={() => navigate(`/product/${item.slug}`)}>{item.name}</Typography>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Цена</TableCell>
              {items.map((item) => (
                <TableCell key={item.id} align="center">
                  <Typography variant="h6" fontWeight={700} color="primary.main">{formatPrice(item.price)}</Typography>
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Рейтинг</TableCell>
              {items.map((item) => (
                <TableCell key={item.id} align="center"><Rating value={item.rating} precision={0.5} size="small" readOnly /></TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {allSpecKeys.map((key) => (
              <TableRow key={key} sx={{ '&:nth-of-type(even)': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>{key}</TableCell>
                {items.map((item) => (
                  <TableCell key={item.id} align="center"><Typography variant="body2">{item.specifications?.[key] || '—'}</Typography></TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow>
              <TableCell sx={{ border: 'none' }} />
              {items.map((item) => (
                <TableCell key={item.id} align="center" sx={{ border: 'none' }}>
                  <Button variant="contained" size="small" startIcon={<ShoppingCart />}
                    onClick={() => {
                      dispatch(addToCart({ productId: item.id, quantity: 1, product: { id: item.id, name: item.name, slug: item.slug, price: item.price, stock: 99, isActive: true, images: item.image ? [{ url: item.image }] : [] } }));
                      toast.success('Добавлено в корзину');
                    }}>В корзину</Button>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Container>
  );
};

export default ComparePage;
