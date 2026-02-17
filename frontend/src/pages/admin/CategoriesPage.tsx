import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, useTheme, alpha, Chip, Collapse,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
} from '@mui/material';
import { Add, Edit, Delete, Close, ExpandMore, ExpandLess, Folder, FolderOpen } from '@mui/icons-material';
import api from '../../services/api';
import { Category } from '../../types';
import toast from 'react-hot-toast';

interface CategoryForm {
  name: string;
  description: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const emptyForm: CategoryForm = { name: '', description: '', parentId: '', sortOrder: '0', isActive: true };

const CategoriesPage: React.FC = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Category | null>(null);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
      // Expand all by default
      const exp: Record<number, boolean> = {};
      res.data.data.forEach((c: Category) => { exp[c.id] = true; });
      setExpanded(exp);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = (parentId?: number) => {
    setEditingId(null);
    setForm({ ...emptyForm, parentId: parentId ? String(parentId) : '' });
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      description: cat.description || '',
      parentId: cat.parentId ? String(cat.parentId) : '',
      sortOrder: String(cat.sortOrder || 0),
      isActive: cat.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Введите название'); return; }
    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        description: form.description || undefined,
        parentId: form.parentId ? parseInt(form.parentId) : null,
        sortOrder: parseInt(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) {
        await api.put(`/categories/${editingId}`, body);
        toast.success('Категория обновлена');
      } else {
        await api.post('/categories', body);
        toast.success('Категория создана');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await api.delete(`/categories/${deleteDialog.id}`);
      toast.success('Категория удалена');
      setDeleteDialog(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    }
  };

  const toggleExpand = (id: number) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Render category tree item
  const renderCategory = (cat: Category, depth: number = 0) => (
    <Box key={cat.id}>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, py: 1, px: 2, pl: 2 + depth * 3,
        borderBottom: `1px solid ${theme.palette.divider}`,
        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) },
      }}>
        {/* Expand toggle */}
        {cat.children && cat.children.length > 0 ? (
          <IconButton size="small" onClick={() => toggleExpand(cat.id)}>
            {expanded[cat.id] ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        ) : <Box sx={{ width: 34 }} />}

        {/* Icon */}
        {cat.children && cat.children.length > 0
          ? (expanded[cat.id] ? <FolderOpen fontSize="small" color="primary" /> : <Folder fontSize="small" color="primary" />)
          : <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: alpha(theme.palette.primary.main, 0.1), ml: 0.3 }} />}

        {/* Name */}
        <Typography variant="body2" fontWeight={depth === 0 ? 600 : 400} sx={{ flexGrow: 1 }}>
          {cat.name}
        </Typography>

        {/* Product count */}
        <Chip label={`${cat._count?.products || 0} товаров`} size="small" variant="outlined" sx={{ mr: 1 }} />

        {/* Status */}
        {!cat.isActive && <Chip label="Скрыта" size="small" color="warning" variant="outlined" sx={{ mr: 1 }} />}

        {/* Sort order */}
        <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 30 }}>#{cat.sortOrder}</Typography>

        {/* Actions */}
        {depth === 0 && (
          <Button size="small" startIcon={<Add />} onClick={() => openCreate(cat.id)}
            sx={{ mr: 0.5, fontSize: '0.7rem' }}>Подкатегория</Button>
        )}
        <IconButton size="small" onClick={() => openEdit(cat)}><Edit fontSize="small" /></IconButton>
        <IconButton size="small" color="error" onClick={() => setDeleteDialog(cat)}><Delete fontSize="small" /></IconButton>
      </Box>

      {/* Children */}
      {cat.children && cat.children.length > 0 && (
        <Collapse in={expanded[cat.id]}>
          {cat.children.map((child) => renderCategory(child, depth + 1))}
        </Collapse>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Категории</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => openCreate()}>Добавить категорию</Button>
      </Box>

      <Card>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2, bgcolor: alpha(theme.palette.primary.main, 0.03), borderBottom: `2px solid ${theme.palette.divider}` }}>
          <Box sx={{ width: 34 }} />
          <Box sx={{ width: 24 }} />
          <Typography variant="caption" fontWeight={600} sx={{ flexGrow: 1, ml: 1 }}>НАЗВАНИЕ</Typography>
          <Typography variant="caption" fontWeight={600} sx={{ mr: 1, minWidth: 80, textAlign: 'center' }}>ТОВАРЫ</Typography>
          <Typography variant="caption" fontWeight={600} sx={{ mr: 1, minWidth: 30 }}>№</Typography>
          <Box sx={{ minWidth: 180 }} />
        </Box>
        {categories.map((cat) => renderCategory(cat))}
        {categories.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Категорий нет</Typography>
          </Box>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>{editingId ? 'Редактировать' : 'Новая категория'}</Typography>
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
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Родительская категория</InputLabel>
                <Select value={form.parentId} label="Родительская категория" onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                  <MenuItem value="">Нет (корневая)</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)} disabled={c.id === editingId}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth label="Порядок" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={3}>
              <FormControlLabel control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Активна" />
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
          <Typography>Это действие необратимо. Все подкатегории также будут удалены.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Отмена</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;
