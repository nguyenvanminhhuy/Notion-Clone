using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using NotionClone.Application.Common.Exceptions;

namespace NotionClone.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title, errors) = exception switch
        {
            NotFoundException => (HttpStatusCode.NotFound, "Resource not found", null),
            UnauthorizedException => (HttpStatusCode.Unauthorized, "Unauthorized", null),
            ForbiddenException => (HttpStatusCode.Forbidden, "Forbidden", null),
            ConflictException => (HttpStatusCode.Conflict, "Conflict", null),
            ExternalServiceException => (HttpStatusCode.ServiceUnavailable, "External service unavailable", null),
            Application.Common.Exceptions.ValidationException ve => (HttpStatusCode.UnprocessableEntity, "Validation failed", ve.Errors),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred.", null)
        };

        if (statusCode == HttpStatusCode.InternalServerError)
            _logger.LogError(exception, "Unhandled exception");

        var problem = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = statusCode != HttpStatusCode.InternalServerError ? exception.Message : null,
            Type = $"https://httpstatuses.com/{(int)statusCode}"
        };

        if (errors is not null)
            problem.Extensions["errors"] = errors;

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(problem, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        await context.Response.WriteAsync(json);
    }
}
