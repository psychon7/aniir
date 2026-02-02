using System;
using System.Net;
using System.Net.Http;
using System.Web.Http.Filters;
using ERP.Web.Api.Helpers;

namespace ERP.Web.Api.Filters
{
    public class ApiExceptionFilter : ExceptionFilterAttribute
    {
        public override void OnException(HttpActionExecutedContext actionExecutedContext)
        {
            var exception = actionExecutedContext.Exception;
            var statusCode = HttpStatusCode.InternalServerError;
            var message = "An unexpected error occurred";

            if (exception is ArgumentException)
            {
                statusCode = HttpStatusCode.BadRequest;
                message = exception.Message;
            }
            else if (exception is UnauthorizedAccessException)
            {
                statusCode = HttpStatusCode.Unauthorized;
                message = exception.Message;
            }
            else if (exception is InvalidOperationException)
            {
                statusCode = HttpStatusCode.BadRequest;
                message = exception.Message;
            }

            // Log the exception
            System.Diagnostics.Debug.WriteLine($"API Exception: {exception}");

            var response = ApiResponseHelper.CreateErrorResponse(message, statusCode);
            actionExecutedContext.Response = actionExecutedContext.Request.CreateResponse(statusCode, response);
        }
    }
}
