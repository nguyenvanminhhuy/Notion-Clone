# Deployment and migrations

## Configuration

Production requires `ConnectionStrings__DefaultConnection` with a non-default password, a non-placeholder `Jwt__Secret` of at least 32 characters, and `Cors__AllowedOrigins__0` (additional numbered origins supported). Supply random values through private environment configuration or the host's secret store. Configure TLS and trusted proxy forwarding before public deployment.

Compose reads DB_PASSWORD, JWT_SECRET, CORS_ORIGIN from `backend/.env`. `dotnet run` does not load that file automatically. Frontend NEXT_PUBLIC_API_URL is public build configuration, never an API key.

## Local migrations

From `backend/`, with the database connection configured:

```sh
dotnet tool restore
dotnet ef migrations add DescriptiveName --project src/NotionClone.Infrastructure --startup-project src/NotionClone.Api -- --environment Development
dotnet ef database update --project src/NotionClone.Infrastructure --startup-project src/NotionClone.Api -- --environment Development
dotnet ef migrations script --idempotent --project src/NotionClone.Infrastructure --startup-project src/NotionClone.Api -- --environment Development
```

Review generated SQL before applying it.

## Deployment

1. Back up database/uploads; review SQL and API/schema compatibility.
2. Build the API image, which includes a self-contained EF migration bundle.
3. Run `/app/efbundle` as a separate one-shot deployment step using API/database configuration.
4. Start the API only after success; check `/api/health/ready`.
5. Deploy the frontend with its API origin and smoke-test auth, editor, sharing, and files.

Compose encodes this sequence through PostgreSQL health and migration-completion dependencies. No ordinary API request applies migrations. For subsequent deployments, recreate the migration job so the new bundle runs:

```sh
docker compose build
docker compose up --force-recreate -d migrate
docker compose up --force-recreate -d api
```

Inspect the migration exit status before promoting. Other hosts must supply equivalent sequencing. Use DDL privileges for the migration job; restrict normal API DB privileges where separate credentials are supported.

## Session upgrade

`20261005060000_HashRefreshTokenStorage` revokes legacy sessions, replaces raw values with unique invalidation markers, and clears replacement-token values. New sessions store SHA-256 hashes. Users must sign in again. This invalidation is irreversible; raw credentials must not be reconstructed.

## Health and rollback

`/api/health` is liveness. `/api/health/ready` checks connectivity and pending migrations; Docker calls readiness. These do not validate every external dependency or schema constraint.

Test backup restoration before destructive migrations. Roll back the application only when compatible with the current schema. Use `dotnet ef database update <PreviousMigration>` only after reviewing Down/data-loss impact; otherwise restore a verified backup or apply a forward repair. Preserve token hashing when rolling back unrelated code. `docker compose down -v` destroys persisted volumes and is not a routine rollback command.
