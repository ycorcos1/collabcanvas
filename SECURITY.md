# Security & Secrets Handling

- Never commit secrets. Add your API keys only to `.env` files.
- This repo ignores: `.env`, `.env.*` via `.gitignore` and also `.cursorignore` to keep secrets out of AI context.
- For production, do not expose provider keys to the browser. Use a proxy API route that holds the key server-side.
- Rotate keys if you suspect any leak.

## Environment Variables

- `VITE_OPENAI_API_KEY` – used for the AI agent (via serverless proxy in production).
- `VITE_ENABLE_AI_AGENT` – feature flag to toggle agent UI.
- `VITE_FIREBASE_*` – Firebase config (already env-based).

## Recommended Proxy Layout (Vercel)

Create `api/ai/proxy.ts` to forward requests to the LLM provider with the key stored as a Vercel Project Environment Variable. The frontend calls `/api/ai/proxy` with the user prompt/tool payload; the route injects the API key server-side.
