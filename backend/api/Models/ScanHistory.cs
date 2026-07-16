using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NestifyApp.Models
{
    [Table("scans_history")] 
    public class ScanHistory
    {
        [Key]
        [Column("id")]
        public long Id { get; set; } 

        [Required]
        [Column("user_id")]
        public int UserId { get; set; } 

        [Required]
        [Column("scan_date")]
        public DateTime ScanDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column("target_style")]
        public string TargetStyle { get; set; } = string.Empty;

        [Required]
        [Column("max_budget")]
        public int MaxBudget { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}