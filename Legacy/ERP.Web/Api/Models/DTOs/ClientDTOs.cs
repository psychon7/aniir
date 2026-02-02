using System.Collections.Generic;

namespace ERP.Web.Api.Models.DTOs
{
    /// <summary>
    /// Request model for creating a new client
    /// </summary>
    public class ClientCreateRequest
    {
        public string CompanyName { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string Postcode { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public string Tel1 { get; set; }
        public string Tel2 { get; set; }
        public string Fax { get; set; }
        public string Cellphone { get; set; }
        public string Email { get; set; }
        public string Siren { get; set; }
        public string Siret { get; set; }
        public string VatIntra { get; set; }
        public int? ClientTypeId { get; set; }
        public List<int> ClientTypeIds { get; set; }
        public int? VatId { get; set; }
        public int? PaymentConditionId { get; set; }
        public int? PaymentModeId { get; set; }
        public int? CurrencyId { get; set; }
        public int? ActivityId { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }
        public string NewsletterEmail { get; set; }
        public bool ReceiveNewsletter { get; set; }
    }

    /// <summary>
    /// Request model for updating an existing client
    /// </summary>
    public class ClientUpdateRequest
    {
        public string CompanyName { get; set; }
        public string Address1 { get; set; }
        public string Address2 { get; set; }
        public string Postcode { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
        public string Tel1 { get; set; }
        public string Tel2 { get; set; }
        public string Fax { get; set; }
        public string Cellphone { get; set; }
        public string Email { get; set; }
        public string Siren { get; set; }
        public string Siret { get; set; }
        public string VatIntra { get; set; }
        public int? ClientTypeId { get; set; }
        public List<int> ClientTypeIds { get; set; }
        public int? VatId { get; set; }
        public int? PaymentConditionId { get; set; }
        public int? PaymentModeId { get; set; }
        public int? CurrencyId { get; set; }
        public int? ActivityId { get; set; }
        public string ClientComment { get; set; }
        public string InternalComment { get; set; }
        public string NewsletterEmail { get; set; }
        public bool? ReceiveNewsletter { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsBlocked { get; set; }
    }
}
