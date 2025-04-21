using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Linq;

namespace DashboardAPI.Services
{
    public class AlphaVantageService : IStockDataService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<AlphaVantageService> _logger;
        private readonly string _apiKey;

        public AlphaVantageService(IHttpClientFactory httpClientFactory, ILogger<AlphaVantageService> logger, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient("AlphaVantage");
            _logger = logger;
            _apiKey = configuration["AlphaVantage:ApiKey"] ?? Environment.GetEnvironmentVariable("ALPHA_VANTAGE_API_KEY");
        }

        public async Task<object> GetStockData(string symbol)
        {
            try
            {
                var url = $"https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={_apiKey}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var data = JsonDocument.Parse(content);

                    // Check for rate limit or error messages using a safer approach
                    if (data.RootElement.TryGetProperty("Information", out var info))
                    {
                        _logger.LogWarning($"Alpha Vantage API returned information message: {info.ToString()} for symbol: {symbol}");
                        return null;
                    }

                    if (data.RootElement.TryGetProperty("Error Message", out var errorMsg))
                    {
                        _logger.LogWarning($"Alpha Vantage API returned error message: {errorMsg.ToString()} for symbol: {symbol}");
                        return null;
                    }

                    return data.RootElement;
                }

                _logger.LogWarning($"Alpha Vantage API returned status code: {response.StatusCode} for symbol: {symbol}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching stock data from Alpha Vantage for symbol: {symbol}");
                return null;
            }
        }

        public async Task<object> GetCompanyOverview(string symbol)
        {
            try
            {
                var url = $"https://www.alphavantage.co/query?function=OVERVIEW&symbol={symbol}&apikey={_apiKey}";
                var response = await _httpClient.GetAsync(url);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var data = JsonDocument.Parse(content);

                    // Check if the response is empty (often happens when API limit is exceeded)
                    if (data.RootElement.ValueKind == JsonValueKind.Object && data.RootElement.EnumerateObject().Count() == 0)
                    {
                        _logger.LogWarning($"Alpha Vantage API returned empty response for symbol: {symbol}");
                        return null;
                    }

                    // Check for information message
                    if (data.RootElement.TryGetProperty("Information", out var info))
                    {
                        _logger.LogWarning($"Alpha Vantage API returned information message: {info.ToString()} for symbol: {symbol}");
                        return null;
                    }

                    // Check for error message
                    if (data.RootElement.TryGetProperty("Error Message", out var errorMsg))
                    {
                        _logger.LogWarning($"Alpha Vantage API returned error message: {errorMsg.ToString()} for symbol: {symbol}");
                        return null;
                    }

                    return data.RootElement;
                }

                _logger.LogWarning($"Alpha Vantage API returned status code: {response.StatusCode} for symbol: {symbol}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error fetching company overview from Alpha Vantage for symbol: {symbol}");
                return null;
            }
        }
    }
}