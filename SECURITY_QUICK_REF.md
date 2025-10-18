# 🔐 AI Security Quick Reference

## TL;DR

✅ **Development (Local)**

- Keep API key in `.env` file
- Never commit `.env` to Git
- Direct mode is enabled by default

✅ **Production (Vercel)**

- Set `OPENAI_API_KEY` in Vercel dashboard (no `VITE_` prefix)
- Proxy mode is automatic in production
- API key never exposed to browser

---

## Environment Variables

### Local (.env file)

```bash
VITE_ENABLE_AI_AGENT=true
VITE_OPENAI_API_KEY=sk-your_key_here
```

### Production (Vercel Dashboard)

```
OPENAI_API_KEY=sk-your_key_here     ← No VITE_ prefix!
VITE_ENABLE_AI_AGENT=true
```

---

## Deployment Steps

1. **Add API key to Vercel**:

   ```bash
   vercel env add OPENAI_API_KEY production
   ```

2. **Deploy**:

   ```bash
   vercel --prod
   ```

3. **Verify**: Check Network tab for `/api/ai/proxy` calls

---

## How It Works

### Development Mode

```
Browser → OpenAI directly (API key in browser)
⚠️  Less secure, but easier for testing
```

### Production Mode (Automatic)

```
Browser → /api/ai/proxy (Vercel) → OpenAI
✅  Secure, API key on server only
```

---

## Security Features

✅ API key stored server-side only  
✅ Rate limiting: 50 commands/hour per user  
✅ Request validation  
✅ Error masking (no key leaks)  
✅ Automatic proxy in production

---

## Common Issues

**"API key not found"**

- Development: Check `.env` file exists and has `VITE_OPENAI_API_KEY`
- Production: Check Vercel has `OPENAI_API_KEY` (no VITE\_ prefix)

**"Rate limit exceeded"**

- Wait 1 hour or adjust limit in `/api/ai/proxy.ts`

**"Proxy not working"**

- Check `/api/ai/proxy.ts` file exists
- Check Vercel function logs
- Verify environment variables on Vercel

---

## If API Key Is Compromised

1. Revoke key on OpenAI dashboard immediately
2. Generate new key
3. Update `.env` locally
4. Update Vercel environment variable
5. Redeploy: `vercel --prod`

---

## Testing Security

### ✅ Verify API Key Is Hidden

1. Open browser DevTools → Network tab
2. Trigger an AI command
3. Look at request to `/api/ai/proxy`
4. **Should NOT see API key** anywhere in request or response

### ✅ Verify Proxy Is Used

1. Deploy to Vercel
2. Check Network tab
3. **Should see** `/api/ai/proxy` calls, NOT `api.openai.com` directly

---

## Quick Commands

```bash
# Set environment variable on Vercel
vercel env add OPENAI_API_KEY production

# List environment variables
vercel env ls

# Pull environment variables locally (for testing)
vercel env pull .env.local

# Deploy to production
vercel --prod

# View function logs
vercel logs
```

---

📚 **Full Documentation**: See `SECURITY_SETUP.md`
