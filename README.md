# TechStore — Интернет-магазин техники и электроники

## Технологический стек

| Уровень | Технологии |
|---------|-----------|
| **Frontend** | React 18, TypeScript, Material UI, Redux Toolkit |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **База данных** | PostgreSQL |
| **Real-time** | Socket.IO |
| **Авторизация** | JWT (access + refresh tokens) |
| **Валидация** | Zod |

## Быстрый старт

### Требования
- Node.js >= 18
- PostgreSQL >= 15
- npm >= 9

### 1. Установка зависимостей
```bash
npm run install:all
```

### 2. Настройка базы данных
```bash
# Создайте БД PostgreSQL
createdb techstore

# Скопируйте и настройте переменные окружения
cp backend/.env.example backend/.env
# Отредактируйте DATABASE_URL в backend/.env

# Применить миграции и заполнить данными
npm run db:setup
```

### 3. Запуск проекта
```bash
# Backend + Frontend одновременно
npm run dev

# Или по отдельности
npm run dev:backend   # http://localhost:5000
npm run dev:frontend  # http://localhost:3000
```

### Тестовые аккаунты
| Роль | Email | Пароль |
|------|-------|--------|
| Администратор | admin@techstore.kz | admin123 |
| Покупатель | user@techstore.kz | customer123 |

## Структура проекта

```
techstore/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma        # Схема БД
│   ├── src/
│   │   ├── config/              # Конфигурация, подключение к БД
│   │   ├── controllers/         # Контроллеры (auth, products, orders...)
│   │   ├── middleware/           # Auth, validation, error handler, upload
│   │   ├── routes/              # Маршруты API
│   │   ├── sockets/             # WebSocket (уведомления)
│   │   ├── utils/               # JWT, валидаторы, хелперы
│   │   └── index.ts             # Точка входа сервера
│   └── uploads/                 # Загруженные изображения
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # React компоненты
│   │   │   ├── layout/          # Header, Footer, MainLayout, AdminLayout
│   │   │   ├── auth/            # ProtectedRoute
│   │   │   └── ...
│   │   ├── pages/               # Страницы приложения
│   │   ├── store/               # Redux store и slices
│   │   ├── services/            # API service (axios)
│   │   ├── hooks/               # Custom hooks
│   │   ├── types/               # TypeScript типы
│   │   ├── styles/              # Тема MUI
│   │   └── App.tsx              # Главный компонент
│   └── package.json
│
└── package.json                 # Корневой (monorepo скрипты)
```

## API Endpoints

### Авторизация
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| POST | `/api/auth/refresh` | Обновление токенов |
| POST | `/api/auth/logout` | Выход |
| GET | `/api/auth/profile` | Профиль текущего пользователя |

### Товары
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/products` | Каталог (фильтры, сортировка, пагинация) |
| GET | `/api/products/search/suggestions` | Автодополнение поиска |
| GET | `/api/products/:slug` | Карточка товара |
| GET | `/api/products/:id/related` | Похожие товары |

### Категории
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/categories` | Дерево категорий |
| GET | `/api/categories/:slug` | Категория по slug |

### Корзина (auth required)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/cart` | Получить корзину |
| POST | `/api/cart` | Добавить товар |
| POST | `/api/cart/sync` | Синхронизация localStorage → БД |
| PUT | `/api/cart/:productId` | Изменить количество |
| DELETE | `/api/cart/:productId` | Удалить товар |

### Заказы (auth required)
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/orders` | Оформить заказ |
| GET | `/api/orders/my` | Мои заказы |
| GET | `/api/orders/:id` | Детали заказа |

### Отзывы
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/reviews/product/:id` | Отзывы о товаре |
| POST | `/api/reviews` | Оставить отзыв (auth) |

### Избранное (auth required)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/favorites` | Список избранного |
| POST | `/api/favorites/toggle` | Добавить/убрать |

### Админ (admin only)
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/admin/dashboard` | Статистика |
| GET | `/api/admin/revenue-chart` | Данные для графика выручки |
| POST | `/api/products` | Создать товар |
| PUT | `/api/products/:id` | Обновить товар |
| DELETE | `/api/products/:id` | Удалить товар |
| GET | `/api/orders` | Все заказы |
| PATCH | `/api/orders/:id/status` | Изменить статус заказа |
| GET | `/api/reviews/pending` | Отзывы на модерации |
| PATCH | `/api/reviews/:id/moderate` | Модерация отзыва |

## Схема БД

Основные таблицы: `users`, `categories`, `brands`, `products`, `product_images`, `reviews`, `orders`, `order_items`, `cart_items`, `favorites`, `addresses`

