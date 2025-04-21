using Microsoft.AspNetCore.Mvc;
using DashboardAPI.Data;
using DashboardAPI.Models;
using DashboardAPI.Services;
using System.Threading.Tasks;
using System.Net.Http;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace DashboardAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    // This controller handles requests related to stock data from multiple providers
    public class DashboardController : ControllerBase
    {
        private readonly DashboardContext _context;
        private readonly ILogger<DashboardController> _logger;
        private readonly IStockDataService _stockDataService;
        private readonly HttpClient _httpClient;

        public DashboardController(DashboardContext context, ILogger<DashboardController> logger,
                                  IHttpClientFactory httpClientFactory, IStockDataService stockDataService)
        {
            _context = context;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
            _stockDataService = stockDataService;
        }

        // Getting the latest stock data for all tickers
        // This will be refactored to use client-side IndexedDB in the future
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

        // Updated to use our FallbackStockDataService
        [HttpGet("fetch/{symbol}")]
        public async Task<IActionResult> FetchStockData(string symbol)
        {
            try
            {
                _logger.LogInformation($"Fetching stock data for symbol: {symbol} using fallback service");
                var data = await _stockDataService.GetStockData(symbol);

                if (data == null)
                {
                    return BadRequest(new { message = "Could not retrieve stock data. API limits may have been reached." });
                }

                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching stock data for symbol: {symbol}");
                return BadRequest(new { message = "An error occurred while fetching stock data." });
            }
        }

        // Update watchlist items with latest stock data
        public async Task UpdateWatchlistItems()
        {
            try
            {
                // Get all watchlist items
                var watchlistItems = await _context.WatchlistItems.ToListAsync();

                foreach (var item in watchlistItems)
                {
                    // Get latest stock data for this symbol
                    var latestData = await _context.StockData
                        .Where(s => s.Symbol == item.Symbol)
                        .OrderByDescending(s => s.Date)
                        .FirstOrDefaultAsync();

                    // Get previous day's data for comparison
                    var previousData = await _context.StockData
                        .Where(s => s.Symbol == item.Symbol)
                        .OrderByDescending(s => s.Date)
                        .Skip(1)
                        .FirstOrDefaultAsync();

                    if (latestData != null)
                    {
                        // Update the watchlist item
                        item.LatestPrice = latestData.Close;
                        item.PreviousClose = previousData?.Close ?? "N/A";
                        item.DayRange = $"{latestData.Low} - {latestData.High}";
                        item.Volume = latestData.Volume;

                        // Calculate change percentage
                        if (previousData != null)
                        {
                            var open = float.Parse(previousData.Close);
                            var close = float.Parse(latestData.Close);
                            var change = ((close - open) / open) * 100;
                            item.ChangePercentage = change.ToString("0.00");
                        }

                        await _context.SaveChangesAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating watchlist items");
            }
        }

        // Updated to use our FallbackStockDataService
        [HttpGet("company-overview/{symbol}")]
        public async Task<IActionResult> GetCompanyOverview(string symbol)
        {
            try
            {
                _logger.LogInformation($"Fetching company overview for symbol: {symbol} using fallback service");
                var data = await _stockDataService.GetCompanyOverview(symbol);

                if (data == null)
                {
                    return BadRequest(new { message = "Could not retrieve company overview. API limits may have been reached." });
                }

                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching company overview for symbol: {symbol}");
                return BadRequest(new { message = "An error occurred while fetching company overview." });
            }
        }
    }
}