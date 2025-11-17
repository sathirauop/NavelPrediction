# Naval Predictions - Architecture Overview

## System Architecture

### Single-Server Design

The application runs entirely from a **single Next.js server**. Python is called as needed via child processes - no separate backend server required!:::

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Server (Port 3000)              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Frontend (React)                      │  │
│  │  - PredictionForm.tsx                                │  │
│  │  - ResultsDisplay.tsx                                │  │
│  │  - HistoryTable.tsx                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Next.js API Routes (/app/api)             │  │
│  │                                                       │  │
│  │  POST /api/predict                                   │  │
│  │    1. Validates input                                │  │
│  │    2. Spawns Python child process                    │  │
│  │    3. Queries SQLite database                        │  │
│  │    4. Calls Gemini API                               │  │
│  │    5. Stores result                                  │  │
│  │                                                       │  │
│  │  GET /api/history                                    │  │
│  │  GET /api/stats                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│              ↓                  ↓                           │
│  ┌──────────────────┐  ┌────────────────────┐             │
│  │  Python Script   │  │  SQLite Database   │             │
│  │  (Child Process) │  │   (ship_data.db)   │             │
│  │                  │  │                    │             │
│  │  predict.py      │  │  81 historical     │             │
│  │  - Loads model   │  │  records           │             │
│  │  - Predicts      │  │                    │             │
│  │  - Returns JSON  │  │  Auto-stores new   │             │
│  └──────────────────┘  │  predictions       │             │
│                        └────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
               ↓
    ┌─────────────────────┐
    │   Gemini AI API     │
    │  (Google Cloud)     │
    │                     │
    │  - Analyzes context │
    │  - Returns status   │
    │  - Structured JSON  │
    └─────────────────────┘
```

## Data Flow

### Prediction Pipeline

```
1. User Input (Frontend)
   ↓
2. POST /api/predict (Next.js API Route)
   ↓
3. Spawn Python Process
   - Input: JSON via stdin
   - Execute: lib/python/predict.py
   - Load: python-backend/models/trained_health_model.pkl
   - Predict: XGBoost model inference
   - Output: JSON via stdout (raw health score)
   ↓
4. Query Historical Data (SQLite)
   - Fetch: Last 20 predictions
   - Analyze: Trends and patterns
   ↓
5. Call Gemini AI
   - Input: ML score + historical data + new input
   - Process: Contextual analysis
   - Output: Structured JSON (status, trend, recommendation)
   ↓
6. Store Result (SQLite)
   - Insert: Complete prediction record
   - Auto-increment: ID
   - Timestamp: Current time
   ↓
7. Return to Frontend
   - JSON response with complete analysis
   - Display: Health score, status, trend, recommendation
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: React functional components with hooks
- **State Management**: React useState (no external state library)

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Python Integration**: Child processes via `spawn()`
- **Database**: SQLite (better-sqlite3)
- **AI**: Google Gemini 1.5 Pro API

### ML Model
- **Framework**: XGBoost (Python)
- **Format**: Pickle (.pkl)
- **Features**: 6 input features (oil hours, total hours, viscosity, flags, previous score)
- **Output**: Single float (0.0-1.0)

## Key Design Decisions

### Why Child Processes Instead of HTTP Server?

**Before (FastAPI)**:
- Separate FastAPI server on port 8000
- Required 2 terminals to run
- HTTP overhead for local calls
- More complex deployment

**After (Child Processes)**:
- Single Next.js server
- 1 terminal to run
- Direct process communication
- Simpler deployment

**Benefits**:
- ✅ Simpler setup (one command: `npm run dev`)
- ✅ No port conflicts
- ✅ Faster execution (no HTTP overhead)
- ✅ Easier deployment (single server)
- ✅ Better error handling (stderr capture)

### Why SQLite?

- **Embedded**: No separate database server
- **Zero configuration**: Just a file
- **Fast**: Perfect for read-heavy workloads
- **ACID compliant**: Data integrity guaranteed
- **Easy backup**: Copy the .db file

### Why Gemini AI?

- **Structured Output**: JSON schema enforcement
- **Contextual Analysis**: Understands trends and patterns
- **Fast**: Sub-second responses
- **Cost-effective**: Free tier available
- **No fine-tuning needed**: Works out of the box

## File Structure

```
naval-predictions/
├── app/
│   ├── page.tsx                      # Main prediction page
│   ├── history/page.tsx              # Historical data view
│   ├── layout.tsx                    # Root layout
│   └── api/                          # Next.js API routes
│       ├── predict/route.ts          # Main prediction endpoint
│       ├── history/route.ts          # Historical data API
│       └── stats/route.ts            # Statistics API
│
├── components/                       # React components
│   ├── PredictionForm.tsx           # Input form
│   ├── ResultsDisplay.tsx           # Results visualization
│   └── HistoryTable.tsx             # Data table
│
├── lib/                              # Shared libraries
│   ├── types.ts                     # TypeScript definitions
│   ├── database.ts                  # SQLite operations
│   ├── gemini.ts                    # Gemini AI client
│   └── python/
│       └── predict.py               # ML model script
│
├── python-backend/                   # Python ML model
│   └── models/
│       └── trained_health_model.pkl # XGBoost model (193 KB)
│
├── data/                             # SQLite database
│   └── ship_data.db                 # 81 historical records
│
├── scripts/                          # Utility scripts
│   └── import-historical-data.ts    # Data import script
│
└── Configuration files
    ├── .env.local                   # Environment variables
    ├── package.json                 # Node dependencies
    ├── tsconfig.json                # TypeScript config
    └── tailwind.config.ts           # Tailwind CSS config
```

## API Endpoints

### POST /api/predict
**Purpose**: Make a new health prediction

**Request Body**:
```json
{
  "oil_hrs": 3500,
  "total_hrs": 98000,
  "viscosity_40": 140,
  "oil_refill_start": 0,
  "oil_topup": 0,
  "health_score_lag_1": 0.35,
  "fe_ppm": 65,  // Optional
  "pb_ppm": 12,  // Optional
  ...
}
```

**Response**:
```json
{
  "id": 82,
  "timestamp": "2025-10-27T23:54:12.345Z",
  "ml_raw_score": 0.2454,
  "gemini_final_score": 0.2100,
  "status": "NORMAL_WEAR",
  "trend": "STABLE",
  "recommendation": "Expected wear patterns, maintain routine schedule",
  "confidence": "high"
}
```

### GET /api/history?limit=20
**Purpose**: Fetch historical predictions

**Response**:
```json
{
  "count": 81,
  "data": [...]
}
```

### GET /api/stats
**Purpose**: Get dashboard statistics

**Response**:
```json
{
  "total_predictions": 81,
  "latest_score": 0.107,
  "latest_status": "OPTIMAL_CONDITION",
  "average_score_7_days": 0.125,
  "trend_direction": "STABLE",
  "critical_alerts_count": 0
}
```

## Security Considerations

### Input Validation
- All inputs validated in API routes
- Type checking via TypeScript
- Range validation (e.g., health score 0-1)

### Python Execution
- No user-provided code execution
- Sandboxed child processes
- Timeout protection (inherited from Next.js)
- Error output captured and logged

### API Keys
- Stored in `.env.local` (gitignored)
- Not exposed to frontend
- Server-side only

### Database
- No SQL injection (using prepared statements)
- File-based (local access only)
- No network exposure

## Performance

### Prediction Latency
- Python spawn: ~100ms
- ML inference: ~50ms
- SQLite query: ~10ms
- Gemini API: ~2-5 seconds
- **Total**: ~3-6 seconds

### Optimization Opportunities
1. **Cache model**: Keep Python process alive (pool)
2. **Parallel calls**: Gemini + DB in parallel
3. **Edge functions**: Deploy to Vercel Edge
4. **Model conversion**: ONNX for Node.js inference

## Deployment

### Local Development
```bash
npm run dev
```

### Production (Vercel)
1. Push to GitHub
2. Import to Vercel
3. Add `GEMINI_API_KEY` environment variable
4. Deploy automatically

**Note**: Python must be available in the deployment environment (Vercel includes Python 3.9 by default).

## Monitoring & Logging

### Console Logs
- All predictions logged to stdout
- Errors logged to stderr
- Pipeline stages marked with emojis

### Database Audit
- Every prediction stored with timestamp
- Full audit trail available
- Easy to export to CSV

## Future Enhancements

### Short Term
- [ ] Add confidence intervals to predictions
- [ ] Chart visualizations for trends
- [ ] Email alerts for critical conditions
- [ ] Export predictions to Excel

### Long Term
- [ ] Multiple ship support
- [ ] Real-time data streaming
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Convert model to ONNX for faster inference

---

**Built with**: Next.js 15, TypeScript, Tailwind CSS, XGBoost, Gemini AI, SQLite
