using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using ruangrasa.Models.Entity;

namespace ruangrasa.Services.Context
{
    public partial class RuangrasaDbContext : DbContext
    {
        public RuangrasaDbContext()
            : base("name=RuangrasaDbContext")
        {
            this.Database.CommandTimeout = 600;
            // Nonaktifkan migrasi otomatis karena database sudah dibuat langsung di SSMS
            Database.SetInitializer<RuangrasaDbContext>(null);
        }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<DiningTable> DiningTables { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Delivery> Deliveries { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<PasswordReset> PasswordResets { get; set; }
        public DbSet<Promo> Promos { get; set; }
        public DbSet<DriverLocationHistory> DriverLocationHistories { get; set; }
        public DbSet<Review> Reviews { get; set; }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relasi Order ke Delivery
            modelBuilder.Entity<Delivery>()
                .HasRequired(d => d.Order)
                .WithMany()
                .HasForeignKey(d => d.OrderId);
        }
    }
}
