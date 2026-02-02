namespace ERP.Web.Api.Models.DTOs
{
    /// <summary>
    /// Request model for creating a new user
    /// </summary>
    public class UserCreateRequest
    {
        public string UserLogin { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
        public string Cellphone { get; set; }
        public string Fax { get; set; }
        public string Title { get; set; }
        public int? RoleId { get; set; }
        public int? CivilityId { get; set; }
    }

    /// <summary>
    /// Request model for updating an existing user
    /// </summary>
    public class UserUpdateRequest
    {
        public string UserLogin { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Telephone { get; set; }
        public string Cellphone { get; set; }
        public string Fax { get; set; }
        public string Title { get; set; }
        public int? RoleId { get; set; }
        public int? CivilityId { get; set; }
        public bool? IsActive { get; set; }
    }

    /// <summary>
    /// Request model for changing password
    /// </summary>
    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }
}
