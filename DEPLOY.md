# Deploy de Produção - YARA AI

Este projeto está preparado para produção com frontend público, backend seguro, banco PostgreSQL e OpenAI no servidor.

## Arquitetura

- Frontend: Vercel ou Netlify.
- Backend: Render, Railway, Fly.io, AWS, Google Cloud, Azure ou outro Node host.
- Banco: PostgreSQL em Supabase, Neon, Railway Postgres, Render Postgres ou RDS.
- IA: OpenAI API apenas no backend.
- Pagamentos: Stripe, Mercado Pago e Asaas via backend.
- Admin: `admin.html`, protegido por `ADMIN_TOKEN`.

## Frontend

Configure no painel da Vercel/Netlify:

```env
YARA_API_BASE_URL=https://api.seudominio.com
```

Build:

```bash
node scripts/build-frontend.js
```

O build valida e publica apenas `public/`, contendo:

- `index.html`
- `admin.html`
- `style.css`
- `app.js`
- `config.js`

Publicação:

- Vercel: use `vercel.json`.
- Netlify: use `netlify.toml`.

Projeto Netlify criado nesta conta:

- Site ID: `13659525-848f-4fcb-80f6-cec2f09f3ae3`
- Nome: `yara-ai-juliaisis408`
- URL pública prevista: `https://yara-ai-juliaisis408.netlify.app`
- Painel: `https://app.netlify.com/projects/yara-ai-juliaisis408`

Variáveis públicas já configuradas no Netlify:

- `YARA_API_BASE_URL=https://yara-ai-juliaisis408.netlify.app`
- `PUBLIC_APP_URL=https://yara-ai-juliaisis408.netlify.app`
- `ALLOWED_ORIGINS=https://yara-ai-juliaisis408.netlify.app`

O build gera `public/config.js` com a URL pública do backend. O frontend nunca recebe `OPENAI_API_KEY`.

Para concluir o deploy pelo comando gerado pelo conector Netlify, execute em um ambiente com `npx` disponível:

```bash
npx -y @netlify/mcp@latest --site-id 13659525-848f-4fcb-80f6-cec2f09f3ae3 --proxy-path "<proxy-path-gerado-pelo-conector>"
```

## Backend

No deploy Netlify atual, a API também pode rodar como Netlify Function em:

- `/.netlify/functions/api`
- `/api/*` redirecionado para a function pelo `netlify.toml`

Arquivos:

- `netlify/functions/api.js`
- `netlify.toml`

Também existe `server.js` para deploy Node dedicado em Render/Railway/Fly/AWS.

Configure no host do backend:

```env
NODE_ENV=production
PUBLIC_APP_URL=https://yara-ai.com
ALLOWED_ORIGINS=https://yara-ai.com,https://www.yara-ai.com
Chave da OpenAI: configurar no painel da hospedagem como variável secreta do backend.
OPENAI_MODEL=gpt-4.1-mini
DATABASE_URL=postgresql://...
PGSSLMODE=require
ADMIN_TOKEN=um_token_longo_e_secreto
SESSION_SECRET=gere_um_token_longo_e_secreto
STRIPE_SECRET_KEY=sk_live_...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR...
ASAAS_API_KEY=$aact_...
```

Start:

```bash
pnpm install --shamefully-hoist
pnpm start
```

### Render: alinhamento obrigatório do deploy

O serviço Render deve executar o backend Node dedicado deste repositório, não outro backend TypeScript ou artefato antigo.

Configuração esperada:

```text
Build Command: pnpm install --shamefully-hoist
Start Command: pnpm start
Entrypoint real: server.js
```

O comando `pnpm start` executa o script `start`, que aponta para `node server.js`. Para auditoria local do blueprint, `node scripts/verify-render-entrypoint.js` deve passar e imprimir:

```text
[render-entrypoint] Expected entrypoint confirmed: server.js
[render-entrypoint] DATABASE_URL and SESSION_SECRET are lazy/optional at startup.
```

`DATABASE_URL` e `SESSION_SECRET` podem ser configuradas no Render, mas não devem quebrar o startup quando ausentes. O banco e autenticação devem ser inicializados apenas quando um endpoint realmente precisar deles.

Se o Render continuar exibindo erros como `SESSION_SECRET is required but was not provided`, `DATABASE_URL must be set` ou `Cannot find module 'express'` antes dessas linhas, o serviço não está executando este código/commit ou está usando cache/comandos antigos. Nesse caso, confira no painel do Render:

- Repository: deve ser o repositório correto da YARA AI.
- Branch: deve ser a branch onde este `render.yaml` foi publicado.
- Start Command: deve ser `pnpm start`; remova overrides antigos no painel.
- Build Command: deve ser `pnpm install --shamefully-hoist`.
- Latest deploy commit: deve corresponder ao commit que contém `scripts/verify-render-entrypoint.js`.

Depois de corrigir repo/branch/comando, use:

```text
Manual Deploy -> Clear build cache & deploy
```

Isso força um rebuild completo e elimina cache de uma versão antiga do backend.

O backend Node serve somente `public/`. A pasta `dist/` é ignorada pelo servidor e removida pelo build para evitar frontend antigo.

Endpoints:

- `GET /api/health`
- `POST /api/yara-ai`
- `POST /api/payments/checkout`
- `POST /api/open-finance/connect`
- `GET /api/admin/metrics`

## Banco de Dados

Execute:

```sql
\i database/schema.sql
```

Em Supabase/Neon/Render/Railway, copie o conteúdo de `database/schema.sql` no SQL editor.

O schema cobre:

- usuários
- mensagens da IA
- memórias da YARA
- metas
- tarefas
- eventos
- relatórios
- assinaturas
- pagamentos
- logs de auditoria

## Checkout

O backend cria sessões/links reais quando as chaves estão configuradas:

- Stripe: `STRIPE_SECRET_KEY`
- Mercado Pago: `MERCADO_PAGO_ACCESS_TOKEN`
- Asaas: `ASAAS_API_KEY`

Para ativação automática definitiva do plano, configure webhooks de cada gateway apontando para endpoints de produção e grave o status em `subscriptions` e `payments`.

## Open Finance

Open Finance fica como recurso de produção futura até existir provedor credenciado e fluxo de consentimento.

Enquanto não houver provedor real:

```text
Open Finance em fase de integração.
```

Não há simulação de conexão bancária real.

## Admin

Acesse:

```text
https://yara-ai.com/admin.html
```

Informe:

- URL da API
- `ADMIN_TOKEN`

O painel mostra:

- total de usuários
- uso da IA
- erros da API
- consumo estimado
- assinaturas
- pagamentos
- logs importantes

## Segurança

- `OPENAI_API_KEY` fica apenas no backend.
- CORS aceita apenas `ALLOWED_ORIGINS`.
- Rate limit por IP/usuário via `RATE_LIMIT_PER_MINUTE`.
- Logs evitam expor dados sensíveis.
- Painel admin exige `ADMIN_TOKEN`.
- Pagamentos e Open Finance rodam apenas no servidor.
