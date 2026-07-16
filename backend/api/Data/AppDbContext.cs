using Microsoft.EntityFrameworkCore;
using NestifyApp.Models;
using System.Collections.Generic;

namespace NestifyApp.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<ScanHistory> ScansHistory { get; set; }
    }
}