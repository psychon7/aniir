using System;
using System.Collections.Generic;
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
    /// Products management endpoints
    /// </summary>
    [RoutePrefix("api/v1/products")]
    [JwtAuthFilter]
    public class ProductsController : BaseApiController
    {
        private readonly ProductServices _productServices = new ProductServices();
        private readonly ProductTypeServices _productTypeServices = new ProductTypeServices();
        private readonly CategoryServices _categoryServices = new CategoryServices();

        /// <summary>
        /// Search products with pagination and filtering
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult SearchProducts(
            [FromUri] string search = null,
            [FromUri] int? categoryId = null,
            [FromUri] int? productTypeId = null,
            [FromUri] bool? isActive = null,
            [FromUri] int page = 1,
            [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var products = _productServices.SearchProduct(
                    societyId,
                    search ?? "",
                    categoryId ?? 0,
                    productTypeId ?? 0,
                    isActive ?? true,
                    0 // limit - 0 means no limit
                );

                // Apply pagination
                var totalCount = products.Count;
                var pagedProducts = products
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedProducts, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SearchProducts error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to search products", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a specific product by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetProduct(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var product = _productServices.LoadProductById(id, societyId);

                if (product == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(product));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProduct error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing product
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateProduct(int id, [FromBody] ProductUpdateRequest request)
        {
            try
            {
                if (request == null)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Request body is required"));
                }

                var societyId = GetCurrentSocietyId();

                // Check if product exists
                var existingProduct = _productServices.LoadProductById(id, societyId);
                if (existingProduct == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Product not found", HttpStatusCode.NotFound));
                }

                // Map DTO to Product entity
                var productToUpdate = new Product
                {
                    PrdId = id,
                    SocId = societyId,
                    PrdRef = request.PrdRef,
                    PrdName = request.PrdName,
                    PrdSubName = request.PrdSubName,
                    PrdDescription = request.PrdDescription,
                    PtyId = request.PtyId ?? existingProduct.PtyId,
                    PrdPrice = request.PrdPrice,
                    PrdPurchasePrice = request.PrdPurchasePrice,
                    PrdFileName = request.PrdFileName,
                    PrdOutsideDiameter = request.PrdOutsideDiameter,
                    PrdLength = request.PrdLength,
                    PrdWidth = request.PrdWidth,
                    PrdHeight = request.PrdHeight,
                    PrdHoleSize = request.PrdHoleSize,
                    PrdDepth = request.PrdDepth,
                    PrdHoleLength = request.PrdHoleLength,
                    PrdHoleWidth = request.PrdHoleWidth,
                    PrdWeight = request.PrdWeight,
                    PrdUnitLength = request.PrdUnitLength,
                    PrdUnitWidth = request.PrdUnitWidth,
                    PrdUnitHeight = request.PrdUnitHeight,
                    PrdUnitWeight = request.PrdUnitWeight,
                    PrdQuantityEachCarton = request.PrdQuantityEachCarton,
                    PrdCartonLength = request.PrdCartonLength,
                    PrdCartonWidth = request.PrdCartonWidth,
                    PrdCartonHeight = request.PrdCartonHeight,
                    PrdCartonWeight = request.PrdCartonWeight,
                    PrdOutsideLength = request.PrdOutsideLength,
                    PrdOutsideWidth = request.PrdOutsideWidth,
                    PrdOutsideHeight = request.PrdOutsideHeight,
                    PrdTmpRef = request.PrdTmpRef,
                    PrdSupDes = request.PrdSupDes,
                    PrdGeneralInfoList = request.PrdGeneralInfoList
                };

                // Map instance updates if provided
                if (request.InstanceList != null && request.InstanceList.Count > 0)
                {
                    productToUpdate.InstanceList = request.InstanceList.Select(i => new ProductInstance
                    {
                        PitId = i.PitId,
                        PitRef = i.PitRef,
                        PitDescription = i.PitDescription,
                        PitPrice = i.PitPrice,
                        PitPurchasePrice = i.PitPurchasePrice,
                        PitInventoryThreshold = i.PitInventoryThreshold ?? 0,
                        PitAllInfo = i.PitAllInfo
                    }).ToList();
                }

                var updatedProduct = _productServices.UpdateProductById(id, societyId, productToUpdate);

                if (updatedProduct == null)
                {
                    return Content(HttpStatusCode.InternalServerError,
                        ApiResponseHelper.CreateErrorResponse("Failed to update product", HttpStatusCode.InternalServerError));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedProduct, "Product updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateProduct error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update product", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get product instances (variants) for a specific product
        /// </summary>
        [HttpGet]
        [Route("{id:int}/instances")]
        public IHttpActionResult GetProductInstances(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var instances = _productServices.GetProductInstances(societyId, id);

                return Ok(ApiResponseHelper.CreateSuccessResponse(instances));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProductInstances error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product instances", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all product types
        /// </summary>
        [HttpGet]
        [Route("types")]
        public IHttpActionResult GetProductTypes()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var productTypes = _productTypeServices.GetAllProductTypes(societyId);

                return Ok(ApiResponseHelper.CreateSuccessResponse(productTypes));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProductTypes error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product types", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get all categories
        /// </summary>
        [HttpGet]
        [Route("categories")]
        public IHttpActionResult GetCategories()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var categories = _categoryServices.GetAllCategory(societyId);

                return Ok(ApiResponseHelper.CreateSuccessResponse(categories));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetCategories error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve categories", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get product photos
        /// </summary>
        [HttpGet]
        [Route("{id:int}/photos")]
        public IHttpActionResult GetProductPhotos(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var photos = _productServices.GetProductPrdPhotoList(societyId, id);

                return Ok(ApiResponseHelper.CreateSuccessResponse(photos));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetProductPhotos error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve product photos", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Activate a product
        /// </summary>
        [HttpPost]
        [Route("{id:int}/activate")]
        public IHttpActionResult ActivateProduct(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var result = _productServices.ActiverProduct(societyId, id, true);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Product activated successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to activate product"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ActivateProduct error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to activate product", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Deactivate a product
        /// </summary>
        [HttpPost]
        [Route("{id:int}/deactivate")]
        public IHttpActionResult DeactivateProduct(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var result = _productServices.ActiverProduct(societyId, id, false);

                if (result)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Product deactivated successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to deactivate product"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeactivateProduct error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to deactivate product", HttpStatusCode.InternalServerError));
            }
        }
    }
}
