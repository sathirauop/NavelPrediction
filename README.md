# Naval Predictions - Hybrid AI Ship Health Monitoring

A Next.js full-stack application that combines Machine Learning and Gemini AI for predictive maintenance of the SLNS Gajabahu No. 02 Generator.

## 🏗️ Architecture

```
User Input → Next.js Frontend
                ↓
    Next.js API Routes (Orchestration)
                ↓
    ┌───────────┴──────────────────┐
    ↓                               ↓
Python Script (Child Process)  SQLite Database
    XGBoost ML Model          (Historical Data)
    ↓                               ↓
    └──────────┬────────────────────┘
               ↓
         Gemini AI API
      (Structured Analysis)
               ↓
    Final Prediction + Storage
```

**Single Server Setup**: The entire application runs from a single Next.js server. Python is called as a child process when predictions are needed - no separate backend server required!

## ✨ Features

### Hybrid AI Approach
- **ML Model**: XGBoost model generates initial health score (0-1)
- **Historical Context**: Retrieves last 20 predictions from SQLite
- **Gemini Analysis**: AI analyzes trends, maintenance history, and patterns
- **Structured Output**: Predefined status categories (not chat responses)
- **Auto-Storage**: Each prediction is stored for future trend analysis

### Predefined Status Categories
1. **OPTIMAL_CONDITION** (0.0-0.25): All systems operating within normal parameters
2. **NORMAL_WEAR** (0.25-0.40): Expected wear patterns detected
3. **ATTENTION_REQUIRED** (0.40-0.55): Elevated wear indicators
4. **MAINTENANCE_DUE** (0.55-0.75): Service required soon
5. **CRITICAL_ALERT** (0.75-1.0): Immediate action required

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   pip3 install numpy scikit-learn xgboost
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your GEMINI_API_KEY
   ```

### Running the Application

**That's it! Just one command:**
```bash
npm run dev
```

The app runs on [http://localhost:3000](http://localhost:3000)

**No separate backend server needed!** Python is automatically called by Next.js when making predictions.

## 📁 Project Structure

```
naval-predictions/
├── app/
│   ├── page.tsx                    # Main prediction page
│   ├── history/page.tsx            # Historical predictions
│   └── api/
│       ├── predict/route.ts        # Main orchestration endpoint
│       ├── history/route.ts        # Fetch historical data
│       └── stats/route.ts          # Dashboard statistics
├── components/
│   ├── PredictionForm.tsx          # Input form
│   ├── ResultsDisplay.tsx          # Results visualization
│   └── HistoryTable.tsx            # Historical data table
├── lib/
│   ├── types.ts                    # TypeScript type definitions
│   ├── database.ts                 # SQLite operations
│   └── gemini.ts                   # Gemini AI integration
├── python-backend/
│   ├── main.py                     # FastAPI server
│   └── models/
│       └── trained_health_model.pkl # XGBoost model
└── data/
    └── ship_data.db               # SQLite database (auto-created)
```

## 🔧 Required Input Parameters

### Required
- **oil_hrs**: Hours since last oil change (≥0)
- **total_hrs**: Total engine operating hours (≥0)
- **viscosity_40**: Oil viscosity at 40°C in cSt (>0)
- **health_score_lag_1**: Previous health score (0.0-1.0)
- **oil_refill_start**: Oil refill flag (0 or 1)
- **oil_topup**: Oil top-up flag (0 or 1)

### Optional
- **fe_ppm**: Iron concentration
- **pb_ppm**: Lead concentration
- **cu_ppm**: Copper concentration
- **al_ppm**: Aluminum concentration
- **si_ppm**: Silicon concentration

## 🔄 How It Works

1. User submits engine data via the web form
2. Next.js API calls Python ML model for raw health score
3. Fetches historical data from SQLite (last 20 records)
4. Sends everything to Gemini AI with full context
5. Gemini returns structured output with final score, status, trend
6. Result is stored in database
7. Complete analysis displayed to user

## 🛠️ Troubleshooting

**Python not found:**
- Ensure Python 3 is installed: `python3 --version`
- Install required packages: `pip3 install numpy scikit-learn xgboost`

**ML Model not found:**
- Ensure model exists: `ls python-backend/models/trained_health_model.pkl`
- Copy from original project if missing

**Gemini API errors:**
- Verify your API key in `.env.local`
- Check quota at [Google AI Studio](https://aistudio.google.com)

**Database errors:**
- Ensure `data/` directory exists
- Database is auto-created on first run

## 📄 License

This project is for educational and research purposes for naval ship maintenance.

---

**Built with Next.js, FastAPI, XGBoost, Gemini AI, and SQLite**
