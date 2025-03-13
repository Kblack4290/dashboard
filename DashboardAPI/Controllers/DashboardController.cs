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
    public class AlphaVantageController : ControllerBase
    {
        private readonly DashboardContext _context;
        private readonly ILogger<AlphaVantageController> _logger;

        public AlphaVantageController(DashboardContext context, ILogger<AlphaVantageController> logger)
        {
            _context = context;
            _logger = logger;
        }

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