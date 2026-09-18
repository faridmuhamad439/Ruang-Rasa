using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("Reviews")]
    public class Review
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReviewId { get; set; }

        [Required]
        public int OrderId { get; set; }

        [Required]
        public int CustomerId { get; set; }

        [Required]
        [Range(1, 5)]
        public int Rating { get; set; } // 1 sampai 5 bintang

        [StringLength(1000)]
        public string ReviewText { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("OrderId")]
        public virtual Order Order { get; set; }

        [ForeignKey("CustomerId")]
        public virtual User Customer { get; set; }
    }
}
