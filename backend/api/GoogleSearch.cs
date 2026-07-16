using NestifyApp.Models;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

namespace NestifyApp
{
    public class GoogleSearch
    {
        HttpClient client = new HttpClient();

        public async Task<List<Furniture>> priceOfItems(List<Furniture> furnituresToChange, string styleName)
        {
            foreach (var f in furnituresToChange)
            { 
                await fetchItemData(f, f.FurnitureType + " " + styleName);
            }
            return furnituresToChange;
        }

        public async Task fetchItemData(Furniture f, string itemToSearch)
        {
           // Reading configuration
            var config = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();
            string apiKeyAmazon = config["AmazonApiKey"];
            try
            {   {   
                // Search URL
                string url =
                 $"https://api.rainforestapi.com/request" +
                  $"?api_key={apiKeyAmazon}" +
                  $"&amazon_domain=amazon.com" +
                   $"&type=search" +
                  $"&search_term={Uri.EscapeDataString(itemToSearch)}";

                // Getting the response
                HttpResponseMessage response = await client.GetAsync(url);
                string jsonString = await response.Content.ReadAsStringAsync();

                response.EnsureSuccessStatusCode();

                // Parsing into structured data
                using JsonDocument doc = JsonDocument.Parse(jsonString);
                JsonElement root = doc.RootElement;

                if (!root.TryGetProperty("search_results", out JsonElement searchResults) ||
                    searchResults.ValueKind != JsonValueKind.Array ||
                    searchResults.GetArrayLength() == 0)
                {
                    throw new Exception("No search_results found");
                }

                JsonElement topResult = searchResults[0];

                // Price
                decimal priceValue = 0;
                bool priceFound = false;

                // First attempt: price.value
                if (topResult.TryGetProperty("price", out JsonElement priceObj) &&
                    priceObj.ValueKind == JsonValueKind.Object &&
                    priceObj.TryGetProperty("value", out JsonElement priceValObj) &&
                    priceValObj.ValueKind == JsonValueKind.Number)
                {
                    priceValue = priceValObj.GetDecimal();
                    priceFound = true;
                }
                else if (topResult.TryGetProperty("prices", out JsonElement prices) &&
                         prices.ValueKind == JsonValueKind.Array &&
                         prices.GetArrayLength() > 0)
                {
                    JsonElement firstPrice = prices[0];

                    if (firstPrice.TryGetProperty("value", out JsonElement v) &&
                        v.ValueKind == JsonValueKind.Number)
                    {
                        priceValue = v.GetDecimal();
                        priceFound = true;
                    }
                }

                f.Price = priceFound
                    ? (int)Math.Round(priceValue)
                    : Random.Shared.Next(100, 601);
                // Product name
                if (topResult.TryGetProperty("title", out JsonElement title))
                    f.Name = title.GetString() ?? "Unknown";
                else
                    f.Name = "Unknown";

                // Link
                if (topResult.TryGetProperty("link", out JsonElement link))
                    f.LinkToBuy = link.GetString() ?? "";
                else
                    f.LinkToBuy = "";
                // Image
                if (topResult.TryGetProperty("image", out JsonElement image))
                    f.image = image.GetString() ?? "";
                else
                    f.image = "";

            }
            catch (Exception ex)
            {

                f.Price = Random.Shared.Next(100, 601);
                f.Name = "Product not found";
                f.LinkToBuy = "";
                f.image = "";
            }
        }

    }

}





