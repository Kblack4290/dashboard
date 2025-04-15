using DashboardAPI.Data;
using DashboardAPI.Services;
using DashboardAPI.Controllers;
using Microsoft.EntityFrameworkCore;
using DotNetEnv;

// Load environment variables from .env file
Env.Load();

var builder = WebApplication.CreateBuilder(args);

var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
if (string.IsNullOrEmpty(connectionString))
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
}

var apiKey = Environment.GetEnvironmentVariable("ALPHA_VANTAGE_API_KEY")?.Trim('"');

// Add services to the container.
// Configure Entity Framework Core with PostgreSQL
builder.Services.AddDbContext<DashboardContext>(options =>
    options.UseNpgsql(connectionString));

// Register the API key for the background service
builder.Services.AddSingleton<IConfiguration>(provider =>
{
    var config = new ConfigurationBuilder()
        .AddInMemoryCollection(new Dictionary<string, string>
        {
            {"AlphaVantage:ApiKey", apiKey}
        })
        .Build();
    return config;
});

// Register the controller
builder.Services.AddScoped<DashboardController>();

// Configure HttpClient for making API requests
builder.Services.AddHttpClient();
builder.Services.AddHostedService<AlphaVantageSchedulerService>();

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
                "https://your-frontend-app-name.onrender.com",
                "https://dashboard-api.onrender.com"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseCors("AllowAngular");

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
        context.Database.Migrate();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred applying migrations.");
    }
}

app.MapControllers();
app.Run();