using System;
using System.Collections.Generic;

namespace ERP.Web.Api.Models.DTOs
{
    /// <summary>
    /// Request model for searching invoices
    /// </summary>
    public class InvoiceSearchRequest
    {
        public string Search { get; set; }
        public int? ClientId { get; set; }
        public int? ProjectId { get; set; }
        public int? OrderId { get; set; }
        public string DateFrom { get; set; }
        public string DateTo { get; set; }
        public bool? IsInvoice { get; set; }
        public bool? IsPaid { get; set; }
        public bool? IsInvoiced { get; set; }
        public bool? KeyProjectOnly { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// Request model for creating a new invoice
    /// </summary>
    public class InvoiceCreateRequest
    {
        public int ClientId { get; set; }
        public int? ProjectId { get; set; }
        public int? OrderId { get; set; }
        public int? CostPlanId { get; set; }
        public int? ContactInvoicingId { get; set; }
        public int CurrencyId { get; set; }
        public int? PaymentConditionId { get; set; }
        public int? PaymentModeId { get; set; }
        public int? VatId { get; set; }
        public string Name { get; set; }
        public string InvoiceDate { get; set; }
        public string TermDate { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string HeaderText { get; set; }
        public string FooterText { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }
        public bool IsInvoice { get; set; } = true;
        public int? CreditNoteInvoiceId { get; set; }
        public int? BankId { get; set; }
        public int? TradeTermsId { get; set; }
        public int? DelegatorId { get; set; }
        public int? Commercial1Id { get; set; }
        public int? Commercial2Id { get; set; }
        public int? Commercial3Id { get; set; }
        public List<InvoiceLineCreateRequest> Lines { get; set; }
    }

    /// <summary>
    /// Request model for creating an invoice line
    /// </summary>
    public class InvoiceLineCreateRequest
    {
        public int? ProductId { get; set; }
        public string Description { get; set; }
        public string Reference { get; set; }
        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? VatId { get; set; }
        public int? LineTypeId { get; set; }
        public int? Level1 { get; set; }
        public int? Level2 { get; set; }
    }

    /// <summary>
    /// Request model for updating an existing invoice
    /// </summary>
    public class InvoiceUpdateRequest
    {
        public string Name { get; set; }
        public int? ContactInvoicingId { get; set; }
        public int? CurrencyId { get; set; }
        public int? PaymentConditionId { get; set; }
        public int? PaymentModeId { get; set; }
        public int? VatId { get; set; }
        public string InvoiceDate { get; set; }
        public string TermDate { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string HeaderText { get; set; }
        public string FooterText { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }
        public int? BankId { get; set; }
        public int? TradeTermsId { get; set; }
        public int? DelegatorId { get; set; }
        public int? Commercial1Id { get; set; }
        public int? Commercial2Id { get; set; }
        public int? Commercial3Id { get; set; }
        public bool? KeyProject { get; set; }
    }

    /// <summary>
    /// Request model for creating/updating an invoice line
    /// </summary>
    public class InvoiceLineUpdateRequest
    {
        public int? LineId { get; set; }
        public int? ProductId { get; set; }
        public string Description { get; set; }
        public string Reference { get; set; }
        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? VatId { get; set; }
        public int? LineTypeId { get; set; }
        public int? Level1 { get; set; }
        public int? Level2 { get; set; }
    }

    /// <summary>
    /// Request model for adding a payment to an invoice
    /// </summary>
    public class InvoicePaymentCreateRequest
    {
        public decimal Amount { get; set; }
        public string Comment { get; set; }
        public string PaymentDate { get; set; }
    }

    /// <summary>
    /// Response model for invoice summary in list views
    /// </summary>
    public class InvoiceListResponse
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }
        public int ClientId { get; set; }
        public string ClientName { get; set; }
        public string ClientAbbreviation { get; set; }
        public int? ProjectId { get; set; }
        public string ProjectCode { get; set; }
        public string ProjectName { get; set; }
        public int? OrderId { get; set; }
        public string OrderCode { get; set; }
        public string OrderName { get; set; }
        public string CreationDate { get; set; }
        public string InvoiceDate { get; set; }
        public string TermDate { get; set; }
        public decimal? AmountHt { get; set; }
        public decimal? AmountTtc { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? RestToPay { get; set; }
        public bool IsInvoice { get; set; }
        public bool IsInvoiced { get; set; }
        public bool? IsFullPaid { get; set; }
        public bool KeyProject { get; set; }
        public string CurrencySymbol { get; set; }
        public string PaymentComments { get; set; }
    }

    /// <summary>
    /// Response model for invoice detail view
    /// </summary>
    public class InvoiceDetailResponse
    {
        public int Id { get; set; }
        public string FId { get; set; }
        public string Code { get; set; }
        public string Name { get; set; }

        // Client info
        public int ClientId { get; set; }
        public string ClientFId { get; set; }
        public string ClientName { get; set; }
        public string ClientAbbreviation { get; set; }

        // Project info
        public int? ProjectId { get; set; }
        public string ProjectFId { get; set; }
        public string ProjectCode { get; set; }
        public string ProjectName { get; set; }

        // Order info
        public int? OrderId { get; set; }
        public string OrderFId { get; set; }
        public string OrderCode { get; set; }
        public string OrderName { get; set; }

        // Cost Plan info
        public int? CostPlanId { get; set; }
        public string CostPlanFId { get; set; }
        public string CostPlanCode { get; set; }
        public string CostPlanName { get; set; }

        // Dates
        public string CreationDate { get; set; }
        public string UpdateDate { get; set; }
        public string InvoiceDate { get; set; }
        public string TermDate { get; set; }
        public string CashingDate { get; set; }

        // Financial
        public int CurrencyId { get; set; }
        public string CurrencySymbol { get; set; }
        public int? VatId { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? AmountHt { get; set; }
        public decimal? AmountTtc { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? RestToPay { get; set; }
        public decimal? Margin { get; set; }

        // Payment
        public int PaymentConditionId { get; set; }
        public string PaymentCondition { get; set; }
        public int PaymentModeId { get; set; }
        public string PaymentMode { get; set; }

        // Status flags
        public bool IsInvoice { get; set; }
        public bool IsInvoiced { get; set; }
        public bool? IsFullPaid { get; set; }
        public bool KeyProject { get; set; }
        public bool CanCreateDeliveryForm { get; set; }

        // Text content
        public string HeaderText { get; set; }
        public string FooterText { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }

        // Bank info
        public int? BankId { get; set; }
        public string BankName { get; set; }
        public string BankIban { get; set; }
        public string BankBic { get; set; }

        // Trade terms
        public int? TradeTermsId { get; set; }
        public string TradeTerms { get; set; }

        // Credit note reference
        public int? CreditNoteInvoiceId { get; set; }
        public string CreditNoteInvoiceFId { get; set; }
        public string CreditNoteInvoiceCode { get; set; }

        // Contact info
        public int? ContactInvoicingId { get; set; }
        public string ContactFirstname { get; set; }
        public string ContactLastname { get; set; }
        public string ContactAddress1 { get; set; }
        public string ContactAddress2 { get; set; }
        public string ContactPostcode { get; set; }
        public string ContactCity { get; set; }
        public string ContactCountry { get; set; }
        public string ContactPhone { get; set; }
        public string ContactFax { get; set; }
        public string ContactMobile { get; set; }
        public string ContactEmail { get; set; }

        // Commercials
        public int? Commercial1Id { get; set; }
        public string Commercial1Name { get; set; }
        public int? Commercial2Id { get; set; }
        public string Commercial2Name { get; set; }
        public int? Commercial3Id { get; set; }
        public string Commercial3Name { get; set; }

        // Delegator
        public int? DelegatorId { get; set; }
        public string DelegatorName { get; set; }

        // Creator
        public int CreatorId { get; set; }
        public string CreatorName { get; set; }

        // Related data
        public List<InvoiceLineResponse> Lines { get; set; }
        public List<InvoicePaymentResponse> Payments { get; set; }
        public List<KeyValueResponse> SupplierOrders { get; set; }
        public List<KeyValueResponse> Logistics { get; set; }
    }

    /// <summary>
    /// Response model for invoice line
    /// </summary>
    public class InvoiceLineResponse
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public int? ProductId { get; set; }
        public string ProductFId { get; set; }
        public string ProductName { get; set; }
        public string ProductDescription { get; set; }
        public string Description { get; set; }
        public string Reference { get; set; }
        public decimal? Quantity { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? TotalPrice { get; set; }
        public decimal? TotalPriceWithDiscount { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? TotalCrudePrice { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public decimal? Margin { get; set; }
        public int? VatId { get; set; }
        public string VatLabel { get; set; }
        public decimal VatRate { get; set; }
        public int LineTypeId { get; set; }
        public string LineType { get; set; }
        public int? Level1 { get; set; }
        public int? Level2 { get; set; }
        public string ProductImagePath { get; set; }
        public decimal? LogisticsQuantity { get; set; }
        public decimal? DeliveryFormQuantity { get; set; }
    }

    /// <summary>
    /// Response model for invoice payment
    /// </summary>
    public class InvoicePaymentResponse
    {
        public int Id { get; set; }
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string PaymentDate { get; set; }
        public string Comment { get; set; }
        public string PaymentCode { get; set; }
        public bool HasFile { get; set; }
        public string FileGuid { get; set; }
    }

    /// <summary>
    /// Generic key-value response
    /// </summary>
    public class KeyValueResponse
    {
        public int Key { get; set; }
        public string Value { get; set; }
        public string Value2 { get; set; }
        public string Value3 { get; set; }
        public string FId { get; set; }
    }

    /// <summary>
    /// Response model for invoice financial info
    /// </summary>
    public class InvoiceFinancialInfo
    {
        public int InvoiceId { get; set; }
        public decimal? TotalAmountHt { get; set; }
        public decimal? TotalAmountTtc { get; set; }
        public decimal? TotalMargin { get; set; }
        public decimal? TotalPurchasePrice { get; set; }
        public decimal? TotalSalePrice { get; set; }
        public decimal? PaidAmount { get; set; }
        public decimal? RestToPay { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string CurrencySymbol { get; set; }
    }
}
