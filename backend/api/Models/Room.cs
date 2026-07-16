using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NestifyApp.Models
{
    public class Room
    {
        public int Code { get; set; }
        public Furniture[] Furnitures { get; set; }
        public string UserText { get; set; }
        public string ImagePath { get; set; }
        public string Style { get; set; }
        public string Requirements { get; set; }
        public string[] Colors { get; set; }
        public string Lighting { get; set; }
        public double Budget { get; set; }
        public Dimensions Dimensions { get; set; }
        public FinalAnswer[] FinalAnswers { get; set; }
        public double FinalWeight { get; set; }
        public double totalPixels { get; set; }

        public Room(int numberOfQuestions)
        {
            Dimensions = new Dimensions();
            Furnitures = new Furniture[0];
            Colors = new string[3];
            FinalAnswers = new FinalAnswer[numberOfQuestions];

            for (int i = 0; i < numberOfQuestions; i++)
                FinalAnswers[i] = new FinalAnswer();
        }
    }
}
