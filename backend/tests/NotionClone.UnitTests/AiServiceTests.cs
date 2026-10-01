using Microsoft.EntityFrameworkCore;
using NotionClone.Application.DTOs.AI;
using NotionClone.Domain.Entities;
using NotionClone.Infrastructure.AI;
using NotionClone.Infrastructure.Persistence;
using NotionClone.Infrastructure.Services;
using Xunit;

namespace NotionClone.UnitTests;

public class AiServiceTests
{
    private NotionDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<NotionDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new NotionDbContext(options);
    }

    private async Task<Guid> SetupUserAsync(NotionDbContext db)
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Email = "aiuser@example.com", Name = "AI User" };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return userId;
    }

    [Fact]
    public async Task GenerateAsync_ShouldProduceTransformedText()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var userId = await SetupUserAsync(db);
        var aiEngine = new DefaultAiEngine();
        var aiService = new AiService(db, aiEngine);

        var request = new AiGenerateRequest("Summarize this doc", "This is an important architectural doc about scaling.", "summarize", null);

        // Act
        var result = await aiService.GenerateAsync(userId, request);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("summarize", result.ActionType);
        Assert.Contains("Key Takeaways", result.Response);
    }

    [Fact]
    public async Task ChatAsync_ShouldCreateConversationAndRecordMessages()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var userId = await SetupUserAsync(db);
        var aiEngine = new DefaultAiEngine();
        var aiService = new AiService(db, aiEngine);

        // Act 1: Initial chat message (creates new conversation)
        var chatResponse1 = await aiService.ChatAsync(userId, new AiChatRequest(null, null, "How do I create a database index?", "explain"));

        Assert.NotNull(chatResponse1);
        Assert.Equal("assistant", chatResponse1.Role);

        // Act 2: Verify conversation and messages stored
        var conversations = (await aiService.GetConversationsAsync(userId)).ToList();
        Assert.Single(conversations);
        Assert.Equal(2, conversations[0].Messages.Count); // User message + Assistant message
        Assert.Equal("user", conversations[0].Messages[0].Role);
        Assert.Equal("assistant", conversations[0].Messages[1].Role);

        // Act 3: Follow-up message in the same conversation
        var chatResponse2 = await aiService.ChatAsync(userId, new AiChatRequest(conversations[0].Id, null, "Tell me more details.", "continue"));
        Assert.NotNull(chatResponse2);

        var updatedConv = await aiService.GetConversationByIdAsync(userId, conversations[0].Id);
        Assert.Equal(4, updatedConv.Messages.Count); // 2 user messages + 2 assistant messages
    }

    [Fact]
    public async Task DeleteConversation_ShouldRemoveConversationAndMessages()
    {
        // Arrange
        var db = CreateInMemoryDbContext();
        var userId = await SetupUserAsync(db);
        var aiEngine = new DefaultAiEngine();
        var aiService = new AiService(db, aiEngine);

        var chatResp = await aiService.ChatAsync(userId, new AiChatRequest(null, null, "Temporary query", "custom"));
        var conversationId = chatResp.ConversationId;

        // Act
        await aiService.DeleteConversationAsync(userId, conversationId);

        // Assert
        var conversations = (await aiService.GetConversationsAsync(userId)).ToList();
        Assert.Empty(conversations);

        var messagesInDb = await db.AIMessages.Where(m => m.ConversationId == conversationId).ToListAsync();
        Assert.Empty(messagesInDb);
    }
}
