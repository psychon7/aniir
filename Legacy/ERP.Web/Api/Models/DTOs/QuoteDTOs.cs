using System;
using System.Collections.Generic;

namespace ERP.Web.Api.Models.DTOs
{
    /// <summary>
    /// Request model for creating a new quote
    /// </summary>
    public class QuoteCreateRequest
    {
        public string Name { get; set; }
        public int ClientId { get; set; }
        public int? ProjectId { get; set; }
        public int? VatId { get; set; }
        public int? PaymentConditionId { get; set; }
        public int? PaymentModeId { get; set; }
        public DateTime? ValidityDate { get; set; }
        public DateTime? PreDeliveryDate { get; set; }
        public string HeaderText { get; set; }
        public string FooterText { get; set; }
        public int? InvoicingContactId { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? Commercial1Id { get; set; }
        public int? Commercial2Id { get; set; }
        public int? Commercial3Id { get; set; }
        public bool IsKeyProject { get; set; }
        public List<QuoteLineCreateRequest> Lines { get; set; }
    }

    /// <summary>
    /// Request model for updating an existing quote
    /// </summary>
    public class QuoteUpdateRequest
    {
        public string Name { get; set; }
        public int? ClientId { get; set; }
        public int? ProjectId { get; set; }
        public int? VatId { get; set; }
        public int? PaymentConditionId { get; set; }
        public int? PaymentModeId { get; set; }
        public int? StatusId { get; set; }
        public DateTime? ValidityDate { get; set; }
        public DateTime? PreDeliveryDate { get; set; }
        public string HeaderText { get; set; }
        public string FooterText { get; set; }
        public int? InvoicingContactId { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public int? Commercial1Id { get; set; }
        public int? Commercial2Id { get; set; }
        public int? Commercial3Id { get; set; }
        public bool? IsKeyProject { get; set; }
    }

    /// <summary>
    /// Request model for creating a quote line
    /// </summary>
    public class QuoteLineCreateRequest
    {
        public int? Level1 { get; set; }
        public int? Level2 { get; set; }
        public string Description { get; set; }
        public int? ProductId { get; set; }
        public string ProductName { get; set; }
        public int? ProductInstanceId { get; set; }
        public string ProductInstanceName { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Quantity { get; set; }
        public int? VatId { get; set; }
        public int LineTypeId { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string ProductDescription { get; set; }
    }

    /// <summary>
    /// Request model for updating a quote line
    /// </summary>
    public class QuoteLineUpdateRequest
    {
        public int? Level1 { get; set; }
        public int? Level2 { get; set; }
        public string Description { get; set; }
        public int? ProductId { get; set; }
        public string ProductName { get; set; }
        public int? ProductInstanceId { get; set; }
        public string ProductInstanceName { get; set; }
        public decimal? PurchasePrice { get; set; }
        public decimal? UnitPrice { get; set; }
        public decimal? Quantity { get; set; }
        public int? VatId { get; set; }
        public int? LineTypeId { get; set; }
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
        public string ProductDescription { get; set; }
    }

    /// <summary>
    /// Search parameters for quotes
    /// </summary>
    public class QuoteSearchParams
    {
        public string Search { get; set; }
        public string QuoteName { get; set; }
        public string QuoteCode { get; set; }
        public string ClientName { get; set; }
        public string ProjectCode { get; set; }
        public string ProjectName { get; set; }
        public int? StatusId { get; set; }
        public string DateFrom { get; set; }
        public string DateTo { get; set; }
        public string Keyword { get; set; }
        public bool? FromSite { get; set; }
        public bool? IsKeyProject { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    /// <summary>
    /// Request model for changing quote status
    /// </summary>
    public class QuoteStatusChangeRequest
    {
        public List<int> QuoteIds { get; set; }
        public int StatusId { get; set; }
    }

    /// <summary>
    /// Request model for updating quote discount
    /// </summary>
    public class QuoteDiscountRequest
    {
        public decimal? DiscountPercentage { get; set; }
        public decimal? DiscountAmount { get; set; }
    }

    /// <summary>
    /// Request model for updating quote commercials
    /// </summary>
    public class QuoteCommercialRequest
    {
        public int? Commercial1Id { get; set; }
        public int? Commercial2Id { get; set; }
        public int? Commercial3Id { get; set; }
    }

    /// <summary>
    /// Request model for duplicating a quote
    /// </summary>
    public class QuoteDuplicateRequest
    {
        public bool SameProject { get; set; }
    }
}
