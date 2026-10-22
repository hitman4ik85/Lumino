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
- Hosting: Azure App Service, Azure Static Web Apps, Azure SQL Database
- CI/CD: GitHub Actions
