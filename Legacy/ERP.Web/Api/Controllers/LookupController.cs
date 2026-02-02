using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using ERP.DataServices;
using ERP.Web.Api.Filters;
using ERP.Web.Api.Helpers;

namespace ERP.Web.Api.Controllers
{
    /// <summary>
    /// Reference data/lookup endpoints for dropdown population
    /// </summary>
    [RoutePrefix("api/v1/lookup")]
    [JwtAuthFilter]
    public class LookupController : ApiController
    {
        private readonly CommonServices _commonServices = new CommonServices();
        private readonly UserServices _userServices = new UserServices();

        /// <summary>
        /// Get all client types
        /// </summary>
        [HttpGet]
        [Route("client-types")]
        public IHttpActionResult GetClientTypes()
        {
            try
            {
                var result = _commonServices.GetClientTypes();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetClientTypes error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve client types", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all countries
        /// </summary>
        [HttpGet]
        [Route("countries")]
        public IHttpActionResult GetCountries()
        {
            try
            {
                var result = _commonServices.GetAllCountries();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCountries error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve countries", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a country by ID
        /// </summary>
        [HttpGet]
        [Route("countries/{id:int}")]
        public IHttpActionResult GetCountryById(int id)
        {
            try
            {
                var result = _commonServices.GetCountryById(id);
                if (result == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Country not found", HttpStatusCode.NotFound));
                }
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCountryById error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve country", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all currencies
        /// </summary>
        [HttpGet]
        [Route("currencies")]
        public IHttpActionResult GetCurrencies()
        {
            try
            {
                var result = _commonServices.GetAllCurrency();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCurrencies error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve currencies", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all VAT rates
        /// </summary>
        [HttpGet]
        [Route("vat-rates")]
        public IHttpActionResult GetVatRates()
        {
            try
            {
                var result = _commonServices.GetAllTVA();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetVatRates error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve VAT rates", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all payment modes
        /// </summary>
        [HttpGet]
        [Route("payment-modes")]
        public IHttpActionResult GetPaymentModes()
        {
            try
            {
                var result = _commonServices.GetPaymentMode();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetPaymentModes error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve payment modes", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all payment conditions
        /// </summary>
        [HttpGet]
        [Route("payment-conditions")]
        public IHttpActionResult GetPaymentConditions()
        {
            try
            {
                var result = _commonServices.GetPaymentCondition();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetPaymentConditions error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve payment conditions", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all trade terms (Incoterms)
        /// </summary>
        [HttpGet]
        [Route("trade-terms")]
        public IHttpActionResult GetTradeTerms()
        {
            try
            {
                var result = _commonServices.GetTradeTerms();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetTradeTerms error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve trade terms", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all civilities (Mr., Ms., etc.)
        /// </summary>
        [HttpGet]
        [Route("civilities")]
        public IHttpActionResult GetCivilities()
        {
            try
            {
                var result = _commonServices.GetCivility();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCivilities error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve civilities", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all activities
        /// </summary>
        [HttpGet]
        [Route("activities")]
        public IHttpActionResult GetActivities()
        {
            try
            {
                var result = _commonServices.GetActivity();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetActivities error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve activities", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all languages
        /// </summary>
        [HttpGet]
        [Route("languages")]
        public IHttpActionResult GetLanguages()
        {
            try
            {
                var result = _commonServices.GetAllLanguage();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetLanguages error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve languages", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all line types
        /// </summary>
        [HttpGet]
        [Route("line-types")]
        public IHttpActionResult GetLineTypes()
        {
            try
            {
                var result = _commonServices.GetAllLineType();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetLineTypes error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve line types", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all cost plan statuses
        /// </summary>
        [HttpGet]
        [Route("costplan-statuses")]
        public IHttpActionResult GetCostPlanStatuses()
        {
            try
            {
                var result = _commonServices.GetAllStatus();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCostPlanStatuses error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve cost plan statuses", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all general statuses
        /// </summary>
        [HttpGet]
        [Route("statuses")]
        public IHttpActionResult GetStatuses()
        {
            try
            {
                var result = _commonServices.GetAllGeneralStatus();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetStatuses error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve statuses", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get communes by postcode
        /// </summary>
        [HttpGet]
        [Route("communes")]
        public IHttpActionResult GetCommunes([FromUri] string postcode)
        {
            try
            {
                if (string.IsNullOrEmpty(postcode))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Postcode is required"));
                }

                var result = _commonServices.GetAllCommuneNameByPostcode(postcode);
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCommunes error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve communes", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all colors for a society
        /// </summary>
        [HttpGet]
        [Route("colors")]
        public IHttpActionResult GetColors()
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                var result = _commonServices.GetAllColor(societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetColors error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve colors", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get user roles
        /// </summary>
        [HttpGet]
        [Route("roles")]
        public IHttpActionResult GetRoles()
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                var userIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "userId");

                if (societyIdClaim == null || userIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                var userId = int.Parse(userIdClaim.Value);
                var result = _userServices.GetRoleList(societyId, userId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetRoles error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve roles", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get header/footer text settings
        /// </summary>
        [HttpGet]
        [Route("header-footer")]
        public IHttpActionResult GetHeaderFooter()
        {
            try
            {
                var result = _commonServices.GetHeaderFooter();
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetHeaderFooter error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve header/footer settings", HttpStatusCode.InternalServerError));
            }
        }

        #region Carrier

        /// <summary>
        /// Get all carriers for the current society
        /// </summary>
        [HttpGet]
        [Route("carriers")]
        public IHttpActionResult GetCarriers()
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                var result = _commonServices.GetAllCarriers(societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCarriers error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve carriers", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all active carriers for the current society
        /// </summary>
        [HttpGet]
        [Route("carriers/active")]
        public IHttpActionResult GetActiveCarriers()
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                var result = _commonServices.GetActiveCarriers(societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetActiveCarriers error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve active carriers", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a carrier by ID
        /// </summary>
        [HttpGet]
        [Route("carriers/{id:int}")]
        public IHttpActionResult GetCarrierById(int id)
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                var result = _commonServices.GetCarrierById(societyId, id);
                if (result == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Carrier not found", HttpStatusCode.NotFound));
                }
                return Ok(ApiResponseHelper.CreateSuccessResponse(result));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCarrierById error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve carrier", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new carrier
        /// </summary>
        [HttpPost]
        [Route("carriers")]
        public IHttpActionResult CreateCarrier([FromBody] ERP.Entities.Carrier carrier)
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (carrier == null || string.IsNullOrEmpty(carrier.Name))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Carrier name is required"));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                carrier.SocId = societyId;
                carrier.Id = 0; // Ensure we're creating, not updating
                var carrierId = _commonServices.CreateUpdateCarrier(carrier);

                var createdCarrier = _commonServices.GetCarrierById(societyId, carrierId);
                return Content(HttpStatusCode.Created, ApiResponseHelper.CreateSuccessResponse(createdCarrier));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateCarrier error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create carrier", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing carrier
        /// </summary>
        [HttpPut]
        [Route("carriers/{id:int}")]
        public IHttpActionResult UpdateCarrier(int id, [FromBody] ERP.Entities.Carrier carrier)
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (carrier == null || string.IsNullOrEmpty(carrier.Name))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Carrier name is required"));
                }

                var societyId = int.Parse(societyIdClaim.Value);

                // Check if carrier exists
                var existing = _commonServices.GetCarrierById(societyId, id);
                if (existing == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Carrier not found", HttpStatusCode.NotFound));
                }

                carrier.SocId = societyId;
                carrier.Id = id;
                _commonServices.CreateUpdateCarrier(carrier);

                var updatedCarrier = _commonServices.GetCarrierById(societyId, id);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedCarrier));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateCarrier error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update carrier", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete a carrier
        /// </summary>
        [HttpDelete]
        [Route("carriers/{id:int}")]
        public IHttpActionResult DeleteCarrier(int id)
        {
            try
            {
                var identity = User.Identity as System.Security.Principal.GenericIdentity;
                var societyIdClaim = identity?.Claims.FirstOrDefault(c => c.Type == "societyId");
                if (societyIdClaim == null)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var societyId = int.Parse(societyIdClaim.Value);
                var deleted = _commonServices.DeleteCarrier(societyId, id);

                if (!deleted)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Carrier not found or in use", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(new { message = "Carrier deleted successfully" }));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteCarrier error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete carrier", HttpStatusCode.InternalServerError));
            }
        }

        #endregion Carrier
    }
}
