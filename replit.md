# Gerador de Sistemas IA

Uma plataforma que usa IA para gerar sistemas de software completos automaticamente. O usuário descreve o sistema desejado e a IA gera código funcional (backend, frontend, banco de dados e documentação).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/app run dev` — run the frontend (port 23863)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `OPENAI_API_KEY` — OpenAI API key for code generation
- Required env: `SESSION_SECRET` — secret for session cookie signing

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session (cookie-based auth)
- DB: PostgreSQL + Drizzle ORM
- Auth: bcryptjs password hashing + session cookies
- AI: OpenAI gpt-4o-mini for code generation (streaming SSE)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions (users, projects, generated_files)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/app/src/` — React frontend
- `artifacts/app/src/hooks/use-auth.tsx` — Auth context
- `artifacts/app/src/pages/` — Page components

## Architecture decisions

- Session-based auth (not JWT) — simpler, server-side, works well with SSE
- OpenAI client initialized lazily (per request) to avoid startup crash when key is missing
- SSE streaming for code generation — real-time progress feedback to the user
- OpenAPI-first: spec gates all codegen, frontend hooks auto-generated via Orval

## Product

Users register/login, create projects describing the system they want, then trigger AI generation. The AI streams code generation in real-time, producing multiple files (backend, frontend, DB schema, README). Generated files are stored per project and can be browsed in a file explorer view.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- OPENAI_API_KEY must be set — server starts fine without it but generation endpoint will fail at request time
- After any OpenAPI spec change, always run codegen before starting either workflow
- DB schema changes: run `pnpm --filter @workspace/db run push` then restart api-server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
