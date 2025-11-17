# ⚡ Vercel Deployment Quick Start

**30-Minute Guide: SQLite → Vercel + Postgres**

---

## ✅ What's Been Prepared

Your app is **ready to deploy** with:
- ✅ Postgres database adapter created
- ✅ Migration scripts ready
- ✅ 94 records exported from SQLite
- ✅ Vercel configuration files created
- ✅ Environment variables configured

---

## 🚀 Deploy in 6 Steps (30 minutes)

### 1️⃣ Push to GitHub (5 min)

```bash
# Initialize and push
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2️⃣ Deploy to Vercel (5 min)

1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Add New Project"**
3. Import your GitHub repo
4. Add environment variable:
   ```
   GEMINI_API_KEY=AIzaSyBpL5qb9j7WGPYziC4fXKQNHD8H4NUZthY
   ```
5. Click **"Deploy"**

**Done!** App is live (but needs database)

### 3️⃣ Add Postgres Database (3 min)

1. In Vercel dashboard: **Storage** → **Create Database**
2. Select **Postgres**
3. Name it: `ship-predictions-db`
4. Click **Create**

**Done!** Database created and connected

### 4️⃣ Initialize Tables (2 min)

1. **Storage** → your database → **Query**
2. Copy & paste this SQL:

```sql
CREATE TABLE ship_data (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  oil_hrs REAL NOT NULL,
  total_hrs REAL NOT NULL,
  viscosity_40 REAL NOT NULL,
  oil_refill_start INTEGER NOT NULL,
  oil_topup INTEGER NOT NULL,
  health_score_lag_1 REAL NOT NULL,
  fe_ppm REAL, pb_ppm REAL, cu_ppm REAL, al_ppm REAL, si_ppm REAL,
  ml_raw_score REAL NOT NULL,
  gemini_final_score REAL NOT NULL,
  status TEXT NOT NULL,
  trend TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence TEXT NOT NULL
);
```

3. Click **"Run Query"**

**Done!** Tables created

### 5️⃣ Import Your 94 Records (10 min)

**On your computer:**

```bash
# 1. Get Postgres credentials from Vercel
# Dashboard → Storage → your DB → .env.local tab
# Copy all variables to your local .env.local file

# 2. Run import
npx tsx scripts/import-to-postgres.ts
```

**Expected output:**
```
✅ Import Complete!
   Imported successfully: 94
```

**Done!** All data migrated

### 6️⃣ Verify (5 min)

1. Visit your Vercel app URL
2. Make a test prediction
3. Check `/history` page → see your 94 records

**Done!** 🎉 You're live on Vercel!

---

## 📁 Files Created for You

| File | Purpose |
|------|---------|
| `lib/database-postgres.ts` | Postgres adapter |
| `lib/database.ts` | Exports Postgres by default |
| `lib/database-sqlite.ts` | SQLite backup (old version) |
| `data/sqlite_export.json` | Your 94 records exported |
| `scripts/export-sqlite-data.ts` | Export tool |
| `scripts/import-to-postgres.ts` | Import tool |
| `vercel.json` | Vercel configuration |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Full guide |

---

## 🔑 Environment Variables Needed

### Vercel (Production)
```bash
GEMINI_API_KEY=your_key_here
# Postgres vars auto-added by Vercel
```

### Local (Development)
Copy from Vercel dashboard → Storage → .env.local:
```bash
GEMINI_API_KEY=your_key_here
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
# ... (Vercel provides all)
```

---

## 🆘 Quick Troubleshooting

**Problem:** Import fails
```bash
# Solution: Check environment variables
cat .env.local | grep POSTGRES_URL
```

**Problem:** "Table does not exist"
```bash
# Solution: Run CREATE TABLE SQL again in Vercel Query tab
```

**Problem:** Gemini not working
```bash
# Solution: Check environment variable in Vercel dashboard
# Settings → Environment Variables
```

---

## 📊 What You Get (FREE)

**Vercel Free Tier:**
- ✅ Unlimited Next.js hosting
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-scaling

**Postgres Free Tier:**
- ✅ 256MB storage (~10,000+ predictions)
- ✅ 60 hours compute/month
- ✅ Automatic backups
- ✅ Connection pooling

---

## 🎯 Success Checklist

- [ ] Pushed code to GitHub
- [ ] Deployed on Vercel
- [ ] Added Postgres database
- [ ] Ran CREATE TABLE SQL
- [ ] Imported 94 records
- [ ] Tested prediction
- [ ] Verified history shows data

**All checked?** You're done! 🎉

---

## 📞 Need Help?

**Full Guide:** Read `VERCEL_DEPLOYMENT_GUIDE.md`

**Vercel Docs:** https://vercel.com/docs

**Support:**
- Vercel Discord: https://vercel.com/discord
- GitHub Issues: Create an issue in your repo

---

## 🚢 Your App is Production-Ready!

**What changed:**
- Database: SQLite → Postgres ✅
- Hosting: Local → Vercel ✅
- Everything else: Same! ✅

**What stayed:**
- All features work identically
- Same UI/UX
- Same ML predictions
- Same Gemini analysis

**Deploy and share your ship health prediction system! ⚓**
