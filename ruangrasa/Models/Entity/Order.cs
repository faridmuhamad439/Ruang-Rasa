using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("Orders")]
    public class Order
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int OrderId { get; set; }

        [Required]
        [StringLength(40)]
        public string OrderNumber { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [StringLength(150)]
        public string GuestName { get; set; }

        [Required]
        [StringLength(20)]
        public string OrderType { get; set; } // 'DineIn', 'TakeAway', 'Delivery'

        public int? TableId { get; set; }

        public int? CashierId { get; set; }

        public int? KitchenStaffId { get; set; }

        public int? DriverId { get; set; }

        public int? WaiterId { get; set; }

        [StringLength(500)]
        public string DeliveryAddress { get; set; }

        [StringLength(25)]
        public string DeliveryContactPhone { get; set; }

        public decimal DeliveryFee { get; set; } = 0.00m;

        [Required]
        public decimal Subtotal { get; set; }

        public decimal Tax { get; set; } = 0.00m;

        public decimal Discount { get; set; } = 0.00m;

        [Required]
        public decimal TotalAmount { get; set; }

        [Required]
        [StringLength(30)]
        public string OrderStatus { get; set; } = "PendingPayment";
        // 'PendingPayment', 'WaitingConfirmation', 'Confirmed', 'Cooking', 'Ready', 'ReadyToServe', 'ReadyForPickup', 'ReadyForDelivery', 'Delivering', 'Delivered', 'Completed', 'Cancelled'

        [StringLength(255)]
        public string CancelReason { get; set; }

        [StringLength(500)]
        public string PaymentProofUrl { get; set; }

        [StringLength(500)]
        public string Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; }

        [ForeignKey("TableId")]
        public virtual DiningTable Table { get; set; }

        [ForeignKey("CashierId")]
        public virtual User Cashier { get; set; }

        [ForeignKey("KitchenStaffId")]
        public virtual User KitchenStaff { get; set; }

        [ForeignKey("DriverId")]
        public virtual User Driver { get; set; }

        [ForeignKey("WaiterId")]
        public virtual User Waiter { get; set; }

        public virtual ICollection<OrderItem> OrderItems { get; set; }

        public virtual ICollection<Payment> Payments { get; set; }

        public virtual ICollection<Review> Reviews { get; set; }

        [NotMapped]
        public virtual Delivery Delivery { get; set; }
    }
}
