import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Card, InputAdornment,
  IconButton, Alert, Divider, Grid, useTheme, alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { register, clearError } from '../../store/slices/authSlice';

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setLocalError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setLocalError('Пароли не совпадают');
      return;
    }
    if (form.password.length < 6) {
      setLocalError('Пароль должен быть не менее 6 символов');
      return;
    }
    dispatch(register({
      email: form.email, password: form.password,
      firstName: form.firstName, lastName: form.lastName,
      phone: form.phone || undefined,
    }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mb: 1 }}>TechStore</Typography>
          <Typography variant="h5" fontWeight={600}>Регистрация</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Создайте аккаунт для покупок
          </Typography>
        </Box>

        {(error || localError) && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || localError}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="Имя" value={form.firstName} onChange={handleChange('firstName')} required
                InputProps={{ startAdornment: <InputAdornment position="start"><Person color="action" /></InputAdornment> }} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Фамилия" value={form.lastName} onChange={handleChange('lastName')} required />
            </Grid>
          </Grid>
          <TextField fullWidth label="Email" type="email" value={form.email} onChange={handleChange('email')} required sx={{ mt: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} />
          <TextField fullWidth label="Телефон" value={form.phone} onChange={handleChange('phone')} sx={{ mt: 2 }}
            placeholder="+7 (777) 123-45-67"
            InputProps={{ startAdornment: <InputAdornment position="start"><Phone color="action" /></InputAdornment> }} />
          <TextField
            fullWidth label="Пароль" type={showPassword ? 'text' : 'password'} value={form.password}
            onChange={handleChange('password')} required sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth label="Подтвердите пароль" type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword} onChange={handleChange('confirmPassword')} required sx={{ mt: 2, mb: 3 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment> }}
          />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading} sx={{ py: 1.5, mb: 2 }}>
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">или</Typography></Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Уже есть аккаунт?{' '}
            <Typography component={Link} to="/auth/login" variant="body2" color="primary.main" fontWeight={600}
              sx={{ textDecoration: 'none' }}>
              Войти
            </Typography>
          </Typography>
        </Box>
      </Card>
    </Container>
  );
};

export default RegisterPage;
