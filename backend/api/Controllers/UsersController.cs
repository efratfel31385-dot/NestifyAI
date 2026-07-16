using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NestifyApp.Data;
using NestifyApp.DTOs;
using NestifyApp.Models;
using Isopoh.Cryptography.Argon2;
using System.Threading.Tasks;

namespace NestifyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                return BadRequest(new { message = "This email is already registered." });
            }

            string hashedPassword = Argon2.Hash(request.Password);

            var newUser = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                PasswordHash = hashedPassword,
                SubscriptionTier = "Free"
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User registered successfully!",
                userId = newUser.Id
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !Argon2.Verify(user.PasswordHash, request.Password))
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            return Ok(new
            {
                message = "Login successful!",
                userId = user.Id,
                fullName = user.FullName,
                subscriptionTier = user.SubscriptionTier
            });
        }

        [HttpGet("all")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    id = u.Id,
                    name = u.FullName,
                    email = u.Email,
                    tier = u.SubscriptionTier,
                    joined = u.CreatedAt.ToString("yyyy-MM-dd"),
                    scansCount = _context.ScansHistory.Count(s => s.UserId == u.Id)
                })
                .ToListAsync();
            return Ok(users);
        }

        [HttpPut("tier/{userId}")]
        public async Task<IActionResult> UpdateTier(int userId, [FromBody] string newTier)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            user.SubscriptionTier = newTier;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tier updated successfully!" });
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserById(int userId)
        {
            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new {
                    id = u.Id,
                    name = u.FullName,
                    email = u.Email,
                    tier = u.SubscriptionTier,
                    joined = u.CreatedAt.ToString("yyyy-MM-dd"),
                    scansCount = _context.ScansHistory.Count(s => s.UserId == u.Id)
                })
                .FirstOrDefaultAsync();

            if (user == null)
                return NotFound(new { message = "User not found." });

            return Ok(user);
        }
    }
}
