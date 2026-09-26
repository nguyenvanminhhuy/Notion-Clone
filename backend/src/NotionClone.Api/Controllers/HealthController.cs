using Microsoft.AspNetCore.Mvc;

namespace NotionClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetStatus()
    {
        return Ok(new
        {
            Status = "Healthy",
            Service = "NotionClone.Api",
            Timestamp = DateTime.UtcNow
        });
    }
}
