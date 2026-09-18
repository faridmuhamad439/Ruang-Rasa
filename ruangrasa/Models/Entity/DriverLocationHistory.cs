using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("DriverLocationHistories")]
    public class DriverLocationHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public long HistoryId { get; set; }

        [Required]
        public int DriverId { get; set; }

        [StringLength(100)]
        public string DriverName { get; set; }

        [Required]
        [StringLength(50)]
        public string OrderId { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        public double? Speed { get; set; }

        public double? Heading { get; set; }

        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    }
}
