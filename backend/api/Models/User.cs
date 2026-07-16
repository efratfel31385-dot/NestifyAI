using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace NestifyApp.Models
{
    [Table("Users")] 
    public class User
    {
        [Key]
        [Column("id")]

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; } 

        [Column("CreatedAt")] 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        [Column("full_name")]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [Column("email")]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column("password_hash")]
        public string PasswordHash { get; set; } 

        [Column("subscription_tier")]
        public string SubscriptionTier { get; set; } = "Free";

        public List<ScanHistory> ScansHistory { get; set; } = new List<ScanHistory>();
    }
}