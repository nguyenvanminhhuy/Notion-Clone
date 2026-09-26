using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NotionClone.Application.Common.Exceptions;
using NotionClone.Application.DTOs.Auth;
using NotionClone.Application.Interfaces;
using NotionClone.Domain.Entities;
using NotionClone.Infrastructure.Persistence;

namespace NotionClone.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly NotionDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IConfiguration _configuration;
    private readonly int _refreshTokenExpiryDays;

    public AuthService(NotionDbContext context, IJwtService jwtService, IConfiguration configuration)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
        _refreshTokenExpiryDays = int.TryParse(configuration["Jwt:RefreshTokenExpiryDays"], out var days) ? days : 7;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        // Check if email already exists
        var exists = await _context.Users.AnyAsync(u => u.Email == request.Email.ToLower(), ct);
        if (exists)
            throw new ConflictException($"An account with email '{request.Email}' already exists.");

        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var user = new User
        {
            Email = request.Email.ToLower().Trim(),
            Name = request.Name.Trim(),
            PasswordHash = passwordHash,
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(ct);

        return await GenerateAuthResponseAsync(user, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email.ToLower(), ct);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        return await GenerateAuthResponseAsync(user, ct);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, ct);

        if (storedToken is null || !storedToken.IsActive)
            throw new UnauthorizedException("Invalid or expired refresh token.");

        // Revoke old token (rotation)
        storedToken.IsRevoked = true;
        storedToken.UpdatedAt = DateTime.UtcNow;

        var response = await GenerateAuthResponseAsync(storedToken.User, ct);
        storedToken.ReplacedByToken = response.RefreshToken;

        await _context.SaveChangesAsync(ct);
        return response;
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken, ct);

        if (storedToken is not null && storedToken.IsActive)
        {
            storedToken.IsRevoked = true;
            storedToken.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
    }

    public async Task<UserDto> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, ct)
            ?? throw new NotFoundException(nameof(User), userId);

        return MapToUserDto(user);
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user, CancellationToken ct)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshTokenValue = _jwtService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays)
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync(ct);

        return new AuthResponse(
            User: MapToUserDto(user),
            AccessToken: accessToken,
            RefreshToken: refreshTokenValue,
            ExpiresAt: refreshToken.ExpiresAt);
    }

    private static UserDto MapToUserDto(User user) => new(
        Id: user.Id,
        Name: user.Name,
        Email: user.Email,
        AvatarUrl: user.AvatarUrl,
        Role: user.SystemRole.ToString().ToLower(),
        CreatedAt: user.CreatedAt,
        UpdatedAt: user.UpdatedAt);
}
