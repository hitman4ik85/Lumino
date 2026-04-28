# Lumino

**Lumino** — інтерактивна веб-платформа для вивчення англійської мови (клон Duolingo),
розроблена як дипломний / екзаменаційний проєкт.

## Опис проєкту
Платформа дозволяє користувачу:
- зареєструватися / увійти (JWT)
- підтвердити пошту
- відновити пароль
- увійти або прив'язати Google-акаунт
- проходити навчання: курс → теми → уроки → вправи
- проходити навчальні сцени
- переглядати прогрес і результати уроків
- повторювати помилки уроку (Repeat Mistakes)
- працювати зі словником
- отримувати досягнення
- взаємодіяти з навчальним персонажем Lumi

Адміністратор керує навчальним контентом через **той самий** React-застосунок:
після входу під **Admin** відкривається адмін-панель, під **User** — звичайний навчальний режим.

## Компоненти
- **backend/** — ASP.NET Core Web API (.NET 8), JWT, Swagger, EF Core, SQL Server
- **backend/Lumino.Tests/** — unit, integration та HTTP integration тести backend-логіки
- **frontend/lumino-app/** — React + Vite застосунок для User та Admin режимів
- **docs/** — документація проєкту
- **backend/docs/** — додаткова backend-документація
- **deploy/** — інструкції та файли, пов'язані з деплоєм

## Технології
- Backend: ASP.NET Core Web API (.NET 8)
- Auth: JWT Bearer, email verification, password reset, Google OAuth
- ORM: Entity Framework Core
- DB: SQL Server (Microsoft.EntityFrameworkCore.SqlServer)
- API docs: Swagger (Swashbuckle)
- Tests: xUnit, Microsoft.AspNetCore.Mvc.Testing, EF Core InMemory
- Frontend: React + Vite
- CI: GitHub Actions

## Структура репозиторію
```text
Lumino/
├─ backend/
│  ├─ Lumino.API/
│  ├─ Lumino.Tests/
│  ├─ docs/
│  └─ Lumino.sln
├─ frontend/
│  └─ lumino-app/
├─ docs/
└─ deploy/
```

## Запуск локально

### Backend
1. Встановити .NET 8 SDK.
2. Перейти в папку `backend/`:

```bash
cd backend
```

3. Відновити залежності та зібрати рішення:

```bash
dotnet restore ./Lumino.sln
dotnet build ./Lumino.sln -c Release
```

4. Запустити тести:

```bash
dotnet test ./Lumino.Tests/Lumino.Tests.csproj -c Release
```

5. Запустити API:

```bash
dotnet run --project ./Lumino.API/Lumino.API.csproj
```

> Запуск API залежить від локальних налаштувань `appsettings`, user secrets та connection string.

### Frontend
1. Встановити Node.js 20+.
2. Перейти в папку frontend-застосунку:

```bash
cd frontend/lumino-app
```

3. Встановити залежності та запустити frontend:

```bash
npm install
npm run dev
```

## Швидка перевірка бекенду для захисту

1. **Зібрати backend і прогнати тести**

```bash
cd backend
dotnet build ./Lumino.sln -c Release
dotnet test ./Lumino.Tests/Lumino.Tests.csproj -c Release
```

2. **Запустити API**

```bash
dotnet run --project ./Lumino.API/Lumino.API.csproj
```

3. **Перевірити Swagger**

Відкрити Swagger UI у браузері. URL залежить від порту запуску у вашому середовищі.

4. **Мінімальний сценарій користувача через Swagger**

- зареєструвати користувача;
- підтвердити пошту;
- увійти;
- отримати JWT;
- натиснути **Authorize** у Swagger і вставити токен;
- відкрити курси/уроки;
- отримати вправи;
- відправити результат уроку;
- перевірити прогрес, словник або досягнення.

## CI (GitHub Actions)

- `.github/workflows/backend-ci.yml` — restore, build та tests backend-частини
- `.github/workflows/frontend-ci.yml` — install та build frontend-частини

## Документація

У проєкті вже є:
- `docs/Lumino_TZ.docx` — технічне завдання
- `backend/docs/LearningFlow.md` — опис навчального flow
- `deploy/DEPLOYMENT.md` — покрокова інструкція деплою
- `deploy/azure-app-settings.example.txt` — шаблон Azure App Service settings без секретів
- `deploy/vercel-env.example.txt` — шаблон Vercel environment variables без секретів

## Деплой

Рекомендований варіант для демонстрації дипломного проєкту:
- Frontend: Vercel
- Backend: Azure App Service
- Database: Azure SQL Database

Детальні кроки описані у файлі:

```text
deploy/DEPLOYMENT.md
```

Перед деплоєм секретні значення не потрібно записувати у файли репозиторію. Їх потрібно додавати тільки у GitHub/Vercel/Azure налаштування середовища.

## Автори

Дипломний / екзаменаційний проєкт виконують студенти в рамках навчального процесу.
