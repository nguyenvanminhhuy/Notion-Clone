namespace NotionClone.Application.Interfaces;

public interface IAiEngine
{
    Task<string> GenerateAsync(string prompt, string? contextText, string actionType, CancellationToken ct = default);
}
