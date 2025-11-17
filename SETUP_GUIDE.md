# Naval Predictions - Setup Guide

## 📋 Pre-Flight Checklist

Before starting, ensure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.8+ installed (`python3 --version`)
- [ ] npm installed (`npm --version`)
- [ ] Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🚀 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for ML model)
pip3 install numpy scikit-learn xgboost
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
nano .env.local  # or use any text editor
```

In `.env.local`, replace:
```
GEMINI_API_KEY=your_gemini_api_key_here
```

With your actual API key from Google AI Studio.

### Step 3: Verify Model Files

Ensure the trained model exists:
```bash
ls -lh python-backend/models/trained_health_model.pkl
```

If missing, copy from the original project:
```bash
cp ../ship_prediction_project/trained_health_model.pkl python-backend/models/
```

### Step 4: Start the Application

**Just one command - that's it!**
```bash
npm run dev
```

You should see:
```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
```

### Step 5: Open the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🧪 Testing the Application

### Test 1: Python Script Test

Open a new terminal:
```bash
echo '{"oil_hrs": 3500, "total_hrs": 98000, "viscosity_40": 140, "oil_refill_start": 0, "oil_topup": 0, "health_score_lag_1": 0.35}' | python3 lib/python/predict.py
```

Expected response:
```json
{"success": true, "raw_health_score": 0.245, "confidence": "high", ...}
```

### Test 2: Make a Test Prediction

In the web interface:
1. Fill in the form with default values (pre-filled)
2. Click "Analyze Engine Health"
3. Wait for the result (takes 5-10 seconds due to Gemini API)
4. Verify you see:
   - Health score gauge
   - Status badge
   - Trend indicator
   - Recommendation text

### Test 3: View History

1. Click "View History" button
2. Verify you see your previous prediction
3. Check the statistics cards update

## 🛠️ Common Issues

### Issue: Python not found

**Error:** `Failed to spawn Python process`

**Solution:**
```bash
# Check Python is installed
python3 --version

# Install if missing (macOS)
brew install python3
```

### Issue: Python packages not installed

**Error:** `ModuleNotFoundError: No module named 'numpy'`

**Solution:**
```bash
pip3 install numpy scikit-learn xgboost
```

### Issue: Model file not found

**Error:** `Failed to load ML model`

**Solution:**
```bash
cp ../ship_prediction_project/trained_health_model.pkl python-backend/models/
```

### Issue: Gemini API error

**Error:** `400 Bad Request` or `401 Unauthorized`

**Solution:**
1. Verify your API key in `.env.local`
2. Check your API quota at [Google AI Studio](https://aistudio.google.com)
3. Ensure the key has no extra spaces or quotes

### Issue: Database errors

**Error:** `SQLITE_CANTOPEN`

**Solution:**
```bash
mkdir -p data
# The database will be auto-created on first run
```

## 📊 Using the Application

### Making a Prediction

1. **Enter Required Data:**
   - Oil Hours: Hours since last oil change (e.g., 3500)
   - Total Engine Hours: Total operating hours (e.g., 98000)
   - Viscosity @40°C: Oil viscosity (e.g., 140)
   - Previous Health Score: Last known score (e.g., 0.35)

2. **Optional Data:**
   - Check "Oil Refill" or "Oil Top-up" if applicable
   - Expand "Wear Metal Concentrations" and enter values if available

3. **Submit:**
   - Click "Analyze Engine Health"
   - Wait 5-10 seconds for Gemini analysis

4. **Review Results:**
   - Health score (0-100)
   - Status category
   - Trend direction
   - Professional recommendation

### Understanding Results

**Health Score:**
- 0-25: Optimal Condition (Green)
- 25-40: Normal Wear (Blue)
- 40-55: Attention Required (Yellow)
- 55-75: Maintenance Due (Orange)
- 75-100: Critical Alert (Red)

**Trend:**
- IMPROVING ↗: Health getting better
- STABLE →: Consistent health
- DEGRADING ↘: Health declining

## 🔄 Development Workflow

### Making Changes

**Frontend Changes:**
- Edit files in `app/`, `components/`, or `lib/`
- Changes auto-reload (hot reload)

**Backend Changes:**
- Edit `python-backend/main.py`
- Restart Python server (Ctrl+C, then `python3 main.py`)

**Database Changes:**
- Edit `lib/database.ts`
- Delete `data/ship_data.db` to reset
- Restart Next.js server

### Adding Historical Data

To import existing ship data:

1. Create an import script in `lib/import-data.ts`
2. Read CSV from `../ship_prediction_project/preprocessed_data.csv`
3. Transform to match schema
4. Use `importHistoricalDataFromCSV()` function

## 🚢 Production Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variable: `GEMINI_API_KEY`
4. Add build environment variable: `PYTHON_BACKEND_URL` (pointing to deployed backend)

### Backend (Railway/Render)

1. Add `Dockerfile` to `python-backend/`
2. Deploy to Railway or Render
3. Update `PYTHON_BACKEND_URL` in Vercel

## 📞 Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Verify all prerequisites are installed
3. Check the README.md for architecture details
4. Ensure all environment variables are set correctly

## ✅ Success Checklist

- [ ] Python backend running on port 8000
- [ ] Next.js frontend running on port 3000
- [ ] Gemini API key configured
- [ ] Test prediction completes successfully
- [ ] Results display correctly
- [ ] History page shows prediction
- [ ] Database file created in `data/` directory

---

**You're ready to monitor ship engine health!** 🎉
