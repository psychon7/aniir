using System;
using System.Collections.Generic;
using System.Globalization;
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
    /// Invoices management endpoints - Full CRUD operations
    /// </summary>
    [RoutePrefix("api/v1/invoices")]
    [JwtAuthFilter]
    public class InvoicesController : BaseApiController
    {
        private readonly ClientInvoiceServices _invoiceServices = new ClientInvoiceServices();
        private readonly ClientInvoiceLineServices _invoiceLineServices = new ClientInvoiceLineServices();
        private readonly UserServices _userServices = new UserServices();

        /// <summary>
        /// Search invoices with pagination and filtering
        /// </summary>
        [HttpGet]
        [Route("")]
        public IHttpActionResult SearchInvoices(
            [FromUri] string search = null,
            [FromUri] int? clientId = null,
            [FromUri] int? projectId = null,
            [FromUri] int? orderId = null,
            [FromUri] string dateFrom = null,
            [FromUri] string dateTo = null,
            [FromUri] bool? isInvoice = null,
            [FromUri] bool? isPaid = null,
            [FromUri] bool? isInvoiced = null,
            [FromUri] bool? keyProjectOnly = null,
            [FromUri] int page = 1,
            [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                // Build search criteria using ClientInvoice entity
                var searchCriteria = new ClientInvoice
                {
                    SocId = societyId,
                    UsrCreatorId = userId,
                    CinName = search ?? "",
                    CinCode = "",
                    ClientCompanyName = "",
                    Inv_CcoFirstname = "",
                    PrjCode = "",
                    PrjName = "",
                    CinInterComment = search ?? "",
                    CliId = clientId ?? 0,
                    CodId = orderId,
                    _CinDCreation = dateFrom ?? "",
                    _CinDUpdate = dateTo ?? "",
                    CinKeyProject = keyProjectOnly ?? false,
                    PaymentMode = ""
                };

                // Get all matching invoices
                var allInvoices = _invoiceServices.SearchClientInvoices(searchCriteria);

                // Apply additional filters
                if (isInvoice.HasValue)
                {
                    allInvoices = allInvoices.Where(i => i.CinIsInvoice == isInvoice.Value).ToList();
                }

                if (isInvoiced.HasValue)
                {
                    allInvoices = allInvoices.Where(i => i.CinIsInvoiced == isInvoiced.Value).ToList();
                }

                if (isPaid.HasValue)
                {
                    allInvoices = allInvoices.Where(i => i.CinIsFullPaid == isPaid.Value).ToList();
                }

                if (projectId.HasValue && projectId.Value > 0)
                {
                    allInvoices = allInvoices.Where(i => i.PrjId == projectId.Value).ToList();
                }

                // Map to response DTOs
                var responseList = allInvoices.Select(inv => new InvoiceListResponse
                {
                    Id = inv.CinId,
                    Code = inv.CinCode,
                    Name = inv.CinName,
                    ClientId = inv.CliId,
                    ClientName = inv.ClientCompanyName,
                    ClientAbbreviation = inv.CliAbbr,
                    ProjectId = inv.PrjId,
                    ProjectCode = inv.PrjCode,
                    ProjectName = inv.PrjName,
                    OrderId = inv.CodId,
                    OrderCode = inv.CodCode,
                    OrderName = inv.CodName,
                    CreationDate = inv.CinDCreation.ToString("dd/MM/yyyy"),
                    InvoiceDate = inv.CinDInvoice?.ToString("dd/MM/yyyy"),
                    TermDate = inv.CinDTerm?.ToString("dd/MM/yyyy"),
                    AmountHt = inv.CinAmount,
                    AmountTtc = inv.TotalAmountTtc,
                    PaidAmount = inv.CinPaid,
                    RestToPay = inv.CinRestToPay,
                    IsInvoice = inv.CinIsInvoice,
                    IsInvoiced = inv.CinIsInvoiced,
                    IsFullPaid = inv.CinIsFullPaid,
                    KeyProject = inv.CinKeyProject,
                    CurrencySymbol = inv.CurrencySymbol,
                    PaymentComments = inv.CinPaymentComments
                }).ToList();

                // Apply pagination
                var totalCount = responseList.Count;
                var pagedInvoices = responseList
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedInvoices, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"SearchInvoices error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to search invoices", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get a specific invoice by ID
        /// </summary>
        [HttpGet]
        [Route("{id:int}")]
        public IHttpActionResult GetInvoice(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                var response = MapToDetailResponse(invoice, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(response));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoice error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoice", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Create a new invoice
        /// </summary>
        [HttpPost]
        [Route("")]
        public IHttpActionResult CreateInvoice([FromBody] InvoiceCreateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
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

                // Parse invoice date
                DateTime invoiceDate = DateTime.Now;
                if (!string.IsNullOrEmpty(request.InvoiceDate))
                {
                    DateTime.TryParse(request.InvoiceDate, CultureInfo.GetCultureInfo("fr-FR"), DateTimeStyles.None, out invoiceDate);
                }

                // Parse term date
                DateTime? termDate = null;
                if (!string.IsNullOrEmpty(request.TermDate))
                {
                    if (DateTime.TryParse(request.TermDate, CultureInfo.GetCultureInfo("fr-FR"), DateTimeStyles.None, out DateTime parsedTermDate))
                    {
                        termDate = parsedTermDate;
                    }
                }

                var invoice = new ClientInvoice
                {
                    SocId = societyId,
                    UsrCreatorId = userId,
                    CliId = request.ClientId,
                    PrjId = request.ProjectId,
                    CodId = request.OrderId,
                    CplId = request.CostPlanId,
                    CcoIdInvoicing = request.ContactInvoicingId,
                    CurId = request.CurrencyId > 0 ? request.CurrencyId : 1,
                    PcoId = request.PaymentConditionId ?? 1,
                    PmoId = request.PaymentModeId ?? 1,
                    VatId = request.VatId ?? 1,
                    CinName = request.Name ?? "",
                    CinDCreation = DateTime.Now,
                    CinDInvoice = invoiceDate,
                    CinDTerm = termDate,
                    CinDiscountPercentage = request.DiscountPercentage,
                    CinDiscountAmount = request.DiscountAmount,
                    CinHeaderText = request.HeaderText,
                    CinFooterText = request.FooterText,
                    CinClientComment = request.ClientComment,
                    CinInterComment = request.InternalComment,
                    CinIsInvoice = request.IsInvoice,
                    CinAvId = request.CreditNoteInvoiceId,
                    CinBank = request.BankId,
                    TteId = request.TradeTermsId,
                    DelegatorId = request.DelegatorId,
                    UsrCom1 = request.Commercial1Id,
                    UsrCom2 = request.Commercial2Id,
                    UsrCom3 = request.Commercial3Id
                };

                var invoiceId = _invoiceServices.CreateUpdateClientInvoice(invoice);

                if (invoiceId > 0)
                {
                    // Create invoice lines if provided
                    if (request.Lines != null && request.Lines.Count > 0)
                    {
                        foreach (var lineRequest in request.Lines)
                        {
                            var line = new ClientInvoiceLine
                            {
                                CinId = invoiceId,
                                SocId = societyId,
                                PrdId = lineRequest.ProductId,
                                CiiDescription = lineRequest.Description,
                                CiiRef = lineRequest.Reference,
                                CiiPrdName = lineRequest.ProductName,
                                CiiPrdDes = lineRequest.ProductDescription,
                                CiiQuantity = lineRequest.Quantity,
                                CiiUnitPrice = lineRequest.UnitPrice,
                                CiiPurchasePrice = lineRequest.PurchasePrice,
                                CiiDiscountPercentage = lineRequest.DiscountPercentage,
                                CiiDiscountAmount = lineRequest.DiscountAmount,
                                VatId = lineRequest.VatId ?? 1,
                                LtpId = lineRequest.LineTypeId ?? 1,
                                CiiLevel1 = lineRequest.Level1,
                                CiiLevel2 = lineRequest.Level2
                            };
                            _invoiceLineServices.InsertUpdateCii(line);
                        }
                    }

                    var createdInvoice = _invoiceServices.LoadClientInvoiceById(invoiceId, societyId, userId);
                    var response = MapToDetailResponse(createdInvoice, societyId);
                    return Content(HttpStatusCode.Created,
                        ApiResponseHelper.CreateSuccessResponse(response, "Invoice created successfully"));
                }

                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Failed to create invoice"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"CreateInvoice error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to create invoice", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an existing invoice
        /// </summary>
        [HttpPut]
        [Route("{id:int}")]
        public IHttpActionResult UpdateInvoice(int id, [FromBody] InvoiceUpdateRequest request)
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
                var isAdmin = _userServices.IsAdmin(societyId, userId);

                var existingInvoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (existingInvoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                // Check if invoice is locked (already invoiced)
                if (existingInvoice.CinIsInvoiced && !isAdmin)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot modify an invoiced document. Contact administrator."));
                }

                // Update fields
                if (!string.IsNullOrEmpty(request.Name))
                    existingInvoice.CinName = request.Name;

                if (request.ContactInvoicingId.HasValue)
                    existingInvoice.CcoIdInvoicing = request.ContactInvoicingId;

                if (request.CurrencyId.HasValue)
                    existingInvoice.CurId = request.CurrencyId.Value;

                if (request.PaymentConditionId.HasValue)
                    existingInvoice.PcoId = request.PaymentConditionId.Value;

                if (request.PaymentModeId.HasValue)
                    existingInvoice.PmoId = request.PaymentModeId.Value;

                if (request.VatId.HasValue)
                    existingInvoice.VatId = request.VatId.Value;

                if (!string.IsNullOrEmpty(request.InvoiceDate))
                {
                    if (DateTime.TryParse(request.InvoiceDate, CultureInfo.GetCultureInfo("fr-FR"), DateTimeStyles.None, out DateTime parsedInvoiceDate))
                    {
                        existingInvoice.CinDInvoice = parsedInvoiceDate;
                    }
                }

                if (!string.IsNullOrEmpty(request.TermDate))
                {
                    if (DateTime.TryParse(request.TermDate, CultureInfo.GetCultureInfo("fr-FR"), DateTimeStyles.None, out DateTime parsedTermDate))
                    {
                        existingInvoice.CinDTerm = parsedTermDate;
                    }
                }

                if (request.DiscountPercentage.HasValue)
                    existingInvoice.CinDiscountPercentage = request.DiscountPercentage;

                if (request.DiscountAmount.HasValue)
                    existingInvoice.CinDiscountAmount = request.DiscountAmount;

                if (request.HeaderText != null)
                    existingInvoice.CinHeaderText = request.HeaderText;

                if (request.FooterText != null)
                    existingInvoice.CinFooterText = request.FooterText;

                if (request.ClientComment != null)
                    existingInvoice.CinClientComment = request.ClientComment;

                if (request.InternalComment != null)
                    existingInvoice.CinInterComment = request.InternalComment;

                if (request.BankId.HasValue)
                    existingInvoice.CinBank = request.BankId;

                if (request.TradeTermsId.HasValue)
                    existingInvoice.TteId = request.TradeTermsId;

                if (request.DelegatorId.HasValue)
                    existingInvoice.DelegatorId = request.DelegatorId;

                if (request.Commercial1Id.HasValue)
                    existingInvoice.UsrCom1 = request.Commercial1Id;

                if (request.Commercial2Id.HasValue)
                    existingInvoice.UsrCom2 = request.Commercial2Id;

                if (request.Commercial3Id.HasValue)
                    existingInvoice.UsrCom3 = request.Commercial3Id;

                if (request.KeyProject.HasValue)
                    existingInvoice.CinKeyProject = request.KeyProject.Value;

                existingInvoice.CinDUpdate = DateTime.Now;

                _invoiceServices.CreateUpdateClientInvoice(existingInvoice, false, isAdmin);

                var updatedInvoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);
                var response = MapToDetailResponse(updatedInvoice, societyId);
                return Ok(ApiResponseHelper.CreateSuccessResponse(response, "Invoice updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateInvoice error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update invoice", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete an invoice (Note: Financial documents cannot be deleted, this endpoint is for admin use only to archive drafts)
        /// </summary>
        [HttpDelete]
        [Route("{id:int}")]
        public IHttpActionResult DeleteInvoice(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var isAdmin = _userServices.IsAdmin(societyId, userId);

                if (!isAdmin)
                {
                    return Content(HttpStatusCode.Forbidden,
                        ApiResponseHelper.CreateErrorResponse("Only administrators can delete invoices", HttpStatusCode.Forbidden));
                }

                var existingInvoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (existingInvoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                // Check if invoice is locked (already invoiced)
                if (existingInvoice.CinIsInvoiced)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot delete an invoiced document. Invoiced documents are immutable."));
                }

                // Check if invoice has payments
                if (existingInvoice.CinPaid.HasValue && existingInvoice.CinPaid.Value > 0)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot delete an invoice with payments"));
                }

                // For now, deletion of draft invoices is not supported at the repository level
                // This is a placeholder - financial documents are typically archived rather than deleted
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Invoice deletion is not currently supported. Please archive the invoice instead."));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteInvoice error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to process request", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Mark invoice as invoiced (lock for editing)
        /// </summary>
        [HttpPost]
        [Route("{id:int}/invoice")]
        public IHttpActionResult MarkAsInvoiced(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var existingInvoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (existingInvoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                if (existingInvoice.CinIsInvoiced)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Invoice is already marked as invoiced"));
                }

                _invoiceServices.SetCinInvoiced(societyId, id);

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Invoice marked as invoiced successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"MarkAsInvoiced error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to mark invoice as invoiced", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get invoice lines
        /// </summary>
        [HttpGet]
        [Route("{id:int}/lines")]
        public IHttpActionResult GetInvoiceLines(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                var lines = _invoiceLineServices.GetCiisByCinId(societyId, id, 0);

                var response = lines.Select(line => new InvoiceLineResponse
                {
                    Id = line.CiiId,
                    InvoiceId = line.CinId,
                    ProductId = line.PrdId,
                    ProductFId = line.PrdFId,
                    ProductName = line.PrdName ?? line.CiiPrdName,
                    ProductDescription = line.CiiPrdDes,
                    Description = line.CiiDescription,
                    Reference = line.CiiRef,
                    Quantity = line.CiiQuantity,
                    UnitPrice = line.CiiUnitPrice,
                    TotalPrice = line.CiiTotalPrice,
                    TotalPriceWithDiscount = line.CiiPriceWithDiscountHt,
                    PurchasePrice = line.CiiPurchasePrice,
                    TotalCrudePrice = line.CiiTotalCrudePrice,
                    DiscountPercentage = line.CiiDiscountPercentage,
                    DiscountAmount = line.CiiDiscountAmount,
                    Margin = line.CiiMargin,
                    VatId = line.VatId,
                    VatLabel = line.VatLabel,
                    VatRate = line.VatRate,
                    LineTypeId = line.LtpId,
                    LineType = line.LineType,
                    Level1 = line.CiiLevel1,
                    Level2 = line.CiiLevel2,
                    ProductImagePath = line.PrdImgPath,
                    LogisticsQuantity = line.LglQuantity,
                    DeliveryFormQuantity = line.DflQuantity
                }).ToList();

                return Ok(ApiResponseHelper.CreateSuccessResponse(response));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoiceLines error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoice lines", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Add a line to an invoice
        /// </summary>
        [HttpPost]
        [Route("{id:int}/lines")]
        public IHttpActionResult AddInvoiceLine(int id, [FromBody] InvoiceLineCreateRequest request)
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
                var isAdmin = _userServices.IsAdmin(societyId, userId);

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                // Check if invoice is locked
                if (invoice.CinIsInvoiced && !isAdmin)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot modify an invoiced document"));
                }

                var line = new ClientInvoiceLine
                {
                    CinId = id,
                    SocId = societyId,
                    PrdId = request.ProductId,
                    CiiDescription = request.Description,
                    CiiRef = request.Reference,
                    CiiPrdName = request.ProductName,
                    CiiPrdDes = request.ProductDescription,
                    CiiQuantity = request.Quantity,
                    CiiUnitPrice = request.UnitPrice,
                    CiiPurchasePrice = request.PurchasePrice,
                    CiiDiscountPercentage = request.DiscountPercentage,
                    CiiDiscountAmount = request.DiscountAmount,
                    VatId = request.VatId ?? 1,
                    LtpId = request.LineTypeId ?? 1,
                    CiiLevel1 = request.Level1,
                    CiiLevel2 = request.Level2
                };

                var lineId = _invoiceLineServices.InsertUpdateCii(line);

                return Content(HttpStatusCode.Created,
                    ApiResponseHelper.CreateSuccessResponse(new { Id = lineId }, "Invoice line added successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"AddInvoiceLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to add invoice line", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Update an invoice line
        /// </summary>
        [HttpPut]
        [Route("{id:int}/lines/{lineId:int}")]
        public IHttpActionResult UpdateInvoiceLine(int id, int lineId, [FromBody] InvoiceLineUpdateRequest request)
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
                var isAdmin = _userServices.IsAdmin(societyId, userId);

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                // Check if invoice is locked
                if (invoice.CinIsInvoiced && !isAdmin)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot modify an invoiced document"));
                }

                var line = new ClientInvoiceLine
                {
                    CiiId = lineId,
                    CinId = id,
                    SocId = societyId,
                    PrdId = request.ProductId,
                    CiiDescription = request.Description,
                    CiiRef = request.Reference,
                    CiiPrdName = request.ProductName,
                    CiiPrdDes = request.ProductDescription,
                    CiiQuantity = request.Quantity,
                    CiiUnitPrice = request.UnitPrice,
                    CiiPurchasePrice = request.PurchasePrice,
                    CiiDiscountPercentage = request.DiscountPercentage,
                    CiiDiscountAmount = request.DiscountAmount,
                    VatId = request.VatId ?? 1,
                    LtpId = request.LineTypeId ?? 1,
                    CiiLevel1 = request.Level1,
                    CiiLevel2 = request.Level2
                };

                _invoiceLineServices.InsertUpdateCii(line);

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Invoice line updated successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"UpdateInvoiceLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to update invoice line", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Delete an invoice line
        /// </summary>
        [HttpDelete]
        [Route("{id:int}/lines/{lineId:int}")]
        public IHttpActionResult DeleteInvoiceLine(int id, int lineId)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();
                var isAdmin = _userServices.IsAdmin(societyId, userId);

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                // Check if invoice is locked
                if (invoice.CinIsInvoiced && !isAdmin)
                {
                    return Content(HttpStatusCode.BadRequest,
                        ApiResponseHelper.CreateErrorResponse("Cannot modify an invoiced document"));
                }

                _invoiceLineServices.DeleteCii(societyId, id, lineId);

                return Ok(ApiResponseHelper.CreateSuccessResponse<object>(null, "Invoice line deleted successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"DeleteInvoiceLine error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to delete invoice line", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get invoice payments
        /// </summary>
        [HttpGet]
        [Route("{id:int}/payments")]
        public IHttpActionResult GetInvoicePayments(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                var paymentInfo = _invoiceServices.GetCinPaymentInfo(societyId, id);

                if (paymentInfo == null || paymentInfo.CinPaymentList == null)
                {
                    return Ok(ApiResponseHelper.CreateSuccessResponse(new List<InvoicePaymentResponse>()));
                }

                var response = paymentInfo.CinPaymentList.Select(p => new InvoicePaymentResponse
                {
                    Id = p.Id,
                    InvoiceId = p.CinId,
                    Amount = p.CpyAmount,
                    PaymentDate = p.CpyDCreation.ToString("dd/MM/yyyy"),
                    Comment = p.CpyComment,
                    PaymentCode = p.CpyPaymentCode,
                    HasFile = p.HasFile,
                    FileGuid = p.CpyGuid
                }).ToList();

                return Ok(ApiResponseHelper.CreateSuccessResponse(response));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoicePayments error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoice payments", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Add a payment to an invoice
        /// </summary>
        [HttpPost]
        [Route("{id:int}/payments")]
        public IHttpActionResult AddInvoicePayment(int id, [FromBody] InvoicePaymentCreateRequest request)
        {
            if (request == null)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Request body is required"));
            }

            if (request.Amount <= 0)
            {
                return Content(HttpStatusCode.BadRequest,
                    ApiResponseHelper.CreateErrorResponse("Payment amount must be greater than zero"));
            }

            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                // Parse payment date
                DateTime paymentDate = DateTime.Now;
                if (!string.IsNullOrEmpty(request.PaymentDate))
                {
                    DateTime.TryParse(request.PaymentDate, CultureInfo.GetCultureInfo("fr-FR"), DateTimeStyles.None, out paymentDate);
                }

                // CreateUpdateCinPayment signature: (int socId, int cinId, int cpyId, decimal cpyAmount, string cpyFilePath, string comment = null, bool updateFile = false, string paymentcode = null)
                // For new payment, cpyId = 0
                var paymentId = _invoiceServices.CreateUpdateCinPayment(societyId, id, 0, request.Amount, null, request.Comment);

                return Content(HttpStatusCode.Created,
                    ApiResponseHelper.CreateSuccessResponse(new { Id = paymentId }, "Payment added successfully"));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"AddInvoicePayment error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to add payment", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get invoice financial information
        /// </summary>
        [HttpGet]
        [Route("{id:int}/financial")]
        public IHttpActionResult GetInvoiceFinancialInfo(int id)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoice = _invoiceServices.LoadClientInvoiceById(id, societyId, userId);

                if (invoice == null)
                {
                    return Content(HttpStatusCode.NotFound,
                        ApiResponseHelper.CreateErrorResponse("Invoice not found", HttpStatusCode.NotFound));
                }

                var generalInfo = _invoiceLineServices.GetClinetInvoiceInfo(societyId, id);
                var paymentInfo = _invoiceServices.GetCinPaymentInfo(societyId, id);

                var response = new InvoiceFinancialInfo
                {
                    InvoiceId = id,
                    TotalAmountHt = generalInfo?.TotalAmountHt,
                    TotalAmountTtc = generalInfo?.TotalAmountTtc,
                    TotalMargin = generalInfo?.TotalMargin,
                    TotalPurchasePrice = generalInfo?.TotalPurchasePrice,
                    TotalSalePrice = generalInfo?.TotalSalePrice,
                    PaidAmount = paymentInfo?.CinPaid,
                    RestToPay = paymentInfo?.CinRest2Pay,
                    DiscountPercentage = generalInfo?.CinDiscountPercentage,
                    DiscountAmount = generalInfo?.CinDiscountAmount,
                    CurrencySymbol = generalInfo?.CurrencySymbol
                };

                return Ok(ApiResponseHelper.CreateSuccessResponse(response));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoiceFinancialInfo error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoice financial info", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get invoices by client ID
        /// </summary>
        [HttpGet]
        [Route("by-client/{clientId:int}")]
        public IHttpActionResult GetInvoicesByClient(int clientId, [FromUri] int page = 1, [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var searchCriteria = new ClientInvoice
                {
                    SocId = societyId,
                    UsrCreatorId = userId,
                    CliId = clientId,
                    CinName = "",
                    CinCode = "",
                    ClientCompanyName = "",
                    Inv_CcoFirstname = "",
                    PrjCode = "",
                    PrjName = "",
                    CinInterComment = "",
                    _CinDCreation = "",
                    _CinDUpdate = "",
                    PaymentMode = ""
                };

                var allInvoices = _invoiceServices.SearchClientInvoices(searchCriteria);

                var responseList = allInvoices.Select(inv => new InvoiceListResponse
                {
                    Id = inv.CinId,
                    Code = inv.CinCode,
                    Name = inv.CinName,
                    ClientId = inv.CliId,
                    ClientName = inv.ClientCompanyName,
                    ProjectId = inv.PrjId,
                    ProjectCode = inv.PrjCode,
                    ProjectName = inv.PrjName,
                    OrderId = inv.CodId,
                    OrderCode = inv.CodCode,
                    CreationDate = inv.CinDCreation.ToString("dd/MM/yyyy"),
                    InvoiceDate = inv.CinDInvoice?.ToString("dd/MM/yyyy"),
                    TermDate = inv.CinDTerm?.ToString("dd/MM/yyyy"),
                    AmountHt = inv.CinAmount,
                    AmountTtc = inv.TotalAmountTtc,
                    PaidAmount = inv.CinPaid,
                    RestToPay = inv.CinRestToPay,
                    IsInvoice = inv.CinIsInvoice,
                    IsInvoiced = inv.CinIsInvoiced,
                    IsFullPaid = inv.CinIsFullPaid
                }).ToList();

                var totalCount = responseList.Count;
                var pagedInvoices = responseList
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedInvoices, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoicesByClient error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoices", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get invoices by project ID
        /// </summary>
        [HttpGet]
        [Route("by-project/{projectId:int}")]
        public IHttpActionResult GetInvoicesByProject(int projectId, [FromUri] int page = 1, [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoices = _invoiceServices.GetClientInvoiceByPrjId(societyId, projectId);

                var responseList = invoices.Select(inv => new InvoiceListResponse
                {
                    Id = inv.CinId,
                    Code = inv.CinCode,
                    Name = inv.CinName,
                    ClientId = inv.CliId,
                    ClientName = inv.ClientCompanyName,
                    ProjectId = inv.PrjId,
                    ProjectCode = inv.PrjCode,
                    ProjectName = inv.PrjName,
                    OrderId = inv.CodId,
                    OrderCode = inv.CodCode,
                    CreationDate = inv.CinDCreation.ToString("dd/MM/yyyy"),
                    InvoiceDate = inv.CinDInvoice?.ToString("dd/MM/yyyy"),
                    TermDate = inv.CinDTerm?.ToString("dd/MM/yyyy"),
                    AmountHt = inv.CinAmount,
                    AmountTtc = inv.TotalAmountTtc,
                    IsInvoice = inv.CinIsInvoice,
                    IsInvoiced = inv.CinIsInvoiced
                }).ToList();

                var totalCount = responseList.Count;
                var pagedInvoices = responseList
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedInvoices, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoicesByProject error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoices", HttpStatusCode.InternalServerError));
            }
        }

        /// <summary>
        /// Get invoices by order ID
        /// </summary>
        [HttpGet]
        [Route("by-order/{orderId:int}")]
        public IHttpActionResult GetInvoicesByOrder(int orderId, [FromUri] int page = 1, [FromUri] int pageSize = 20)
        {
            try
            {
                var societyId = GetCurrentSocietyId();
                var userId = GetCurrentUserId();

                var invoices = _invoiceServices.GetClientInvoiceByCodId(societyId, orderId);

                var responseList = invoices.Select(inv => new InvoiceListResponse
                {
                    Id = inv.CinId,
                    Code = inv.CinCode,
                    Name = inv.CinName,
                    ClientId = inv.CliId,
                    ClientName = inv.ClientCompanyName,
                    ProjectId = inv.PrjId,
                    ProjectCode = inv.PrjCode,
                    ProjectName = inv.PrjName,
                    OrderId = inv.CodId,
                    OrderCode = inv.CodCode,
                    CreationDate = inv.CinDCreation.ToString("dd/MM/yyyy"),
                    InvoiceDate = inv.CinDInvoice?.ToString("dd/MM/yyyy"),
                    TermDate = inv.CinDTerm?.ToString("dd/MM/yyyy"),
                    AmountHt = inv.CinAmount,
                    AmountTtc = inv.TotalAmountTtc,
                    IsInvoice = inv.CinIsInvoice,
                    IsInvoiced = inv.CinIsInvoiced
                }).ToList();

                var totalCount = responseList.Count;
                var pagedInvoices = responseList
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();

                return Ok(ApiResponseHelper.CreatePagedResponse(pagedInvoices, page, pageSize, totalCount));
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"GetInvoicesByOrder error: {ex}");
                return Content(HttpStatusCode.InternalServerError,
                    ApiResponseHelper.CreateErrorResponse("Failed to retrieve invoices", HttpStatusCode.InternalServerError));
            }
        }

        #region Private Helper Methods

        private InvoiceDetailResponse MapToDetailResponse(ClientInvoice invoice, int societyId)
        {
            if (invoice == null) return null;

            // Get invoice lines
            var lines = _invoiceLineServices.GetCiisByCinId(societyId, invoice.CinId, 0);

            return new InvoiceDetailResponse
            {
                Id = invoice.CinId,
                FId = invoice.FId,
                Code = invoice.CinCode,
                Name = invoice.CinName,

                // Client info
                ClientId = invoice.CliId,
                ClientFId = invoice.CliFId,
                ClientName = invoice.ClientCompanyName,
                ClientAbbreviation = invoice.CliAbbr,

                // Project info
                ProjectId = invoice.PrjId,
                ProjectFId = invoice.PrjFId,
                ProjectCode = invoice.PrjCode,
                ProjectName = invoice.PrjName,

                // Order info
                OrderId = invoice.CodId,
                OrderFId = invoice.CodFId,
                OrderCode = invoice.CodCode,
                OrderName = invoice.CodName,

                // Cost Plan info
                CostPlanId = invoice.CplId,
                CostPlanFId = invoice.CplFId,
                CostPlanCode = invoice.CplCode,
                CostPlanName = invoice.CplName,

                // Dates
                CreationDate = invoice.CinDCreation.ToString("dd/MM/yyyy"),
                UpdateDate = invoice.CinDUpdate?.ToString("dd/MM/yyyy"),
                InvoiceDate = invoice.CinDInvoice?.ToString("dd/MM/yyyy"),
                TermDate = invoice.CinDTerm?.ToString("dd/MM/yyyy"),
                CashingDate = invoice.CinDEncaissement?.ToString("dd/MM/yyyy"),

                // Financial
                CurrencyId = invoice.CurId,
                CurrencySymbol = invoice.CurrencySymbol,
                VatId = invoice.VatId,
                DiscountPercentage = invoice.CinDiscountPercentage,
                DiscountAmount = invoice.CinDiscountAmount,
                AmountHt = invoice.CinAmount,
                AmountTtc = invoice.TotalAmountTtc,
                PaidAmount = invoice.CinPaid,
                RestToPay = invoice.CinRestToPay,
                Margin = invoice.CinMargin,

                // Payment
                PaymentConditionId = invoice.PcoId,
                PaymentCondition = invoice.PaymentCondition,
                PaymentModeId = invoice.PmoId,
                PaymentMode = invoice.PaymentMode,

                // Status flags
                IsInvoice = invoice.CinIsInvoice,
                IsInvoiced = invoice.CinIsInvoiced,
                IsFullPaid = invoice.CinIsFullPaid,
                KeyProject = invoice.CinKeyProject,
                CanCreateDeliveryForm = invoice.CanCreateDfo,

                // Text content
                HeaderText = invoice.CinHeaderText,
                FooterText = invoice.CinFooterText,
                ClientComment = invoice.CinClientComment,
                InternalComment = invoice.CinInterComment,

                // Bank info
                BankId = invoice.CinBank,
                BankName = invoice.RibBankName,
                BankIban = invoice.RibCodeIban,
                BankBic = invoice.RibCodeBic,

                // Trade terms
                TradeTermsId = invoice.TteId,
                TradeTerms = invoice.TradeTerms,

                // Credit note reference
                CreditNoteInvoiceId = invoice.CinAvId,
                CreditNoteInvoiceFId = invoice.CinAvFId,
                CreditNoteInvoiceCode = invoice.CinAvCode,

                // Contact info
                ContactInvoicingId = invoice.CcoIdInvoicing,
                ContactFirstname = invoice.Inv_CcoFirstname,
                ContactLastname = invoice.Inv_CcoLastname,
                ContactAddress1 = invoice.Inv_CcoAddress1,
                ContactAddress2 = invoice.Inv_CcoAddress2,
                ContactPostcode = invoice.Inv_CcoPostcode,
                ContactCity = invoice.Inv_CcoCity,
                ContactCountry = invoice.Inv_CcoCountry,
                ContactPhone = invoice.Inv_CcoTel1,
                ContactFax = invoice.Inv_CcoFax,
                ContactMobile = invoice.Inv_CcoCellphone,
                ContactEmail = invoice.Inv_CcoEmail,

                // Commercials
                Commercial1Id = invoice.UsrCom1,
                Commercial1Name = invoice.UsrCommercial1,
                Commercial2Id = invoice.UsrCom2,
                Commercial2Name = invoice.UsrCommercial2,
                Commercial3Id = invoice.UsrCom3,
                Commercial3Name = invoice.UsrCommercial3,

                // Delegator
                DelegatorId = invoice.DelegatorId,
                DelegatorName = invoice.Delegataire?.Value,

                // Creator
                CreatorId = invoice.UsrCreatorId,
                CreatorName = invoice.Creator?.Username,

                // Lines
                Lines = lines?.Select(line => new InvoiceLineResponse
                {
                    Id = line.CiiId,
                    InvoiceId = line.CinId,
                    ProductId = line.PrdId,
                    ProductFId = line.PrdFId,
                    ProductName = line.PrdName ?? line.CiiPrdName,
                    ProductDescription = line.CiiPrdDes,
                    Description = line.CiiDescription,
                    Reference = line.CiiRef,
                    Quantity = line.CiiQuantity,
                    UnitPrice = line.CiiUnitPrice,
                    TotalPrice = line.CiiTotalPrice,
                    TotalPriceWithDiscount = line.CiiPriceWithDiscountHt,
                    PurchasePrice = line.CiiPurchasePrice,
                    TotalCrudePrice = line.CiiTotalCrudePrice,
                    DiscountPercentage = line.CiiDiscountPercentage,
                    DiscountAmount = line.CiiDiscountAmount,
                    Margin = line.CiiMargin,
                    VatId = line.VatId,
                    VatLabel = line.VatLabel,
                    VatRate = line.VatRate,
                    LineTypeId = line.LtpId,
                    LineType = line.LineType,
                    Level1 = line.CiiLevel1,
                    Level2 = line.CiiLevel2,
                    ProductImagePath = line.PrdImgPath,
                    LogisticsQuantity = line.LglQuantity,
                    DeliveryFormQuantity = line.DflQuantity
                }).ToList(),

                // Payments
                Payments = invoice.ClientInvoicePayments?.Select(p => new InvoicePaymentResponse
                {
                    Id = p.Id,
                    InvoiceId = p.CinId,
                    Amount = p.CpyAmount,
                    PaymentDate = p.CpyDCreation.ToString("dd/MM/yyyy"),
                    Comment = p.CpyComment,
                    PaymentCode = p.CpyPaymentCode,
                    HasFile = p.HasFile,
                    FileGuid = p.CpyGuid
                }).ToList(),

                // Supplier Orders
                SupplierOrders = invoice.CsoList?.Select(cso => new KeyValueResponse
                {
                    Key = cso.Key,
                    Value = cso.Value,
                    Value2 = cso.Value3,
                    FId = cso.Value2
                }).ToList(),

                // Logistics
                Logistics = invoice.CgsList?.Select(cgs => new KeyValueResponse
                {
                    Key = cgs.Key,
                    Value = cgs.Value,
                    Value2 = cgs.Value3,
                    Value3 = cgs.Value4,
                    FId = cgs.Value2
                }).ToList()
            };
        }

        #endregion
    }
}
