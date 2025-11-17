#!/usr/bin/env python3
"""
ML Model Prediction Script
Called from Next.js API routes via child process
Accepts JSON input via stdin, outputs JSON to stdout
"""

import sys
import json
import pickle
import numpy as np
import os
from pathlib import Path

# Get the model path relative to this script
SCRIPT_DIR = Path(__file__).parent
MODEL_PATH = SCRIPT_DIR / "../../python-backend/models/trained_health_model.pkl"

# Feature columns expected by the model
FEATURE_COLUMNS = [
    'Oil Hrs', 'Total Hrs', 'Visc @40°C',
    'Oil Refill Start', 'Oil Top-up', 'Health_Score_Lag_1'
]

def load_model():
    """Load the trained ML model"""
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        return None, str(e)

def predict(model, input_data):
    """Make prediction using the model"""
    try:
        # Extract features in correct order
        features = np.array([[
            input_data['oil_hrs'],
            input_data['total_hrs'],
            input_data['viscosity_40'],
            input_data['oil_refill_start'],
            input_data['oil_topup'],
            input_data['health_score_lag_1']
        ]])

        # Make prediction
        raw_prediction = model.predict(features)[0]

        # Ensure prediction is in valid range
        raw_prediction = float(np.clip(raw_prediction, 0.0, 1.0))

        # Determine confidence
        confidence = "high"
        if input_data['health_score_lag_1'] == 0:
            confidence = "medium"

        return {
            "success": True,
            "raw_health_score": raw_prediction,
            "confidence": confidence,
            "model_version": "XGBoost_v1.0",
            "features_used": FEATURE_COLUMNS
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """Main function - reads from stdin, writes to stdout"""
    try:
        # Read JSON input from stdin
        input_line = sys.stdin.read()
        input_data = json.loads(input_line)

        # Load model
        model = load_model()
        if model is None:
            result = {
                "success": False,
                "error": "Failed to load ML model"
            }
        else:
            # Make prediction
            result = predict(model, input_data)

        # Write JSON output to stdout
        print(json.dumps(result))
        sys.stdout.flush()

    except json.JSONDecodeError as e:
        error_result = {
            "success": False,
            "error": f"Invalid JSON input: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)

    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Prediction failed: {str(e)}"
        }
        print(json.dumps(error_result))
        sys.stdout.flush()
        sys.exit(1)

if __name__ == "__main__":
    main()
