using Microsoft.EntityFrameworkCore;
using DashboardAPI.Models;

namespace DashboardAPI.Data
{
    // The DashboardContext class inherits from DbContext, which is part of the Repository Pattern.
    // It provides a clean API for accessing and manipulating DashboardModel entities.
    public class DashboardContext : DbContext
    {
        // Constructor that takes DbContextOptions and passes it to the base class constructor.
        // This adheres to the Dependency Inversion Principle (DIP) by depending on abstractions.
        public DashboardContext(DbContextOptions<DashboardContext> options) : base(options)
        {
        }

        // DbSet property representing a collection of DashboardModel entities.
        // This adheres to the Single Responsibility Principle (SRP) by focusing on data access.
        public DbSet<DashboardModel> DashboardItems { get; set; }
    }
}