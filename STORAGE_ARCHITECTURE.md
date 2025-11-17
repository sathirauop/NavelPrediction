# 📦 Storage Architecture

## Overview

The app uses a **hybrid in-memory storage** system that's perfect for Vercel deployment:

- ✅ **60 base historical records** - Always available (from seed data)
- ✅ **New predictions** - In-memory (reset on server restart)
- ✅ **No database required** - Works on Vercel's read-only filesystem
- ✅ **Fast & simple** - No external dependencies

## How It Works

### On Server Startup
```
1. Server starts
2. lib/memory-storage.ts loads
3. Auto-imports 60 records from lib/seed-data.json
4. Ready to accept new predictions
```

### When User Submits Data
```
1. User submits oil analysis data
2. Gemini API generates prediction
3. New prediction added to in-memory array
4. Total records = 60 (seed) + N (new predictions)
```

### On Server Restart/Redeploy
```
1. In-memory predictions are lost
2. Seed data (60 records) reloads automatically
3. Back to baseline 60 records
```

## File Structure

```
lib/
├── seed-data.json          # 60 historical records (committed to git)
├── memory-storage.ts       # Auto-loads seed data on import
└── simple-gemini.ts        # Gemini API integration

data/
├── ship_data.db           # Old SQLite DB (not used)
└── sqlite_export.json     # Full export (94 records, not used in production)
```

## Key Benefits

### ✅ **Always Have Data**
- 60 historical records always available
- No "empty state" on fresh deploy
- Trends and analysis work immediately

### ✅ **Works on Vercel**
- No file write permissions needed
- Seed data is in codebase (committed to git)
- No external database required

### ✅ **Simple & Fast**
- No database queries
- In-memory is instant
- No connection pooling, no timeouts

### ✅ **Easy to Update**
- Want to change base data? Update `lib/seed-data.json`
- Commit to git
- Next deploy uses new seed data

## Updating Seed Data

If you want to change the 60 base historical records:

1. **Edit the seed file:**
   ```bash
   # Manually edit lib/seed-data.json
   # OR regenerate from database:
   cat data/sqlite_export.json | python3 -c "
   import sys, json
   data = json.load(sys.stdin)[:60]
   json.dump(data, sys.stdout, indent=2)
   " > lib/seed-data.json
   ```

2. **Commit and deploy:**
   ```bash
   git add lib/seed-data.json
   git commit -m "Update seed data"
   git push
   ```

3. **Next deploy automatically uses new data!**

## Seed Data Format

Each record in `lib/seed-data.json`:

```json
{
  "id": 1,
  "timestamp": "2025-04-27T18:24:21.134Z",
  "oil_hrs": 1108,
  "total_hrs": 92417.55,
  "viscosity_40": 122.1,
  "oil_refill_start": 0,
  "oil_topup": 0,
  "health_score_lag_1": 0,
  "fe_ppm": 3.686,
  "pb_ppm": 2.65,
  "cu_ppm": 3.507,
  "al_ppm": 0.5,
  "si_ppm": 3.804,
  "ml_raw_score": 0.0857595,
  "gemini_final_score": 0.0857595,
  "status": "OPTIMAL_CONDITION",
  "trend": "DEGRADING",
  "recommendation": "Monitor closely, slight degradation detected",
  "confidence": "historical"
}
```

## Current Dataset

- **Total seed records:** 60
- **Date range:** April 27, 2025 - September 5, 2025
- **Source:** Historical oil analysis data from SLNS Gajabahu No. 02 Generator

## Monitoring

Check Vercel logs on startup to see:
```
📦 Loaded 60 historical records from seed data
```

When making predictions:
```
📊 Using previous health score: 0.3245
🚀 Starting simplified prediction pipeline...
📚 Retrieved 62 historical records  # 60 seed + 2 new
```

## Trade-offs

### ✅ Pros
- Simple, no external dependencies
- Fast, in-memory is instant
- Always have baseline data
- Free (no database costs)

### ⚠️ Cons
- New predictions lost on restart
- Limited to server memory (~100MB safe)
- Not suitable if you need persistent new data

## Future: Add Persistent Storage

If you need new predictions to persist, you can add:

### Option 1: Vercel KV (Redis)
```typescript
import { kv } from '@vercel/kv';
await kv.set('predictions', predictions);
```

### Option 2: Vercel Postgres
```typescript
import { sql } from '@vercel/postgres';
await sql`INSERT INTO predictions ...`;
```

### Option 3: External DB
- Supabase (Postgres)
- MongoDB Atlas
- PlanetScale (MySQL)

The seed data architecture stays the same, just add writes to external storage!

---

**Current setup is perfect for demos and MVPs. Upgrade to persistent storage when needed.**
