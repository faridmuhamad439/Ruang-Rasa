using System;
using System.Threading.Tasks;
using System.Web.Http;
using ruangrasa.Models.ViewModel;
using ruangrasa.Services.Impl;
using ruangrasa.Services.Interface;

namespace ruangrasa.Controllers
{
    [RoutePrefix("api/dataweb")]
    public class DataWebApiController : ApiController
    {
        // Penerapan arsitektur MVCS: Controller hanya bertugas menerima HTTP request,
        // memvalidasi model state, dan mendelegasikan seluruh logika bisnis ke Service.
        private readonly IDataWebService _dataWebService;

        public DataWebApiController()
        {
            _dataWebService = new DataWebService();
        }

        public DataWebApiController(IDataWebService dataWebService)
        {
            _dataWebService = dataWebService;
        }

        // GET: api/dataweb/cek-koneksi
        [HttpGet]
        [Route("cek-koneksi")]
        public IHttpActionResult CekKoneksi()
        {
            var result = _dataWebService.CekKoneksiDB();
            return Ok(new { success = true, message = result });
        }

        // GET: api/dataweb/sales
        [HttpGet]
        [Route("sales")]
        public IHttpActionResult GetSales()
        {
            var data = _dataWebService.GetSalesModels();
            return Ok(new { success = true, data });
        }

        // POST: api/dataweb/sales/paging
        [HttpPost]
        [Route("sales/paging")]
        public IHttpActionResult GetSalesPaging([FromBody] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _dataWebService.GetSalesModelsPaging(param);
            return Ok(response);
        }

        // GET: api/dataweb/dashboard
        [HttpGet]
        [Route("dashboard")]
        public IHttpActionResult GetDashboardSummary()
        {
            var summary = _dataWebService.GetDashboardSummary();
            return Ok(new { success = true, data = summary });
        }

        // POST: api/dataweb/auth/login
        [HttpPost]
        [Route("auth/login")]
        public IHttpActionResult Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var token = _dataWebService.Authenticate(request);
                return Ok(new { success = true, message = "Login berhasil", data = token });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/dataweb/auth/register
        [HttpPost]
        [Route("auth/register")]
        public IHttpActionResult Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _dataWebService.Register(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/menus/paging
        [HttpPost]
        [Route("menus/paging")]
        public IHttpActionResult GetMenusPaging([FromBody] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _dataWebService.GetMenusPaging(param);
            return Ok(response);
        }

        // GET: api/dataweb/menus/{id}
        [HttpGet]
        [Route("menus/{id:int}")]
        public IHttpActionResult GetMenuById(int id)
        {
            var result = _dataWebService.GetMenuById(id);
            if (!result.Success)
            {
                return NotFound();
            }
            return Ok(result);
        }

        // POST: api/dataweb/menus
        [HttpPost]
        [Route("menus")]
        public IHttpActionResult CreateMenu([FromBody] ruangrasa.Models.Entity.Menu menu)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _dataWebService.CreateMenu(menu);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // PUT: api/dataweb/menus/{id}
        [HttpPut]
        [Route("menus/{id:int}")]
        public IHttpActionResult UpdateMenu(int id, [FromBody] ruangrasa.Models.Entity.Menu menu)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _dataWebService.UpdateMenu(id, menu);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // DELETE: api/dataweb/menus/{id}
        [HttpDelete]
        [Route("menus/{id:int}")]
        public IHttpActionResult DeleteMenu(int id)
        {
            var result = _dataWebService.DeleteMenu(id);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // GET: api/dataweb/categories
        [HttpGet]
        [Route("categories")]
        public IHttpActionResult GetCategories()
        {
            var categories = _dataWebService.GetCategories();
            return Ok(new { success = true, data = categories });
        }

        // GET: api/dataweb/tables/available
        [HttpGet]
        [Route("tables/available")]
        public IHttpActionResult GetAvailableTables()
        {
            var tables = _dataWebService.GetAvailableTables();
            return Ok(new { success = true, data = tables });
        }

        // GET: api/dataweb/tables
        [HttpGet]
        [Route("tables")]
        public IHttpActionResult GetAllTables()
        {
            var tables = _dataWebService.GetAllTables();
            return Ok(new { success = true, data = tables });
        }

        // PUT: api/dataweb/tables/{id}/status
        [HttpPut]
        [Route("tables/{id:int}/status")]
        public IHttpActionResult UpdateTableStatus(int id, [FromBody] UpdateTableStatusRequest req)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Status))
            {
                return BadRequest("Status meja harus diisi.");
            }

            var response = _dataWebService.UpdateTableStatus(id, req.Status);
            if (!response.Success)
            {
                return BadRequest(response.Message);
            }

            return Ok(response);
        }

        // POST: api/dataweb/orders
        [HttpPost]
        [Route("orders")]
        public IHttpActionResult CreateOrder([FromBody] CreateOrderRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var response = _dataWebService.CreateOrder(request);
            if (!response.Success)
            {
                return BadRequest(response.Message);
            }

            return Ok(response);
        }

        // PUT: api/dataweb/orders/{id}/status
        [HttpPut]
        [Route("orders/{id:int}/status")]
        public IHttpActionResult UpdateOrderStatus(int id, [FromBody] UpdateStatusRequest statusReq)
        {
            if (statusReq == null || string.IsNullOrWhiteSpace(statusReq.NewStatus))
            {
                return BadRequest("Status baru wajib diisi.");
            }

            var result = _dataWebService.UpdateOrderStatus(id, statusReq.NewStatus, statusReq.StaffUserId);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // GET: api/dataweb/promos
        [HttpGet]
        [Route("promos")]
        public IHttpActionResult GetActivePromos()
        {
            var promos = _dataWebService.GetActivePromos();
            return Ok(new { success = true, data = promos });
        }

        // POST: api/dataweb/promos/paging
        [HttpPost]
        [Route("promos/paging")]
        public IHttpActionResult GetPromosPaging([FromBody] ParameterViewModel param)
        {
            param = param ?? new ParameterViewModel();
            var response = _dataWebService.GetPromosPaging(param);
            return Ok(response);
        }

        // GET: api/dataweb/promos/{id}
        [HttpGet]
        [Route("promos/{id:int}")]
        public IHttpActionResult GetPromoById(int id)
        {
            var result = _dataWebService.GetPromoById(id);
            if (!result.Success)
            {
                return NotFound();
            }
            return Ok(result);
        }

        // POST: api/dataweb/promos
        [HttpPost]
        [Route("promos")]
        public IHttpActionResult CreatePromo([FromBody] ruangrasa.Models.Entity.Promo promo)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _dataWebService.CreatePromo(promo);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // PUT: api/dataweb/promos/{id}
        [HttpPut]
        [Route("promos/{id:int}")]
        public IHttpActionResult UpdatePromo(int id, [FromBody] ruangrasa.Models.Entity.Promo promo)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = _dataWebService.UpdatePromo(id, promo);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // DELETE: api/dataweb/promos/{id}
        [HttpDelete]
        [Route("promos/{id:int}")]
        public IHttpActionResult DeletePromo(int id)
        {
            var result = _dataWebService.DeletePromo(id);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/promos/validate
        [HttpPost]
        [Route("promos/validate")]
        public IHttpActionResult ValidatePromo([FromBody] ValidatePromoRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PromoCode))
            {
                return BadRequest("Kode promo wajib diisi.");
            }

            var result = _dataWebService.ValidatePromo(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/qris/generate
        [HttpPost]
        [Route("payment/qris/generate")]
        public IHttpActionResult GenerateQrisPayment([FromBody] QrisGenerateRequest request)
        {
            if (request == null || request.Amount <= 0)
            {
                return BadRequest("Nominal transaksi QRIS tidak valid.");
            }

            var result = _dataWebService.GenerateQrisPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/qris/verify
        [HttpPost]
        [Route("payment/qris/verify")]
        public IHttpActionResult VerifyQrisPayment([FromBody] QrisVerifyRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data pesanan dan transaksi verifikasi QRIS wajib diisi.");
            }

            var result = _dataWebService.VerifyQrisPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/transfer/generate
        [HttpPost]
        [Route("payment/transfer/generate")]
        public IHttpActionResult GenerateTransferPayment([FromBody] TransferGenerateRequest request)
        {
            if (request == null || request.Amount <= 0)
            {
                return BadRequest("Nominal transaksi transfer tidak valid.");
            }

            var result = _dataWebService.GenerateTransferPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/transfer/verify
        [HttpPost]
        [Route("payment/transfer/verify")]
        public IHttpActionResult VerifyTransferPayment([FromBody] TransferVerifyRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data verifikasi transfer tidak valid.");
            }

            var result = _dataWebService.VerifyTransferPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/card/process
        [HttpPost]
        [Route("payment/card/process")]
        public IHttpActionResult ProcessCardPayment([FromBody] CardPaymentRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data pembayaran kartu tidak valid.");
            }

            var result = _dataWebService.ProcessCardPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/cash/confirm
        [HttpPost]
        [Route("payment/cash/confirm")]
        public IHttpActionResult ConfirmCashPayment([FromBody] CashPaymentRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Data pembayaran tunai tidak valid.");
            }

            var result = _dataWebService.ConfirmCashPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/payment/process
        [HttpPost]
        [Route("payment/process")]
        public IHttpActionResult ProcessPayment([FromBody] ProcessPaymentRequest request)
        {
            if (request == null || request.OrderId <= 0)
            {
                return BadRequest("Permintaan pembayaran tidak valid.");
            }

            var result = _dataWebService.ProcessPayment(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // GET: api/dataweb/payment/status/{orderId}
        [HttpGet]
        [Route("payment/status/{orderId}")]
        public IHttpActionResult GetPaymentStatus(int orderId)
        {
            var result = _dataWebService.GetPaymentStatus(orderId);
            if (!result.Success)
            {
                return NotFound();
            }

            return Ok(result);
        }

        // GET: api/dataweb/shipping/cities
        [HttpGet]
        [Route("shipping/cities")]
        public IHttpActionResult GetShippingCities()
        {
            var result = _dataWebService.GetRajaOngkirCities();
            return Ok(result);
        }

        // POST: api/dataweb/shipping/calculate-cost
        [HttpPost]
        [Route("shipping/calculate-cost")]
        public IHttpActionResult CalculateShippingCost([FromBody] RajaOngkirCostRequest request)
        {
            if (request == null)
            {
                return BadRequest("Parameter hitung ongkir tidak boleh kosong.");
            }

            var result = _dataWebService.CalculateShippingCost(request);
            if (!result.Success)
            {
                return BadRequest(result.Message);
            }

            return Ok(result);
        }

        // POST: api/dataweb/tracking/update
        [HttpPost]
        [Route("tracking/update")]
        public IHttpActionResult UpdateDriverLocation([FromBody] ruangrasa.Models.Entity.DriverLocationHistory history)
        {
            if (history == null)
            {
                return BadRequest("Data GPS driver tidak boleh kosong.");
            }

            var result = _dataWebService.SaveDriverLocation(history);
            return Ok(result);
        }

        // GET: api/dataweb/tracking/latest/{orderId}
        [HttpGet]
        [Route("tracking/latest/{orderId}")]
        public IHttpActionResult GetLatestDriverLocation(string orderId)
        {
            var result = _dataWebService.GetLatestDriverLocation(orderId);
            return Ok(result);
        }

        // GET: api/dataweb/tracking/active-deliveries
        [HttpGet]
        [Route("tracking/active-deliveries")]
        public IHttpActionResult GetActiveDeliveries()
        {
            var result = _dataWebService.GetActiveDeliveryOrders();
            return Ok(result);
        }

        // DELETE: api/dataweb/products/truncate
        [HttpDelete]
        [Route("products/truncate")]
        public async Task<IHttpActionResult> TruncateProducts()
        {
            await _dataWebService.TruncateMasterProduct();
            return Ok(new { success = true, message = "Master produk berhasil di-reset" });
        }
    }

    public class UpdateStatusRequest
    {
        public string NewStatus { get; set; }
        public int? StaffUserId { get; set; }
    }
}
