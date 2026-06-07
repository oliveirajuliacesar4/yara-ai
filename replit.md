# YARA — GPT Yara

Plataforma de IA que gera sistemas de software completos automaticamente. O usuário descreve o sistema desejado e a YARA gera código funcional (backend, frontend, banco de dados e documentação) usando Google Gemini.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/app run dev` — run the frontend (port 23863)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Google Gemini API key (get free at aistudio.google.com/app/apikey)
- Required env: `SESSION_SECRET` — secret for session cookie signing
- Optional env: `GITHUB_PERSONAL_ACCESS_TOKEN` — for auto-publishing projects to GitHub

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session (cookie-based auth)
- DB: PostgreSQL + Drizzle ORM + tables: users, projects, generated_files, memoria, logs_geracao, conversations, chat_messages
- Auth: bcryptjs password hashing + session cookies
- AI: Google Gemini (gemini-2.0-flash) via @google/genai — streaming SSE + validation pipeline
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/` — Drizzle table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/yara-motor.ts` — YARA 7-step generation pipeline
- `artifacts/api-server/src/routes/chat.ts` — Chat conversacional com streaming Gemini
- `artifacts/app/src/` — React frontend
- `artifacts/app/src/hooks/use-auth.tsx` — Auth context
- `artifacts/app/src/pages/` — Page components
- `artifacts/app/src/pages/chat.tsx` — Chat estilo ChatGPT com sidebar de conversas

## Architecture decisions

- Session-based auth (not JWT) — simpler, server-side, works well with SSE
- Gemini client initialized lazily (per request) to avoid startup crash when key is missing
- SSE streaming for code generation — real-time progress feedback to the user
- OpenAPI-first: spec gates all codegen, frontend hooks auto-generated via Orval
- 7-step generation pipeline: Memória → Geração → Extração → Validação 1 → Refinamento → Validação 2 → Aprendizado
- Persistent memory DB table (memoria) — YARA learns from each generation

## Product

Users register/login, create projects describing the system they want, then trigger AI generation. The YARA AI streams code generation in real-time using Google Gemini, producing multiple files (backend, frontend, DB schema, README). Generated files are stored per project, browsable in a file explorer. Projects can be published directly to GitHub.

## User preferences

- AI engine: Google Gemini (NEVER OpenAI) — use GEMINI_API_KEY
- App name displayed: "GPT Yara" / system name: "YARA"
- Language: Brazilian Portuguese throughout UI and logs

## Gotchas

- GEMINI_API_KEY must be set — server starts fine without it but generation endpoint will fail at request time with a clear error
- After any OpenAPI spec change, always run codegen before starting either workflow
- DB schema changes: run `pnpm --filter @workspace/db run push` then restart api-server
- GitHub integration uses GITHUB_PERSONAL_ACCESS_TOKEN (falls back to GITHUB_TOKEN)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
