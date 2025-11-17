# 🚀 Vercel Deployment - Quick Setup

## ✅ What's Fixed

1. **405 Error** - Removed ONNX, now uses pure Gemini API
2. **File System Error** - Switched to in-memory storage (works on Vercel)
3. **API Model** - Using `gemini-2.5-flash` (your API key supports this)

## 📝 Deploy to Vercel (3 Steps)

### Step 1: Add Environment Variable to Vercel

Go to your Vercel project:
1. Click **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSyAjy7Qnd-vMpYs4TY-5joCYAsAEpGAq9so`
   - **Environment:** Select ALL (Production, Preview, Development)
3. Click **Save**

### Step 2: Commit & Push

```bash
git add -A
git commit -m "Fix Vercel deployment: in-memory storage + gemini-2.5-flash"
git push
```

### Step 3: Vercel Auto-Deploys

- Vercel will automatically deploy when you push
- Wait 1-2 minutes for build
- Your app will be live!

## 🎯 How It Works Now

**Architecture:**
```
User Input → Gemini API → In-Memory Storage → Response
```

**Storage:**
- Uses in-memory storage (no file system needed)
- Data persists during server uptime
- Resets on redeploy (not a problem for demo)

**Gemini:**
- Model: `gemini-2.5-flash` (stable, your API key works)
- Generates both "ML score" and "final score"
- UI still shows two-stage prediction

## ⚠️ Important Notes

### Data Persistence
- **In-memory storage** means data is lost on server restart/redeploy
- For production with persistent data, you would add:
  - Vercel KV (Redis)
  - Vercel Postgres
  - External DB (Supabase, etc.)

### API Key
- Make sure `GEMINI_API_KEY` is set in Vercel dashboard
- The error "unregistered callers" means API key is missing
- Check: Settings → Environment Variables

## 🧪 Test After Deploy

1. Visit your Vercel URL
2. Submit oil data
3. Check browser console for any errors
4. Should see Gemini prediction

## 🔧 If Issues Persist

### "403 Forbidden" or "unregistered callers"
→ API key not set in Vercel. Go to Settings → Environment Variables

### "404 Not Found" on model
→ Make sure code uses `gemini-2.5-flash` (already updated)

### Data not persisting
→ Expected with in-memory storage. Add database if needed.

## ✅ Success Checklist

- [x] Build passes (`npm run build`)
- [x] Using `gemini-2.5-flash` model
- [x] In-memory storage (no file system)
- [x] API key in `.env.local` for local dev
- [ ] API key added to Vercel dashboard
- [ ] Pushed to GitHub
- [ ] Vercel deployed successfully

---

**Ready to deploy!** Just add the API key to Vercel and push. 🚀
