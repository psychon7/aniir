using System;
using System.Net;
using System.Web.Http;
using ERP.DataServices;
using ERP.Entities;
using ERP.Web.Api.Filters;
using ERP.Web.Api.Helpers;
using ERP.Web.Api.Models.DTOs;

namespace ERP.Web.Api.Controllers
{
    /// <summary>
    /// User management endpoints
    /// </summary>
    [RoutePrefix("api/v1/users")]
    [JwtAuthFilter]
    public class UsersController : BaseApiController
    {
        private readonly UserServices _userServices = new UserServices();

        /// <summary>
        /// Get all users for the current society
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult GetUsers()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var users = _userServices.GetUserList(societyId, userId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(users));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetUsers error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve users", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a specific user by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetUser(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var user = _userServices.GetOneUser(societyId, id);

                if (user == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("User not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(user));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetUser error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve user", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateUser([FromBody] UserCreateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            if (string.IsNullOrEmpty(request.UserLogin))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("User login is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var creatorId = GetCurrentUserId();

                // Check if login already exists
                if (_userServices.CheckLoginExisted(societyId, 0, request.UserLogin))
                {
                    return Content(HttpStatusCode.Conflict,
                        ApiResponseHelper.CreateErrorResponse("User login already exists", HttpStatusCode.Conflict));
                }

                var user = new User
                {
                    Soc_id = societyId,
                    UsrCreatorId = creatorId,
                    UserLogin = request.UserLogin,
                    Firstname = request.FirstName,
                    Lastname = request.LastName,
                    Email = request.Email,
                    Telephone = request.Telephone,
                    Cellphone = request.Cellphone,
                    Fax = request.Fax,
                    Title = request.Title,
                    RolId = request.RoleId ?? 3, // Default to commercial
                    Civ_Id = request.CivilityId ?? 1,
                    Is_Active = true,
                    DCreation = DateTime.Now,
                    DUpdate = DateTime.Now
                };

                var userId = _userServices.CreateUpdateUser(user);

                if (userId > 0)
                {
                    var createdUser = _userServices.GetOneUser(societyId, userId);
                    return Content(HttpStatusCode.Created,
                        ApiResponseHelper.CreateSuccessResponse(createdUser, "User created successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to create user"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateUser error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create user", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateUser(int id, [FromBody] UserUpdateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var creatorId = GetCurrentUserId();
                var existingUser = _userServices.GetOneUser(societyId, id);

                if (existingUser == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("User not found", HttpStatusCode.NotFound));
                }

                // Check if login is being changed and already exists
                if (!string.IsNullOrEmpty(request.UserLogin) && request.UserLogin != existingUser.UserLogin)
                {
                    if (_userServices.CheckLoginExisted(societyId, id, request.UserLogin))
                    {
                        return Content(HttpStatusCode.Conflict,
                            ApiResponseHelper.CreateErrorResponse("User login already exists", HttpStatusCode.Conflict));
                    }
                    existingUser.UserLogin = request.UserLogin;
                }

                // Update fields
                existingUser.Firstname = request.FirstName ?? existingUser.Firstname;
                existingUser.Lastname = request.LastName ?? existingUser.Lastname;
                existingUser.Email = request.Email ?? existingUser.Email;
                existingUser.Telephone = request.Telephone ?? existingUser.Telephone;
                existingUser.Cellphone = request.Cellphone ?? existingUser.Cellphone;
                existingUser.Fax = request.Fax ?? existingUser.Fax;
                existingUser.Title = request.Title ?? existingUser.Title;

                if (request.RoleId.HasValue)
                    existingUser.RolId = request.RoleId.Value;
                if (request.CivilityId.HasValue)
                    existingUser.Civ_Id = request.CivilityId.Value;
                if (request.IsActive.HasValue)
                    existingUser.Is_Active = request.IsActive.Value;

                existingUser.DUpdate = DateTime.Now;
                existingUser.UsrCreatorId = creatorId;

                _userServices.CreateUpdateUser(existingUser);

                var updatedUser = _userServices.GetOneUser(societyId, id);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedUser, "User updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateUser error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update user", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Change user password
        /// </summary>
        [HttpPost]
        [Route("{id:int}/change-password")]
        public IHttpActionResult ChangePassword(int id, [FromBody] ChangePasswordRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.NewPassword))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("New password is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var currentUserId = GetCurrentUserId();

                var result = _userServices.ChangeUserPassword(societyId, id, currentUserId, request.NewPassword, false);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Password changed successfully"));
                }

                return Content(HttpStatusCode.Forbidden,
                    ApiResponseHelper.CreateErrorResponse("You do not have permission to change this password", HttpStatusCode.Forbidden));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ChangePassword error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to change password", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get sub-commercials for the current user
        /// </summary>
        [HttpGet]
        [Route("sub-commercials")]
        public IHttpActionResult GetSubCommercials()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var users = _userServices.GetSubCommercial(societyId, userId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(users));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetSubCommercials error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve sub-commercials", HttpStatusCode.InternalServerError));
            }
        }
    }
}
