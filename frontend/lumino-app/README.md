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

## Azure Static Web Apps

Для деплою frontend на Azure Static Web Apps потрібно вказати:

```text
App location: frontend/lumino-app
Api location: залишити порожнім
Output location: dist
Build Command: npm run build
Install Command: npm ci
```

Для production потрібно додати frontend environment variables:

```env
VITE_API_BASE_URL=https://your-backend-url.azurewebsites.net/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Для коректної роботи React Router після оновлення сторінки або прямого переходу на внутрішні маршрути потрібно додати файл:

```text
frontend/lumino-app/staticwebapp.config.json
```

Мінімальний зміст файлу:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```
