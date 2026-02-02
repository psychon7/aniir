using System.ComponentModel.DataAnnotations;

namespace ERP.Web.Api.Models.Auth
{
    public class RefreshTokenRequest
    {
        [Required]
        public string RefreshToken { get; set; }
    }
}
