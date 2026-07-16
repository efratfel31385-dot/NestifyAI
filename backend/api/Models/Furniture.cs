using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NestifyApp.Models
{
    public class Furniture
    {
        public int Id { get; set; }
        public string FurnitureType { get; set; }
        public double BasePoints { get; set; }
        public Answer Answer { get; set; }
        public double area { get; set; }

        // Score per furniture attribute
        public double ColorScore { get; set; }
        public double MaterialScore { get; set; }
        public double ShapeScore { get; set; }
        public double PatternScore { get; set; }
        // Total score across all attributes
        public double FinalPoints { get; set; }

        // Price of the replacement furniture item
        public int Price { get; set; }
        // Name of the new furniture item
        public string Name { get; set; }
        // Purchase link
        public string LinkToBuy { get; set; }
        public string image { get; set; }

        public Furniture()
        {
            Answer = new Answer();
        }
    }
}
