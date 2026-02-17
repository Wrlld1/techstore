import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Card, InputAdornment,
  IconButton, Alert, Divider, useTheme, alpha,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { login, clearError } from '../../store/slices/authSlice';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error } = useAppSelector((s) => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    return () => { dispatch(clearError()); };
  }, [isAuthenticated, navigate, dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" fontWeight={800} color="primary.main" sx={{ mb: 1 }}>TechStore</Typography>
          <Typography variant="h5" fontWeight={600}>Вход в аккаунт</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Введите email и пароль для входа
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} required sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
          />
          <TextField
            fullWidth label="Пароль" type={showPassword ? 'text' : 'password'} value={password}
            onChange={(e) => setPassword(e.target.value)} required sx={{ mb: 3 }}
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
          <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading} sx={{ py: 1.5, mb: 2 }}>
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">или</Typography></Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Нет аккаунта?{' '}
            <Typography component={Link} to="/auth/register" variant="body2" color="primary.main" fontWeight={600}
              sx={{ textDecoration: 'none' }}>
              Зарегистрироваться
            </Typography>
          </Typography>
        </Box>

        {/* Test accounts hint */}
        <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.05), borderRadius: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.2)}` }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>Тестовые аккаунты:</Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Админ: admin@techstore.kz / admin123
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Покупатель: user@techstore.kz / customer123
          </Typography>
        </Box>
      </Card>
    </Container>
  );
};

export default LoginPage;
