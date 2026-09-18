using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("PasswordResets")]
    public class PasswordReset
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ResetId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(255)]
        public string Token { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        public bool IsUsed { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
