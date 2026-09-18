using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using ruangrasa.Models.ViewModel;
using ruangrasa.Services.Impl;
using ruangrasa.Services.Interface;

namespace ruangrasa.Controllers
{
    [RoutePrefix("api/ruangrasa")]
    public class RuangrasaApiController : ApiController
    {
        // Pola MVCS murni: Seluruh logika bisnis diproses di IRuangrasaService
        private readonly IRuangrasaService _ruangrasaService;

        public RuangrasaApiController()
        {
            _ruangrasaService = new RuangrasaService();
        }

        public RuangrasaApiController(IRuangrasaService ruangrasaService)
        {
            _ruangrasaService = ruangrasaService;
        }

        // GET: api/ruangrasa/cek-koneksi
        [HttpGet]
        [Route("cek-koneksi")]
        public IHttpActionResult CekKoneksi()
        {
            var result = _ruangrasaService.CekKoneksiDB();
            return Ok(new { success = true, message = result });
        }

        // GET: api/ruangrasa/sales
        [HttpGet]
        [Route("sales")]
        public IHttpActionResult GetSales()
        {
            var data = _ruangrasaService.GetSalesModels();
            return Ok(new { success = true, data });
        }

        // POST: api/ruangrasa/sales/paging
        [HttpPost]
        [Route("sales/paging")]
        public IHttpActionResult GetSalesPaging([FromBody] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _ruangrasaService.GetSalesModelsPaging(param);
            return Ok(response);
        }

        // GET: api/ruangrasa/dashboard
        [HttpGet]
        [Route("dashboard")]
        public IHttpActionResult GetDashboardSummary()
        {
            var summary = _ruangrasaService.GetDashboardSummary();
            return Ok(new { success = true, data = summary });
        }

        // POST: api/ruangrasa/auth/login
        [HttpPost]
        [Route("auth/login")]
        public IHttpActionResult Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            try
            {
                var token = _ruangrasaService.Authenticate(request);
                return Ok(new { success = true, message = "Login berhasil", data = token });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/ruangrasa/auth/register
        [HttpPost]
        [Route("auth/register")]
        public IHttpActionResult Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.Register(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/auth/forgot-password
        [HttpPost]
        [Route("auth/forgot-password")]
        public IHttpActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.ForgotPassword(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/auth/reset-password
        [HttpPost]
        [Route("auth/reset-password")]
        public IHttpActionResult ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.ResetPassword(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/menus/paging
        [HttpPost]
        [Route("menus/paging")]
        public IHttpActionResult GetMenusPaging([FromBody] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _ruangrasaService.GetMenusPaging(param);
            return Ok(response);
        }

        // GET: api/ruangrasa/menus/{id}
        [HttpGet]
        [Route("menus/{id:int}")]
        public IHttpActionResult GetMenuById(int id)
        {
            var result = _ruangrasaService.GetMenuById(id);
            if (!result.Success)
            {
                return NotFound();
            }
            return Ok(result);
        }

        // POST: api/ruangrasa/menus
        [HttpPost]
        [Route("menus")]
        public IHttpActionResult CreateMenu([FromBody] ruangrasa.Models.Entity.Menu menu)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.CreateMenu(menu);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // PUT: api/ruangrasa/menus/{id}
        [HttpPut]
        [Route("menus/{id:int}")]
        public IHttpActionResult UpdateMenu(int id, [FromBody] ruangrasa.Models.Entity.Menu menu)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.UpdateMenu(id, menu);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // DELETE: api/ruangrasa/menus/{id}
        [HttpDelete]
        [Route("menus/{id:int}")]
        public IHttpActionResult DeleteMenu(int id)
        {
            var result = _ruangrasaService.DeleteMenu(id);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // GET: api/ruangrasa/categories
        [HttpGet]
        [Route("categories")]
        public IHttpActionResult GetCategories()
        {
            var categories = _ruangrasaService.GetCategories();
            return Ok(new { success = true, data = categories });
        }

        // GET: api/ruangrasa/tables/available
        [HttpGet]
        [Route("tables/available")]
        public IHttpActionResult GetAvailableTables()
        {
            var tables = _ruangrasaService.GetAvailableTables();
            return Ok(new { success = true, data = tables });
        }

        // GET: api/ruangrasa/tables
        [HttpGet]
        [Route("tables")]
        public IHttpActionResult GetAllTables()
        {
            var tables = _ruangrasaService.GetAllTables();
            return Ok(new { success = true, data = tables });
        }

        // PUT / PATCH: api/ruangrasa/tables/{id}/status
        [HttpPut, HttpPatch]
        [Route("tables/{id:int}/status")]
        public IHttpActionResult UpdateTableStatus(int id, [FromBody] UpdateTableStatusRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Status))
            {
                return BadRequest("Status meja harus diisi.");
            }

            var response = _ruangrasaService.UpdateTableStatus(id, req.Status);
            if (!response.Success)
            {
                return BadRequest(response.Message);
            }

            return Ok(response);
        }

        // POST: api/ruangrasa/orders
        [HttpPost]
        [Route("orders")]
        public IHttpActionResult CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var response = _ruangrasaService.CreateOrder(request);
            if (!response.Success)
            {
                return BadRequest(response.Message);
            }

            return Ok(response);
        }

        // PUT / PATCH: api/ruangrasa/orders/{id}/status
        [HttpPut, HttpPatch]
        [Route("orders/{id:int}/status")]
        public IHttpActionResult UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.NewStatus))
            {
                return BadRequest("Status baru pesanan wajib diisi.");
            }

            var result = _ruangrasaService.UpdateOrderStatus(id, req.NewStatus, req.StaffUserId);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // GET: api/ruangrasa/promos
        [HttpGet]
        [Route("promos")]
        public IHttpActionResult GetActivePromos()
        {
            var promos = _ruangrasaService.GetActivePromos();
            return Ok(new { success = true, data = promos });
        }

        // POST: api/ruangrasa/promos/paging
        [HttpPost]
        [Route("promos/paging")]
        public IHttpActionResult GetPromosPaging([FromBody] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _ruangrasaService.GetPromosPaging(param);
            return Ok(response);
        }

        // GET: api/ruangrasa/promos/{id}
        [HttpGet]
        [Route("promos/{id:int}")]
        public IHttpActionResult GetPromoById(int id)
        {
            var result = _ruangrasaService.GetPromoById(id);
            if (!result.Success)
            {
                return NotFound();
            }
            return Ok(result);
        }

        // POST: api/ruangrasa/promos
        [HttpPost]
        [Route("promos")]
        public IHttpActionResult CreatePromo([FromBody] ruangrasa.Models.Entity.Promo promo)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.CreatePromo(promo);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // PUT: api/ruangrasa/promos/{id}
        [HttpPut]
        [Route("promos/{id:int}")]
        public IHttpActionResult UpdatePromo(int id, [FromBody] ruangrasa.Models.Entity.Promo promo)
        {
            if (!ModelState.IsValid)
            {
                // 422 Unprocessable Entity: validasi server-side gagal (format respons JSON konsisten)
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi data gagal. Periksa kembali isian formulir.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            var result = _ruangrasaService.UpdatePromo(id, promo);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // DELETE: api/ruangrasa/promos/{id}
        [HttpDelete]
        [Route("promos/{id:int}")]
        public IHttpActionResult DeletePromo(int id)
        {
            var result = _ruangrasaService.DeletePromo(id);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/promos/validate
        [HttpPost]
        [Route("promos/validate")]
        public IHttpActionResult ValidatePromo([FromBody] ValidatePromoRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PromoCode))
            {
                return BadRequest("Kode promo wajib diisi.");
            }

            var result = _ruangrasaService.ValidatePromo(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/qris/generate
        [HttpPost]
        [Route("payment/qris/generate")]
        public IHttpActionResult GenerateQrisPayment([FromBody] QrisGenerateRequest request)
        {
            if (request == null || request.Amount <= 0)
            {
                return BadRequest("Nominal transaksi QRIS tidak valid.");
            }

            var result = _ruangrasaService.GenerateQrisPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/qris/verify
        [HttpPost]
        [Route("payment/qris/verify")]
        public IHttpActionResult VerifyQrisPayment([FromBody] QrisVerifyRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data pesanan dan transaksi verifikasi QRIS wajib diisi.");
            }

            var result = _ruangrasaService.VerifyQrisPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/transfer/generate
        [HttpPost]
        [Route("payment/transfer/generate")]
        public IHttpActionResult GenerateTransferPayment([FromBody] TransferGenerateRequest request)
        {
            if (request == null || request.Amount <= 0)
            {
                return BadRequest("Nominal transaksi transfer tidak valid.");
            }

            var result = _ruangrasaService.GenerateTransferPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/transfer/verify
        [HttpPost]
        [Route("payment/transfer/verify")]
        public IHttpActionResult VerifyTransferPayment([FromBody] TransferVerifyRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data verifikasi transfer tidak valid.");
            }

            var result = _ruangrasaService.VerifyTransferPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/card/process
        [HttpPost]
        [Route("payment/card/process")]
        public IHttpActionResult ProcessCardPayment([FromBody] CardPaymentRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data pembayaran kartu tidak valid.");
            }

            var result = _ruangrasaService.ProcessCardPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/cash/confirm
        [HttpPost]
        [Route("payment/cash/confirm")]
        public IHttpActionResult ConfirmCashPayment([FromBody] CashPaymentRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data pembayaran tunai tidak valid.");
            }

            var result = _ruangrasaService.ConfirmCashPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/payment/process
        [HttpPost]
        [Route("payment/process")]
        public IHttpActionResult ProcessPayment([FromBody] ProcessPaymentRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Permintaan pembayaran tidak valid.");
            }

            var result = _ruangrasaService.ProcessPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // GET: api/ruangrasa/payment/status/{orderId}
        [HttpGet]
        [Route("payment/status/{orderId}")]
        public IHttpActionResult GetPaymentStatus(int orderId)
        {
            var result = _ruangrasaService.GetPaymentStatus(orderId);
            if (!result.Success)
            {
                return NotFound();
            }

            return Ok(result);
        }

        // GET: api/ruangrasa/shipping/cities
        [HttpGet]
        [Route("shipping/cities")]
        public IHttpActionResult GetShippingCities()
        {
            var result = _ruangrasaService.GetRajaOngkirCities();
            return Ok(result);
        }

        // POST: api/ruangrasa/shipping/calculate-cost
        [HttpPost]
        [Route("shipping/calculate-cost")]
        public IHttpActionResult CalculateShippingCost([FromBody] RajaOngkirCostRequest request)
        {
            if (request == null)
            {
                return BadRequest("Parameter hitung ongkir tidak boleh kosong.");
            }

            var result = _ruangrasaService.CalculateShippingCost(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/ruangrasa/tracking/update
        [HttpPost]
        [Route("tracking/update")]
        public IHttpActionResult UpdateDriverLocation([FromBody] ruangrasa.Models.Entity.DriverLocationHistory history)
        {
            if (history == null)
            {
                return BadRequest("Data GPS driver tidak boleh kosong.");
            }

            var result = _ruangrasaService.SaveDriverLocation(history);
            return Ok(result);
        }

        // GET: api/ruangrasa/tracking/latest/{orderId}
        [HttpGet]
        [Route("tracking/latest/{orderId}")]
        public IHttpActionResult GetLatestDriverLocation(string orderId)
        {
            var result = _ruangrasaService.GetLatestDriverLocation(orderId);
            return Ok(result);
        }

        // GET: api/ruangrasa/tracking/active-deliveries
        [HttpGet]
        [Route("tracking/active-deliveries")]
        public IHttpActionResult GetActiveDeliveries()
        {
            var result = _ruangrasaService.GetActiveDeliveryOrders();
            return Ok(result);
        }

        // GET: api/ruangrasa/users/profile/{userId}
        [HttpGet]
        [Route("users/profile/{userId:int}")]
        public IHttpActionResult GetUserProfile(int userId)
        {
            var result = _ruangrasaService.GetUserProfile(userId);
            if (!result.Success)
            {
                return NotFound();
            }
            return Ok(result);
        }

        // PUT: api/ruangrasa/users/profile/{userId}
        [HttpPut]
        [Route("users/profile/{userId:int}")]
        public IHttpActionResult UpdateUserProfile(int userId, [FromBody] UpdateProfileRequest request)
        {
            if (request == null)
            {
                return BadRequest("Data profil tidak valid.");
            }

            var result = _ruangrasaService.UpdateUserProfile(userId, request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // PUT: api/ruangrasa/users/change-password/{userId}
        [HttpPut]
        [Route("users/change-password/{userId:int}")]
        public IHttpActionResult ChangeUserPassword(int userId, [FromBody] ChangePasswordRequest request)
        {
            if (request == null)
            {
                return BadRequest("Data kata sandi tidak valid.");
            }

            var result = _ruangrasaService.ChangeUserPassword(userId, request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // GET: api/ruangrasa/orders/customer/{customerId}
        [HttpGet]
        [Route("orders/customer/{customerId:int}")]
        public IHttpActionResult GetCustomerOrders(int customerId)
        {
            var result = _ruangrasaService.GetCustomerOrders(customerId);
            return Ok(result);
        }

        // POST: api/ruangrasa/orders/{id}/cancel
        [HttpPost]
        [Route("orders/{id:int}/cancel")]
        public IHttpActionResult CancelOrder(int id, [FromBody] CancelOrderRequest req)
        {
            var reason = req != null ? req.Reason : null;
            var staffId = req != null ? req.StaffUserId : null;
            var result = _ruangrasaService.CancelOrder(id, reason, staffId);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // POST: api/ruangrasa/orders/{id}/verify-payment
        [HttpPost]
        [Route("orders/{id:int}/verify-payment")]
        public IHttpActionResult VerifyPayment(int id, [FromBody] VerifyPaymentRequest req)
        {
            if (req == null)
            {
                return BadRequest("Data verifikasi pembayaran tidak valid.");
            }
            var result = _ruangrasaService.VerifyPaymentProof(id, req.IsApproved, req.RejectReason, req.StaffUserId);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // POST: api/ruangrasa/orders/{id}/review
        [HttpPost]
        [Route("orders/{id:int}/review")]
        public IHttpActionResult SubmitReview(int id, [FromBody] OrderReviewRequest req)
        {
            if (req == null)
            {
                return BadRequest("Data ulasan tidak valid.");
            }
            req.OrderId = id;
            var result = _ruangrasaService.SubmitOrderReview(req);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // GET: api/ruangrasa/reviews/menu/{menuId}
        [HttpGet]
        [Route("reviews/menu/{menuId:int}")]
        public IHttpActionResult GetMenuReviews(int menuId)
        {
            var result = _ruangrasaService.GetMenuReviews(menuId);
            return Ok(result);
        }

        // GET: api/ruangrasa/staff
        [HttpGet]
        [Route("staff")]
        public IHttpActionResult GetStaffUsers()
        {
            var result = _ruangrasaService.GetStaffUsers();
            return Ok(result);
        }

        // PUT: api/ruangrasa/staff/{id}/toggle-status
        [HttpPut]
        [Route("staff/{id:int}/toggle-status")]
        public IHttpActionResult ToggleStaffStatus(int id)
        {
            var result = _ruangrasaService.ToggleStaffStatus(id);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // PUT: api/ruangrasa/staff/{id}
        [HttpPut]
        [Route("staff/{id:int}")]
        public IHttpActionResult UpdateStaff(int id, [FromBody] UpdateStaffRequest req)
        {
            var result = _ruangrasaService.UpdateStaffUser(id, req);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // DELETE: api/ruangrasa/staff/{id}
        [HttpDelete]
        [Route("staff/{id:int}")]
        public IHttpActionResult DeleteStaff(int id)
        {
            var result = _ruangrasaService.DeleteStaffUser(id);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }
            return Ok(result);
        }

        // DELETE: api/ruangrasa/menus/truncate
        [HttpDelete]
        [Route("menus/truncate")]
        public async Task<IHttpActionResult> TruncateMenus()
        {
            await _ruangrasaService.TruncateMasterMenu();
            return Ok(new { success = true, message = "Master menu berhasil di-reset" });
        }

        // ---------------------------------------------------------------------------------
        // SESSION & TOKEN (Ketentuan Backend #2: Refresh & Logout server-side)
        // ---------------------------------------------------------------------------------

        // POST: api/ruangrasa/auth/refresh
        [HttpPost]
        [Route("auth/refresh")]
        public IHttpActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ResponseMessage(Request.CreateResponse((HttpStatusCode)422, new
                {
                    success = false,
                    message = "Validasi gagal.",
                    errors = ModelState.Where(kvp => kvp.Value.Errors.Count > 0)
                        .ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Errors.Select(e => e.ErrorMessage).ToArray())
                }));
            }

            try
            {
                var userToken = _ruangrasaService.RefreshAuthentication(request);
                return Ok(ApiResponse<UserToken>.Ok(userToken, "Token berhasil diperbarui."));
            }
            catch (Exception ex)
            {
                return ResponseMessage(Request.CreateResponse(HttpStatusCode.Unauthorized, new
                {
                    success = false,
                    message = ex.Message
                }));
            }
        }

        // POST: api/ruangrasa/auth/logout
        [HttpPost]
        [Route("auth/logout")]
        public IHttpActionResult Logout([FromBody] LogoutRequest request)
        {
            // Client mengirim refresh token agar sesi diperpanjang dapat dicabut di server.
            var token = request?.RefreshToken;
            if (string.IsNullOrWhiteSpace(token))
            {
                // Lanjut ke pengecekan header di bawah
            }
            // Token juga dapat dikirim via header X-Refresh-Token (mode tanpa body)
            if (string.IsNullOrWhiteSpace(token))
            {
                IEnumerable<string> headerValues;
                if (Request.Headers.TryGetValues("X-Refresh-Token", out headerValues))
                {
                    token = headerValues.FirstOrDefault();
                }
            }

            var revoked = _ruangrasaService.RevokeRefreshToken(token);
            return Ok(new
            {
                success = true,
                message = revoked
                    ? "Logout berhasil. Refresh token telah dicabut di server."
                    : "Logout diterima (token tidak dikenal atau sudah tidak aktif)."
            });
        }

        // ---------------------------------------------------------------------------------
        // LIST ENDPOINT QUERY-STRING (Ketentuan Backend #12: GET dengan search/filter/sort/pagination)
        // ---------------------------------------------------------------------------------

        // GET: api/ruangrasa/menus?page=1&limit=10&search=kopi&category=1&sort=name&dir=asc
        [HttpGet]
        [Route("menus")]
        public IHttpActionResult GetMenus([FromUri] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _ruangrasaService.GetMenusPaging(param);
            return Ok(response);
        }
    }

    public class UpdateOrderStatusRequest
    {
        public string NewStatus { get; set; }
        public int? StaffUserId { get; set; }
    }

    public class UpdateTableStatusRequest
    {
        public string Status { get; set; }
    }
}
