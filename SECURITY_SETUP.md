# 🔐 Security Setup Guide for AI Agent Feature

This guide explains how to securely configure and deploy the AI agent feature.

---

## 🎯 Security Overview

The AI agent feature uses OpenAI's API, which requires an API key. **Never expose your API key in the browser**. We use a serverless proxy to keep it secure.

### Architecture

```
┌─────────────┐      ┌──────────────────┐      ┌──────────────┐
│   Browser   │ ───> │ Vercel Function  │ ───> │   OpenAI API │
│  (Client)   │      │   (Proxy)        │      │              │
└─────────────┘      └──────────────────┘      └──────────────┘
                            ↑
                    API Key stored here
                    (Server-side only)
```

**Key Points:**

- ✅ API key is stored on Vercel as an environment variable
- ✅ Client never sees the API key
- ✅ Proxy handles rate limiting per user
- ✅ Proxy validates all requests

---

## 🛠️ Setup Instructions

### Step 1: Local Development Setup

For local development, you can use the direct client mode (less secure but easier for testing):

1. Create `.env` file in the project root:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com

# AI Agent Feature (Local Development Only)
VITE_ENABLE_AI_AGENT=true
VITE_OPENAI_API_KEY=sk-your_openai_api_key_here

# Force proxy usage (optional, for testing proxy locally)
# VITE_USE_AI_PROXY=true
```

2. **NEVER commit the `.env` file** (it's already in `.gitignore`)

3. Run the development server:

```bash
npm run dev
```

### Step 2: Production Deployment (Vercel)

For production, **always use the serverless proxy**:

1. **Install Vercel CLI** (if not already installed):

```bash
npm install -g vercel
```

2. **Set up environment variables on Vercel**:

   **Option A: Via Vercel Dashboard**

   - Go to your project settings on vercel.com
   - Navigate to "Environment Variables"
   - Add the following variables:

   ```
   Name: OPENAI_API_KEY
   Value: sk-your_openai_api_key_here
   Environment: Production, Preview, Development
   ```

   ```
   Name: VITE_ENABLE_AI_AGENT
   Value: true
   Environment: Production, Preview, Development
   ```

   **Option B: Via CLI**

   ```bash
   vercel env add OPENAI_API_KEY production
   # Paste your key when prompted

   vercel env add VITE_ENABLE_AI_AGENT production
   # Enter: true
   ```

3. **Deploy to Vercel**:

```bash
vercel --prod
```

4. **Verify the proxy is working**:
   - The app will automatically use the proxy in production
   - Check browser dev tools → Network tab → Look for `/api/ai/proxy` calls
   - The response should come from your Vercel function, not OpenAI directly

---

## 🔒 Security Best Practices

### ✅ DO:

1. **Always use environment variables** for sensitive data
2. **Use the serverless proxy in production** (automatic when deployed to Vercel)
3. **Rotate your API keys** regularly
4. **Monitor API usage** on OpenAI dashboard
5. **Set up billing alerts** on OpenAI
6. **Review Vercel logs** for suspicious activity
7. **Keep dependencies updated** (`npm update`)

### ❌ DON'T:

1. **Never hardcode API keys** in source code
2. **Never commit `.env` files** to Git
3. **Never share API keys** publicly or in screenshots
4. **Never expose API keys** in browser console logs
5. **Don't use direct client mode in production**

---

## 🛡️ Additional Security Features

### 1. Rate Limiting

The serverless proxy includes built-in rate limiting:

- **Default**: 50 commands per user per hour
- **Storage**: In-memory (Vercel function)
- **Recommendation**: For production at scale, use Redis or a proper rate limiting service

### 2. Request Validation

The proxy validates all requests:

- ✅ Checks for required fields (messages, userId)
- ✅ Validates data types
- ✅ Sanitizes inputs

### 3. Error Masking

The proxy masks sensitive error details:

- ❌ Never exposes API keys in error messages
- ❌ Never exposes internal server errors to clients
- ✅ Returns user-friendly error messages

---

## 🔍 Troubleshooting

### Issue: "API key not found"

**In Development:**

- Check that `.env` file exists in project root
- Verify `VITE_OPENAI_API_KEY` is set correctly
- Restart the dev server (`npm run dev`)

**In Production:**

- Check Vercel environment variables
- Ensure `OPENAI_API_KEY` is set (not `VITE_OPENAI_API_KEY`)
- Redeploy after adding variables

### Issue: "Rate limit exceeded"

- This means you've hit the 50 commands/hour limit
- Wait an hour or adjust the limit in `/api/ai/proxy.ts`
- For production, consider implementing a proper rate limiting solution

### Issue: "Proxy not working"

- Check browser console for errors
- Check Vercel function logs (vercel.com → your project → Functions)
- Verify the `/api` directory exists and contains `ai/proxy.ts`
- Ensure Edge runtime is supported in your Vercel plan

---

## 📊 Monitoring

### OpenAI Dashboard

- Monitor API usage: https://platform.openai.com/usage
- Set up billing alerts
- Review error logs

### Vercel Dashboard

- Check function invocations
- Monitor response times
- Review error logs
- Set up alerts for high usage

---

## 🚨 If Your API Key Is Compromised

1. **Immediately revoke the key** on OpenAI dashboard
2. **Generate a new API key**
3. **Update environment variables**:
   - Locally: Update `.env`
   - Production: Update on Vercel dashboard
4. **Redeploy the application**
5. **Review usage logs** for suspicious activity
6. **Check billing** for unexpected charges

---

## 🔐 Advanced: Custom Rate Limiting with Redis

For production at scale, replace the in-memory rate limiter with Redis:

1. **Install Redis client**:

```bash
npm install @upstash/redis
```

2. **Update `/api/ai/proxy.ts`**:

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

const checkRateLimit = async (
  userId: string,
  maxRequests: number = 50
): Promise<boolean> => {
  const key = `ai-ratelimit:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 3600); // 1 hour
  }

  return count <= maxRequests;
};
```

3. **Set up Redis on Upstash** (free tier available)
4. **Add environment variables** to Vercel

---

## 📚 Additional Resources

- [OpenAI API Best Practices](https://platform.openai.com/docs/guides/production-best-practices)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- [Upstash Redis](https://upstash.com/) (for advanced rate limiting)

---

## ✅ Security Checklist

Before deploying to production, ensure:

- [ ] `.env` is in `.gitignore`
- [ ] `.env` is never committed to Git
- [ ] `OPENAI_API_KEY` is set on Vercel (not `VITE_`)
- [ ] Proxy function (`/api/ai/proxy.ts`) exists
- [ ] Proxy is automatically used in production
- [ ] Rate limiting is enabled
- [ ] Billing alerts are set on OpenAI
- [ ] You've tested the proxy locally (optional)
- [ ] You've tested the proxy in production
- [ ] No API keys appear in browser console
- [ ] No API keys appear in error messages

---

**Last Updated**: October 17, 2025  
**Maintained By**: Yahav Corcos
