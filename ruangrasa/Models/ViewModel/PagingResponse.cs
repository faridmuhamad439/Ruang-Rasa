using System.Collections;

namespace ruangrasa.Models.ViewModel
{
    public class PagingResponse
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = "Data berhasil diambil";
        public int TotalData { get; set; }
        public int TotalPages { get; set; }
        public int CurrentPage { get; set; }
        public int PageSize { get; set; }
        public bool HasPreviousPage => CurrentPage > 1;
        public bool HasNextPage => CurrentPage < TotalPages;
        public IEnumerable Data { get; set; }
    }
}
