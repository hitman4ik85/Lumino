# Lumino frontend

Frontend частина проєкту Lumino створена на React + Vite.

## Локальний запуск

```bash
npm install
npm run dev
```

Локально Vite запускається на порту `5173`.

## Backend API

За замовчуванням frontend використовує:

```env
VITE_API_BASE_URL=/api
```

Під час локального запуску Vite проксіює `/api`, `/avatars` та `/uploads` на backend:

```text
https://localhost:7181
```

Для іншої адреси backend потрібно створити `.env.local` і вказати:

```env
VITE_API_BASE_URL=https://your-backend-url/api
```

## Build

```bash
npm run build
```

Готові файли збираються у папку `dist`.

## Vercel

Для деплою на Vercel потрібно вказати:

```text
Root Directory: frontend/lumino-app
Build Command: npm run build
Output Directory: dist
```

Файл `vercel.json` потрібен для коректної роботи React Router після оновлення сторінки або прямого переходу на внутрішні маршрути.
