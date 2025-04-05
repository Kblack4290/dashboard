using Microsoft.EntityFrameworkCore;
using DashboardAPI.Models;

namespace DashboardAPI.Data
{
    // This class represents the database context for the dashboard application
    // It inherits from DbContext and is used to interact with the database
    public class DashboardContext : DbContext
    {
        public DashboardContext(DbContextOptions<DashboardContext> options) : base(options)
        {
        }

        public DbSet<DashboardModel> DashboardItems { get; set; }
        public DbSet<StockData> StockData { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StockData>(entity =>
            {
                entity.ToTable("StockData");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Symbol).IsRequired();
                entity.Property(e => e.Date).IsRequired();

                entity.HasIndex(e => new { e.Symbol, e.Date });
            });
        }
    }
}