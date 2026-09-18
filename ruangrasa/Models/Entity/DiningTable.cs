using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("DiningTables")]
    public class DiningTable
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TableId { get; set; }

        [Required]
        [StringLength(20)]
        public string TableNumber { get; set; }

        public int Capacity { get; set; } = 2;

        [Required]
        [StringLength(50)]
        public string LocationArea { get; set; } = "Indoor"; // 'Indoor', 'Outdoor', 'Smoking Area', 'VIP Room'

        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "Available"; // 'Available', 'Occupied', 'Reserved', 'Maintenance'

        [StringLength(255)]
        public string QrCode { get; set; }

        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
