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
    private const string HOST = "yahoo-finance15.p.rapidapi.com";

    public YahooFinanceService(IHttpClientFactory httpClientFactory, ILogger<YahooFinanceService> logger, IConfiguration configuration)
    {
      _httpClient = httpClientFactory.CreateClient("YahooFinance");
      _logger = logger;
      _apiKey = configuration["YahooFinance:ApiKey"] ?? Environment.GetEnvironmentVariable("YAHOO_FINANCE_API_KEY");

      // Configure HttpClient for RapidAPI
      _httpClient.DefaultRequestHeaders.Add("x-rapidapi-key", _apiKey);
      _httpClient.DefaultRequestHeaders.Add("x-rapidapi-host", HOST);
    }

    public async Task<object> GetStockData(string symbol)
    {
      try
      {
        var url = $"https://{HOST}/api/v1/markets/stock/history?symbol={symbol}&interval=5m&diffandsplits=false";
        var response = await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode(); // This will throw if status code is not successful

        _logger.LogInformation($"Using Yahoo API: {symbol} - Status Code: {response.StatusCode}");
        var content = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(content);
        return data.RootElement;
      }
      catch (HttpRequestException ex)
      {
        _logger.LogWarning($"Yahoo Finance API request failed for symbol: {symbol}. Status code: {ex.StatusCode}");
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
        var url = $"https://{HOST}/api/v1/markets/stock/modules?ticker={symbol}&module=asset-profile";
        var response = await _httpClient.GetAsync(url);

        response.EnsureSuccessStatusCode();

        _logger.LogInformation($"Using Yahoo API: {symbol} - Status Code: {response.StatusCode}");
        var content = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(content);
        return data.RootElement;
      }
      catch (HttpRequestException ex)
      {
        _logger.LogWarning($"Yahoo Finance API request failed for symbol: {symbol}. Status code: {ex.StatusCode}");
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
