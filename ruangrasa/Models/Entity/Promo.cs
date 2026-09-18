using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("Promos")]
    public class Promo
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PromoId { get; set; }

        [Required]
        [StringLength(50)]
        public string PromoCode { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [Required]
        [StringLength(20)]
        public string DiscountType { get; set; } = "Percentage"; // 'Percentage' atau 'FixedAmount'

        [Required]
        public decimal DiscountValue { get; set; }

        public decimal MinOrderAmount { get; set; } = 0.00m;

        public decimal? MaxDiscountAmount { get; set; }

        [StringLength(50)]
        public string BadgeText { get; set; } = "PROMO";

        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; } = false;

        public DateTime? ExpiryDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? DeletedAt { get; set; }
    }
}
