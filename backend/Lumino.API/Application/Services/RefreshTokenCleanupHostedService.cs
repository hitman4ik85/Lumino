using Lumino.Api.Application.Interfaces;

namespace Lumino.Api.Application.Services
{
    public class RefreshTokenCleanupHostedService : BackgroundService
    {
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RefreshTokenCleanupHostedService> _logger;

        public RefreshTokenCleanupHostedService(
            IServiceScopeFactory serviceScopeFactory,
            IConfiguration configuration,
            ILogger<RefreshTokenCleanupHostedService> logger)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var interval = GetCleanupInterval();

            try
            {
                await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);
            }
            catch (OperationCanceledException)
            {
                return;
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var cleanupService = scope.ServiceProvider.GetRequiredService<IRefreshTokenCleanupService>();
                    var deleted = cleanupService.Cleanup();

                    if (deleted > 0)
                    {
                        _logger.LogInformation("Refresh token cleanup removed {DeletedCount} rows.", deleted);
                    }
                }
                catch (OperationCanceledException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Refresh token cleanup failed.");
                }

                try
                {
                    await Task.Delay(interval, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }

        private TimeSpan GetCleanupInterval()
        {
            var minutesText = _configuration["RefreshToken:AutoCleanupIntervalMinutes"];

            if (!int.TryParse(minutesText, out var minutes))
            {
                minutes = 60;
            }

            if (minutes < 5)
            {
                minutes = 5;
            }

            return TimeSpan.FromMinutes(minutes);
        }
    }
}
