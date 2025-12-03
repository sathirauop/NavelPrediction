"""
Generate 50 additional random data points for each ship.
Creates realistic oil analysis data based on existing patterns.
"""
import json
import random
from datetime import datetime, timedelta
from pathlib import Path

# Ship names
SHIPS = ["GAJABAHU", "SAGARA", "SAYURA", "SHAKTHI", "VIJAYABAHU"]

# Realistic ranges based on naval engine oil analysis
RANGES = {
    "oil_hrs": (100, 5000),
    "total_hrs": (92000, 115000),
    "viscosity_40": (120, 155),
    "viscosity_100": (12.5, 16.5),
    "viscosity_index": (85, 115),
    "fe_ppm": (0.5, 30),  # Iron - can spike in wear conditions
    "cr_ppm": (0.5, 5),
    "si_ppm": (0.5, 10),
    "al_ppm": (0.5, 15),
    "pb_ppm": (0.5, 25),  # Lead - can be high
    "cu_ppm": (0.5, 15),
    "sn_ppm": (0.5, 5),
    "ni_ppm": (0.5, 5),
    "tbn": (5, 12),
    "flash_point": (200, 220),
}

STATUSES = ["OPTIMAL_CONDITION", "NORMAL_WEAR", "ATTENTION_REQUIRED", "MAINTENANCE_DUE"]
TRENDS = ["IMPROVING", "STABLE", "DEGRADING"]

def generate_random_value(key, is_optional=True):
    """Generate a random value for a given parameter."""
    if is_optional and random.random() < 0.2:  # 20% chance of None for optional fields
        return None
    
    if key in RANGES:
        min_val, max_val = RANGES[key]
        if key in ["oil_hrs", "total_hrs"]:
            return round(random.uniform(min_val, max_val), 2)
        else:
            return round(random.uniform(min_val, max_val), 3)
    return None

def calculate_health_score(fe, pb, cu, al, si, viscosity):
    """Calculate a realistic health score based on parameters."""
    # Simple heuristic: higher metal content = higher (worse) score
    metal_score = (fe + pb + cu + al + si) / 500
    
    # Viscosity deviation from ideal (140)
    visc_score = abs(viscosity - 140) / 500
    
    score = min(metal_score + visc_score + random.uniform(-0.05, 0.1), 0.9)
    return max(0.0, round(score, 5))

def determine_status(health_score):
    """Determine status based on health score."""
    if health_score < 0.15:
        return "OPTIMAL_CONDITION"
    elif health_score < 0.35:
        return "NORMAL_WEAR"
    elif health_score < 0.55:
        return "ATTENTION_REQUIRED"
    else:
        return "MAINTENANCE_DUE"

def generate_recommendation(status):
    """Generate recommendation based on status."""
    recommendations = {
        "OPTIMAL_CONDITION": "Maintain current operations, all parameters normal",
        "NORMAL_WEAR": "Continue routine maintenance, expected wear patterns",
        "ATTENTION_REQUIRED": "Schedule inspection within 30 days, elevated wear detected",
        "MAINTENANCE_DUE": "Plan maintenance within 2 weeks, service required"
    }
    return recommendations.get(status, "Monitor conditions")

def generate_record(ship_name, record_id, base_date):
    """Generate a single realistic data record."""
    # Generate random values
    oil_hrs = generate_random_value("oil_hrs", False)
    total_hrs = generate_random_value("total_hrs", False)
    viscosity_40 = generate_random_value("viscosity_40", False)
    viscosity_100 = generate_random_value("viscosity_100", True)
    viscosity_index = generate_random_value("viscosity_index", True)
    
    fe_ppm = generate_random_value("fe_ppm", True) or 5.0
    cr_ppm = generate_random_value("cr_ppm", True)
    si_ppm = generate_random_value("si_ppm", True) or 2.0
    al_ppm = generate_random_value("al_ppm", True) or 1.0
    pb_ppm = generate_random_value("pb_ppm", True) or 2.0
    cu_ppm = generate_random_value("cu_ppm", True) or 3.0
    sn_ppm = generate_random_value("sn_ppm", True)
    ni_ppm = generate_random_value("ni_ppm", True)
    
    tbn = generate_random_value("tbn", True)
    flash_point = generate_random_value("flash_point", True)
    
    # Calculate health score
    health_score = calculate_health_score(fe_ppm, pb_ppm, cu_ppm, al_ppm, si_ppm, viscosity_40)
    
    # Determine status and trend
    status = determine_status(health_score)
    trend = random.choice(TRENDS)
    
    # Generate timestamp (spread over last 6 months)
    days_offset = random.randint(0, 180)
    timestamp = (base_date - timedelta(days=days_offset)).strftime("%Y-%m-%d %H:%M:%S")
    
    record = {
        "id": record_id,
        "oil_hrs": oil_hrs,
        "total_hrs": total_hrs,
        "viscosity_40": viscosity_40,
        "viscosity_100": viscosity_100,
        "viscosity_index": viscosity_index,
        "tbn": tbn,
        "water_content": "<0.1" if random.random() < 0.8 else "<0.2",
        "flash_point": flash_point,
        "fe_ppm": fe_ppm,
        "cr_ppm": cr_ppm,
        "si_ppm": si_ppm,
        "al_ppm": al_ppm,
        "pb_ppm": pb_ppm,
        "cu_ppm": cu_ppm,
        "sn_ppm": sn_ppm,
        "ni_ppm": ni_ppm,
        "oil_refill_start": 1 if oil_hrs < 200 else 0,
        "oil_topup": random.choice([0, 0, 0, 1]),  # 25% chance of topup
        "health_score_lag_1": round(random.uniform(0, 0.3), 5),
        "ml_raw_score": health_score,
        "gemini_final_score": health_score,
        "status": status,
        "trend": trend,
        "recommendation": generate_recommendation(status),
        "confidence": "historical",
        "created_at": timestamp,
        "ship_name": ship_name
    }
    
    return record

def main():
    # Load existing seed data
    seed_file = Path("lib/seed-data-new.json")
    with open(seed_file, 'r') as f:
        existing_data = json.load(f)
    
    print(f"📊 Loaded {len(existing_data)} existing records")
    
    # Get starting ID
    max_id = max(record['id'] for record in existing_data)
    next_id = max_id + 1
    
    print(f"🆔 Starting new records from ID: {next_id}")
    
    # Base date for timestamps
    base_date = datetime.now()
    
    # Generate 50 records per ship
    new_records = []
    for ship in SHIPS:
        print(f"\n🚢 Generating 50 records for {ship}...")
        for i in range(50):
            record = generate_record(ship, next_id, base_date)
            new_records.append(record)
            next_id += 1
        print(f"   ✓ Generated {i+1} records")
    
    # Combine with existing data
    all_data = existing_data + new_records
    
    # Sort by ID
    all_data.sort(key=lambda x: x['id'])
    
    # Save to file
    with open(seed_file, 'w') as f:
        json.dump(all_data, f, indent=4)
    
    print(f"\n✅ Successfully updated {seed_file}")
    print(f"📈 Total records: {len(all_data)}")
    print(f"   - Existing: {len(existing_data)}")
    print(f"   - New: {len(new_records)}")
    
    # Count per ship
    ship_counts = {}
    for record in all_data:
        ship = record['ship_name']
        ship_counts[ship] = ship_counts.get(ship, 0) + 1
    
    print("\n📊 Records per ship:")
    for ship, count in sorted(ship_counts.items()):
        print(f"   {ship}: {count} records")

if __name__ == "__main__":
    main()
