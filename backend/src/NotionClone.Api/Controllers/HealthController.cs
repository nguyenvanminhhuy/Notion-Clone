using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet("ready")]
    public async Task<IActionResult> Ready([FromServices] NotionDbContext db, CancellationToken ct)
    {
        try
        {
            if (!await db.Database.CanConnectAsync(ct) ||
                (db.Database.IsRelational() && (await db.Database.GetPendingMigrationsAsync(ct)).Any()))
                return StatusCode(503, new { Status = "NotReady" });
            return Ok(new { Status = "Ready" });
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch { return StatusCode(503, new { Status = "NotReady" }); }
    }

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
