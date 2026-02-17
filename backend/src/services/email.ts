import nodemailer from 'nodemailer';
import { config } from '../config';

// Транспорт
const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

// Проверка подключения при старте
export const verifyEmailConnection = async () => {
  if (!config.smtp.user || config.smtp.user === 'your-email@gmail.com') {
    console.log('⚠️  Email: SMTP не настроен (пропуск)');
    return false;
  }
  try {
    await transporter.verify();
    console.log('✅ Email: SMTP подключён');
    return true;
  } catch (error) {
    console.log('⚠️  Email: SMTP недоступен (письма не будут отправляться)');
    return false;
  }
};

// Базовый HTML-шаблон
const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; color: #333; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1E40AF 0%, #7C3AED 100%); color: #fff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; }
    .header p { margin: 5px 0 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 30px; }
    .body h2 { color: #1E40AF; font-size: 20px; margin: 0 0 15px; }
    .info-box { background: #f0f4ff; border-radius: 8px; padding: 15px 20px; margin: 15px 0; border-left: 4px solid #1E40AF; }
    .info-box .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-box .value { font-size: 18px; font-weight: 700; color: #1E40AF; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    table th { text-align: left; padding: 10px 12px; background: #f8fafc; color: #666; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
    table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    table td.right { text-align: right; }
    .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #e2e8f0; padding-top: 12px; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; }
    .status-pending { background: #FEF3C7; color: #92400E; }
    .status-confirmed { background: #DBEAFE; color: #1E40AF; }
    .status-processing { background: #E0E7FF; color: #3730A3; }
    .status-shipped { background: #CFFAFE; color: #155E75; }
    .status-delivered { background: #D1FAE5; color: #065F46; }
    .status-cancelled { background: #FEE2E2; color: #991B1B; }
    .button { display: inline-block; background: #1E40AF; color: #ffffff !important; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px; }
    .footer { background: #f8fafc; padding: 20px 30px; text-align: center; color: #94a3b8; font-size: 12px; }
    .footer a { color: #1E40AF; text-decoration: none; }
  </style>
</head>
<body>
  <div style="padding: 20px;">
    <div class="container">
      <div class="header">
        <h1>🛒 TechStore</h1>
        <p>Интернет-магазин техники и электроники</p>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>Это автоматическое письмо. Не отвечайте на него.</p>
        <p><a href="${config.clientUrl}">TechStore</a> — техника по лучшим ценам</p>
        <p>📞 +7 (777) 123-45-67 | ✉️ info@techstore.kz</p>
      </div>
    </div>
  </div>
</body>
</html>`;

// Форматирование цены
const formatPrice = (price: number | string) => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('ru-RU').format(num) + ' ₸';
};

// Статусы на русском
const statusLabels: Record<string, { label: string; cssClass: string; description: string }> = {
  PENDING: { label: 'Ожидает обработки', cssClass: 'status-pending', description: 'Ваш заказ получен и ожидает обработки.' },
  CONFIRMED: { label: 'Подтверждён', cssClass: 'status-confirmed', description: 'Заказ подтверждён и передан на сборку.' },
  PROCESSING: { label: 'Собирается', cssClass: 'status-processing', description: 'Мы собираем ваш заказ на складе.' },
  SHIPPED: { label: 'Отправлен', cssClass: 'status-shipped', description: 'Ваш заказ отправлен! Ожидайте доставку.' },
  DELIVERED: { label: 'Доставлен', cssClass: 'status-delivered', description: 'Заказ успешно доставлен. Спасибо за покупку!' },
  CANCELLED: { label: 'Отменён', cssClass: 'status-cancelled', description: 'К сожалению, заказ был отменён.' },
};

// Тип заказа для писем
interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number | string;
    total: number | string;
  }>;
  subtotal: number | string;
  deliveryFee: number | string;
  total: number | string;
  paymentMethod?: string;
}

// ==================== ПИСЬМО: Подтверждение заказа ====================
export const sendOrderConfirmation = async (data: OrderEmailData) => {
  if (!config.smtp.user || config.smtp.user === 'your-email@gmail.com') return;

  const paymentLabel = data.paymentMethod === 'CASH' ? 'Наличными' :
    data.paymentMethod === 'CARD' ? 'Картой при получении' : 'Онлайн';

  const itemsRows = data.items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td class="right">${item.quantity} шт</td>
      <td class="right">${formatPrice(item.price)}</td>
      <td class="right">${formatPrice(item.total)}</td>
    </tr>
  `).join('');

  const content = `
    <h2>Спасибо за заказ, ${data.customerName}! 🎉</h2>
    <p>Ваш заказ успешно оформлен и принят в обработку.</p>

    <div class="info-box">
      <div class="label">Номер заказа</div>
      <div class="value">${data.orderNumber}</div>
    </div>

    <h3 style="margin-top: 25px;">Состав заказа</h3>
    <table>
      <thead>
        <tr>
          <th>Товар</th>
          <th style="text-align:right">Кол-во</th>
          <th style="text-align:right">Цена</th>
          <th style="text-align:right">Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        <tr>
          <td colspan="3" class="right" style="color:#666">Подытог</td>
          <td class="right">${formatPrice(data.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="3" class="right" style="color:#666">Доставка</td>
          <td class="right">${Number(data.deliveryFee) === 0 ? '<span style="color:#059669">Бесплатно</span>' : formatPrice(data.deliveryFee)}</td>
        </tr>
        <tr class="total-row">
          <td colspan="3" class="right">Итого к оплате</td>
          <td class="right" style="color:#1E40AF">${formatPrice(data.total)}</td>
        </tr>
      </tbody>
    </table>

    <p style="color:#666; font-size:14px;">
      <strong>Способ оплаты:</strong> ${paymentLabel}
    </p>

    <p>Мы уведомим вас об изменении статуса заказа по электронной почте.</p>

    <a href="${config.clientUrl}/profile/orders" class="button">Отследить заказ</a>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: data.customerEmail,
      subject: `✅ Заказ ${data.orderNumber} оформлен — TechStore`,
      html: baseTemplate(content),
    });
    console.log(`📧 Email отправлен: заказ ${data.orderNumber} → ${data.customerEmail}`);
  } catch (error) {
    console.error(`❌ Ошибка отправки email (${data.orderNumber}):`, error);
  }
};

// ==================== ПИСЬМО: Обновление статуса ====================
export const sendOrderStatusUpdate = async (data: {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  total: number | string;
}) => {
  if (!config.smtp.user || config.smtp.user === 'your-email@gmail.com') return;

  const statusInfo = statusLabels[data.status] || { label: data.status, cssClass: 'status-pending', description: '' };

  const content = `
    <h2>Обновление статуса заказа</h2>
    <p>Здравствуйте, ${data.customerName}!</p>

    <div class="info-box">
      <div class="label">Заказ</div>
      <div class="value">${data.orderNumber}</div>
    </div>

    <p style="margin: 20px 0;">Статус вашего заказа изменён на:</p>

    <div style="text-align: center; margin: 20px 0;">
      <span class="status-badge ${statusInfo.cssClass}">${statusInfo.label}</span>
    </div>

    <p style="color:#666; text-align: center;">${statusInfo.description}</p>

    <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
      <span style="color: #666; font-size: 13px;">Сумма заказа</span><br>
      <span style="font-size: 22px; font-weight: 700; color: #1E40AF;">${formatPrice(data.total)}</span>
    </div>

    <div style="text-align: center;">
      <a href="${config.clientUrl}/profile/orders" class="button">Подробнее о заказе</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: data.customerEmail,
      subject: `📦 Заказ ${data.orderNumber}: ${statusInfo.label} — TechStore`,
      html: baseTemplate(content),
    });
    console.log(`📧 Email отправлен: статус ${data.status} → ${data.customerEmail}`);
  } catch (error) {
    console.error(`❌ Ошибка отправки email статуса:`, error);
  }
};

// ==================== ПИСЬМО: Регистрация ====================
export const sendWelcomeEmail = async (data: { name: string; email: string }) => {
  if (!config.smtp.user || config.smtp.user === 'your-email@gmail.com') return;

  const content = `
    <h2>Добро пожаловать в TechStore! 🎉</h2>
    <p>Здравствуйте, ${data.name}!</p>
    <p>Спасибо за регистрацию в нашем интернет-магазине. Теперь вам доступны:</p>
    <ul style="color:#555; line-height: 2;">
      <li>Оформление заказов с отслеживанием статуса</li>
      <li>Список избранных товаров</li>
      <li>Сравнение характеристик</li>
      <li>История покупок</li>
      <li>Персональные рекомендации</li>
    </ul>
    <div style="text-align: center;">
      <a href="${config.clientUrl}/catalog" class="button">Перейти в каталог</a>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: data.email,
      subject: '🎉 Добро пожаловать в TechStore!',
      html: baseTemplate(content),
    });
    console.log(`📧 Welcome email → ${data.email}`);
  } catch (error) {
    console.error('❌ Ошибка welcome email:', error);
  }
};

export default transporter;
