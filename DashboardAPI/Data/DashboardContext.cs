// using Microsoft.EntityFrameworkCore;
// using DashboardAPI.Models;

// namespace DashboardAPI.Data
// {
//     // This class represents the database context for the dashboard application
//     // It inherits from DbContext and is used to interact with the database
//     public class DashboardContext : DbContext
//     {
//         public DashboardContext(DbContextOptions<DashboardContext> options) : base(options)
//         {
//         }

//         public DbSet<DashboardModel> DashboardItems { get; set; }
//         public DbSet<StockData> StockData { get; set; }
//         public DbSet<WatchlistItem> WatchlistItems { get; set; }
//         public DbSet<CompanyOverview> CompanyOverviews { get; set; }

//         protected override void OnModelCreating(ModelBuilder modelBuilder)
//         {
//             // Configure StockData entity
//             modelBuilder.Entity<StockData>(entity =>
//             {
//                 entity.ToTable("StockData");
//                 entity.HasKey(e => e.Id);
//                 entity.Property(e => e.Symbol).IsRequired();
//                 entity.Property(e => e.Date).IsRequired();

//                 entity.HasIndex(e => new { e.Symbol, e.Date });
//             });

//             // Configure WatchlistItem entity
//             modelBuilder.Entity<WatchlistItem>(entity =>
//             {
//                 entity.ToTable("WatchlistItems");
//                 entity.HasKey(e => e.Id);
//                 entity.Property(e => e.Symbol).IsRequired();
//                 entity.Property(e => e.Name).IsRequired();
//                 entity.Property(e => e.DateAdded).IsRequired();
//             });

//             // Configure CompanyOverview entity
//             modelBuilder.Entity<CompanyOverview>(entity =>
//             {
//                 entity.ToTable("CompanyOverviews");
//                 entity.HasKey(e => e.Id);
//                 entity.Property(e => e.Symbol).IsRequired().HasMaxLength(10);
//                 entity.Property(e => e.Name).HasMaxLength(100);
//                 entity.Property(e => e.Sector).HasMaxLength(50);
//                 entity.Property(e => e.Industry).HasMaxLength(100);

//                 // Create a unique index on Symbol to ensure we don't have duplicate entries
//                 entity.HasIndex(e => e.Symbol).IsUnique();
//             });
//         }
//     }
// }