using NestifyApp.Models;
using System.IO;
using System;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace NestifyApp
{
    public class JsonRead
    {
        // Reads the design style rules file
        public DesignStyle LoadDesignStyle(string style_name)
        {
            // If no style is provided, default to Modern
            if (string.IsNullOrEmpty(style_name))
            {
                style_name = "Modern";
            }
            string path = style_name + ".json";
            string jsonContent = "";
            DesignStyle styleObject = null;
            try
            {
                jsonContent = File.ReadAllText(path);
                styleObject = JsonSerializer.Deserialize<DesignStyle>(jsonContent);
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to read: " + ex.Message);
            }
            return styleObject;
        }

        // Reads furniture data returned from the model
        public Furniture[] LoadRoomFurniture(string jsonFromPython)
        {
            List<Furniture> newRoonList = new List<Furniture>();

            try
            {
                PythonResponse rawList = JsonSerializer.Deserialize<PythonResponse>(jsonFromPython);
                if (rawList != null)
                {
                    foreach (var rawItem in rawList.detected_objects)
                    {
                        Furniture f = new Furniture();
                        f.Answer = new Answer();
                        f.FurnitureType = rawItem.label;
                        f.Answer.Color = rawItem.color;
                        f.Answer.Material = rawItem.material;
                        f.Answer.Shape = rawItem.shape;
                        f.Answer.Sample = rawItem.pattern;
                        f.area = rawItem.area;

                        newRoonList.Add(f);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to parse room furniture: " + ex.Message);
            }

            return newRoonList.ToArray();
        }


        public string GetPredictedStyle(string jsonFromPython)
        {
            try
            {
                PythonResponse response = JsonSerializer.Deserialize<PythonResponse>(jsonFromPython);

                if (response != null && response.textEngineOutput != null && !string.IsNullOrEmpty(response.textEngineOutput.predictedStyle))
                {
                    return response.textEngineOutput.predictedStyle;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed: " + ex.Message);
            }

            // Default to "modern" so the system doesn't crash
            return "modern";
        }
        // Extracts image analysis data (brightness, lighting, colors) from the Python response
        public ImageAnalysis GetAnalyze(string jsonFromPython) {
            try
            {
                PythonResponse response = JsonSerializer.Deserialize<PythonResponse>(jsonFromPython);
                if (response != null && response.image_analysis != null)
                    return response.image_analysis;
            }
            catch (Exception ex) {
                Console.WriteLine(ex.Message);
            }
            return null;
        }

        // Loads a furniture list for an empty room based on room type (parents / kids) — no image analysis involved
        public List<Furniture> LoadEmptyRoomFurniture(string roomType)
        {
            try
            {
                string json = File.ReadAllText("room_furniture.json");
                var data = JsonSerializer.Deserialize<Dictionary<string, List<string>>>(json);

                string key = roomType.ToLower() == "parents" ? "parents" : "kids";

                if (data != null && data.ContainsKey(key))
                {
                    return data[key].Select(name => new Furniture
                    {
                        FurnitureType = name,
                        Answer = new Answer()
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Failed to load room furniture: " + ex.Message);
            }
            return new List<Furniture>();
        }
    }
    // Response from the Python service
    public class PythonResponse
    {
        public List<PythonFurnitureInput> detected_objects { get; set; }
        public TextEngineOutput textEngineOutput { get; set; }
        public ImageAnalysis image_analysis { get; set; }
    }
    // Design style predicted by DistilBERT
    public class TextEngineOutput
    {
        public string predictedStyle { get; set; }
    }
    public class PythonFurnitureInput
    {
        public string label { get; set; }
        public string color { get; set; }
        public string material { get; set; }
        public string shape { get; set; }
        public string pattern { get; set; }
        public double confidence { get; set; }
        public double area {  get; set; }
    }
    public class ImageAnalysis
    {
        public double brightness_value { get; set; }
        public string brightness_category { get; set; }
        public double std_value { get; set; }
        public string lighting_type { get; set; }
        public List<DominantColor> colors { get; set; }
    }
    public class DominantColor
    {
        public List<int> rgb { get; set; }
        public string hex { get; set; }
    }
}