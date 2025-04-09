using Microsoft.AspNetCore.Mvc;
using DashboardAPI.Data;
using DashboardAPI.Models;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace DashboardAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    // This controller handles requests related to stock data from Alpha Vantage
    public class AlphaVantageController : ControllerBase
    {
        private readonly DashboardContext _context;
        private readonly ILogger<AlphaVantageController> _logger;

        public AlphaVantageController(DashboardContext context, ILogger<AlphaVantageController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Getting the latest stock data for all tickers
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestData()
        {
            try
            {
                // Get unique tickers from database
                var tickers = await _context.StockData
                    .Select(s => s.Symbol)
                    .Distinct()
                    .ToListAsync();

                var result = new Dictionary<string, object>();

                foreach (var ticker in tickers)
                {
                    // Get latest data for each ticker
                    var latestData = await _context.StockData
                        .Where(s => s.Symbol == ticker)
                        .OrderByDescending(s => s.Date)
                        .FirstOrDefaultAsync();

                    if (latestData != null)
                    {
                        result[ticker] = latestData;
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest data");
                return BadRequest(new { message = ex.Message });
            }
        }

        // Getting stock data for a specific ticker symbol
        // This endpoint is called by the Alpha Vantage API to get stock data
        // It returns the stock data for the specified symbol in descending order by date
        [HttpGet("{symbol}")]
        public async Task<IActionResult> GetStockData(string symbol)
        {
            try
            {
                var stockData = await _context.StockData
                    .Where(s => s.Symbol == symbol)
                    .OrderByDescending(s => s.Date)
                    .ToListAsync();

                if (stockData == null || !stockData.Any())
                {
                    return NotFound(new { message = $"No stock data found for symbol: {symbol}" });
                }

                return Ok(stockData);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Saving stock data for a specific ticker symbol
        // This endpoint is called by the Alpha Vantage API to save stock data
        // It takes the symbol and the stock data in JSON format as input
        [HttpPost("{symbol}")]
        public async Task<IActionResult> SaveStockData(string symbol, [FromBody] JsonElement data)
        {
            try
            {
                _logger.LogInformation($"Received request to save data for symbol: {symbol}");
                _logger.LogInformation($"Incoming JSON payload: Possible API KEY limit reached");

                if (!data.TryGetProperty("Time Series (Daily)", out var timeSeriesDaily))
                {
                    _logger.LogError("The key 'Time Series (Daily)' was not found in the JSON payload.");
                    return BadRequest(new { message = "Invalid JSON payload. 'Time Series (Daily)' key is missing." });
                }

                foreach (var date in timeSeriesDaily.EnumerateObject())
                {
                    var values = date.Value;

                    var stockData = new StockData
                    {
                        Symbol = symbol,
                        Date = date.Name,
                        Open = values.GetProperty("1. open").GetString(),
                        High = values.GetProperty("2. high").GetString(),
                        Low = values.GetProperty("3. low").GetString(),
                        Close = values.GetProperty("4. close").GetString(),
                        Volume = values.GetProperty("5. volume").GetString()
                    };

                    _context.StockData.Add(stockData);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Stock data saved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving stock data for symbol: {symbol}");
                return BadRequest(new { message = ex.Message });
            }
        }

        // Add a stock to the watchlist
        [HttpPost("watchlist")]
        public async Task<IActionResult> AddToWatchlist([FromBody] WatchlistItem item)
        {
            try
            {
                var existingItem = await _context.WatchlistItems
                    .FirstOrDefaultAsync(w => w.Symbol == item.Symbol);

                if (existingItem != null)
                {
                    return BadRequest(new { message = "Item is already in the watchlist." });
                }

                item.DateAdded = DateTime.UtcNow;
                _context.WatchlistItems.Add(item);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item added to watchlist." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding item to watchlist.");
                return BadRequest(new { message = ex.Message });
            }
        }

        // Remove a stock from the watchlist
        [HttpDelete("watchlist/{symbol}")]
        public async Task<IActionResult> RemoveFromWatchlist(string symbol)
        {
            try
            {
                var item = await _context.WatchlistItems
                    .FirstOrDefaultAsync(w => w.Symbol == symbol);

                if (item == null)
                {
                    return NotFound(new { message = "Item not found in watchlist." });
                }

                _context.WatchlistItems.Remove(item);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Item removed from watchlist." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing item from watchlist.");
                return BadRequest(new { message = ex.Message });
            }
        }

        // Get all watchlist items
        [HttpGet("watchlist")]
        public async Task<IActionResult> GetWatchlist()
        {
            try
            {
                var watchlist = await _context.WatchlistItems.ToListAsync();
                return Ok(watchlist);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving watchlist.");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("fetch/{symbol}")]
        public async Task<IActionResult> FetchStockData(string symbol)
        {
            try
            {
                var apiKey = Environment.GetEnvironmentVariable("ALPHA_VANTAGE_API_KEY");
                if (string.IsNullOrEmpty(apiKey))
                {
                    return BadRequest(new { message = "API key is not configured." });
                }

                var url = $"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={apiKey}";
                using var httpClient = new HttpClient();
                var response = await httpClient.GetStringAsync(url);

                // Parse the response to check for error messages
                var jsonResponse = JsonDocument.Parse(response);
                if (jsonResponse.RootElement.TryGetProperty("Information", out var infoMessage))
                {
                    _logger.LogWarning($"Alpha Vantage API returned an information message: {infoMessage}");
                    return BadRequest(new { message = "API rate limit exceeded or invalid request." });
                }

                if (jsonResponse.RootElement.TryGetProperty("Error Message", out var errorMessage))
                {
                    _logger.LogError($"Alpha Vantage API returned an error: {errorMessage}");
                    return BadRequest(new { message = "Error fetching stock data. Please try again later." });
                }

                return Ok(jsonResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching stock data for symbol: {symbol}");
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}