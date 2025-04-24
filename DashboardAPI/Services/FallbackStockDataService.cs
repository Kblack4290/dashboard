using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace DashboardAPI.Services
{
    public class FallbackStockDataService : IStockDataService
    {
        private readonly YahooFinanceService _yahooService;
        private readonly AlphaVantageService _alphaVantageService;
        private readonly ILogger<FallbackStockDataService> _logger;

        public FallbackStockDataService(
            YahooFinanceService yahooService,
            AlphaVantageService alphaVantageService,
            ILogger<FallbackStockDataService> logger)
        {
            _yahooService = yahooService;
            _alphaVantageService = alphaVantageService;
            _logger = logger;
        }

        public async Task<object> GetStockData(string symbol)
        {
            try
            {
                _logger.LogInformation($"Attempting to fetch stock data from Yahoo Finance for symbol: {symbol}");
                var yahooData = await _yahooService.GetStockData(symbol);

                if (yahooData != null)
                {
                    _logger.LogInformation($"Successfully retrieved stock data from Yahoo Finance for symbol: {symbol}");
                    return yahooData;
                }

                _logger.LogInformation($"Yahoo Finance failed, attempting to fetch from Alpha Vantage for symbol: {symbol}");
                var alphaVantageData = await _alphaVantageService.GetStockData(symbol);

                if (alphaVantageData != null)
                {
                    _logger.LogInformation($"Successfully retrieved stock data from Alpha Vantage for symbol: {symbol}");
                    return alphaVantageData;
                }

                _logger.LogWarning($"Both Yahoo Finance and Alpha Vantage failed to return stock data for symbol: {symbol}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in stock data fallback chain for symbol: {symbol}");
                throw;
            }
        }

        public async Task<object> GetCompanyOverview(string symbol)
        {
            try
            {
                _logger.LogInformation($"Attempting to fetch company overview from Yahoo Finance for symbol: {symbol}");
                var yahooData = await _yahooService.GetCompanyOverview(symbol);

                if (yahooData != null)
                {
                    _logger.LogInformation($"Successfully retrieved company overview from Yahoo Finance for symbol: {symbol}");
                    return yahooData;
                }

                _logger.LogInformation($"Yahoo Finance failed, attempting to fetch from Alpha Vantage for symbol: {symbol}");
                var alphaVantageData = await _alphaVantageService.GetCompanyOverview(symbol);

                if (alphaVantageData != null)
                {
                    _logger.LogInformation($"Successfully retrieved company overview from Alpha Vantage for symbol: {symbol}");
                    return alphaVantageData;
                }

                _logger.LogWarning($"Both Yahoo Finance and Alpha Vantage failed to return company overview for symbol: {symbol}");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in company overview fallback chain for symbol: {symbol}");
                throw;
            }
        }
    }
}