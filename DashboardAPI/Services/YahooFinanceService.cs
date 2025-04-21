using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace DashboardAPI.Services
{
    public class YahooFinanceService : IStockDataService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<YahooFinanceService> _logger;
        private readonly string _apiKey;

        public YahooFinanceService(IHttpClientFactory httpClientFactory, ILogger<YahooFinanceService> logger, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient("YahooFinance");
            _logger = logger;
            _apiKey = configuration["YahooFinance:ApiKey"] ?? Environment.GetEnvironmentVariable("YAHOO_FINANCE_API_KEY");

            // Configure HttpClient for RapidAPI
            _httpClient.DefaultRequestHeaders.Add("X-RapidAPI-Key", _apiKey);
            _httpClient.DefaultRequestHeaders.Add("X-RapidAPI-Host", "yh-finance.p.rapidapi.com");
        }

        public async Task<object> GetStockData(string symbol)
        {
            try
            {
                var url = $"https://yh-finance.p.rapidapi.com/stock/v3/get-historical-data?symbol={symbol}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var data = JsonDocument.Parse(content);
                    return data.RootElement;
                }

                _logger.LogWarning($"Yahoo Finance API returned status code: {response.StatusCode} for symbol: {symbol}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching stock data from Yahoo Finance for symbol: {symbol}");
                return null;
            }
        }

        public async Task<object> GetCompanyOverview(string symbol)
        {
            try
            {
                var url = $"https://yh-finance.p.rapidapi.com/stock/v2/get-summary?symbol={symbol}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var data = JsonDocument.Parse(content);
                    return data.RootElement;
                }

                _logger.LogWarning($"Yahoo Finance API returned status code: {response.StatusCode} for symbol: {symbol}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching company overview from Yahoo Finance for symbol: {symbol}");
                return null;
            }
        }
    }
}