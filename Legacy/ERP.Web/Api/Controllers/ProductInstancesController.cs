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
    /// Product Instance (variant) management endpoints
    /// </summary>
    [RoutePrefix("api/v1/product-instances")]
    [JwtAuthFilter]
    public class ProductInstancesController : BaseApiController
    {
        private readonly ProductInstanceServices _productInstanceServices = new ProductInstanceServices();

        /// <summary>
        /// Get all product instances for the current society
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult GetProductInstances(
            [FromUri] int? productId = null,
            [FromUri] string search = null,
            [FromUri] int page = 1,
            [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                System.Collections.Generic.List<ProductInstance> instances;

                if (productId.HasValue && productId.Value > 0)
                {
                    // Get instances for a specific product
                    instances = _productInstanceServices.GetProductInstancesByProductId(productId.Value, societyId);
                }
                else if (!string.IsNullOrEmpty(search))
                {
                    // Search instances by reference
                    instances = _productInstanceServices.SearchProductInstancesByRef(search, societyId);
                }
                else
                {
                    // Get all instances
                    instances = _productInstanceServices.GetAllProductInstances(societyId);
                }

                // Apply pagination
                var totalCount = instances.Count;
                var pagedInstances = instances
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedInstances, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProductInstances error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product instances", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get product instances lookup for dropdowns
        /// </summary>
        [HttpGet]
        [Route("lookup")]
        public IHttpActionResult GetProductInstancesLookup([FromUri] int productId)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (productId <= 0)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Product ID is required"));
                }

                var instances = _productInstanceServices.GetProductInstancesLookup(productId, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(instances));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProductInstancesLookup error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product instances lookup", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a single product instance by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetProductInstance(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var instance = _productInstanceServices.GetProductInstanceById(id, societyId);
                if (instance == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product instance not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(instance));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProductInstance error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product instance", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Search product instances by reference
        /// </summary>
        [HttpGet]
        [Route("search")]
        public IHttpActionResult SearchProductInstances([FromUri] string q)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                var instances = _productInstanceServices.SearchProductInstancesByRef(q ?? string.Empty, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(instances));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SearchProductInstances error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to search product instances", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new product instance
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateProductInstance([FromBody] ProductInstance productInstance)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (productInstance == null)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Product instance data is required"));
                }

                if (productInstance.PrdId <= 0)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Product ID is required"));
                }

                productInstance.PitId = 0; // Ensure we're creating a new instance
                int instanceId = _productInstanceServices.CreateUpdateProductInstance(productInstance, societyId);

                if (instanceId == 0)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Failed to create product instance. Product may not exist."));
                }

                var createdInstance = _productInstanceServices.GetProductInstanceById(instanceId, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(createdInstance, "Product instance created successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateProductInstance error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create product instance", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing product instance
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateProductInstance(int id, [FromBody] ProductInstance productInstance)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (productInstance == null)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Product instance data is required"));
                }

                // Verify the instance exists
                var existingInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                if (existingInstance == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product instance not found", HttpStatusCode.NotFound));
                }

                productInstance.PitId = id;
                productInstance.PrdId = existingInstance.PrdId; // Preserve the product relationship
                _productInstanceServices.CreateUpdateProductInstance(productInstance, societyId);

                var updatedInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedInstance, "Product instance updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateProductInstance error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update product instance", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update product instance prices
        /// </summary>
        [HttpPatch]
        [Route("{id:int}/prices")]
        public IHttpActionResult UpdateProductInstancePrices(int id, [FromBody] PriceUpdateRequest request)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                // Verify the instance exists
                var existingInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                if (existingInstance == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product instance not found", HttpStatusCode.NotFound));
                }

                bool updated = _productInstanceServices.UpdateProductInstancePrices(
                    id,
                    request?.Price,
                    request?.PurchasePrice,
                    societyId);

                if (!updated)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Failed to update prices"));
                }

                var updatedInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedInstance, "Prices updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateProductInstancePrices error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update product instance prices", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update product instance inventory threshold
        /// </summary>
        [HttpPatch]
        [Route("{id:int}/inventory-threshold")]
        public IHttpActionResult UpdateInventoryThreshold(int id, [FromBody] InventoryThresholdRequest request)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                if (request == null)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Threshold value is required"));
                }

                // Verify the instance exists
                var existingInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                if (existingInstance == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product instance not found", HttpStatusCode.NotFound));
                }

                bool updated = _productInstanceServices.UpdateInventoryThreshold(id, request.Threshold, societyId);

                if (!updated)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Failed to update inventory threshold"));
                }

                var updatedInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedInstance, "Inventory threshold updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateInventoryThreshold error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update inventory threshold", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete a product instance
        /// </summary>
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteProductInstance(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                if (societyId == 0)
                {
                    return Content(HttpStatusCode.Unauthorized,
                        ApiResponseHelper.CreateErrorResponse("Invalid token claims", HttpStatusCode.Unauthorized));
                }

                // Verify the instance exists
                var existingInstance = _productInstanceServices.GetProductInstanceById(id, societyId);
                if (existingInstance == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product instance not found", HttpStatusCode.NotFound));
                }

                bool deleted = _productInstanceServices.DeleteProductInstance(id, societyId);
                if (!deleted)
                {
                    return Content(HttpStatusCode.Conflict,
                        ApiResponseHelper.CreateErrorResponse("Cannot delete product instance. It may be in use by orders or invoices."));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Product instance deleted successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteProductInstance error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete product instance", HttpStatusCode.InternalServerError));
            }
        }
    }

    /// <summary>
    /// Request model for price updates
    /// </summary>
    public class PriceUpdateRequest
    {
        public decimal? Price { get; set; }
        public decimal? PurchasePrice { get; set; }
    }

    /// <summary>
    /// Request model for inventory threshold updates
    /// </summary>
    public class InventoryThresholdRequest
    {
        public int Threshold { get; set; }
    }
}
