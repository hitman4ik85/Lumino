using Lumino.Api.Utils;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using System.Collections.Generic;
using Xunit;

namespace Lumino.Tests.Integration.Http;

public class EmailSettingsBindingHttpIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public EmailSettingsBindingHttpIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public void EmailSettings_ShouldBind_FromConfiguration()
    {
        var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                var settings = new Dictionary<string, string?>
                {
                    ["Email:Host"] = "smtp.test.local",
                    ["Email:Port"] = "2525",
                    ["Email:Username"] = "user",
                    ["Email:Password"] = "pass",
                    ["Email:EnableSsl"] = "false",
                    ["Email:FromEmail"] = "noreply@lumino.test",
                    ["Email:FromName"] = "Lumino",
                    ["Email:FrontendBaseUrl"] = "http://localhost:5173"
                };

                config.AddInMemoryCollection(settings);
            });
        });

        using (var scope = factory.Services.CreateScope())
        {
            var emailOptions = scope.ServiceProvider.GetRequiredService<IOptions<EmailSettings>>();

            Assert.NotNull(emailOptions);
            Assert.NotNull(emailOptions.Value);

            Assert.Equal("smtp.test.local", emailOptions.Value.Host);
            Assert.Equal(2525, emailOptions.Value.Port);
            Assert.Equal("user", emailOptions.Value.Username);
            Assert.Equal("pass", emailOptions.Value.Password);
            Assert.False(emailOptions.Value.EnableSsl);
            Assert.Equal("noreply@lumino.test", emailOptions.Value.FromEmail);
            Assert.Equal("Lumino", emailOptions.Value.FromName);
            Assert.Equal("http://localhost:5173", emailOptions.Value.FrontendBaseUrl);
        }
    }
}
