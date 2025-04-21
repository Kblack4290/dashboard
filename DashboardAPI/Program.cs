using DashboardAPI.Data;
using DashboardAPI.Services;
using DashboardAPI.Controllers;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System;

var builder = WebApplication.CreateBuilder(args);

// Load .env file in development only - ONCE
if (builder.Environment.IsDevelopment())
{
    DotNetEnv.Env.Load();
}

string connectionString = null;

var envConnectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")?.Trim('"');
if (!string.IsNullOrEmpty(envConnectionString))
{
    connectionString = envConnectionString;
    Console.WriteLine("Using DB_CONNECTION_STRING environment variable");
}

if (string.IsNullOrEmpty(connectionString))
{
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        connectionString = databaseUrl;
        Console.WriteLine("Using DATABASE_URL environment variable");
    }
}

if (string.IsNullOrEmpty(connectionString))
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString))
    {
        Console.WriteLine("Using ConnectionStrings:DefaultConnection from configuration");
    }
}

// Log warning if still empty
if (string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("WARNING: Database connection string is missing!");
}
else
{
    // Log the connection string type (not the actual string for security)
    Console.WriteLine($"Connection string format: {(connectionString.StartsWith("postgresql://") ? "URL" : "Key-Value")}");
}

// Get API Keys from environment variables or configuration
var alphaVantageApiKey = Environment.GetEnvironmentVariable("ALPHA_VANTAGE_API_KEY")?.Trim('"');
if (string.IsNullOrEmpty(alphaVantageApiKey))
{
    alphaVantageApiKey = builder.Configuration["AlphaVantage:ApiKey"];
}

var yahooFinanceApiKey = Environment.GetEnvironmentVariable("YAHOO_FINANCE_API_KEY")?.Trim('"');
if (string.IsNullOrEmpty(yahooFinanceApiKey))
{
    yahooFinanceApiKey = builder.Configuration["YahooFinance:ApiKey"];
}

// Configure Entity Framework Core with PostgreSQL
if (!string.IsNullOrEmpty(connectionString))
{
    builder.Services.AddDbContext<DashboardContext>(options =>
    {
        // Handle both connection string formats
        options.UseNpgsql(connectionString);
    });
}

// cors policy to allow requests from Angular frontend
// This policy allows requests from the specified origins, methods, and headers
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policyBuilder =>
    {
        policyBuilder
            .WithOrigins(
                "http://localhost:4200",
                "https://localhost:4200",
                "http://localhost:5000",
                "https://localhost:5001",
                "https://dashboard-app-x7u6.onrender.com",
                "https://dashboard-api.onrender.com",
                "https://dashboard-api-tbsx.onrender.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .WithExposedHeaders("Content-Disposition")
            .SetIsOriginAllowedToAllowWildcardSubdomains();
    });
});

// Register the API keys for the services
builder.Services.AddSingleton<IConfiguration>(provider =>
{
    var config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string>
        {
            {"AlphaVantage:ApiKey", alphaVantageApiKey},
            {"YahooFinance:ApiKey", yahooFinanceApiKey}
        })
        .Build();
    return config;
});

// Register the controller
builder.Services.AddScoped<DashboardController>();

// Configure HttpClient for making API requests
builder.Services.AddHttpClient();

// Register our new stock data services with the fallback pattern
builder.Services.AddScoped<YahooFinanceService>();
builder.Services.AddScoped<AlphaVantageService>();
builder.Services.AddScoped<IStockDataService, FallbackStockDataService>();

// Register scheduler service
builder.Services.AddHostedService<AlphaVantageSchedulerService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("AllowAngular");

// Add these standard middleware components
app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<DashboardContext>();
        if (context.Database.CanConnect())
        {
            context.Database.Migrate();
        }
        else
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogError("Cannot connect to database with provided connection string.");
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "!An error occurred applying migrations. Error: {Message}", ex.Message);
    }
}

app.MapGet("/api/diagnostics", () => new
{
    DatabaseConfigured = !string.IsNullOrEmpty(connectionString),
    ConnectionStringFormat = connectionString?.StartsWith("postgresql://") == true ? "URL" : "Key-Value",
    AlphaVantageApiKeyConfigured = !string.IsNullOrEmpty(alphaVantageApiKey),
    YahooFinanceApiKeyConfigured = !string.IsNullOrEmpty(yahooFinanceApiKey),
    Environment = app.Environment.EnvironmentName
});

app.MapControllers();
app.Run();