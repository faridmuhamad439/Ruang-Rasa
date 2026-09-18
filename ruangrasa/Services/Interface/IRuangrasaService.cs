using System.Collections.Generic;
using System.Threading.Tasks;
using ruangrasa.Models.Entity;
using ruangrasa.Models.ViewModel;

namespace ruangrasa.Services.Interface
{
    public interface IRuangrasaService
    {
        // 1. Cek Koneksi ke Database RuangrasaDb
        string CekKoneksiDB();

        // 2. Data Penjualan & Dashboard Analytics
        List<SalesModel> GetSalesModels();
        PagingResponse GetSalesModelsPaging(ParameterViewModel requestData, bool isDownload = false);
        DashboardSummaryViewModel GetDashboardSummary();

        // 3. Autentikasi Pengguna & Karyawan (7 Role: Admin, Owner, Kasir, Dapur, Waiter, Driver, Customer)
        UserToken Authenticate(LoginRequest request);
        ApiResponse<string> Register(RegisterRequest request);
        ApiResponse<string> ForgotPassword(ForgotPasswordRequest request);
        ApiResponse<bool> ResetPassword(ResetPasswordRequest request);
        ApiResponse<List<StaffUserDto>> GetStaffUsers();
        ApiResponse<bool> ToggleStaffStatus(int userId);
        ApiResponse<StaffUserDto> UpdateStaffUser(int userId, UpdateStaffRequest request);
        ApiResponse<bool> DeleteStaffUser(int userId);

        // 4. Menu & Kategori Coffee Shop
        PagingResponse GetMenusPaging(ParameterViewModel requestData);
        List<Category> GetCategories();
        ApiResponse<Menu> GetMenuById(int menuId);
        ApiResponse<Menu> CreateMenu(Menu menu);
        ApiResponse<Menu> UpdateMenu(int menuId, Menu menu);
        ApiResponse<bool> DeleteMenu(int menuId);

        // 5. Pemilihan & Manajemen Meja (Dine-In Sesuai Ketersediaan)
        List<DiningTable> GetAvailableTables();
        List<DiningTable> GetAllTables();
        ApiResponse<bool> UpdateTableStatus(int tableId, string status);

        // 6. Transaksi Pemesanan & Pembayaran (REST API)
        ApiResponse<SalesModel> CreateOrder(CreateOrderRequest request);
        ApiResponse<bool> UpdateOrderStatus(int orderId, string newStatus, int? staffUserId = null);
        ApiResponse<bool> CancelOrder(int orderId, string reason, int? staffUserId = null);
        ApiResponse<bool> VerifyPaymentProof(int orderId, bool isApproved, string rejectReason, int? staffUserId = null);
        Task TruncateMasterMenu();
        Task TruncateMasterProduct();

        // 7. Promo & Voucher Diskon
        List<PromoModel> GetActivePromos();
        PagingResponse GetPromosPaging(ParameterViewModel requestData);
        ApiResponse<Promo> GetPromoById(int promoId);
        ApiResponse<Promo> CreatePromo(Promo promo);
        ApiResponse<Promo> UpdatePromo(int promoId, Promo promo);
        ApiResponse<bool> DeletePromo(int promoId);
        ApiResponse<ValidatePromoResponse> ValidatePromo(ValidatePromoRequest request);

        // 8. Gateway Pembayaran Lengkap (QRIS, Transfer VA, Debit/Credit Card, Tunai/Cash) & Ongkir
        ApiResponse<QrisPaymentResponse> GenerateQrisPayment(QrisGenerateRequest request);
        ApiResponse<QrisVerifyResponse> VerifyQrisPayment(QrisVerifyRequest request);
        ApiResponse<TransferPaymentResponse> GenerateTransferPayment(TransferGenerateRequest request);
        ApiResponse<QrisVerifyResponse> VerifyTransferPayment(TransferVerifyRequest request);
        ApiResponse<CardPaymentResponse> ProcessCardPayment(CardPaymentRequest request);
        ApiResponse<CashPaymentResponse> ConfirmCashPayment(CashPaymentRequest request);
        ApiResponse<ProcessPaymentResponse> ProcessPayment(ProcessPaymentRequest request);
        ApiResponse<PaymentStatusResponse> GetPaymentStatus(int orderId);
        ApiResponse<List<RajaOngkirCityModel>> GetRajaOngkirCities();
        ApiResponse<RajaOngkirCostResponse> CalculateShippingCost(RajaOngkirCostRequest request);

        // 9. Live GPS Tracking (Delivery Coffee Shop)
        ApiResponse<bool> SaveDriverLocation(DriverLocationHistory history);
        ApiResponse<DriverLocationHistory> GetLatestDriverLocation(string orderId);
        ApiResponse<List<Order>> GetActiveDeliveryOrders();

        // 10. Profil Pengguna & Riwayat Pesanan Pelanggan
        ApiResponse<UserProfileDto> GetUserProfile(int userId);
        ApiResponse<UserProfileDto> UpdateUserProfile(int userId, UpdateProfileRequest request);
        ApiResponse<bool> ChangeUserPassword(int userId, ChangePasswordRequest request);
        ApiResponse<List<CustomerOrderDto>> GetCustomerOrders(int customerId);

        // 11. Rating & Ulasan (Review)
        ApiResponse<bool> SubmitOrderReview(OrderReviewRequest request);
        ApiResponse<List<ReviewDto>> GetMenuReviews(int menuId);

        // 12. Sesi & Token (Refresh & Logout server-side)
        UserToken RefreshAuthentication(RefreshTokenRequest request);
        bool RevokeRefreshToken(string refreshToken);
    }
}
