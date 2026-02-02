using System;
using System.Linq;
using System.Net;
using System.Web.Http;
using ERP.DataServices;
using ERP.Entities;
using ERP.Web.Api.Filters;
using ERP.Web.Api.Helpers;

namespace ERP.Web.Api.Controllers
{
    /// <summary>
    /// Brand management endpoints
    /// </summary>
    [RoutePrefix("api/v1/brands")]
    [JwtAuthFilter]
    public class BrandsController : BaseApiController
    {
        private readonly BrandServices _brandServices = new BrandServices();

        /// <summary>
        /// Get all brands for the current society
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult GetBrands()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var brands = _brandServices.GetAllBrands(societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(brands));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetBrands error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve brands", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get active brands for dropdown/lookup
        /// </summary>
        [HttpGet]
        [Route("lookup")]
        public IHttpActionResult GetBrandsLookup()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var brands = _brandServices.GetActiveBrandsLookup(societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(brands));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetBrandsLookup error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve brands lookup", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a single brand by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetBrand(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var brand = _brandServices.GetBrandById(societyId, id);
                if (brand == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Brand not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(brand));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetBrand error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve brand", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Search brands by name or code
        /// </summary>
        [HttpGet]
        [Route("search")]
        public IHttpActionResult SearchBrands([FromUri] string q)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var brands = _brandServices.SearchBrands(societyId, q ?? string.Empty);
                return Ok(ApiResponseHelper.CreateSuccessResponse(brands));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SearchBrands error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to search brands", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new brand
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateBrand([FromBody] Brand brand)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (brand == null)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Brand data is required"));
                }

                if (string.IsNullOrWhiteSpace(brand.BraName))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Brand name is required"));
                }

                if (string.IsNullOrWhiteSpace(brand.BraCode))
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Brand code is required"));
                }

                brand.SocId = societyId;
                brand.BraId = 0; // Ensure we're creating a new brand
                int brandId = _brandServices.CreateUpdateBrand(brand);

                var createdBrand = _brandServices.GetBrandById(societyId, brandId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(createdBrand, "Brand created successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateBrand error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create brand", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing brand
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateBrand(int id, [FromBody] Brand brand)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (brand == null)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Brand data is required"));
                }

                // Verify the brand exists
                var existingBrand = _brandServices.GetBrandById(societyId, id);
                if (existingBrand == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Brand not found", HttpStatusCode.NotFound));
                }

                brand.BraId = id;
                brand.SocId = societyId;
                _brandServices.CreateUpdateBrand(brand);

                var updatedBrand = _brandServices.GetBrandById(societyId, id);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedBrand, "Brand updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateBrand error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update brand", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete a brand
        /// </summary>
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteBrand(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                // Verify the brand exists
                var existingBrand = _brandServices.GetBrandById(societyId, id);
                if (existingBrand == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Brand not found", HttpStatusCode.NotFound));
                }

                bool deleted = _brandServices.DeleteBrand(societyId, id);
                if (!deleted)
                {
                    return Content(HttpStatusCode.Conflict,
                        ApiResponseHelper.CreateErrorResponse("Cannot delete brand. It may be in use by products."));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Brand deleted successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteBrand error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete brand", HttpStatusCode.InternalServerError));
            }
        }
    }
}
