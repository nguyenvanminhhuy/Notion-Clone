namespace NotionClone.Application.DTOs.Auth;

public record RegisterRequest(
    string Email,
    string Password,
    string Name);

public record LoginRequest(
    string Email,
    string Password);

public record RefreshTokenRequest(
    string RefreshToken);

public record AuthResponse(
    UserDto User,
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt);

public record UserDto(
    Guid Id,
    string Name,
    string Email,
    string? AvatarUrl,
    string Role,
    DateTime CreatedAt,
    DateTime UpdatedAt);
