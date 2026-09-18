using System;
using System.Collections.Generic;

namespace ruangrasa.Models.ViewModel
{
    public class UserProfileDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string RoleName { get; set; }
        public string AvatarUrl { get; set; }
        public string DefaultAddress { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateProfileRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string DefaultAddress { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
    }

    public class CustomerOrderItemDto
    {
        public int OrderItemId { get; set; }
        public int MenuId { get; set; }
        public string MenuName { get; set; }
        public string ImageUrl { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
        public string Notes { get; set; }
    }

    public class CustomerOrderDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public string OrderType { get; set; }
        public string TableNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentStatus { get; set; }
        public string DeliveryAddress { get; set; }
        public string DeliveryContactPhone { get; set; }
        public string Notes { get; set; }
        public string CancelReason { get; set; }
        public string PaymentProofUrl { get; set; }
        public int? Rating { get; set; }
        public string ReviewText { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<CustomerOrderItemDto> Items { get; set; } = new List<CustomerOrderItemDto>();
    }

    public class ReviewDto
    {
        public int ReviewId { get; set; }
        public int OrderId { get; set; }
        public string CustomerName { get; set; }
        public int Rating { get; set; }
        public string ReviewText { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class StaffUserDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string RoleName { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TotalOrdersHandled { get; set; }
        public int TotalOrdersCompleted { get; set; }
        public int TotalOrdersServed { get; set; }
        public int TotalOrdersDelivered { get; set; }
        public decimal TotalRevenueHandled { get; set; }
        public DateTime? LastActiveAt { get; set; }
    }

    public class UpdateStaffRequest
    {
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string RoleName { get; set; }
        public bool? IsActive { get; set; }
        public string NewPassword { get; set; }
    }
}

