# Lumino deployment guide

Цей файл описує покрокову підготовку Lumino до онлайн-демонстрації дипломного проєкту.

## Рекомендований варіант для демонстрації

```text
Frontend: Vercel
Backend: Azure App Service
Database: Azure SQL Database
```

Такий варіант найкраще підходить для поточної структури проєкту, тому що frontend уже створений на React + Vite, а backend використовує ASP.NET Core .NET 8 та SQL Server.

## Важливо про секретні ключі

Секретні значення не потрібно записувати в `appsettings.json`, `.env.example`, README або будь-який файл репозиторію.

Їх потрібно додавати тільки в:

```text
Azure App Service -> Environment variables / Application settings
Vercel -> Project Settings -> Environment Variables
локально -> dotnet user-secrets або .env.local
```

## 1. Перевірка перед деплоєм

### Backend

```bash
cd backend
dotnet restore ./Lumino.sln
dotnet build ./Lumino.sln -c Release
dotnet test ./Lumino.Tests/Lumino.Tests.csproj -c Release
```

### Frontend

```bash
cd frontend/lumino-app
npm ci
npm run build
```

Якщо обидві частини збираються без помилок, можна переходити до онлайн-деплою.

## 2. Azure SQL Database

Створити Azure SQL Database для backend.

Рекомендовані назви для демонстрації:

```text
Resource Group: lumino-rg
SQL Server: lumino-sql-server
Database: lumino-db
```

Після створення бази потрібно скопіювати connection string для `.NET / SQLClient`.

У connection string потрібно замінити:

```text
{your_username}
{your_password}
```

на логін і пароль SQL Server, які були створені в Azure.

Connection string потім вставляється в Azure App Service у змінну:

```text
ConnectionStrings__DefaultConnection
```

## 3. Backend на Azure App Service

Backend потрібно деплоїти з проєкту:

```text
backend/Lumino.API/Lumino.API.csproj
```

Рекомендовані налаштування Azure App Service:

```text
Runtime stack: .NET 8
Operating System: Windows
Pricing plan: Free F1 або інший доступний безкоштовний/дешевий план
```

У Azure App Service потрібно додати такі Application settings:

```text
ASPNETCORE_ENVIRONMENT=Production

ConnectionStrings__DefaultConnection=your-azure-sql-connection-string

Jwt__Key=your-jwt-key
Jwt__Issuer=Lumino.Api
Jwt__Audience=Lumino.Client
Jwt__ExpiresMinutes=60

Email__Host=smtp.gmail.com
Email__Port=587
Email__Username=your-email@gmail.com
Email__Password=your-email-app-password
Email__EnableSsl=true
Email__FromEmail=your-email@gmail.com
Email__FromName=Lumino
Email__FrontendBaseUrl=https://your-frontend-url.vercel.app

OAuth__Google__ClientId=your-google-client-id.apps.googleusercontent.com

Cors__AllowedOrigins__0=https://your-frontend-url.vercel.app

Swagger__Enabled=true
Seed__RunOnStartup=true
```

### Пояснення важливих налаштувань

`Cors__AllowedOrigins__0` — це frontend-домен без `/` у кінці.

Правильно:

```text
https://your-frontend-url.vercel.app
```

Неправильно:

```text
https://your-frontend-url.vercel.app/
```

`Email__FrontendBaseUrl` використовується для посилань підтвердження пошти та відновлення пароля.

`Seed__RunOnStartup=true` потрібен для першого запуску demo-бази, щоб застосувалися міграції та додались початкові дані.

Після успішного першого запуску backend і перевірки, що база заповнена, краще змінити:

```text
Seed__RunOnStartup=false
```

`Swagger__Enabled=true` зручно залишити для захисту, щоб можна було показати API. Після захисту краще змінити на `false`.

## 4. Frontend на Vercel

У Vercel потрібно імпортувати GitHub repository та вибрати frontend-папку.

Налаштування:

```text
Root Directory: frontend/lumino-app
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm ci
```

Environment Variables для Vercel:

```text
VITE_API_BASE_URL=https://your-backend-url.azurewebsites.net/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

Після зміни environment variables у Vercel потрібно зробити redeploy frontend.

## 5. Google OAuth

У Google Cloud Console для OAuth Client потрібно додати frontend-домени.

Authorized JavaScript origins:

```text
http://localhost:5173
https://your-frontend-url.vercel.app
```

Для поточної реалізації Google login використовується Google Identity Services на frontend, тому головне — щоб frontend-домен був доданий у дозволені JavaScript origins.

## 6. Перевірка після деплою

Після деплою перевірити в такому порядку:

1. Відкрити backend URL.
2. Відкрити Swagger:

```text
https://your-backend-url.azurewebsites.net/swagger
```

3. Відкрити frontend URL.
4. Перевірити, що frontend не має помилок CORS у DevTools Console.
5. Зареєструвати нового користувача.
6. Перевірити лист підтвердження пошти.
7. Підтвердити пошту.
8. Увійти в акаунт.
9. Перевірити головну сторінку, курси, уроки, сцени, словник, профіль і досягнення.
10. Увійти як admin і перевірити адмін-панель.

## 7. Типові проблеми

### Frontend не бачить backend

Перевірити:

```text
VITE_API_BASE_URL
Cors__AllowedOrigins__0
```

Frontend URL у CORS має бути без `/` у кінці.

### Не приходить лист підтвердження пошти

Перевірити:

```text
Email__Username
Email__Password
Email__FromEmail
Email__FrontendBaseUrl
```

Для Gmail потрібен саме App Password, а не звичайний пароль від пошти.

### Після деплою немає курсів/адміна/демо-даних

Перевірити:

```text
Seed__RunOnStartup=true
ConnectionStrings__DefaultConnection
```

Після першого успішного запуску можна поставити `Seed__RunOnStartup=false`.

### Google login не працює

Перевірити:

```text
VITE_GOOGLE_CLIENT_ID
OAuth__Google__ClientId
Authorized JavaScript origins у Google Cloud Console
```

## 8. Що краще зробити після захисту

Після демонстрації бажано:

```text
Swagger__Enabled=false
Seed__RunOnStartup=false
```

Також потрібно зберігати секрети тільки у сервісах деплою, а не у файлах репозиторію.
