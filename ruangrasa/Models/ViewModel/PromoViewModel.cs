using System;
using System.Collections.Generic;

namespace ruangrasa.Models.ViewModel
{
    public class PromoModel
    {
        public int PromoId { get; set; }
        public string PromoCode { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string DiscountType { get; set; } // 'Percentage' (misal 20%) atau 'FixedAmount' (misal Rp 10.000)
        public decimal DiscountValue { get; set; }
        public decimal MinOrderAmount { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public string BadgeText { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? ExpiryDate { get; set; }
    }

    public class ValidatePromoRequest
    {
        public string PromoCode { get; set; }
        public decimal Subtotal { get; set; }
        public string OrderType { get; set; } // 'DineIn', 'TakeAway', 'Delivery'
    }

    public class ValidatePromoResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public string PromoCode { get; set; }
        public string Title { get; set; }
        public string DiscountType { get; set; }
        public decimal DiscountValue { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal FinalSubtotal { get; set; }
    }
}
