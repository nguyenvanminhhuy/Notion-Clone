# Notion Clone frontend

See the [root README](../README.md) for features, setup, architecture, configuration, and limitations.

Use Node 22 and pnpm 10.34.6. Copy `.env.example` to `.env.local` and set the API origin.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Production builds require `NEXT_PUBLIC_API_URL`. AI is deterministic Demo AI; response animation is simulated streaming.
