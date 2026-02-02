using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Principal;
using System.Threading;
using System.Web.Http.Controllers;
using System.Web.Http.Filters;
using ERP.Web.App_Start;

namespace ERP.Web.Api.Filters
{
    public class JwtAuthFilter : AuthorizationFilterAttribute
    {
        public override void OnAuthorization(HttpActionContext actionContext)
        {
            // Skip authorization for actions marked with AllowAnonymous
            if (actionContext.ActionDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Any() ||
                actionContext.ControllerContext.ControllerDescriptor.GetCustomAttributes<AllowAnonymousAttribute>().Any())
            {
                return;
            }

            var authHeader = actionContext.Request.Headers.Authorization;

            if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
            {
                actionContext.Response = CreateUnauthorizedResponse("Authorization header is required");
                return;
            }

            if (!authHeader.Scheme.Equals("Bearer", StringComparison.OrdinalIgnoreCase))
            {
                actionContext.Response = CreateUnauthorizedResponse("Bearer token required");
                return;
            }

            var token = authHeader.Parameter;
            var validationResult = JwtAuthConfig.ValidateToken(token);

            if (!validationResult.IsValid)
            {
                actionContext.Response = CreateUnauthorizedResponse(validationResult.ErrorMessage);
                return;
            }

            // Set the principal for the current request
            var identity = new GenericIdentity(validationResult.Username);
            identity.AddClaim(new System.Security.Claims.Claim("userId", validationResult.UserId.ToString()));
            identity.AddClaim(new System.Security.Claims.Claim("societyId", validationResult.SocietyId.ToString()));
            identity.AddClaim(new System.Security.Claims.Claim("roleId", validationResult.RoleId.ToString()));

            var principal = new GenericPrincipal(identity, null);
            Thread.CurrentPrincipal = principal;

            if (System.Web.HttpContext.Current != null)
            {
                System.Web.HttpContext.Current.User = principal;
            }

            base.OnAuthorization(actionContext);
        }

        private HttpResponseMessage CreateUnauthorizedResponse(string message)
        {
            return new HttpResponseMessage(HttpStatusCode.Unauthorized)
            {
                Content = new StringContent($"{{\"error\": \"{message}\"}}", System.Text.Encoding.UTF8, "application/json")
            };
        }
    }

    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class AllowAnonymousAttribute : Attribute
    {
    }
}
