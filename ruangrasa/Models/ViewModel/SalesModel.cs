using System;
using System.Collections.Generic;

namespace ruangrasa.Models.ViewModel
{
    public class SalesModel
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        public string CustomerPhone { get; set; }
        public string OrderType { get; set; }
        public int? TableId { get; set; }
        public string TableNumber { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Discount { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal TotalAmount { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentStatus { get; set; }
        public string PaymentProofUrl { get; set; }
        public string CancelReason { get; set; }
        public string DeliveryAddress { get; set; }
        public string Notes { get; set; }
        public int? CashierId { get; set; }
        public string CashierName { get; set; }
        public int? KitchenStaffId { get; set; }
        public string KitchenStaffName { get; set; }
        public int? WaiterId { get; set; }
        public string WaiterName { get; set; }
        public int? DriverId { get; set; }
        public string DriverName { get; set; }
        public DateTime OrderDate { get; set; }
        public List<OrderItemDetailDto> Items { get; set; } = new List<OrderItemDetailDto>();
        public int? Rating { get; set; }
        public string ReviewText { get; set; }
    }

    public class OrderItemDetailDto
    {
        public int MenuId { get; set; }
        public string MenuName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal SubtotalPrice { get; set; }
        public string Notes { get; set; }
    }

    public class DashboardSummaryViewModel
    {
        public decimal TotalOmsetHariIni { get; set; }
        public decimal TotalOmsetMingguIni { get; set; }
        public decimal TotalOmsetBulanIni { get; set; }
        public int TotalPesananHariIni { get; set; }
        public int TotalPesananSelesai { get; set; }
        public int TotalMejaTersedia { get; set; }
        public int TotalMejaTerpakai { get; set; }
        public int TotalPelangganAktif { get; set; }
        public int TotalMenuTersedia { get; set; }
        public int TotalPromoAktif { get; set; }

        // Performa Staf
        public int StaffKasirCompleted { get; set; }
        public int StaffDapurCompleted { get; set; }
        public int StaffWaiterCompleted { get; set; }
        public int StaffDriverCompleted { get; set; }

        // Best Seller Top 5
        public List<BestSellerItemDto> BestSellers { get; set; } = new List<BestSellerItemDto>();

        // Promo Usage
        public List<PromoUsageDto> PromoUsages { get; set; } = new List<PromoUsageDto>();
    }

    public class BestSellerItemDto
    {
        public int MenuId { get; set; }
        public string MenuName { get; set; }
        public string CategoryName { get; set; }
        public int TotalSold { get; set; }
        public decimal TotalRevenue { get; set; }
    }

    public class PromoUsageDto
    {
        public string PromoCode { get; set; }
        public string PromoTitle { get; set; }
        public int TimesUsed { get; set; }
        public decimal TotalDiscountGiven { get; set; }
    }

    public class OrderReviewRequest
    {
        public int OrderId { get; set; }
        public int CustomerId { get; set; }
        public int Rating { get; set; } // 1-5
        public string ReviewText { get; set; }
    }

    public class CancelOrderRequest
    {
        public string Reason { get; set; }
        public int? StaffUserId { get; set; }
    }

    public class VerifyPaymentRequest
    {
        public bool IsApproved { get; set; }
        public string RejectReason { get; set; }
        public int? StaffUserId { get; set; }
    }
}
