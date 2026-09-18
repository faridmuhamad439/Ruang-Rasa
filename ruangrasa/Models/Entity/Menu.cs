using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("Menus")]
    public class Menu
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MenuId { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [Required]
        [StringLength(150)]
        public string Name { get; set; }

        public string Description { get; set; }

        [Required]
        public decimal Price { get; set; }

        [StringLength(500)]
        public string ImageUrl { get; set; }

        public bool IsAvailable { get; set; } = true;

        public int Stock { get; set; } = 100;

        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("CategoryId")]
        public virtual Category Category { get; set; }
    }
}
