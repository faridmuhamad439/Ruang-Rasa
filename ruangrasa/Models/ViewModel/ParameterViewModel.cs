using System;

namespace ruangrasa.Models.ViewModel
{
    public class ParameterViewModel
    {
        public string SearchKeyword { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string SortBy { get; set; } = "CreatedAt";
        public string SortDirection { get; set; } = "DESC"; // "ASC" atau "DESC"
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
