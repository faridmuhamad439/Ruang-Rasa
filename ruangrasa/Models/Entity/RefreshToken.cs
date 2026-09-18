using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ruangrasa.Models.Entity
{
    [Table("RefreshTokens")]
    public class RefreshToken
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TokenId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(500)]
        public string Token { get; set; }

        [Required]
        public DateTime ExpiresAt { get; set; }

        public bool IsRevoked { get; set; } = false;

        [StringLength(500)]
        public string ReplacedByToken { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}
