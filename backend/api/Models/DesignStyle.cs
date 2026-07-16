using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace NestifyApp.Models
{
    public class DesignStyle
    {
        public string style_name { get; set; }
        public int id_style { get; set; }

        public ScoringCategory color_palette { get; set; }         
        public ScoringCategory materials { get; set; }              
        public ScoringCategory furniture_characteristics { get; set; } 
        public ScoringCategory textiles { get; set; }    
        public ScoringCategory lighting { get; set; }   
        public ScoringCategory accessories { get; set; }   
        public ScoringCategory wall_and_floor { get; set; }    




    }
    public class ScoringCategory
    {
        public List<string> Preferred { get; set; } = new List<string>();
        public List<string> Acceptable { get; set; } = new List<string>();
        public List<string> Avoid { get; set; } = new List<string>();
    }
}

