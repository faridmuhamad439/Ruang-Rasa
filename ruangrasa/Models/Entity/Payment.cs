using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("Payments")]
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        [StringLength(30)]
        public string PaymentMethod { get; set; } // 'Cash', 'QRIS', 'Transfer', 'DebitCard'

        [Required]
        [StringLength(30)]
        public string PaymentStatus { get; set; } = "Pending"; // 'Pending', 'Paid', 'Failed', 'Refunded'

        [Required]
        public decimal AmountPaid { get; set; }

        public decimal ChangeAmount { get; set; } = 0.00m;

        [StringLength(100)]
        public string TransactionReference { get; set; }

        public DateTime? PaidAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; }
    }
}
