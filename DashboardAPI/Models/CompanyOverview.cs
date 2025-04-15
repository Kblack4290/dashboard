using System;
using System.ComponentModel.DataAnnotations;

namespace DashboardAPI.Models
{
    public class CompanyOverview
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(10)]
        public string Symbol { get; set; }

        [MaxLength(100)]
        public string Name { get; set; }

        public string Description { get; set; }

        [MaxLength(50)]
        public string Sector { get; set; }

        [MaxLength(100)]
        public string Industry { get; set; }

        public DateTime LastUpdated { get; set; }
    }
}