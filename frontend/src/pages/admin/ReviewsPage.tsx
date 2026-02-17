import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, Button, Rating, Avatar, Chip, Divider,
  useTheme, alpha,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import api from '../../services/api';
import { Review } from '../../types';
import toast from 'react-hot-toast';

const ReviewsPage: React.FC = () => {
  const theme = useTheme();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/pending');
      setReviews(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleModerate = async (id: number, isApproved: boolean) => {
    try {
      await api.patch(`/reviews/${id}/moderate`, { isApproved });
      toast.success(isApproved ? 'Отзыв одобрен' : 'Отзыв отклонён');
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error('Ошибка');
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Модерация отзывов
        {reviews.length > 0 && (
          <Chip label={reviews.length} size="small" color="warning" sx={{ ml: 1 }} />
        )}
      </Typography>

      {reviews.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={600}>Все отзывы проверены!</Typography>
          <Typography variant="body2" color="text.secondary">Нет отзывов, ожидающих модерации</Typography>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reviews.map((review) => (
            <Card key={review.id} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: 14 }}>
                    {review.user?.firstName?.[0]}{review.user?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {review.user?.firstName} {review.user?.lastName}
                    </Typography>
<Typography variant="caption" color="text.secondary">{(review.user as any)?.email}</Typography>                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Rating value={review.rating} readOnly size="small" />
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                  </Typography>
                </Box>
              </Box>

              {/* Product */}
              <Chip
                label={`Товар: ${review.product?.name || 'ID ' + review.productId}`}
                size="small" variant="outlined" sx={{ mb: 2 }}
              />

              {review.title && (
                <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>{review.title}</Typography>
              )}
              {review.comment && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{review.comment}</Typography>
              )}
              {review.pros && (
                <Typography variant="body2" sx={{ color: 'success.main', mb: 0.5 }}>
                  <strong>Достоинства:</strong> {review.pros}
                </Typography>
              )}
              {review.cons && (
                <Typography variant="body2" sx={{ color: 'error.main', mb: 1 }}>
                  <strong>Недостатки:</strong> {review.cons}
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined" color="error" startIcon={<Cancel />}
                  onClick={() => handleModerate(review.id, false)}
                >
                  Отклонить
                </Button>
                <Button
                  variant="contained" color="success" startIcon={<CheckCircle />}
                  onClick={() => handleModerate(review.id, true)}
                >
                  Одобрить
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ReviewsPage;
