using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NestifyApp.Data;
using NestifyApp.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace NestifyApp.Controllers
{
    public class FurnitureItem
    {
        [JsonPropertyName("FurnitureType")]
        public string FurnitureType { get; set; }
        [JsonPropertyName("old_color")]
        public string old_color { get; set; }
        [JsonPropertyName("old_material")]
        public string old_material { get; set; }
        [JsonPropertyName("new_name")]
        public string new_name { get; set; }
        [JsonPropertyName("price")]
        public double price { get; set; }
    }

    public class DesignRequest
    {
        public string style { get; set; }
        public List<FurnitureItem> furniture_list { get; set; }
        public string reason { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class DesignController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly DesignAnalyzerService _DesignAnalyzerService;
        private readonly JsonRead _JsonRead;
        private readonly GoogleSearch _googleSearch;
        private readonly AppDbContext _context;

        public DesignController(HttpClient httpClient, AppDbContext context)
        {
            _httpClient = httpClient;
            _httpClient.Timeout = TimeSpan.FromMinutes(15);
            _DesignAnalyzerService = new DesignAnalyzerService();
            _JsonRead = new JsonRead();
            _googleSearch = new GoogleSearch();
            _context = context;
        }

        [HttpPost("process")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ProcessDesign([FromForm] DesignUploadRequest request)
        {
            if (request.Image == null || request.Image.Length == 0)
                return BadRequest("Image file was not received by the server.");

            try
            {
                using var content = new MultipartFormDataContent();
                using var stream = request.Image.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(request.Image.ContentType);

                content.Add(fileContent, "file", request.Image.FileName);
                content.Add(new StringContent(request.Style ?? "Modern"), "style");
                content.Add(new StringContent(request.Description ?? ""), "description");

                var pythonResponse = await _httpClient.PostAsync("http://127.0.0.1:8000/predict", content);
                if (!pythonResponse.IsSuccessStatusCode)
                    return StatusCode((int)pythonResponse.StatusCode, "Error processing data in the AI model.");

                var responseString = await pythonResponse.Content.ReadAsStringAsync();
                string realStyle = _JsonRead.GetPredictedStyle(responseString);
                DesignStyle design = _JsonRead.LoadDesignStyle(realStyle);

                using JsonDocument doc = JsonDocument.Parse(responseString);
                double totalPixels = doc.RootElement.TryGetProperty("image_total_pixels", out JsonElement p) ? p.GetDouble() : 0;
                Furniture[] furnitures;
                if (!string.IsNullOrEmpty(request.RoomType))
                {
                    furnitures = _JsonRead.LoadEmptyRoomFurniture(request.RoomType).ToArray();

                }
                else
                    furnitures = _JsonRead.LoadRoomFurniture(responseString);
                ImageAnalysis imageAnalysis = _JsonRead.GetAnalyze(responseString);

                Room newRoom = new Room(0)
                {
                    totalPixels = totalPixels,
                    Dimensions = new Dimensions
                    {
                        Width = request.Width,
                        Length = request.Length
                    },
                    // totalPixels = request.TotalRoomArea,
                    Furnitures = furnitures,
                    Style = realStyle,
                    Lighting = imageAnalysis.lighting_type ?? "",
                    Colors = imageAnalysis.colors.Select(c => c.hex).ToArray() ?? new string[3]
                };


                _DesignAnalyzerService.CalculateRoomDesignReport(newRoom, design, totalPixels);

                List<Furniture> worstFurniture = _DesignAnalyzerService.FindWorstFurniture(newRoom);
                worstFurniture = worstFurniture
                 .OrderBy(f => f.FinalPoints)
                  .ToList();
                worstFurniture = await _googleSearch.priceOfItems(worstFurniture, realStyle);

                List<Furniture> whatToChange = _DesignAnalyzerService.knapsack(worstFurniture, request.Budget);

                string reason = "";
                if (whatToChange.Count == 0)
                {
                    if (worstFurniture.Count == 0)
                        reason = "room_perfect";
                    else
                        reason = "budget_too_low";
                }

                var bestFurnitureList = whatToChange.Select(item => new FurnitureItem
                {
                    FurnitureType = item.FurnitureType,
                    old_color = item.Answer?.Color ?? "Unknown",
                    old_material = item.Answer?.Material ?? "Unknown",
                    new_name = item.FurnitureType,
                    price = item.Price
                }).ToList();

                string finalAiText = await GenerateDesignTask(realStyle, bestFurnitureList, reason);


                if (request.UserId > 0)
                {

                    var scan = new ScanHistory
                    {
                        UserId = request.UserId,
                        ScanDate = DateTime.UtcNow,
                        TargetStyle = realStyle,
                        MaxBudget = request.Budget
                    };
                    _context.ScansHistory.Add(scan);
                    await _context.SaveChangesAsync();

                }

                return Ok(new { furniture = whatToChange, ai_recommendation = finalAiText });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
        [NonAction]
        public async Task<string> GenerateDesignTask(string style, List<FurnitureItem> bestFurniture, string reason = "")
        {
            var payload = new DesignRequest { style = style, furniture_list = bestFurniture , reason = reason };
            try
            {
                var response = await _httpClient.PostAsJsonAsync("http://127.0.0.1:8000/generate_text", payload);
                if (response.IsSuccessStatusCode)
                {
                    var rawJson = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<Dictionary<string, object>>(rawJson);

                    // Check for error status returned by the Python AI service
                    if (result.ContainsKey("status") && result["status"].ToString() == "error")
                    {
                        var errorMsg = result.ContainsKey("message") ? result["message"].ToString() : "Unknown error";
                        return $"Python error: {errorMsg}";
                    }

                    if (!result.ContainsKey("generated_text"))
                        return "Error: Missing generated_text key in AI response.";

                    return result["generated_text"].ToString();
                }
                return "Communication error with the AI server.";
            }
            catch (Exception ex)
            {
                return $"Connection error to the AI server: {ex.Message}";
            }
        }
        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetHistory(int userId)
        {
            try
            {
                var history = await _context.ScansHistory
                    .Where(s => s.UserId == userId)
                    .OrderByDescending(s => s.ScanDate)
                    .Select(s => new
                    {
                        id = s.Id,
                        date = s.ScanDate.ToString("yyyy-MM-dd"),
                        style = s.TargetStyle,
                        budget = s.MaxBudget
                    })
                    .ToListAsync();

                return Ok(history);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}