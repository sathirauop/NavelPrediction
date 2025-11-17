# Machine Learning Models

This directory contains the trained models for ship health prediction.

## Files

### `trained_health_model.pkl` (189 KB)
- **Type**: XGBoost Regressor (scikit-learn API)
- **Format**: Python pickle
- **Training**: Trained on historical ship oil analysis data
- **Input Features**: 6 (Oil Hrs, Total Hrs, Visc @40°C, Oil Refill, Oil Top-up, Health_Score_Lag_1)
- **Output**: Health score (0.0 = healthy, 1.0 = critical)
- **Purpose**: Original Python model, used for conversion to ONNX

### `health_model.onnx` (111 KB)
- **Type**: ONNX Runtime Model
- **Format**: ONNX (Open Neural Network Exchange)
- **Converted From**: `trained_health_model.pkl`
- **Runtime**: onnxruntime-node (no Python required)
- **Accuracy**: 100% match with original model (0.000000 difference)
- **Purpose**: Production model used by Next.js API

## Model Conversion

To regenerate the ONNX model from the pickle file:

```bash
# Ensure Python dependencies are installed
pip install onnxmltools onnx skl2onnx onnxruntime

# Run conversion script
python3 scripts/convert_to_onnx.py
```

The conversion script will:
1. Load the XGBoost model from `trained_health_model.pkl`
2. Convert it to ONNX format
3. Save as `health_model.onnx`
4. Validate the conversion
5. Test inference to ensure accuracy

## Model Details

### Input Schema
```typescript
{
  oil_hrs: number,        // Hours since last oil change
  total_hrs: number,      // Total engine operating hours
  viscosity_40: number,   // Oil viscosity at 40°C (cSt)
  oil_refill_start: 0|1,  // Oil refill flag
  oil_topup: 0|1,         // Oil top-up flag
  health_score_lag_1: number  // Previous health score (0-1)
}
```

### Output
- Single float value: Health score (0.0 - 1.0)
- Lower = healthier, Higher = more critical

### Health Score Interpretation
- **0.0 - 0.25**: OPTIMAL_CONDITION
- **0.25 - 0.40**: NORMAL_WEAR
- **0.40 - 0.55**: ATTENTION_REQUIRED
- **0.55 - 0.75**: MAINTENANCE_DUE
- **0.75 - 1.0**: CRITICAL_ALERT

## Performance

### ONNX Runtime (Production)
- **Average Prediction Time**: 0.10ms - 0.20ms
- **First Call (Cold Start)**: ~50ms
- **Memory Usage**: ~2MB (cached session)
- **No Python Required**: ✅

### Python XGBoost (Development Only)
- **Average Prediction Time**: 10-50ms (subprocess overhead)
- **First Call**: 100-200ms
- **Memory Usage**: High (Python process)
- **Requires Python**: ✅

## Retraining

If you retrain the model:

1. Save new model as `models/trained_health_model.pkl`
2. Run conversion: `python3 scripts/convert_to_onnx.py`
3. Restart Next.js server
4. Verify predictions match: `npx tsx test-onnx.ts`

## Version Information

- **Model Version**: XGBoost_v1.0_ONNX
- **ONNX Opset**: 12
- **Training Date**: September 2024
- **Conversion Date**: November 2024

## License

Model trained on SLNS Gajabahu No. 02 Generator oil analysis data.
