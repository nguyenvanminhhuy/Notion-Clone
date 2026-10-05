using NotionClone.Application.Interfaces;

namespace NotionClone.Infrastructure.AI;

public class DefaultAiEngine : IAiEngine
{
    public Task<string> GenerateAsync(string prompt, string? contextText, string actionType, CancellationToken ct = default)
    {
        var action = actionType?.ToLowerInvariant() ?? "custom";
        var text = contextText?.Trim() ?? string.Empty;

        string result = action switch
        {
            "summarize" =>
                $"**Key Takeaways:**\n- {(text.Length > 0 ? text[..Math.Min(text.Length, 80)] : "The main topics covered include project planning, team alignment, and milestone execution.")}\n- Key priorities focus on efficiency, accessibility, and clean architectural design.\n- Next steps involve finalizing feature verification and UX polishing.",

            "improve" =>
                text.Length > 0
                    ? $"Here is an improved version:\n\n\"{text} — revised for clarity, punchiness, and professional tone.\""
                    : "Here is a refined version of your notes with enhanced structure and concise phrasing for maximum impact.",

            "rewrite" =>
                text.Length > 0
                    ? $"Rephrased:\n\n{string.Join("\n", text.Split(new[] { ". " }, StringSplitOptions.RemoveEmptyEntries).Select(s => $"• {s}"))}"
                    : "Reorganized content with clearer paragraph transitions and bulleted executive highlights.",

            "translate" =>
                $"**[Translated Content]**\n\n{(text.Length > 0 ? text : "This content has been accurately translated while preserving original context and nuance.")}",

            "explain" =>
                $"**Explanation:**\n\nThis section discusses {(text.Length > 0 ? $"\"{text[..Math.Min(text.Length, 50)]}...\"" : "the core operational workflow")}. In simple terms, it breaks down how components interact, handle events, and sync state across the system without unnecessary overhead.",

            "continue" =>
                $"{(text.Length > 0 ? text + " " : "")}Furthermore, continuing this thought leads us to consider scalable scalability patterns, automated testing frameworks, and continuous delivery pipelines to ensure long-term stability.",

            "make_longer" =>
                $"In-depth Breakdown:\n\n{(text.Length > 0 ? text : "Initial summary context")}\n\nTo elaborate further on this point, standard enterprise workflows require thorough documentation, edge-case coverage, and clear user guidance to maintain software quality at scale.",

            "make_shorter" =>
                $"Summary: {(text.Length > 0 ? text[..Math.Min(text.Length, 100)] + "..." : "Key objective achieved with streamlined execution.")}",

            _ =>
                $"Based on your request \"{(string.IsNullOrWhiteSpace(prompt) ? "Ask AI" : prompt)}\":\n\n1. **Analysis**: Identified primary requirements and core concepts.\n2. **Recommendation**: Implement modular component structures and automated state tracking.\n3. **Summary**: Clean, scalable solution ready for immediate deployment."
        };

        return Task.FromResult($"[Demo AI] {result}");
    }
}
