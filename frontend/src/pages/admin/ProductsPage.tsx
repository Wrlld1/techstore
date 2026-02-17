import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, Button, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Pagination, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  useTheme, alpha, InputAdornment, Select, MenuItem, FormControl, InputLabel,
  FormControlLabel, Switch, Divider, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Search, CloudUpload, Close, AddCircle, RemoveCircle } from '@mui/icons-material';
import api from '../../services/api';
import { Product, Category, Brand, PaginationMeta } from '../../types';
import toast from 'react-hot-toast';

const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(price) + ' ₸';

interface ProductForm {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  oldPrice: string;
  sku: string;
  stock: string;
  categoryId: string;
  brandId: string;
  isActive: boolean;
  isNew: boolean;
  isFeatured: boolean;
  specifications: { key: string; value: string }[];
}

const emptyForm: ProductForm = {
  name: '', description: '', shortDescription: '', price: '', oldPrice: '',
  sku: '', stock: '', categoryId: '', brandId: '',
  isActive: true, isNew: false, isFeatured: false,
  specifications: [{ key: '', value: '' }],
};

const ProductsPage: React.FC = () => {
  const theme = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Product | null>(null);

  // Image upload
  const [uploadingImages, setUploadingImages] = useState(false);
  const [productImages, setProductImages] = useState<any[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      const res = await api.get(`/products?${params}`);
      setProducts(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchFilters = async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/categories'),
        api.get('/categories'), // brands come from separate endpoint or we extract
      ]);
      setCategories(catRes.data.data);
      // Extract unique brands from products
      const bRes = await api.get('/products?limit=100');
      const allBrands = bRes.data.data
        .map((p: any) => p.brand)
        .filter(Boolean)
        .filter((b: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === b.id) === i);
      setBrands(allBrands);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchFilters(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // ===== OPEN CREATE/EDIT DIALOG =====
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setProductImages([]);
    setDialogOpen(true);
  };

  const openEdit = async (product: Product) => {
    setEditingId(product.id);
    const specs = product.specifications as Record<string, string> | null;
    const specArray = specs
      ? Object.entries(specs).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }];

    setForm({
      name: product.name,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: String(product.price),
      oldPrice: product.oldPrice ? String(product.oldPrice) : '',
      sku: product.sku || '',
      stock: String(product.stock),
      categoryId: product.categoryId ? String(product.categoryId) : '',
      brandId: product.brandId ? String(product.brandId) : '',
      isActive: product.isActive,
      isNew: product.isNew || false,
      isFeatured: product.isFeatured || false,
      specifications: specArray.length > 0 ? specArray : [{ key: '', value: '' }],
    });
    setProductImages(product.images || []);
    setDialogOpen(true);
  };

  // ===== SAVE =====
  const handleSave = async () => {
    if (!form.name || !form.price || !form.sku || !form.categoryId || !form.brandId) {
      toast.error('Заполните обязательные поля: название, цена, SKU, категория, бренд');
      return;
    }

    setSaving(true);
    try {
      const specs: Record<string, string> = {};
      form.specifications.forEach((s) => {
        if (s.key.trim() && s.value.trim()) specs[s.key.trim()] = s.value.trim();
      });

      const body = {
        name: form.name,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        price: parseFloat(form.price),
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : undefined,
        sku: form.sku,
        stock: parseInt(form.stock) || 0,
        categoryId: parseInt(form.categoryId),
        brandId: parseInt(form.brandId),
        isActive: form.isActive,
        isNew: form.isNew,
        isFeatured: form.isFeatured,
        specifications: Object.keys(specs).length > 0 ? specs : undefined,
      };

      if (editingId) {
        await api.put(`/products/${editingId}`, body);
        toast.success('Товар обновлён');
      } else {
        await api.post('/products', body);
        toast.success('Товар создан');
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // ===== IMAGE UPLOAD =====
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingId || !e.target.files?.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(e.target.files).forEach((f) => formData.append('images', f));
      const res = await api.post(`/products/${editingId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProductImages((prev) => [...prev, ...res.data.data]);
      toast.success('Изображения загружены');
    } catch (err) {
      toast.error('Ошибка загрузки');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleImageDelete = async (imageId: number) => {
    if (!editingId) return;
    try {
      await api.delete(`/products/${editingId}/images/${imageId}`);
      setProductImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Изображение удалено');
    } catch (err) {
      toast.error('Ошибка удаления');
    }
  };

  // ===== DELETE PRODUCT =====
  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/products/${deleteDialog.id}`);
      toast.success('Товар удалён');
      setDeleteDialog(null);
      fetchProducts();
    } catch (err) {
      toast.error('Ошибка удаления');
    }
  };

  // ===== SPECS HELPERS =====
  const updateSpec = (index: number, field: 'key' | 'value', val: string) => {
    setForm((prev) => {
      const specs = [...prev.specifications];
      specs[index] = { ...specs[index], [field]: val };
      return { ...prev, specifications: specs };
    });
  };
  const addSpec = () => setForm((prev) => ({ ...prev, specifications: [...prev.specifications, { key: '', value: '' }] }));
  const removeSpec = (i: number) => setForm((prev) => ({ ...prev, specifications: prev.specifications.filter((_, idx) => idx !== i) }));

  // Flatten categories for select
  const flatCategories: { id: number; name: string; depth: number }[] = [];
  const flattenCats = (cats: Category[], depth = 0) => {
    cats.forEach((c) => {
      flatCategories.push({ id: c.id, name: c.name, depth });
      if (c.children) flattenCats(c.children, depth + 1);
    });
  };
  flattenCats(categories);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Управление товарами</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Добавить товар</Button>
      </Box>

      {/* Search */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
          <TextField size="small" placeholder="Поиск товаров..." value={search}
            onChange={(e) => setSearch(e.target.value)} sx={{ flexGrow: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
          <Button type="submit" variant="outlined">Найти</Button>
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Товар</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Категория</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Бренд</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Цена</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Остаток</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Статус</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 1, overflow: 'hidden',
                        bgcolor: alpha(theme.palette.primary.main, 0.05), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {product.images?.[0]?.url ? (
                          <Box component="img" src={`http://localhost:5000${product.images[0].url}`} alt=""
                            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Typography sx={{ fontSize: '1rem', opacity: 0.3 }}>📱</Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={500} sx={{ maxWidth: 200 }} noWrap>{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{product.category?.name}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{product.brand?.name}</Typography></TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>{formatPrice(Number(product.price))}</Typography>
                    {product.oldPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
                        {formatPrice(Number(product.oldPrice))}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={product.stock} size="small" color={product.stock > 0 ? 'success' : 'error'} variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                      {product.isActive && <Chip label="Активен" size="small" color="success" variant="outlined" />}
                      {product.isNew && <Chip label="NEW" size="small" color="primary" />}
                      {product.isFeatured && <Chip label="★" size="small" color="warning" />}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(product)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog(product)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {meta && meta.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={meta.totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      {/* ===== CREATE/EDIT DIALOG ===== */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>{editingId ? 'Редактировать товар' : 'Новый товар'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Basic info */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Основная информация</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Название *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="SKU *" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Остаток на складе" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Категория *</InputLabel>
                <Select value={form.categoryId} label="Категория *" onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  {flatCategories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {'—'.repeat(c.depth)} {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Бренд *</InputLabel>
                <Select value={form.brandId} label="Бренд *" onChange={(e) => setForm({ ...form, brandId: e.target.value })}>
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={String(b.id)}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Price */}
            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Цена</Typography>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Цена (₸) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Старая цена (₸)" type="number" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} size="small"
                helperText="Если указана — покажет скидку" />
            </Grid>

            {/* Description */}
            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Описание</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Краткое описание" value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Полное описание" multiline rows={3} value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" />
            </Grid>

            {/* Flags */}
            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Флаги</Typography>
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
                label="Активен" />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel control={<Switch checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} />}
                label="Новинка" />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel control={<Switch checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />}
                label="Хит продаж" />
            </Grid>

            {/* Specifications */}
            <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>Характеристики</Typography>
                <Button size="small" startIcon={<AddCircle />} onClick={addSpec}>Добавить</Button>
              </Box>
            </Grid>
            {form.specifications.map((spec, i) => (
              <React.Fragment key={i}>
                <Grid item xs={5}>
                  <TextField fullWidth label="Параметр" value={spec.key} onChange={(e) => updateSpec(i, 'key', e.target.value)}
                    size="small" placeholder="Дисплей" />
                </Grid>
                <Grid item xs={5.5}>
                  <TextField fullWidth label="Значение" value={spec.value} onChange={(e) => updateSpec(i, 'value', e.target.value)}
                    size="small" placeholder='6.7" Super Retina XDR' />
                </Grid>
                <Grid item xs={1.5} sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton size="small" color="error" onClick={() => removeSpec(i)} disabled={form.specifications.length <= 1}>
                    <RemoveCircle fontSize="small" />
                  </IconButton>
                </Grid>
              </React.Fragment>
            ))}

            {/* Images (only for edit mode) */}
            {editingId && (
              <>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Изображения</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {productImages.map((img) => (
                      <Box key={img.id} sx={{ position: 'relative', width: 80, height: 80, borderRadius: 1, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                        <Box component="img" src={`http://localhost:5000${img.url}`} alt=""
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small"
                          onClick={() => handleImageDelete(img.id)}
                          sx={{ position: 'absolute', top: 0, right: 0, bgcolor: 'rgba(255,0,0,0.8)', color: '#fff', p: 0.3, '&:hover': { bgcolor: 'red' } }}>
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                        {img.isMain && (
                          <Chip label="Main" size="small" sx={{ position: 'absolute', bottom: 2, left: 2, fontSize: '0.6rem', height: 18 }} color="primary" />
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Button variant="outlined" component="label" startIcon={uploadingImages ? <CircularProgress size={18} /> : <CloudUpload />}
                    disabled={uploadingImages}>
                    {uploadingImages ? 'Загрузка...' : 'Загрузить изображения'}
                    <input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={handleImageUpload} />
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Удалить товар?</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить «{deleteDialog?.name}»?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsPage;
