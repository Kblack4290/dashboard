// using DashboardAPI.Models;
// using Microsoft.EntityFrameworkCore;
// using Microsoft.Extensions.Hosting;
// using Microsoft.Extensions.Http;
// using System;
// using System.Collections.Generic;
// using System.Linq.Expressions;
// using System.Net.Http;
// using System.Text.Json;
// using System.Threading;
// using System.Threading.Tasks;
// using DashboardAPI.Controllers;

// namespace DashboardAPI.Services
// {
//     // This service is responsible for fetching stock data from Alpha Vantage API and storing it in the database
//     // It runs as a background service and fetches data every hour
//     public class AlphaVantageSchedulerService : BackgroundService
//     {
//         private readonly IServiceScopeFactory _scopeFactory;
//         private readonly ILogger<AlphaVantageSchedulerService> _logger;
//         private readonly HttpClient _httpClient;
//         private readonly string _apiKey;
//         private readonly List<string> _tickers = new List<string> { "DOW", "SPY", "NDAQ", "GLD", "BTCUSD" };

//         public AlphaVantageSchedulerService(
//             IServiceScopeFactory scopeFactory,
//             ILogger<AlphaVantageSchedulerService> logger,
//             IConfiguration configuration)
//         {
//             _scopeFactory = scopeFactory;
//             _logger = logger;
//             _httpClient = new HttpClient();
//             _apiKey = configuration["AlphaVantage:ApiKey"];
//         }

//         // This method is called when the service starts
//         // It runs the ExecuteAsync method in a loop until the service is stopped
//         protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//         {
//             while (!stoppingToken.IsCancellationRequested)
//             {
//                 _logger.LogInformation("Scheduler service running at: {time}", DateTimeOffset.Now);

//                 try
//                 {
//                     await FetchAndStoreAllTickerData();

//                     // Update watchlist items with latest data
//                     using (var scope = _scopeFactory.CreateScope())
//                     {
//                         var controller = scope.ServiceProvider.GetRequiredService<DashboardController>();
//                         await controller.UpdateWatchlistItems();
//                     }
//                 }
//                 catch (Exception ex)
//                 {
//                     _logger.LogError(ex, "Error occurred while fetching ticker data");
//                 }

//                 // Wait until the next hour
//                 var now = DateTime.UtcNow;
//                 var nextHour = now.AddHours(1).Date.AddHours(now.Hour + 1);
//                 var delay = nextHour - now;

//                 _logger.LogInformation("Next update scheduled for: {time}", nextHour);
//                 await Task.Delay(delay, stoppingToken);
//             }
//         }

//         // getting all ticker data to save to postgresql to minimize the number of requests to Alpha Vantage
//         private async Task FetchAndStoreAllTickerData()
//         {

//             foreach (var ticker in _tickers)
//             {
//                 await FetchAndStoreTickerData(ticker);
//             }

//             using (var scope = _scopeFactory.CreateScope())
//             {
//                 var dbContext = scope.ServiceProvider.GetRequiredService<DashboardContext>();
//                 var watchlistSymbols = await dbContext.WatchlistItems
//                     .Select(w => w.Symbol)
//                     .Distinct()
//                     .ToListAsync();

//                 foreach (var symbol in watchlistSymbols)
//                 {
//                     if (!_tickers.Contains(symbol))
//                     {
//                         await FetchAndStoreTickerData(symbol);
//                     }
//                 }
//             }
//         }

//         private async Task FetchAndStoreTickerData(string ticker)
//         {
//             try
//             {
//                 _logger.LogInformation("Fetching data for {ticker}", ticker);

//                 // Fetch from Alpha Vantage
//                 var url = $"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={ticker}&apikey={_apiKey}";
//                 var response = await _httpClient.GetAsync(url);
//                 response.EnsureSuccessStatusCode();

//                 var content = await response.Content.ReadAsStringAsync();
//                 var data = JsonDocument.Parse(content);

//                 // Check for rate limiting or errors
//                 if (data.RootElement.TryGetProperty("Information", out JsonElement infoElement))
//                 {
//                     string infoMessage = infoElement.GetString();
//                     if (infoMessage != null && infoMessage.Contains("API key") && infoMessage.Contains("rate limit"))
//                     {
//                         _logger.LogWarning("You have reached your API limit for {ticker}", ticker);
//                         return;
//                     }
//                 }

//                 // Store in database
//                 using (var scope = _scopeFactory.CreateScope())
//                 {
//                     var dbContext = scope.ServiceProvider.GetRequiredService<DashboardContext>();
//                     await StoreTickerData(dbContext, ticker, data.RootElement);
//                 }

//                 // Respect Alpha Vantage rate limits
//                 await Task.Delay(TimeSpan.FromSeconds(15));
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error processing ticker {ticker}", ticker);
//             }
//         }

//         // Store the ticker data in the database
//         // This method is called for each ticker in the list
//         private async Task StoreTickerData(DashboardContext context, string symbol, JsonElement data)
//         {
//             try
//             {
//                 // Check if API returned an error message
//                 if (data.TryGetProperty("Error Message", out JsonElement errorElement))
//                 {
//                     _logger.LogWarning("Alpha Vantage returned error: {error} for {symbol}",
//                         errorElement.GetString(), symbol);
//                     return;
//                 }

//                 // Check for rate limiting
//                 if (data.TryGetProperty("Note", out JsonElement noteElement))
//                 {
//                     _logger.LogWarning("Alpha Vantage rate limit reached: {note} for {symbol}",
//                         noteElement.GetString(), symbol);
//                     return;
//                 }

//                 // Check if the expected time series data exists
//                 if (!data.TryGetProperty("Time Series (Daily)", out JsonElement timeSeriesDaily))
//                 {
//                     // Log response to debug
//                     _logger.LogWarning("Response for {symbol} doesn't contain expected data structure. API limit may have been reached.", symbol);
//                     return;
//                 }

//                 var mostRecentDate = timeSeriesDaily.EnumerateObject().FirstOrDefault();

//                 if (mostRecentDate.Value.ValueKind != JsonValueKind.Undefined)
//                 {
//                     var dateStr = mostRecentDate.Name;
//                     var mostRecentData = mostRecentDate.Value;

//                     // Check if we already have this day's data
//                     var existingData = await context.StockData
//                         .FirstOrDefaultAsync(s => s.Symbol == symbol && s.Date == dateStr);

//                     if (existingData == null)
//                     {
//                         // Create new record
//                         var stockData = new StockData
//                         {
//                             Symbol = symbol,
//                             Date = dateStr,
//                             Open = mostRecentData.GetProperty("1. open").GetString(),
//                             High = mostRecentData.GetProperty("2. high").GetString(),
//                             Low = mostRecentData.GetProperty("3. low").GetString(),
//                             Close = mostRecentData.GetProperty("4. close").GetString(),
//                             Volume = mostRecentData.GetProperty("5. volume").GetString()
//                         };

//                         context.StockData.Add(stockData);
//                         await context.SaveChangesAsync();
//                         _logger.LogInformation("Saved new data for {symbol} on {date}", symbol, dateStr);
//                     }
//                     else
//                     {
//                         // Update existing record
//                         existingData.Open = mostRecentData.GetProperty("1. open").GetString();
//                         existingData.High = mostRecentData.GetProperty("2. high").GetString();
//                         existingData.Low = mostRecentData.GetProperty("3. low").GetString();
//                         existingData.Close = mostRecentData.GetProperty("4. close").GetString();
//                         existingData.Volume = mostRecentData.GetProperty("5. volume").GetString();

//                         await context.SaveChangesAsync();
//                         _logger.LogInformation("Updated data for {symbol} on {date}", symbol, dateStr);
//                     }
//                 }
//                 else
//                 {
//                     _logger.LogWarning("No recent data found for {symbol}", symbol);
//                 }
//             }
//             catch (Exception ex)
//             {
//                 _logger.LogError(ex, "Error storing data for {symbol}", symbol);
//                 throw;
//             }
//         }
//     }
// }