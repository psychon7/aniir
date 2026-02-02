using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using ERP.DataServices;
using ERP.Web.Api.Filters;
using ERP.Web.Api.Helpers;
using ERP.Web.Api.Models.Auth;
using ERP.Web.App_Start;

namespace ERP.Web.Api.Controllers
{
    [RoutePrefix("api/v1/auth")]
    public class AuthController : ApiController
    {
        private readonly UserServices _userServices = new UserServices();

        /// <summary>
        /// Authenticate user and return JWT tokens
        /// </summary>
        [HttpPost]
        [Route("login")]
        [AllowAnonymous]
        public IHttpActionResult Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Username) || string.IsNullOrEmpty(request.Password))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Username and password are required"));
            }

            try
            {
                var user = _userServices.LogIn(request.Username, request.Password);

                if (user == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid username or password", HttpStatusCode.Unauthorized));
                }

                if (!user.Is_Active)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("User account is inactive", HttpStatusCode.Unauthorized));
                }

                // Generate JWT tokens
                var accessToken = JwtAuthConfig.GenerateAccessToken(
                    user.Id,
                    user.Soc_id,
                    user.RolId,
                    user.UserLogin
                );
                var refreshToken = JwtAuthConfig.GenerateRefreshToken();

                // TODO: Store refresh token in database for validation
                // For now, we'll use a simple approach

                var response = new LoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = JwtAuthConfig.GetAccessTokenExpirySeconds(),
                    User = new UserInfo
                    {
                        Id = user.Id,
                        Username = user.UserLogin,
                        FirstName = user.Firstname,
                        LastName = user.Lastname,
                        Email = user.Email,
                        RoleId = user.RolId,
                        RoleName = user.RoleName,
                        SocietyId = user.Soc_id,
                        SocietyName = user.Society?.Name,
                        IsAdmin = user.IsAdmin,
                        PhotoPath = user.PhotoPath
                    }
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(response, "Login successful"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Login error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("An error occurred during authentication", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Refresh access token using refresh token
        /// </summary>
        [HttpPost]
        [Route("refresh")]
        [AllowAnonymous]
        public IHttpActionResult RefreshToken([FromBody] RefreshTokenRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.RefreshToken))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Refresh token is required"));
            }

            try
            {
                // TODO: Validate refresh token from database
                // For now, we'll need the access token to get user info
                var authHeader = Request.Headers.Authorization;
                if (authHeader == null || string.IsNullOrEmpty(authHeader.Parameter))
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Current access token required for refresh", HttpStatusCode.Unauthorized));
                }

                // Validate the current token (even if expired, we can extract claims)
                var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadJwtToken(authHeader.Parameter);

                var userId = int.Parse(jwtToken.Subject);
                var user = _userServices.GetUserInfo(userId);

                if (user == null || !user.Is_Active)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("User not found or inactive", HttpStatusCode.Unauthorized));
                }

                // Generate new tokens
                var accessToken = JwtAuthConfig.GenerateAccessToken(
                    user.Id,
                    user.Soc_id,
                    user.RolId,
                    user.UserLogin
                );
                var newRefreshToken = JwtAuthConfig.GenerateRefreshToken();

                var response = new LoginResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = newRefreshToken,
                    ExpiresIn = JwtAuthConfig.GetAccessTokenExpirySeconds(),
                    User = new UserInfo
                    {
                        Id = user.Id,
                        Username = user.UserLogin,
                        FirstName = user.Firstname,
                        LastName = user.Lastname,
                        Email = user.Email,
                        RoleId = user.RolId,
                        RoleName = user.RoleName,
                        SocietyId = user.Soc_id,
                        SocietyName = user.Society?.Name,
                        IsAdmin = user.IsAdmin,
                        PhotoPath = user.PhotoPath
                    }
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(response, "Token refreshed successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Refresh token error: {ex}");
                return Content(HttpStatusCode.Unauthorized,
                    ApiResponseHelper.CreateErrorResponse("Invalid or expired token", HttpStatusCode.Unauthorized));
            }
        }

        /// <summary>
        /// Logout user (invalidate refresh token)
        /// </summary>
        [HttpPost]
        [Route("logout")]
        [JwtAuthFilter]
        public IHttpActionResult Logout()
        {
            try
            {
                // TODO: Invalidate refresh token in database
                // For now, just return success - client should delete tokens
                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Logout successful"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Logout error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("An error occurred during logout", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get current user information
        /// </summary>
        [HttpGet]
        [Route("me")]
        [JwtAuthFilter]
        public IHttpActionResult GetCurrentUser()
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                if (identity == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("User not authenticated", HttpStatusCode.Unauthorized));
                }

                var userIdClaim = identity.Claims.FirstOrDefault(c => c.Type == "userId");
                if (userIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                int userId;
                if (!int.TryParse(userIdClaim.Value, out userId))
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid user ID in token", HttpStatusCode.Unauthorized));
                }

                var user = _userServices.GetUserInfo(userId);

                if (user == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("User not found", HttpStatusCode.NotFound));
                }

                var userInfo = new UserInfo
                {
                    Id = user.Id,
                    Username = user.UserLogin,
                    FirstName = user.Firstname,
                    LastName = user.Lastname,
                    Email = user.Email,
                    RoleId = user.RolId,
                    RoleName = user.RoleName,
                    SocietyId = user.Soc_id,
                    SocietyName = user.Society?.Name,
                    IsAdmin = user.IsAdmin,
                    PhotoPath = user.PhotoPath
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(userInfo));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Get user error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("An error occurred", HttpStatusCode.InternalServerError));
            }
        }

    }
}
