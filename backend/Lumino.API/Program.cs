using Lumino.Api.Application.Interfaces;
using Lumino.Api.Application.Services;
using Lumino.Api.Application.Validators;
using Lumino.Api.Data;
using Lumino.Api.Middleware;
using Lumino.Api.Utils;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;
using System.IO;
using System.Text;

namespace Lumino.Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers()
                .ConfigureApiBehaviorOptions(options =>
                {
                    options.InvalidModelStateResponseFactory = context =>
                    {
                        var errors = context.ModelState
                            .Where(x => x.Value != null && x.Value.Errors.Count > 0)
                            .ToDictionary(
                                x => x.Key,
                                x => x.Value!.Errors
                                    .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Invalid value" : e.ErrorMessage)
                                    .ToArray()
                            );

                        var traceId = System.Diagnostics.Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;

                        var payload = new
                        {
                            type = "bad_request",
                            title = "Bad Request",
                            status = StatusCodes.Status400BadRequest,
                            detail = "Validation failed.",
                            instance = context.HttpContext.Request.Path.Value ?? "",
                            traceId = traceId,
                            errors = errors
                        };

                        return new BadRequestObjectResult(payload)
                        {
                            ContentTypes = { "application/problem+json" }
                        };
                    };
                });

            // CORS (Frontend)
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins(
                        "http://localhost:5173",
                        "https://localhost:5173",
                        "http://localhost:5174",
                        "https://localhost:5174"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
                });
            });

            var jwtSettings = builder.Configuration.GetSection("Jwt");

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidAudience = jwtSettings["Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings["Key"]!)
                    ),
                    ClockSkew = TimeSpan.Zero
                };
            });

            builder.Services.AddAuthorization();

            builder.Services.AddDbContext<LuminoDbContext>(options =>
            {
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection")
                );
            });

            // конфіг навчання
            builder.Services.Configure<LearningSettings>(
                builder.Configuration.GetSection("Learning")
            );

            // конфіг демо (уроки без авторизації)
            builder.Services.Configure<DemoSettings>(
                builder.Configuration.GetSection("Demo")
            );

            // конфіг email (forgot/reset password)
            builder.Services.Configure<EmailSettings>(
                builder.Configuration.GetSection("Email")
            );

            builder.Services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
            builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();

            builder.Services.AddScoped<IRegisterRequestValidator, RegisterRequestValidator>();
            builder.Services.AddScoped<ILoginRequestValidator, LoginRequestValidator>();
            builder.Services.AddScoped<IChangePasswordRequestValidator, ChangePasswordRequestValidator>();
            builder.Services.AddScoped<IDeleteAccountRequestValidator, DeleteAccountRequestValidator>();
            builder.Services.AddScoped<IForgotPasswordRequestValidator, ForgotPasswordRequestValidator>();
            builder.Services.AddScoped<IResetPasswordRequestValidator, ResetPasswordRequestValidator>();
            builder.Services.AddScoped<IVerifyEmailRequestValidator, VerifyEmailRequestValidator>();
            builder.Services.AddScoped<IResendVerificationRequestValidator, ResendVerificationRequestValidator>();
            builder.Services.AddScoped<ICourseStructureValidator, CourseStructureValidator>();
            builder.Services.AddScoped<IUpdateProfileRequestValidator, UpdateProfileRequestValidator>();
            builder.Services.AddScoped<ISubmitLessonRequestValidator, SubmitLessonRequestValidator>();
            builder.Services.AddScoped<ISubmitSceneRequestValidator, SubmitSceneRequestValidator>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            if (builder.Environment.IsEnvironment("Testing"))
            {
                builder.Services.AddSingleton<IOpenIdTokenValidator, TestingOpenIdTokenValidator>();
            }
            else
            {
                builder.Services.AddSingleton<IOpenIdTokenValidator, OpenIdTokenValidator>();
            }

            if (builder.Environment.IsEnvironment("Testing"))
            {
                builder.Services.AddSingleton<IEmailSender, NoOpEmailSender>();
            }
            else
            {
                builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
            }
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IUserAccountService, UserAccountService>();
            builder.Services.AddScoped<IUserEconomyService, UserEconomyService>();
            builder.Services.AddScoped<IUserExternalLoginService, UserExternalLoginService>();
            builder.Services.AddScoped<IOnboardingService, OnboardingService>();
            builder.Services.AddScoped<ICourseService, CourseService>();
            builder.Services.AddScoped<IAdminCourseService, AdminCourseService>();
            builder.Services.AddScoped<ITopicService, TopicService>();
            builder.Services.AddScoped<IAdminTopicService, AdminTopicService>();
            builder.Services.AddScoped<ILessonService, LessonService>();
            builder.Services.AddScoped<IAdminLessonService, AdminLessonService>();
            builder.Services.AddScoped<IExerciseService, ExerciseService>();
            builder.Services.AddScoped<IDemoLessonService, DemoLessonService>();
            builder.Services.AddScoped<IAdminExerciseService, AdminExerciseService>();
            builder.Services.AddScoped<ILessonResultService, LessonResultService>();
            builder.Services.AddScoped<ILessonMistakesService, LessonMistakesService>();
            builder.Services.AddScoped<IProgressService, ProgressService>();
            builder.Services.AddScoped<IProfileService, ProfileService>();
            builder.Services.AddScoped<ICourseProgressService, CourseProgressService>();
            builder.Services.AddScoped<ICourseCompletionService, CourseCompletionService>();
            builder.Services.AddScoped<IAchievementService, AchievementService>();
            builder.Services.AddScoped<IAchievementQueryService, AchievementQueryService>();
            builder.Services.AddScoped<IAdminAchievementService, AdminAchievementService>();
            builder.Services.AddScoped<ILessonResultQueryService, LessonResultQueryService>();
            builder.Services.AddScoped<IVocabularyService, VocabularyService>();
            builder.Services.AddScoped<IAdminVocabularyService, AdminVocabularyService>();
            builder.Services.AddScoped<ISceneService, SceneService>();
            builder.Services.AddScoped<IAdminSceneService, AdminSceneService>();
            builder.Services.AddScoped<IMediaService, MediaService>();
            builder.Services.AddScoped<IRefreshTokenCleanupService, RefreshTokenCleanupService>();
            builder.Services.AddHostedService<RefreshTokenCleanupHostedService>();
            builder.Services.AddScoped<IAdminUserService, AdminUserService>();
            builder.Services.AddScoped<INextActivityService, NextActivityService>();
            builder.Services.AddScoped<ILearningPathService, LearningPathService>();
            builder.Services.AddScoped<IStreakService, StreakService>();

            // Swagger
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Enter JWT token like: Bearer {your token}"
                });

                options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });
            });

            var app = builder.Build();

            // Configure the HTTP request pipeline
            if (app.Environment.IsDevelopment())
            {
                LuminoSeeder.Seed(app);

                app.UseSwagger();
                app.UseSwaggerUI();
            }

            if (!app.Environment.IsEnvironment("Testing"))
            {
                app.UseHttpsRedirection();
            }

            EnsureUploadsFolders(app);
            SyncLessonUploads(app);

            app.UseStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = context =>
                {
                    var requestPath = context.Context.Request.Path.Value ?? string.Empty;

                    if (!requestPath.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)
                        && !requestPath.StartsWith("/avatars/", StringComparison.OrdinalIgnoreCase))
                    {
                        return;
                    }

                    context.Context.Response.Headers[HeaderNames.CacheControl] = "public,max-age=604800,stale-while-revalidate=86400";
                    context.Context.Response.Headers[HeaderNames.Vary] = "Accept-Encoding";
                }
            });

            app.UseCors("AllowFrontend");

            app.UseMiddleware<ExceptionHandlingMiddleware>();

            app.UseAuthentication();

            app.UseMiddleware<EnsureTestUserMiddleware>();

            app.UseMiddleware<BlockedUserMiddleware>();
            app.UseAuthorization();

            // Єдиний формат помилок для 401/403 (і тих випадків, де не кидаються винятки)
            app.UseStatusCodePages(async statusCodeContext =>
            {
                var http = statusCodeContext.HttpContext;

                if (http.Response.HasStarted)
                {
                    return;
                }

                if (http.Response.StatusCode != StatusCodes.Status401Unauthorized
                    && http.Response.StatusCode != StatusCodes.Status403Forbidden)
                {
                    return;
                }

                // Якщо хтось вже записав тіло відповіді - не перезаписуємо
                if (http.Response.ContentLength.HasValue && http.Response.ContentLength.Value > 0)
                {
                    return;
                }

                var traceId = System.Diagnostics.Activity.Current?.Id ?? http.TraceIdentifier;

                var type = http.Response.StatusCode == StatusCodes.Status401Unauthorized ? "unauthorized" : "forbidden";
                var title = http.Response.StatusCode == StatusCodes.Status401Unauthorized ? "Unauthorized" : "Forbidden";

                var payload = new
                {
                    type = type,
                    title = title,
                    status = http.Response.StatusCode,
                    detail = title,
                    instance = http.Request.Path.Value ?? "",
                    traceId = traceId
                };

                http.Response.ContentType = "application/problem+json; charset=utf-8";

                var json = System.Text.Json.JsonSerializer.Serialize(payload, new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                });

                await http.Response.WriteAsync(json);
            });

            app.MapControllers();
            app.Run();
        }

        private static void EnsureUploadsFolders(WebApplication app)
        {
            var webRoot = GetWebRootPath(app);

            Directory.CreateDirectory(Path.Combine(webRoot, "uploads"));
            Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "achievements"));
            Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "lessons"));
        }

        private static void SyncLessonUploads(WebApplication app)
        {
            var targetLessonsPath = Path.Combine(GetWebRootPath(app), "uploads", "lessons");
            Directory.CreateDirectory(targetLessonsPath);

            var candidateRoots = new[]
            {
                app.Environment.WebRootPath,
                !string.IsNullOrWhiteSpace(app.Environment.ContentRootPath)
                    ? Path.Combine(app.Environment.ContentRootPath, "wwwroot")
                    : null,
                Path.Combine(AppContext.BaseDirectory, "wwwroot"),
                Path.Combine(Directory.GetCurrentDirectory(), "wwwroot")
            }
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => Path.GetFullPath(x!))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

            foreach (var root in candidateRoots)
            {
                var sourceLessonsPath = Path.Combine(root, "uploads", "lessons");

                if (!Directory.Exists(sourceLessonsPath)
                    || PathsEqual(sourceLessonsPath, targetLessonsPath))
                {
                    continue;
                }

                foreach (var sourceFilePath in Directory.GetFiles(sourceLessonsPath))
                {
                    var targetFilePath = Path.Combine(targetLessonsPath, Path.GetFileName(sourceFilePath));

                    if (!File.Exists(targetFilePath))
                    {
                        File.Copy(sourceFilePath, targetFilePath, overwrite: false);
                        continue;
                    }

                    var sourceInfo = new FileInfo(sourceFilePath);
                    var targetInfo = new FileInfo(targetFilePath);

                    if (sourceInfo.Length != targetInfo.Length)
                    {
                        File.Copy(sourceFilePath, targetFilePath, overwrite: true);
                    }
                }
            }
        }

        private static string GetWebRootPath(WebApplication app)
        {
            if (!string.IsNullOrWhiteSpace(app.Environment.WebRootPath))
            {
                return app.Environment.WebRootPath;
            }

            if (!string.IsNullOrWhiteSpace(app.Environment.ContentRootPath))
            {
                return Path.Combine(app.Environment.ContentRootPath, "wwwroot");
            }

            return Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        }

        private static bool PathsEqual(string left, string right)
        {
            return string.Equals(
                Path.GetFullPath(left).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar),
                Path.GetFullPath(right).TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar),
                StringComparison.OrdinalIgnoreCase
            );
        }

    }
}
