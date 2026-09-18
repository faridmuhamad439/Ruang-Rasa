using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("Deliveries")]
    public class Delivery
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DeliveryId { get; set; }

        [Required]
        [Index(IsUnique = true)]
        public int OrderId { get; set; }

        [Required]
        public int DriverId { get; set; }

        [Required]
        [StringLength(30)]
        public string DeliveryStatus { get; set; } = "Assigned";
        // 'Assigned', 'PickedUp', 'OnTheWay', 'Delivered', 'Failed'

        public DateTime? PickupTime { get; set; }

        public DateTime? DeliveredTime { get; set; }

        [StringLength(100)]
        public string RecipientName { get; set; }

        [StringLength(500)]
        public string ProofImageUrl { get; set; }

        [StringLength(255)]
        public string Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; }

        [ForeignKey("DriverId")]
        public virtual User Driver { get; set; }
    }
}
