using System.Linq;
using System.Security.Principal;
using System.Web.Http;

namespace ERP.Web.Api.Controllers
{
    /// <summary>
    /// Base controller with common helper methods for API controllers
    /// </summary>
    public abstract class BaseApiController : ApiController
    {
        /// <summary>
        /// Get the current authenticated user's ID from the JWT token
        /// </summary>
        protected int GetCurrentUserId()
        {
            var identity = User.Identity as GenericIdentity;
            var userIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "userId");
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return 0;
        }

        /// <summary>
        /// Get the current authenticated user's society ID from the JWT token
        /// </summary>
        protected int GetCurrentSocietyId()
        {
            var identity = User.Identity as GenericIdentity;
            var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
            if (societyIdClaim != null && int.TryParse(societyIdClaim.Value, out int societyId))
            {
                return societyId;
            }
            return 0;
        }

        /// <summary>
        /// Get the current authenticated user's role ID from the JWT token
        /// </summary>
        protected int GetCurrentRoleId()
        {
            var identity = User.Identity as GenericIdentity;
            var roleIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "roleId");
            if (roleIdClaim != null && int.TryParse(roleIdClaim.Value, out int roleId))
            {
                return roleId;
            }
            return 0;
        }

        /// <summary>
        /// Get the current authenticated user's username from the JWT token
        /// </summary>
        protected string GetCurrentUsername()
        {
            return User.Identity?.Name;
        }
    }
}
