using System.Collections.Generic;
using System.Net;

namespace ERP.Web.Api.Helpers
{
    public static class ApiResponseHelper
    {
        public static ApiResponse<T> CreateSuccessResponse<T>(T data, string message = null)
        {
            return new ApiResponse<T>
            {
                Success = true,
                Data = data,
                Message = message
            };
        }

        public static ApiResponse<object> CreateErrorResponse(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest)
        {
            return new ApiResponse<object>
            {
                Success = false,
                Message = message,
                StatusCode = (int)statusCode
            };
        }

        public static PagedResponse<T> CreatePagedResponse<T>(IEnumerable<T> data, int page, int pageSize, int totalCount)
        {
            var totalPages = (totalCount + pageSize - 1) / pageSize;
            return new PagedResponse<T>
            {
                Success = true,
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };
        }
    }

    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public T Data { get; set; }
        public string Message { get; set; }
        public int? StatusCode { get; set; }
    }

    public class PagedResponse<T>
    {
        public bool Success { get; set; }
        public IEnumerable<T> Data { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}
