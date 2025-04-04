namespace DashboardAPI.Models
{
    public class DashboardModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }
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

}