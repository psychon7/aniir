using System;
using System.Linq;
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
    /// Clients management endpoints
    /// </summary>
    [RoutePrefix("api/v1/clients")]
    [JwtAuthFilter]
    public class ClientsController : BaseApiController
    {
        private readonly ClientServices _clientServices = new ClientServices();
        private readonly ContactClientServices _contactClientServices = new ContactClientServices();

        /// <summary>
        /// Search clients with pagination and filtering
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult SearchClients(
            [FromUri] string search = null,
            [FromUri] int? clientType = null,
            [FromUri] bool? isActive = null,
            [FromUri] int page = 1,
            [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                // Get all clients for the society
                var allClients = _clientServices.SearchClient(
                    societyId,
                    userId,
                    search ?? "",
                    clientType ?? 0,
                    isActive ?? true
                );

                // Apply pagination
                var totalCount = allClients.Count;
                var pagedClients = allClients
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedClients, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SearchClients error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to search clients", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a specific client by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetClient(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var client = _clientServices.LoadClientById(societyId, id);

                if (client == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Client not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(client));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve client", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new client
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateClient([FromBody] ClientCreateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            if (string.IsNullOrEmpty(request.CompanyName))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Company name is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var client = new Client
                {
                    SocId = societyId,
                    UsrCreatedBy = userId,
                    CompanyName = request.CompanyName,
                    Address1 = request.Address1,
                    Address2 = request.Address2,
                    Postcode = request.Postcode,
                    City = request.City,
                    Country = request.Country,
                    Tel1 = request.Tel1,
                    Tel2 = request.Tel2,
                    Fax = request.Fax,
                    Cellphone = request.Cellphone,
                    Email = request.Email,
                    Siren = request.Siren,
                    Siret = request.Siret,
                    VatIntra = request.VatIntra,
                    CtyId = request.ClientTypeId ?? 1, // Default to client
                    VatId = request.VatId ?? 1,
                    PcoId = request.PaymentConditionId ?? 1,
                    PmoId = request.PaymentModeId ?? 1,
                    CurId = request.CurrencyId ?? 1,
                    Isactive = true,
                    DateCreation = DateTime.Now,
                    DateUpdate = DateTime.Now,
                    Comment4Client = request.ClientComment,
                    Comment4Interne = request.InternalComment,
                    ClientTypes = request.ClientTypeIds?.Select(id => new KeyValueSimple { Key2 = id, Actived = true })
                                  ?? new[] { new KeyValueSimple { Key2 = request.ClientTypeId ?? 1, Actived = true } }
                };

                var clientId = _clientServices.CreateUpdateClient(client, true);

                if (clientId > 0)
                {
                    var createdClient = _clientServices.LoadClientById(societyId, clientId);
                    return Content(HttpStatusCode.Created,
                        ApiResponseHelper.CreateSuccessResponse(createdClient, "Client created successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to create client"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create client", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing client
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateClient(int id, [FromBody] ClientUpdateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var existingClient = _clientServices.LoadClientById(societyId, id);

                if (existingClient == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Client not found", HttpStatusCode.NotFound));
                }

                // Update fields
                existingClient.CompanyName = request.CompanyName ?? existingClient.CompanyName;
                existingClient.Address1 = request.Address1 ?? existingClient.Address1;
                existingClient.Address2 = request.Address2 ?? existingClient.Address2;
                existingClient.Postcode = request.Postcode ?? existingClient.Postcode;
                existingClient.City = request.City ?? existingClient.City;
                existingClient.Country = request.Country ?? existingClient.Country;
                existingClient.Tel1 = request.Tel1 ?? existingClient.Tel1;
                existingClient.Tel2 = request.Tel2 ?? existingClient.Tel2;
                existingClient.Fax = request.Fax ?? existingClient.Fax;
                existingClient.Cellphone = request.Cellphone ?? existingClient.Cellphone;
                existingClient.Email = request.Email ?? existingClient.Email;
                existingClient.Siren = request.Siren ?? existingClient.Siren;
                existingClient.Siret = request.Siret ?? existingClient.Siret;
                existingClient.VatIntra = request.VatIntra ?? existingClient.VatIntra;
                existingClient.Comment4Client = request.ClientComment ?? existingClient.Comment4Client;
                existingClient.Comment4Interne = request.InternalComment ?? existingClient.Comment4Interne;

                if (request.ClientTypeId.HasValue)
                    existingClient.CtyId = request.ClientTypeId.Value;
                if (request.VatId.HasValue)
                    existingClient.VatId = request.VatId.Value;
                if (request.PaymentConditionId.HasValue)
                    existingClient.PcoId = request.PaymentConditionId.Value;
                if (request.PaymentModeId.HasValue)
                    existingClient.PmoId = request.PaymentModeId.Value;
                if (request.CurrencyId.HasValue)
                    existingClient.CurId = request.CurrencyId.Value;
                if (request.IsActive.HasValue)
                    existingClient.Isactive = request.IsActive.Value;

                existingClient.DateUpdate = DateTime.Now;

                if (request.ClientTypeIds != null)
                {
                    existingClient.ClientTypes = request.ClientTypeIds.Select(ctId => new KeyValueSimple { Key2 = ctId, Actived = true });
                }

                _clientServices.CreateUpdateClient(existingClient);

                var updatedClient = _clientServices.LoadClientById(societyId, id);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedClient, "Client updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update client", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get contacts for a specific client
        /// </summary>
        [HttpGet]
        [Route("{id:int}/contacts")]
        public IHttpActionResult GetClientContacts(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var contacts = _contactClientServices.GetAllContactClient(societyId, id);

                return Ok(ApiResponseHelper.CreateSuccessResponse(contacts));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetClientContacts error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve client contacts", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Activate a client
        /// </summary>
        [HttpPost]
        [Route("{id:int}/activate")]
        public IHttpActionResult ActivateClient(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var result = _clientServices.ActiverClient(societyId, id, true);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Client activated successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to activate client"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ActivateClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to activate client", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Deactivate a client
        /// </summary>
        [HttpPost]
        [Route("{id:int}/deactivate")]
        public IHttpActionResult DeactivateClient(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var result = _clientServices.ActiverClient(societyId, id, false);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Client deactivated successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to deactivate client"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeactivateClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to deactivate client", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Block a client
        /// </summary>
        [HttpPost]
        [Route("{id:int}/block")]
        public IHttpActionResult BlockClient(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var result = _clientServices.BlocUnblocClient(societyId, id, true);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Client blocked successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to block client"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"BlockClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to block client", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Unblock a client
        /// </summary>
        [HttpPost]
        [Route("{id:int}/unblock")]
        public IHttpActionResult UnblockClient(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var result = _clientServices.BlocUnblocClient(societyId, id, false);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Client unblocked successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to unblock client"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UnblockClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to unblock client", HttpStatusCode.InternalServerError));
            }
        }
    }
}
