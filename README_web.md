# YARA AI

YARA AI é uma aplicação SaaS de assistente inteligente de vida pessoal.

Slogan: **Uma vida organizada começa aqui.**

## Produção

A YARA AI foi ajustada para não depender de execução manual pelo usuário final.

Em produção, o usuário apenas acessa o link público, cria conta e usa a YARA AI. A chave da OpenAI fica somente no backend.

Arquitetura:

- Frontend público em Vercel, Netlify ou similar.
- Backend Node em Render, Railway, Fly.io, AWS, Google Cloud, Azure ou similar.
- Banco PostgreSQL em Supabase, Neon, Railway Postgres, Render Postgres ou RDS.
- `OPENAI_API_KEY` somente no servidor.
- Frontend usa apenas `YARA_API_BASE_URL`, `VITE_API_BASE_URL` ou `NEXT_PUBLIC_API_BASE_URL`.

Leia [DEPLOY.md](DEPLOY.md) para publicar.

## Login demo

- Email: `isis@yara.ai`
- Senha: `yara123`

## Recursos

- Dashboard inteligente.
- YARA AI integrada via backend seguro.
- Memória inteligente da YARA.
- Saúde, hábitos, metas, produtividade, agenda e finanças.
- Planos YARA AI com Free, Plus, Pro e Elite.
- Checkout com arquitetura para Stripe, Mercado Pago e Asaas.
- Relatórios PDF com bloqueio premium.
- Frontend oficial servido somente a partir de `public/`.
- Painel admin separado em `public/admin.html`.
- Schema PostgreSQL em `database/schema.sql`.

## APIs do backend

- `GET /api/health`
- `POST /api/yara-ai`
- `POST /api/payments/checkout`
- `POST /api/open-finance/connect`
- `GET /api/admin/metrics`

## Segurança

- Chaves sensíveis apenas no servidor.
- CORS por `ALLOWED_ORIGINS`.
- Rate limit por usuário/IP.
- Admin protegido por `ADMIN_TOKEN`.
- Logs sem expor dados sensíveis.
- Open Finance sem simulação bancária falsa; enquanto não houver provedor real, mostra “Open Finance em fase de integração.”

## Desenvolvimento local

Uso apenas para desenvolvedores:

```powershell
corepack enable
pnpm install --shamefully-hoist
pnpm start
```

Depois acesse:

```text
http://localhost:3000
```

Para simular frontend separado:

```powershell
$env:YARA_API_BASE_URL="https://api.seudominio.com"
node scripts/build-frontend.js
```
