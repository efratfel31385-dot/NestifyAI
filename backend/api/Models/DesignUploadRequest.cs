using Microsoft.AspNetCore.Http;

namespace NestifyApp.Models
{
    public class DesignUploadRequest
    {
        public IFormFile Image { get; set; } = null!;
        public string Style { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Budget { get; set; }
        public double TotalRoomArea { get; set; }
        public string? RoomType { get; set; } = "";
        public int UserId { get; set; }
        public double Width { get; set; }
        public double Length { get; set; }

    }
}