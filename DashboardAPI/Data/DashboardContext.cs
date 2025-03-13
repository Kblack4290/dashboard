using Microsoft.EntityFrameworkCore;
using DashboardAPI.Models;

namespace DashboardAPI.Data
{
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