using System;
using System.Diagnostics.Eventing.Reader;
using NestifyApp.Models;
using System.IO;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace NestifyApp
{
    public class DesignAnalyzerService
    {
        private readonly Dictionary<string, double> _furnitureScores;
        private const int ATTRIBUTE_NUM = 4;
        private const int COMPONENT_NUM = 3;

        public DesignAnalyzerService()
        {
            try
            {
                // Loads base score for each furniture type from file
                var json = File.ReadAllText("furniture_scores.json");
                _furnitureScores = JsonSerializer.Deserialize<Dictionary<string, double>>(json);
            }
            catch (Exception ex)
            {
                _furnitureScores = new Dictionary<string, double>();
            }
        }
        public double EvaluateAttribute(string attributeName, ScoringCategory category)
        {
            // Preferred attribute → +1 point, Avoid → -1 point, Acceptable → +0.5, otherwise 0
            if (category.Preferred.Any(x =>
              x.Equals(attributeName, StringComparison.OrdinalIgnoreCase)))
                return 1.0;
            
            else if (category.Avoid.Any(x =>
              x.Equals(attributeName, StringComparison.OrdinalIgnoreCase)))
                return -1.0;
            
            else if (category.Acceptable.Any(x =>
             x.Equals(attributeName, StringComparison.OrdinalIgnoreCase)))
                return 0.5;
            
            return 0.0;
        }

        public void CalculateRoomDesignReport(Room room, DesignStyle style, double totalPixels)
        {
            double totalColorPoints = 0;
            double totalMaterialPoints = 0;
            double totalshapePoints = 0;
            double totalpatternPoints = 0;
            double totalAvgRoom = 0;

            int furnitureCount = 0;
            foreach (var f in room.Furnitures)
            {

            
                f.FinalPoints = 0;
                // How well the furniture matches the color palette
                f.ColorScore = EvaluateAttribute(f.Answer.Color, style.color_palette);
                totalColorPoints += f.ColorScore;
                // How well the furniture matches the material
                f.MaterialScore = EvaluateAttribute(f.Answer.Material, style.materials);
                totalMaterialPoints += f.MaterialScore;
                // How well the furniture's shape/finish matches the style
                f.ShapeScore = EvaluateAttribute(f.Answer.Shape, style.furniture_characteristics); totalshapePoints += f.ShapeScore;
                f.PatternScore = EvaluateAttribute(f.Answer.Sample, style.textiles); totalpatternPoints += f.PatternScore;

                double BasePoints = _furnitureScores.GetValueOrDefault(f.FurnitureType, 1.0);
                double sizeRatio = f.area / room.totalPixels;
                // Empty room: use base score directly. Otherwise: scale score by furniture's size ratio in the room
                if (f.area == 0)
                    f.BasePoints = BasePoints;
                else
                    f.BasePoints = BasePoints * sizeRatio;
                f.FinalPoints = (f.ShapeScore + f.ColorScore + f.MaterialScore + f.PatternScore )/ ATTRIBUTE_NUM;
                furnitureCount++;
            }
            if (furnitureCount > 0.5)
            {   
                // Average each attribute across all furniture items
                totalColorPoints = totalColorPoints / furnitureCount;
                totalMaterialPoints = totalMaterialPoints / furnitureCount;
                totalpatternPoints = totalpatternPoints / furnitureCount;
                totalshapePoints = totalshapePoints / furnitureCount;
                // Overall room average across all attribute averages
                totalAvgRoom += (totalColorPoints + totalMaterialPoints + totalpatternPoints + totalshapePoints) / ATTRIBUTE_NUM;
            }
            double lightingScore = EvaluateAttribute(room.Lighting, style.lighting);
            string mainColor = (room.Colors != null && room.Colors.Length > 0) ? room.Colors[0] : "";
            double wallScore = EvaluateAttribute(mainColor, style.wall_and_floor);

            room.FinalWeight = (totalAvgRoom + lightingScore + wallScore) / COMPONENT_NUM;
        }
        public List<Furniture> FindWorstFurniture(Room room)
        {
            List<Furniture> furnituresToChange = new List<Furniture>();
            if (room.Furnitures == null || room.Furnitures.Length == 0)
                return furnituresToChange;
            if (room.Furnitures.All(f => f.area == 0))
                // Return all furniture for purchase if room is empty
                return room.Furnitures.ToList(); 
            foreach (var furniture in room.Furnitures)
            {
                // Only furniture with non-positive score needs replacement
                if (furniture.FinalPoints <= 0)
                {
                    furnituresToChange.Add(furniture);
                }

            }

            return furnituresToChange;
        }


        public List<Furniture> knapsack(List<Furniture> furnituresToChange, int budget)
        {
            if (furnituresToChange == null || furnituresToChange.Count == 0)
            {
                return new List<Furniture>();
            }
            else
            {
                // Build DP table: rows = furniture items, columns = budget
                int[,] items = new int[furnituresToChange.Count + 1, budget + 1];
                for (int i = 0; i <= furnituresToChange.Count; i++)
                {

                    for (int j = 0; j <= budget; j++)
                    {
                        if (i == 0 || j == 0)
                        {
                            items[i, j] = 0;
                        }
                        else
                        {
                            if ((int)furnituresToChange[i - 1].Price <= j)
                            {
                                int pick = (int)(furnituresToChange[i - 1].BasePoints * 100) + items[i - 1,
                                         j - furnituresToChange[i - 1].Price];
                                int notPick = items[i - 1, j];
                                items[i, j] = Math.Max(pick, notPick);
                            }
                            else
                            {
                                items[i, j] = items[i - 1, j];
                            }
                        }
                    }
                }
                List<Furniture> chosenFurniture = new List<Furniture>();
                int currentBudget = budget;
                // Backtrack through the DP table to find which items were actually chosen
                for (int i = furnituresToChange.Count; i > 0; i--)
                {
                    if (items[i, currentBudget] != items[i - 1, currentBudget])
                    {
                        Furniture selected = furnituresToChange[i - 1];
                        chosenFurniture.Add(selected);
                        currentBudget -= (int)selected.Price;
                    }
                }
                return chosenFurniture;
            }
        }
    }
}


