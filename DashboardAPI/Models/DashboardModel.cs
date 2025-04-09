namespace DashboardAPI.Models
{
    // This class represents a dashboard item in the application
    public class DashboardModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    // This class represents stock data for a specific ticker
    // It includes properties for the stock symbol, date, open, high, low, close prices, and volume
    public class StockData
    {
        public int Id { get; set; }
        public string Symbol { get; set; }
        public string Date { get; set; }
        public string Open { get; set; }
        public string High { get; set; }
        public string Low { get; set; }
        public string Close { get; set; }
        public string Volume { get; set; }
    }

    public class WatchlistItem
    {
        public int Id { get; set; }
        public string Symbol { get; set; }
        public string Name { get; set; }
        public string LatestPrice { get; set; }
        public string PreviousClose { get; set; }
        public string DayRange { get; set; }
        public string Volume { get; set; }
        public string ChangePercentage { get; set; }
        public DateTime DateAdded { get; set; }
    }

}