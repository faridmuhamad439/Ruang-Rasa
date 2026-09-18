using System;
using System.Collections.Generic;

namespace ruangrasa.Models.ViewModel
{
    // =========================================================================
    // 1. QRIS Payment Models
    // =========================================================================
    public class QrisGenerateRequest
    {
        public int? OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal Amount { get; set; }
        public string CustomerName { get; set; }
        public string CustomerEmail { get; set; }
    }

    public class QrisPaymentResponse
    {
        public string TransactionReference { get; set; }
        public int? OrderId { get; set; }
        public string OrderNumber { get; set; }
        public string MerchantName { get; set; } = "RUANG RASA QRIS";
        public string Nmid { get; set; } = "ID1020039485710";
        public string QrString { get; set; }
        public string QrImageUrl { get; set; }
        public decimal Amount { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; } = "Pending";
    }

    public class QrisVerifyRequest
    {
        public string TransactionReference { get; set; }
        public int OrderId { get; set; }
    }

    public class QrisVerifyResponse
    {
        public bool IsPaid { get; set; }
        public string Status { get; set; }
        public string TransactionReference { get; set; }
        public string Message { get; set; }
    }

    // =========================================================================
    // 2. Virtual Account / Bank Transfer Models
    // =========================================================================
    public class TransferGenerateRequest
    {
        public int? OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal Amount { get; set; }
        public string Bank { get; set; } = "BCA"; // BCA, MANDIRI, BNI, BRI, PERMATA
        public string CustomerName { get; set; }
    }

    public class TransferPaymentResponse
    {
        public string TransactionReference { get; set; }
        public int? OrderId { get; set; }
        public string OrderNumber { get; set; }
        public string Bank { get; set; }
        public string BankName { get; set; }
        public string VaNumber { get; set; }
        public string AccountName { get; set; } = "RUANG RASA BRAGA";
        public decimal Amount { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; } = "Pending";
        public List<string> Instructions { get; set; } = new List<string>();
    }

    public class TransferVerifyRequest
    {
        public int OrderId { get; set; }
        public string TransactionReference { get; set; }
        public string VaNumber { get; set; }
    }

    // =========================================================================
    // 3. Card Payment Models (Debit & Credit Card)
    // =========================================================================
    public class CardPaymentRequest
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal Amount { get; set; }
        public string CardNumber { get; set; }
        public string CardHolderName { get; set; }
        public string ExpiryMonth { get; set; }
        public string ExpiryYear { get; set; }
        public string Cvv { get; set; }
        public string CardType { get; set; } = "DebitCard"; // DebitCard / CreditCard
    }

    public class CardPaymentResponse
    {
        public bool IsSuccess { get; set; }
        public string TransactionReference { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public string MaskedCardNumber { get; set; }
        public string CardType { get; set; }
        public string AuthCode { get; set; }
        public decimal Amount { get; set; }
        public DateTime PaidAt { get; set; }
        public string Message { get; set; }
    }

    // =========================================================================
    // 4. Cash Payment Models (Kasir Braga & COD)
    // =========================================================================
    public class CashPaymentRequest
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TenderedAmount { get; set; } // Uang yang diserahkan pembeli
        public string CashierNotes { get; set; }
    }

    public class CashPaymentResponse
    {
        public bool IsSuccess { get; set; }
        public string TransactionReference { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal TenderedAmount { get; set; }
        public decimal ChangeAmount { get; set; } // Kembalian
        public DateTime PaidAt { get; set; }
        public string Message { get; set; }
    }

    // =========================================================================
    // 5. Universal Payment Dispatcher & Status
    // =========================================================================
    public class ProcessPaymentRequest
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public string PaymentMethod { get; set; } // 'RUANG RASA QRIS', 'Transfer', 'DebitCard', 'Cash'
        public decimal Amount { get; set; }
        public string Bank { get; set; }
        public string CardNumber { get; set; }
        public string CardHolderName { get; set; }
        public string ExpiryMonth { get; set; }
        public string ExpiryYear { get; set; }
        public string Cvv { get; set; }
        public decimal? TenderedAmount { get; set; }
    }

    public class ProcessPaymentResponse
    {
        public bool IsSuccess { get; set; }
        public string Status { get; set; }
        public string PaymentMethod { get; set; }
        public string TransactionReference { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public decimal Amount { get; set; }
        public decimal ChangeAmount { get; set; }
        public string Message { get; set; }
        public object Details { get; set; }
    }

    public class PaymentStatusResponse
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; }
        public string OrderStatus { get; set; }
        public string PaymentMethod { get; set; }
        public string PaymentStatus { get; set; }
        public decimal AmountPaid { get; set; }
        public decimal ChangeAmount { get; set; }
        public string TransactionReference { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // =========================================================================
    // 6. RajaOngkir Models
    // =========================================================================
    public class RajaOngkirCityModel
    {
        public string CityId { get; set; }
        public string Province { get; set; }
        public string CityName { get; set; }
        public string Type { get; set; }
        public string PostalCode { get; set; }
    }

    public class RajaOngkirCostRequest
    {
        public string OriginCityId { get; set; } = "152"; // Default Jakarta Pusat
        public string DestinationCityId { get; set; }
        public int WeightGrams { get; set; } = 500; // 500g default untuk pesanan kopi & pastry
        public string Courier { get; set; } = "jne"; // jne, tiki, pos, express
    }

    public class RajaOngkirServiceCost
    {
        public string Service { get; set; }
        public string Description { get; set; }
        public decimal Cost { get; set; }
        public string Etd { get; set; }
    }

    public class RajaOngkirCostResponse
    {
        public string Courier { get; set; }
        public string OriginCity { get; set; }
        public string DestinationCity { get; set; }
        public List<RajaOngkirServiceCost> Services { get; set; } = new List<RajaOngkirServiceCost>();
    }
}
