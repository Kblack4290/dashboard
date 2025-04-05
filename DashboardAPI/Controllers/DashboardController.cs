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
                var timeSeriesDaily = data.GetProperty("Time Series (Daily)");

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
    }
}