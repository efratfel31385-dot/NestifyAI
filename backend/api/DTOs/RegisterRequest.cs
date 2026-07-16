using System.ComponentModel.DataAnnotations;

namespace NestifyApp.DTOs
{
    public class RegisterRequest
    {
        [Required(ErrorMessage = "Full name is required")]
        [RegularExpression(@"^[a-zA-Zא-ת\s]+$", ErrorMessage = "Name can only contain letters and spaces.")]
        public string FullName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long")]
        public string Password { get; set; } = string.Empty;
    }
}