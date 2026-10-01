# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy solution and project files first for layer caching
COPY NotionClone.sln ./
COPY src/NotionClone.Api/NotionClone.Api.csproj               src/NotionClone.Api/
COPY src/NotionClone.Application/NotionClone.Application.csproj src/NotionClone.Application/
COPY src/NotionClone.Domain/NotionClone.Domain.csproj         src/NotionClone.Domain/
COPY src/NotionClone.Infrastructure/NotionClone.Infrastructure.csproj src/NotionClone.Infrastructure/

# Restore NuGet packages
RUN dotnet restore

# Copy the rest of the source code
COPY src/ src/

# Publish the API project in Release configuration
RUN dotnet publish src/NotionClone.Api/NotionClone.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# Stage 2: Runtime image (smaller, no SDK)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Create a non-root user for security
RUN addgroup --system --gid 1001 appgroup && \
    adduser  --system --uid 1001 --ingroup appgroup appuser

# Copy published output from build stage
COPY --from=build --chown=appuser:appgroup /app/publish .

# Create uploads directory and assign ownership
RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads

USER appuser

# Expose the default ASP.NET Core port
EXPOSE 8080

# Environment: production defaults (override via docker-compose / env vars)
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "NotionClone.Api.dll"]
