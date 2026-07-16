using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace NestifyApp.Models
{
    public class Answer
    {
        public int Id { get; set; }
        public string Type { get; set; }
        public string Material { get; set; } 
        public string Sample { get; set; }  
        public string Color { get; set; }    
        public string Shape {  get; set; }
        public string pattern {  get; set; }

        public Answer()
        {
          
        }
    }
}
