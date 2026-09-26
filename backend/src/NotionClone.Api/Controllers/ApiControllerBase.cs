using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using NotionClone.Application.Common.Exceptions;

namespace NotionClone.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                           ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedException("User is not authenticated or user ID is invalid.");
            }
            return userId;
        }
    }
}
