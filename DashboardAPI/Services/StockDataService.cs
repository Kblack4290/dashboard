using DashboardAPI.Models;
using System.Threading.Tasks;

namespace DashboardAPI.Services
{

    public interface IStockDataService
    {
        Task<object> GetStockData(string symbol);
        Task<object> GetCompanyOverview(string symbol);
    }

}