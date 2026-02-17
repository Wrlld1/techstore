import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Button, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, useTheme, alpha,
} from '@mui/material';
import { Add, Edit, Delete, Close } from '@mui/icons-material';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  _count?: { products: number };
}

interface BrandForm {
  name: string;
  description: string;
  logo: string;
}

const emptyForm: BrandForm = { name: '', description: '', logo: '' };

const BrandsPage: React.FC = () => {
  const theme = useTheme();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<BrandForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Brand | null>(null);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await api.get('/brands');
      setBrands(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBrands(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, description: brand.description || '', logo: brand.logo || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Введите название'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name,
        description: form.description || undefined,
        logo: form.logo || undefined,
      };
      if (editingId) {
        await api.put(`/brands/${editingId}`, body);
        toast.success('Бренд обновлён');
      } else {
        await api.post('/brands', body);
        toast.success('Бренд создан');
      }
      setDialogOpen(false);
      fetchBrands();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/brands/${deleteDialog.id}`);
      toast.success('Бренд удалён');
      setDeleteDialog(null);
      fetchBrands();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Бренды</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Добавить бренд</Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Бренд</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Описание</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Товаров</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id} hover>
                  <TableCell>{brand.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', bgcolor: alpha(theme.palette.primary.main, 0.08),
                        fontWeight: 700, fontSize: 14, color: 'primary.main',
                      }}>
                        {brand.name[0]}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>{brand.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{brand.slug}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }} noWrap>
                      {brand.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={brand._count?.products || 0} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" onClick={() => openEdit(brand)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteDialog(brand)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>{editingId ? 'Редактировать бренд' : 'Новый бренд'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField fullWidth label="Название *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Описание" multiline rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="URL логотипа" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} size="small"
                placeholder="https://example.com/logo.png" helperText="Ссылка на изображение логотипа" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Удалить «{deleteDialog?.name}»?</DialogTitle>
        <DialogContent>
          <Typography>Бренд можно удалить только если к нему не привязаны товары.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrandsPage;
