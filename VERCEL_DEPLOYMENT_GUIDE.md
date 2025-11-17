# 🚀 Vercel + Postgres Deployment Guide

Complete step-by-step guide to deploy your Ship Health Prediction app to Vercel with Postgres.

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Vercel account (sign up at vercel.com - it's free!)
- ✅ Your code pushed to GitHub
- ✅ Gemini API key

---

## 🎯 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment with Postgres"

# Create GitHub repository and push
# (Follow GitHub's instructions to create a new repo)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

**✅ Your code is now on GitHub!**

---

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Click "Add New Project"**
3. **Import your GitHub repository**
   - Select "Import Git Repository"
   - Find your `naval-predictions` repo
   - Click "Import"

4. **Configure Project**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `.` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

5. **Add Environment Variables**
   - Click "Environment Variables"
   - Add your Gemini API key:
     ```
     GEMINI_API_KEY=AIzaSyBpL5qb9j7WGPYziC4fXKQNHD8H4NUZthY
     ```

6. **Click "Deploy"**

⏳ Wait 2-3 minutes for the initial build...

**🎉 Your app is live!** (But we need to add the database)

---

### Step 3: Add Vercel Postgres

1. **Go to your Vercel project dashboard**
2. **Click "Storage" tab**
3. **Click "Create Database"**
4. **Select "Postgres"**
5. **Click "Continue"**
6. **Name your database** (e.g., `ship-predictions-db`)
7. **Select region**: Choose closest to your users
8. **Click "Create"**

⏳ Wait ~30 seconds for database creation...

**✅ Postgres database created!**

Vercel automatically:
- ✅ Created the database
- ✅ Added environment variables to your project
- ✅ Configured connection pooling

---

### Step 4: Initialize Database Tables

1. **Go to Storage → your database → Query**
2. **Run this SQL** to create tables:

```sql
CREATE TABLE IF NOT EXISTS ship_data (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  oil_hrs REAL NOT NULL,
  total_hrs REAL NOT NULL,
  viscosity_40 REAL NOT NULL,
  oil_refill_start INTEGER NOT NULL,
  oil_topup INTEGER NOT NULL,
  health_score_lag_1 REAL NOT NULL,
  fe_ppm REAL,
  pb_ppm REAL,
  cu_ppm REAL,
  al_ppm REAL,
  si_ppm REAL,
  ml_raw_score REAL NOT NULL,
  gemini_final_score REAL NOT NULL,
  status TEXT NOT NULL,
  trend TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON ship_data(timestamp DESC);
```

3. **Click "Run Query"**

**✅ Database tables created!**

---

### Step 5: Import Your Historical Data (94 records)

**On your local machine:**

1. **Get Postgres connection URL from Vercel**
   - Go to Storage → your database → .env.local tab
   - Copy all the environment variables
   - Paste into your local `.env.local` file

2. **Run the import script:**

```bash
npx tsx scripts/import-to-postgres.ts
```

You should see:
```
============================================================
Import Complete!
============================================================
   Total records: 94
   Imported successfully: 94
   Failed: 0

🎉 Your data is now in Vercel Postgres!
```

**✅ All 94 historical predictions imported!**

---

### Step 6: Verify Deployment

1. **Visit your Vercel URL** (e.g., `https://your-app.vercel.app`)
2. **Try making a prediction:**
   - Fill in oil data
   - Submit
   - Check if it works!

3. **Check the console** (in browser DevTools):
   - You should see Gemini responses
   - No database errors

4. **Go to /history page** to see your 94 imported records

**✅ Everything working!**

---

## 🔧 Post-Deployment Configuration

### Update Gemini API Key (if needed)

```bash
# Via Vercel CLI
vercel env add GEMINI_API_KEY

# Or via dashboard:
# Settings → Environment Variables → Edit
```

### Monitor Your App

**Vercel Dashboard provides:**
- 📊 Analytics (visitors, page views)
- 🐛 Error logs
- ⚡ Performance metrics
- 💾 Database queries

**Access via:**
- Dashboard → Your Project → Analytics/Logs

---

## 📊 Database Management

### View Data

**Option 1: Vercel Dashboard**
- Storage → Your Database → Query
- Run SQL: `SELECT * FROM ship_data ORDER BY timestamp DESC LIMIT 10;`

**Option 2: Local Connection**
```bash
# Add Postgres URL to .env.local, then:
npx tsx -e "import {getAllPredictions} from './lib/database'; getAllPredictions().then(console.log)"
```

### Backup Data

**Export from Vercel:**
```sql
-- In Vercel Query tab:
SELECT * FROM ship_data ORDER BY timestamp ASC;
-- Download as CSV
```

**Or use pg_dump:**
```bash
pg_dump $POSTGRES_URL > backup.sql
```

---

## 🚨 Troubleshooting

### Issue: "POSTGRES_URL is not defined"

**Solution:**
- Vercel → Storage → Your DB → .env.local
- Copy environment variables
- Settings → Environment Variables → Add

### Issue: "Table does not exist"

**Solution:**
- Run the CREATE TABLE SQL in Step 4 again
- Check you're connected to the right database

### Issue: Import script fails

**Solution:**
```bash
# Check environment variables
echo $POSTGRES_URL

# Re-export SQLite data
npx tsx scripts/export-sqlite-data.ts

# Try import again
npx tsx scripts/import-to-postgres.ts
```

### Issue: Gemini API not working

**Solution:**
- Check API key in Vercel environment variables
- Verify key is correct
- Check Gemini quota at https://aistudio.google.com/

---

## 📈 Scaling & Performance

### Current Free Tier Limits

**Vercel:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic scaling
- ✅ Global CDN

**Postgres:**
- ✅ 256MB storage (~10,000+ predictions)
- ✅ 60 hours compute/month
- ✅ 256MB RAM

### When You Outgrow Free Tier

**Upgrade options:**
- **Vercel Pro** ($20/month): 1TB bandwidth, more
- **Postgres Pro** ($20/month): 10GB storage

---

## 🔐 Security Best Practices

**✅ Already Configured:**
- HTTPS automatic
- Environment variables encrypted
- Connection pooling enabled
- SQL injection protection

**Recommended:**
- [ ] Set up Vercel Authentication (if needed)
- [ ] Configure CORS (if using external APIs)
- [ ] Enable Vercel Firewall (Pro plan)

---

## 🎉 Success Checklist

- [x] Code pushed to GitHub
- [x] Deployed to Vercel
- [x] Postgres database created
- [x] Database tables initialized
- [x] Historical data imported (94 records)
- [x] Gemini API key configured
- [x] App working at your Vercel URL
- [x] Can make new predictions
- [x] Can view history

---

## 📞 Support Resources

**Vercel Docs:**
- https://vercel.com/docs
- https://vercel.com/docs/storage/vercel-postgres

**Need Help?**
- Vercel Discord: https://vercel.com/discord
- Vercel Support: support@vercel.com

---

## 🚀 Quick Deploy Checklist

```bash
# 1. Export SQLite data
npx tsx scripts/export-sqlite-data.ts

# 2. Push to GitHub
git add .
git commit -m "Deploy to Vercel"
git push

# 3. Deploy on Vercel (via dashboard)
# - Import repo
# - Add Gemini API key
# - Deploy

# 4. Add Postgres (via Vercel dashboard)
# - Storage → Create → Postgres

# 5. Initialize DB (via Vercel SQL Query)
# - Run CREATE TABLE SQL

# 6. Import data
npx tsx scripts/import-to-postgres.ts

# 7. Done! 🎉
```

---

## 📝 What Changed from SQLite?

### Code Changes
✅ Database adapter switched to Postgres
✅ Async operations (SQLite was sync)
✅ Connection pooling (automatic)
✅ No file-based storage

### What Stayed the Same
✅ All API routes work identically
✅ Frontend unchanged
✅ ML model (ONNX) unchanged
✅ Gemini integration unchanged
✅ All features work exactly the same

### Benefits
✅ Survives deployments (no data loss)
✅ Automatic backups
✅ Better performance
✅ Production-ready
✅ Scales automatically

---

## 🎊 Congratulations!

Your Ship Health Prediction system is now **production-ready** and deployed on Vercel with Postgres!

**Your app URL:** `https://your-app.vercel.app`

### What You Achieved:
- ✅ Professional hosting (free!)
- ✅ Global CDN (fast worldwide)
- ✅ Automatic HTTPS
- ✅ Managed database
- ✅ Zero downtime deployments
- ✅ Automatic scaling

**Share your app and start predicting ship health! 🚢⚙️**
