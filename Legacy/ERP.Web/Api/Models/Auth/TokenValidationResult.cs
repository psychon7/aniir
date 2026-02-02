namespace ERP.Web.Api.Models.Auth
{
    public class TokenValidationResult
    {
        public bool IsValid { get; set; }
        public int UserId { get; set; }
        public int SocietyId { get; set; }
        public int RoleId { get; set; }
        public string Username { get; set; }
        public string ErrorMessage { get; set; }
    }
}
