using Lumino.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using System.Text.Json;
using Xunit;

namespace Lumino.Tests;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task Invoke_TimeoutException_ShouldReturnDatabaseUnavailable()
    {
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        RequestDelegate next = _ => throw new TimeoutException("Connection Timeout Expired");

        var middleware = new ExceptionHandlingMiddleware(
            next,
            NullLogger<ExceptionHandlingMiddleware>.Instance,
            new FakeHostEnvironment()
        );

        await middleware.Invoke(context);

        context.Response.Body.Position = 0;
        var body = await new StreamReader(context.Response.Body).ReadToEndAsync();
        var json = JsonSerializer.Deserialize<JsonElement>(body);

        Assert.Equal(StatusCodes.Status503ServiceUnavailable, context.Response.StatusCode);
        Assert.Equal("database_unavailable", json.GetProperty("type").GetString());
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, json.GetProperty("status").GetInt32());
        Assert.Equal("Тимчасово не вдалося підключитися до бази даних. Спробуйте ще раз через кілька секунд.", json.GetProperty("detail").GetString());
    }
}
