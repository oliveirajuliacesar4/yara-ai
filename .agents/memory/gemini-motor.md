---
name: Motor IA — Google Gemini
description: YARA usa exclusivamente Google Gemini como motor de IA, não OpenAI. Decisão explícita do usuário.
---

**Regra:** A YARA usa Google Gemini como único motor de IA para geração de sistemas.

**Why:** O usuário pediu explicitamente para trocar de OpenAI para Google Gemini, nunca usar OpenAI como padrão.

**How to apply:**
- SDK: `@google/genai` (instalado em `artifacts/api-server`)
- Variável de ambiente: `GEMINI_API_KEY` (não `OPENAI_API_KEY`)
- Modelo padrão: `gemini-1.5-flash`
- Import: `import { GoogleGenAI } from "@google/genai"`
- Inicialização: `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`
- Streaming: `gemini.models.generateContentStream({ model, contents, config })`
- Não-streaming: `gemini.models.generateContent({ model, contents, config })`
- Resposta de texto: `chunk.text` (streaming) ou `response.text` (não-streaming)
- Endpoint de status (`/api/status`) deve checar `gemini` não `openai`
- Chave gratuita em: aistudio.google.com/app/apikey
- GitHub: usa `GITHUB_PERSONAL_ACCESS_TOKEN` (fallback: `GITHUB_TOKEN`)
