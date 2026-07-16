using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace NestifyApp.Models
{
    public class FinalAnswer
    {
        public double Percentage { get; set; }
        public FinalAnswer[] Pointers { get; set; }

        public FinalAnswer()
        {
            Pointers = new FinalAnswer[0];
        }
    }
}
