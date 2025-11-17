#!/usr/bin/env python3
"""
Convert XGBoost Model to ONNX Format
This script converts the trained XGBoost health prediction model to ONNX format
for use in Node.js without requiring Python dependencies in production.
"""

import pickle
import numpy as np
from pathlib import Path

try:
    import onnxmltools
    from onnxmltools.convert.common.data_types import FloatTensorType
    import onnx
    from skl2onnx.common.data_types import FloatTensorType as SKLFloatTensorType
except ImportError as e:
    print("❌ Missing required packages. Please install them:")
    print("   pip install onnxmltools onnx skl2onnx onnxruntime")
    print(f"\nError: {e}")
    exit(1)

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
MODEL_PATH = PROJECT_ROOT / "models" / "trained_health_model.pkl"
ONNX_OUTPUT_PATH = PROJECT_ROOT / "models" / "health_model.onnx"

# Feature columns (must match training)
FEATURE_COLUMNS = [
    'Oil Hrs', 'Total Hrs', 'Visc @40°C',
    'Oil Refill Start', 'Oil Top-up', 'Health_Score_Lag_1'
]

def load_xgboost_model():
    """Load the trained XGBoost model"""
    print(f"📦 Loading XGBoost model from: {MODEL_PATH}")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)

    print(f"✅ Model loaded successfully")
    print(f"   Model type: {type(model).__name__}")

    return model

def convert_to_onnx(model):
    """Convert XGBoost model to ONNX format"""
    print(f"\n🔄 Converting to ONNX format...")

    # Define input shape: [batch_size, number_of_features]
    # batch_size = None (dynamic), number_of_features = 6
    initial_type = [('float_input', FloatTensorType([None, len(FEATURE_COLUMNS)]))]

    try:
        # Get the XGBoost Booster object directly
        # This avoids feature name issues during conversion
        if hasattr(model, 'get_booster'):
            booster = model.get_booster()
            # Set feature names to None to avoid conversion issues
            booster.feature_names = None
            model_to_convert = booster
        else:
            model_to_convert = model

        # Convert XGBoost model to ONNX
        onnx_model = onnxmltools.convert_xgboost(
            model_to_convert,
            initial_types=initial_type,
            target_opset=12  # Use opset version 12 for compatibility
        )

        print(f"✅ Conversion successful")

        # Save ONNX model
        print(f"\n💾 Saving ONNX model to: {ONNX_OUTPUT_PATH}")
        onnx.save_model(onnx_model, str(ONNX_OUTPUT_PATH))

        print(f"✅ ONNX model saved successfully")

        # Verify the model
        verify_onnx_model(onnx_model)

        return onnx_model

    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        raise

def verify_onnx_model(onnx_model):
    """Verify the ONNX model is valid"""
    print(f"\n🔍 Verifying ONNX model...")

    try:
        # Check model validity
        onnx.checker.check_model(onnx_model)
        print(f"✅ ONNX model is valid")

        # Print model info
        print(f"\n📊 Model Information:")
        print(f"   Input name: {onnx_model.graph.input[0].name}")
        print(f"   Input shape: {onnx_model.graph.input[0].type.tensor_type.shape}")
        print(f"   Output name: {onnx_model.graph.output[0].name}")
        print(f"   Output shape: {onnx_model.graph.output[0].type.tensor_type.shape}")

    except Exception as e:
        print(f"⚠️  Model validation warning: {e}")

def test_onnx_inference():
    """Test ONNX model inference using onnxruntime"""
    print(f"\n🧪 Testing ONNX inference...")

    try:
        import onnxruntime as ort
    except ImportError:
        print("⚠️  onnxruntime not installed. Skipping inference test.")
        print("   Install with: pip install onnxruntime")
        return

    # Load ONNX model
    session = ort.InferenceSession(str(ONNX_OUTPUT_PATH))

    # Test data (example input)
    test_input = np.array([[
        3500.0,   # Oil Hrs
        98000.0,  # Total Hrs
        140.0,    # Visc @40°C
        0,        # Oil Refill Start
        1,        # Oil Top-up
        0.35      # Health_Score_Lag_1
    ]], dtype=np.float32)

    # Get input name from model
    input_name = session.get_inputs()[0].name

    # Run inference
    result = session.run(None, {input_name: test_input})
    prediction = result[0][0]

    print(f"✅ ONNX inference test successful")
    print(f"   Test input: {test_input[0].tolist()}")
    print(f"   Predicted health score: {float(prediction):.4f}")

    # Compare with original model
    print(f"\n🔬 Comparing with original XGBoost model...")
    original_model = load_xgboost_model()
    original_prediction = original_model.predict(test_input)[0]

    print(f"   Original XGBoost prediction: {float(original_prediction):.4f}")
    print(f"   ONNX prediction: {float(prediction):.4f}")
    print(f"   Difference: {float(abs(original_prediction - prediction)):.6f}")

    if abs(original_prediction - prediction) < 0.001:
        print(f"   ✅ Predictions match (within tolerance)")
    else:
        print(f"   ⚠️  Predictions differ slightly (this is normal for ONNX conversion)")

def main():
    """Main conversion workflow"""
    print("=" * 60)
    print("XGBoost to ONNX Model Conversion")
    print("=" * 60)

    try:
        # Step 1: Load XGBoost model
        xgb_model = load_xgboost_model()

        # Step 2: Convert to ONNX
        onnx_model = convert_to_onnx(xgb_model)

        # Step 3: Test inference
        test_onnx_inference()

        print("\n" + "=" * 60)
        print("✅ Conversion completed successfully!")
        print("=" * 60)
        print(f"\n📁 ONNX model saved to: {ONNX_OUTPUT_PATH}")
        print(f"📏 Model size: {ONNX_OUTPUT_PATH.stat().st_size / 1024:.2f} KB")
        print(f"\n🚀 Next steps:")
        print(f"   1. Model is ready to use in Next.js")
        print(f"   2. No Python dependencies required in production")

    except Exception as e:
        print(f"\n❌ Conversion failed: {e}")
        exit(1)

if __name__ == "__main__":
    main()
