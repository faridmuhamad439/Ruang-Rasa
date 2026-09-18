using System.Collections.Generic;

namespace ruangrasa.Models.ViewModel
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public List<string> Errors { get; set; } = new List<string>();

        public static ApiResponse<T> Ok(T data, string message = "Berhasil")
        {
            return new ApiResponse<T> { Success = true, Message = message, Data = data };
        }

        public static ApiResponse<T> Fail(string message, List<string> errors = null)
        {
            return new ApiResponse<T> { Success = false, Message = message, Errors = errors ?? new List<string>() };
        }
    }

    public class OrderItemRequest
    {
        public int MenuId { get; set; }
        public int Quantity { get; set; } = 1;
        public string Notes { get; set; }
    }

    public class CreateOrderRequest
    {
        public int CustomerId { get; set; }
        public string OrderType { get; set; } // 'DineIn', 'TakeAway', 'Delivery'
        public int? TableId { get; set; }     // Wajib jika DineIn
        public string DeliveryAddress { get; set; }
        public string DeliveryContactPhone { get; set; }
        public string Notes { get; set; }
        public string PaymentMethod { get; set; } = "QRIS"; // 'Cash', 'QRIS', 'Transfer', 'DebitCard'
        public string PromoCode { get; set; }
        public decimal DiscountAmount { get; set; } = 0.00m;
        public decimal DeliveryFee { get; set; } = 0.00m;
        public string GuestName { get; set; }
        public string PaymentProofUrl { get; set; }
        public List<OrderItemRequest> Items { get; set; } = new List<OrderItemRequest>();
    }
}
