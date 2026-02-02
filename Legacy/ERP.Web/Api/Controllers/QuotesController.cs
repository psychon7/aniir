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
    /// Quotes (Cost Plans) management endpoints
    /// </summary>
    [RoutePrefix("api/v1/quotes")]
    [JwtAuthFilter]
    public class QuotesController : BaseApiController
    {
        private readonly CostPlanServices _costPlanServices = new CostPlanServices();
        private readonly CostPlanLineServices _costPlanLineServices = new CostPlanLineServices();

        #region Quote CRUD Operations

        /// <summary>
        /// Search quotes with pagination and filtering
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult SearchQuotes([FromUri] QuoteSearchParams searchParams)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                if (searchParams == null)
                {
                    searchParams = new QuoteSearchParams();
                }

                var allQuotes = _costPlanServices.SearchCostPlans(
                    societyId,
                    searchParams.QuoteName ?? searchParams.Search ?? "",
                    searchParams.QuoteCode ?? "",
                    searchParams.ClientName ?? "",
                    "", // ccoName
                    searchParams.ProjectCode ?? "",
                    searchParams.ProjectName ?? "",
                    userId,
                    searchParams.StatusId ?? 0,
                    true, // superRight - adjust based on user permissions
                    0, // loginMode
                    null, // flag
                    null, // comment
                    searchParams.DateFrom,
                    searchParams.DateTo,
                    searchParams.Keyword,
                    searchParams.FromSite ?? false,
                    searchParams.IsKeyProject ?? false
                );

                // Apply pagination
                var totalCount = allQuotes.Count;
                var pagedQuotes = allQuotes
                    .Skip((searchParams.Page - 1) * searchParams.PageSize)
                    .Take(searchParams.PageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedQuotes, searchParams.Page, searchParams.PageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SearchQuotes error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to search quotes", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a specific quote by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetQuote(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var quote = _costPlanServices.LoadCostPlanById(id, societyId, userId);

                if (quote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(quote));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetQuote error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve quote", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new quote
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateQuote([FromBody] QuoteCreateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            if (string.IsNullOrEmpty(request.Name))
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Quote name is required"));
            }

            if (request.ClientId <= 0)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Client ID is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var quote = new CostPlan
                {
                    SocId = societyId,
                    UsrCreatorId = userId,
                    CplName = request.Name,
                    CliId = request.ClientId,
                    PrjId = request.ProjectId ?? 0,
                    VatId = request.VatId ?? 1,
                    PcoId = request.PaymentConditionId ?? 1,
                    PmoId = request.PaymentModeId ?? 1,
                    CstId = 1, // In Progress status
                    CplDateCreation = DateTime.Now,
                    CplDateUpdate = DateTime.Now,
                    CplDateValidity = request.ValidityDate ?? DateTime.Now.AddMonths(1),
                    CplDatePreDelivery = request.PreDeliveryDate,
                    CplHeaderText = request.HeaderText,
                    CplFooterText = request.FooterText,
                    CcoIdInvoicing = request.InvoicingContactId,
                    CplClientComment = request.ClientComment,
                    CplInterComment = request.InternalComment,
                    CplDiscountPercentage = request.DiscountPercentage,
                    CplDiscountAmount = request.DiscountAmount,
                    UsrCom1 = request.Commercial1Id,
                    UsrCom2 = request.Commercial2Id,
                    UsrCom3 = request.Commercial3Id,
                    CplKeyProject = request.IsKeyProject
                };

                var quoteId = _costPlanServices.CreateUpdateCostPlan(quote);

                if (quoteId > 0)
                {
                    // Create lines if provided
                    if (request.Lines != null && request.Lines.Any())
                    {
                        foreach (var lineRequest in request.Lines)
                        {
                            var line = MapLineRequestToEntity(lineRequest, quoteId, societyId);
                            _costPlanLineServices.InsertUpdateCln(line);
                        }
                    }

                    var createdQuote = _costPlanServices.LoadCostPlanById(quoteId, societyId, userId);
                    return Content(HttpStatusCode.Created,
                        ApiResponseHelper.CreateSuccessResponse(createdQuote, "Quote created successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to create quote"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateQuote error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create quote", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing quote
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateQuote(int id, [FromBody] QuoteUpdateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var existingQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);

                if (existingQuote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                // Update fields
                existingQuote.CplName = request.Name ?? existingQuote.CplName;
                existingQuote.CliId = request.ClientId ?? existingQuote.CliId;
                existingQuote.PrjId = request.ProjectId ?? existingQuote.PrjId;
                existingQuote.VatId = request.VatId ?? existingQuote.VatId;
                existingQuote.PcoId = request.PaymentConditionId ?? existingQuote.PcoId;
                existingQuote.PmoId = request.PaymentModeId ?? existingQuote.PmoId;
                existingQuote.CstId = request.StatusId ?? existingQuote.CstId;
                existingQuote.CplDateValidity = request.ValidityDate ?? existingQuote.CplDateValidity;
                existingQuote.CplDatePreDelivery = request.PreDeliveryDate ?? existingQuote.CplDatePreDelivery;
                existingQuote.CplHeaderText = request.HeaderText ?? existingQuote.CplHeaderText;
                existingQuote.CplFooterText = request.FooterText ?? existingQuote.CplFooterText;
                existingQuote.CcoIdInvoicing = request.InvoicingContactId ?? existingQuote.CcoIdInvoicing;
                existingQuote.CplClientComment = request.ClientComment ?? existingQuote.CplClientComment;
                existingQuote.CplInterComment = request.InternalComment ?? existingQuote.CplInterComment;
                existingQuote.UsrCom1 = request.Commercial1Id ?? existingQuote.UsrCom1;
                existingQuote.UsrCom2 = request.Commercial2Id ?? existingQuote.UsrCom2;
                existingQuote.UsrCom3 = request.Commercial3Id ?? existingQuote.UsrCom3;

                if (request.DiscountPercentage.HasValue)
                    existingQuote.CplDiscountPercentage = request.DiscountPercentage;
                if (request.DiscountAmount.HasValue)
                    existingQuote.CplDiscountAmount = request.DiscountAmount;
                if (request.IsKeyProject.HasValue)
                    existingQuote.CplKeyProject = request.IsKeyProject.Value;

                existingQuote.CplDateUpdate = DateTime.Now;

                _costPlanServices.CreateUpdateCostPlan(existingQuote);

                var updatedQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedQuote, "Quote updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateQuote error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update quote", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete a quote
        /// </summary>
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteQuote(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var existingQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);

                if (existingQuote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                var result = _costPlanServices.DeleteCostPlan(societyId, id);

                if (result == 1)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Quote deleted successfully"));
                }
                else if (result == 0)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot delete quote: it has associated orders"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete quote"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteQuote error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete quote", HttpStatusCode.InternalServerError));
            }
        }

        #endregion

        #region Quote Lines Operations

        /// <summary>
        /// Get all lines for a quote
        /// </summary>
        [HttpGet]
        [Route("{id:int}/lines")]
        public IHttpActionResult GetQuoteLines(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var lines = _costPlanLineServices.GetClnsByCplId(societyId, id);

                return Ok(ApiResponseHelper.CreateSuccessResponse(lines));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetQuoteLines error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve quote lines", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Add a line to a quote
        /// </summary>
        [HttpPost]
        [Route("{id:int}/lines")]
        public IHttpActionResult AddQuoteLine(int id, [FromBody] QuoteLineCreateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                // Verify quote exists
                var quote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (quote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                var line = MapLineRequestToEntity(request, id, societyId);
                var lineId = _costPlanLineServices.InsertUpdateCln(line);

                if (lineId > 0)
                {
                    var lines = _costPlanLineServices.GetClnsByCplId(societyId, id);
                    var createdLine = lines.FirstOrDefault(l => l.ClnId == lineId);
                    return Content(HttpStatusCode.Created,
                        ApiResponseHelper.CreateSuccessResponse(createdLine, "Quote line added successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to add quote line"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"AddQuoteLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to add quote line", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update a quote line
        /// </summary>
        [HttpPut]
        [Route("{id:int}/lines/{lineId:int}")]
        public IHttpActionResult UpdateQuoteLine(int id, int lineId, [FromBody] QuoteLineUpdateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                // Verify quote exists
                var quote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (quote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                var lines = _costPlanLineServices.GetClnsByCplId(societyId, id);
                var existingLine = lines.FirstOrDefault(l => l.ClnId == lineId);
                if (existingLine == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote line not found", HttpStatusCode.NotFound));
                }

                // Update line
                existingLine.ClnLevel1 = request.Level1 ?? existingLine.ClnLevel1;
                existingLine.ClnLevel2 = request.Level2 ?? existingLine.ClnLevel2;
                existingLine.ClnDescription = request.Description ?? existingLine.ClnDescription;
                existingLine.PrdId = request.ProductId ?? existingLine.PrdId;
                existingLine.PrdName = request.ProductName ?? existingLine.PrdName;
                existingLine.PitId = request.ProductInstanceId ?? existingLine.PitId;
                existingLine.PitName = request.ProductInstanceName ?? existingLine.PitName;
                existingLine.ClnPurchasePrice = request.PurchasePrice ?? existingLine.ClnPurchasePrice;
                existingLine.ClnUnitPrice = request.UnitPrice ?? existingLine.ClnUnitPrice;
                existingLine.ClnQuantity = request.Quantity ?? existingLine.ClnQuantity;
                existingLine.VatId = request.VatId ?? existingLine.VatId;
                existingLine.LtpId = request.LineTypeId ?? existingLine.LtpId;
                existingLine.ClnDiscountPercentage = request.DiscountPercentage ?? existingLine.ClnDiscountPercentage;
                existingLine.ClnDiscountAmount = request.DiscountAmount ?? existingLine.ClnDiscountAmount;
                existingLine.ClnPrdDes = request.ProductDescription ?? existingLine.ClnPrdDes;

                // Calculate totals
                CalculateLineTotals(existingLine);

                _costPlanLineServices.InsertUpdateCln(existingLine);

                var updatedLines = _costPlanLineServices.GetClnsByCplId(societyId, id);
                var updatedLine = updatedLines.FirstOrDefault(l => l.ClnId == lineId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedLine, "Quote line updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateQuoteLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update quote line", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete a quote line
        /// </summary>
        [HttpDelete]
        [Route("{id:int}/lines/{lineId:int}")]
        public IHttpActionResult DeleteQuoteLine(int id, int lineId)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                // Verify quote exists
                var quote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (quote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                _costPlanLineServices.DeleteCln(societyId, id, lineId);

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Quote line deleted successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteQuoteLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete quote line", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Duplicate a quote line
        /// </summary>
        [HttpPost]
        [Route("{id:int}/lines/{lineId:int}/duplicate")]
        public IHttpActionResult DuplicateQuoteLine(int id, int lineId)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                // Verify quote exists
                var quote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (quote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                _costPlanLineServices.DuplicateCln(id, lineId);

                var lines = _costPlanLineServices.GetClnsByCplId(societyId, id);
                return Ok(ApiResponseHelper.CreateSuccessResponse(lines, "Quote line duplicated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DuplicateQuoteLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to duplicate quote line", HttpStatusCode.InternalServerError));
            }
        }

        #endregion

        #region Quote Actions

        /// <summary>
        /// Duplicate a quote
        /// </summary>
        [HttpPost]
        [Route("{id:int}/duplicate")]
        public IHttpActionResult DuplicateQuote(int id, [FromBody] QuoteDuplicateRequest request)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var existingQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (existingQuote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                var sameProject = request?.SameProject ?? false;
                var newQuoteId = _costPlanServices.DuplicateCostPlan(societyId, id, userId, sameProject);

                if (newQuoteId > 0)
                {
                    var newQuote = _costPlanServices.LoadCostPlanById(newQuoteId, societyId, userId);
                    return Content(HttpStatusCode.Created,
                        ApiResponseHelper.CreateSuccessResponse(newQuote, "Quote duplicated successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to duplicate quote"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DuplicateQuote error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to duplicate quote", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Convert quote to client order (when status is "Won")
        /// </summary>
        [HttpPost]
        [Route("{id:int}/convert-to-order")]
        public IHttpActionResult ConvertToOrder(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var existingQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (existingQuote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                var orderId = _costPlanServices.PassCostPlan2ClientOrder(id, societyId);

                if (orderId > 0)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse(new { orderId }, "Quote converted to order successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to convert quote to order. Quote may already be converted or has no lines."));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ConvertToOrder error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to convert quote to order", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Change status of multiple quotes
        /// </summary>
        [HttpPost]
        [Route("change-status")]
        public IHttpActionResult ChangeQuotesStatus([FromBody] QuoteStatusChangeRequest request)
        {
            if (request == null || request.QuoteIds == null || !request.QuoteIds.Any())
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Quote IDs are required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                _costPlanServices.ChangeCostplanStatus(societyId, request.QuoteIds, request.StatusId);

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Quote status changed successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ChangeQuotesStatus error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to change quote status", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update quote discount
        /// </summary>
        [HttpPost]
        [Route("{id:int}/discount")]
        public IHttpActionResult UpdateQuoteDiscount(int id, [FromBody] QuoteDiscountRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var existingQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (existingQuote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                _costPlanServices.AddUpdateDiscount(societyId, id, request.DiscountPercentage, request.DiscountAmount);

                var updatedQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedQuote, "Quote discount updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateQuoteDiscount error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update quote discount", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update quote commercials
        /// </summary>
        [HttpPost]
        [Route("{id:int}/commercials")]
        public IHttpActionResult UpdateQuoteCommercials(int id, [FromBody] QuoteCommercialRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var existingQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                if (existingQuote == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                _costPlanServices.ChangeCommercial(
                    societyId,
                    userId,
                    id,
                    request.Commercial1Id ?? 0,
                    request.Commercial2Id ?? 0,
                    request.Commercial3Id ?? 0
                );

                var updatedQuote = _costPlanServices.LoadCostPlanById(id, societyId, userId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(updatedQuote, "Quote commercials updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateQuoteCommercials error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update quote commercials", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get quotes by project ID
        /// </summary>
        [HttpGet]
        [Route("by-project/{projectId:int}")]
        public IHttpActionResult GetQuotesByProject(int projectId)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var quotes = _costPlanServices.GetCostPlansByProjectId(societyId, projectId);

                return Ok(ApiResponseHelper.CreateSuccessResponse(quotes));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetQuotesByProject error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve quotes by project", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get quotes in progress (for dashboard widget)
        /// </summary>
        [HttpGet]
        [Route("in-progress")]
        public IHttpActionResult GetQuotesInProgress()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var quotes = _costPlanServices.GetCostPlansInProgress(societyId, userId);

                return Ok(ApiResponseHelper.CreateSuccessResponse(quotes));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetQuotesInProgress error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve quotes in progress", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get recent quotes in progress (this month and last month)
        /// </summary>
        [HttpGet]
        [Route("recent-in-progress")]
        public IHttpActionResult GetRecentQuotesInProgress()
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var quotes = _costPlanServices.GetCostPlansInProgressThisMonthAndLastMonth(societyId, userId);

                return Ok(ApiResponseHelper.CreateSuccessResponse(quotes));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetRecentQuotesInProgress error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve recent quotes in progress", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get quote summary/info (totals, margins, etc.)
        /// </summary>
        [HttpGet]
        [Route("{id:int}/summary")]
        public IHttpActionResult GetQuoteSummary(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var summary = _costPlanLineServices.GetCostPlanInfo(societyId, id);

                if (summary == null || summary.CplId == 0)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Quote not found", HttpStatusCode.NotFound));
                }

                return Ok(ApiResponseHelper.CreateSuccessResponse(summary));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetQuoteSummary error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve quote summary", HttpStatusCode.InternalServerError));
            }
        }

        #endregion

        #region Helper Methods

        private CostPlanLine MapLineRequestToEntity(QuoteLineCreateRequest request, int quoteId, int societyId)
        {
            var line = new CostPlanLine
            {
                CplId = quoteId,
                SocId = societyId,
                ClnLevel1 = request.Level1 ?? 1,
                ClnLevel2 = request.Level2 ?? 1,
                ClnDescription = request.Description,
                PrdId = request.ProductId,
                PrdName = request.ProductName,
                PitId = request.ProductInstanceId,
                PitName = request.ProductInstanceName,
                ClnPurchasePrice = request.PurchasePrice,
                ClnUnitPrice = request.UnitPrice,
                ClnQuantity = request.Quantity ?? 1,
                VatId = request.VatId,
                LtpId = request.LineTypeId,
                ClnDiscountPercentage = request.DiscountPercentage,
                ClnDiscountAmount = request.DiscountAmount,
                ClnPrdDes = request.ProductDescription
            };

            CalculateLineTotals(line);
            return line;
        }

        private void CalculateLineTotals(CostPlanLine line)
        {
            var quantity = line.ClnQuantity ?? 1;
            var unitPrice = line.ClnUnitPrice ?? 0;
            var discountPercentage = line.ClnDiscountPercentage ?? 0;
            var discountAmount = line.ClnDiscountAmount ?? 0;

            // Calculate price with discount
            var priceWithDiscount = unitPrice;
            if (discountPercentage > 0)
            {
                priceWithDiscount = unitPrice * (1 - discountPercentage / 100);
            }
            priceWithDiscount -= discountAmount;

            line.ClnPriceWithDiscountHt = priceWithDiscount;
            line.ClnTotalPrice = priceWithDiscount * quantity;

            // Calculate margin
            var purchasePrice = line.ClnPurchasePrice ?? 0;
            line.ClnMargin = priceWithDiscount - purchasePrice;

            // Calculate crude price (with VAT) - simplified, would need VAT rate from database
            line.ClnTotalCrudePrice = line.ClnTotalPrice * 1.2m; // Assuming 20% VAT default
        }

        #endregion
    }
}
