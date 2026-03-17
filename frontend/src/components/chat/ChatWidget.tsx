import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, IconButton, Typography, TextField, Paper, Avatar, Fab, Zoom,
  Chip, Rating, Skeleton, useTheme, alpha, Badge, Tooltip,
} from '@mui/material';
import {
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  ShoppingCart as CartIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface ProductCard {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  shortDescription: string | null;
  rating: number;
  stock: number;
  image: string | null;
  brand: string;
  category: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ProductCard[];
  timestamp: string;
}

const QUICK_ACTIONS = [
  'Покажи популярные товары',
  'Смартфоны до 500000',
  'Посоветуй ноутбук',
  'Что есть из наушников?',
];

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU').format(price) + ' тг';
};

const ChatWidget: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: 'Здравствуйте! Я AI-помощник TechStore. Помогу подобрать технику, сравнить товары или узнать цены. Что вас интересует?',
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [open, messages.length]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/chat/message', {
        message: text.trim(),
        sessionId,
      });

      const response = data.data;
      if (response.sessionId && !sessionId) {
        setSessionId(response.sessionId);
      }

      setMessages(prev => [...prev, response.message]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Произошла ошибка. Попробуйте ещё раз.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleProductClick = (slug: string) => {
    navigate(`/product/${slug}`);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen(prev => !prev);
    if (!open) setUnread(0);
  };

  return (
    <>
      {/* Chat FAB */}
      <Zoom in={!open}>
        <Fab
          onClick={handleToggle}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            width: 60,
            height: 60,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: '#fff',
            '&:hover': {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              transform: 'scale(1.05)',
            },
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.4)',
            transition: 'all 0.3s ease',
          }}
        >
          <Badge badgeContent={unread} color="error">
            <BotIcon sx={{ fontSize: 28 }} />
          </Badge>
        </Fab>
      </Zoom>

      {/* Chat Window */}
      <Zoom in={open}>
        <Paper
          elevation={24}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1300,
            width: { xs: 'calc(100vw - 32px)', sm: 420 },
            height: { xs: 'calc(100vh - 100px)', sm: 600 },
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              color: '#fff',
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            <Avatar sx={{ bgcolor: alpha('#fff', 0.2), width: 40, height: 40 }}>
              <BotIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                AI-Помощник
              </Typography>
              <Typography variant="caption" sx={{ color: alpha('#fff', 0.8) }}>
                TechStore Assistant
              </Typography>
            </Box>
            <IconButton onClick={handleToggle} sx={{ color: '#fff' }} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              bgcolor: '#F8FAFC',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 2,
              },
            }}
          >
            {messages.map((msg, i) => (
              <Box key={i}>
                {/* Message bubble */}
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32, height: 32,
                      bgcolor: msg.role === 'user' ? theme.palette.primary.main : theme.palette.secondary.main,
                      fontSize: 16,
                    }}
                  >
                    {msg.role === 'user' ? <PersonIcon sx={{ fontSize: 18 }} /> : <BotIcon sx={{ fontSize: 18 }} />}
                  </Avatar>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      borderRadius: 3,
                      bgcolor: msg.role === 'user' ? theme.palette.primary.main : '#fff',
                      color: msg.role === 'user' ? '#fff' : theme.palette.text.primary,
                      border: msg.role === 'user' ? 'none' : `1px solid ${theme.palette.divider}`,
                      ...(msg.role === 'user'
                        ? { borderTopRightRadius: 4 }
                        : { borderTopLeftRadius: 4 }),
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                      {msg.content}
                    </Typography>
                  </Paper>
                </Box>

                {/* Product cards */}
                {msg.products && msg.products.length > 0 && (
                  <Box sx={{ mt: 1.5, ml: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {msg.products.map((product) => (
                      <Paper
                        key={product.id}
                        elevation={0}
                        onClick={() => handleProductClick(product.slug)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2.5,
                          border: `1px solid ${theme.palette.divider}`,
                          cursor: 'pointer',
                          display: 'flex',
                          gap: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        {/* Product image */}
                        {product.image && (
                          <Box
                            sx={{
                              width: 56, height: 56, flexShrink: 0,
                              borderRadius: 1.5, overflow: 'hidden',
                              bgcolor: '#F1F5F9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={product.image.startsWith('http') ? product.image : `http://localhost:5000${product.image}`}
                              alt={product.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                        )}

                        {/* Product info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {product.name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <Typography
                              variant="body2"
                              fontWeight={700}
                              color="primary"
                            >
                              {formatPrice(product.price)}
                            </Typography>
                            {product.oldPrice && (
                              <Typography
                                variant="caption"
                                sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                              >
                                {formatPrice(product.oldPrice)}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            {product.rating > 0 && (
                              <Rating value={product.rating} size="small" precision={0.5} readOnly sx={{ fontSize: 14 }} />
                            )}
                            <Chip
                              label={product.stock > 0 ? 'В наличии' : 'Нет'}
                              size="small"
                              color={product.stock > 0 ? 'success' : 'default'}
                              sx={{ height: 18, fontSize: 10 }}
                            />
                          </Box>
                        </Box>

                        {/* View button */}
                        <Tooltip title="Посмотреть">
                          <IconButton size="small" sx={{ alignSelf: 'center', color: theme.palette.primary.main }}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Paper>
                    ))}
                  </Box>
                )}
              </Box>
            ))}

            {/* Loading indicator */}
            {loading && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main, fontSize: 16 }}>
                  <BotIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 3, borderTopLeftRadius: 4, border: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', px: 1 }}>
                    {[0, 1, 2].map(i => (
                      <Box
                        key={i}
                        sx={{
                          width: 8, height: 8,
                          borderRadius: '50%',
                          bgcolor: theme.palette.primary.main,
                          animation: 'bounce 1.4s infinite ease-in-out both',
                          animationDelay: `${i * 0.16}s`,
                          '@keyframes bounce': {
                            '0%, 80%, 100%': { transform: 'scale(0.4)', opacity: 0.4 },
                            '40%': { transform: 'scale(1)', opacity: 1 },
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Paper>
              </Box>
            )}

            <div ref={messagesEndRef} />
          </Box>

          {/* Quick actions (shown when few messages) */}
          {messages.length <= 1 && !loading && (
            <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, flexShrink: 0 }}>
              {QUICK_ACTIONS.map((action) => (
                <Chip
                  key={action}
                  label={action}
                  size="small"
                  variant="outlined"
                  onClick={() => sendMessage(action)}
                  sx={{
                    cursor: 'pointer',
                    fontSize: 11,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Input */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              gap: 1,
              bgcolor: '#fff',
              flexShrink: 0,
            }}
          >
            <TextField
              inputRef={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение..."
              size="small"
              fullWidth
              disabled={loading}
              autoComplete="off"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: '#F8FAFC',
                },
              }}
              inputProps={{ maxLength: 500 }}
            />
            <IconButton
              type="submit"
              disabled={!input.trim() || loading}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: '#fff',
                width: 40, height: 40,
                '&:hover': { bgcolor: theme.palette.primary.dark },
                '&.Mui-disabled': { bgcolor: alpha(theme.palette.primary.main, 0.3), color: '#fff' },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Paper>
      </Zoom>
    </>
  );
};

export default ChatWidget;
