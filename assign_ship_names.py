"""
Script to assign ship names to existing historical data.
Distributes 81 records across 5 ships evenly.
"""
import json
from pathlib import Path

# Ship names to assign
SHIPS = ["GAJABAHU", "SAGARA", "SAYURA", "SHAKTHI", "VIJAYABAHU"]

# Load existing seed data
seed_file = Path("lib/seed-data-new.json")
with open(seed_file, 'r') as f:
    data = json.load(f)

print(f"Loaded {len(data)} records from seed data")

# Assign ship names in a round-robin fashion
# This ensures even distribution across all ships
for i, record in enumerate(data):
    ship_index = i % len(SHIPS)
    record['ship_name'] = SHIPS[ship_index]
    
# Count records per ship
ship_counts = {}
for record in data:
    ship = record['ship_name']
    ship_counts[ship] = ship_counts.get(ship, 0) + 1

print("\nRecords assigned per ship:")
for ship, count in sorted(ship_counts.items()):
    print(f"  {ship}: {count} records")

# Save updated data
with open(seed_file, 'w') as f:
    json.dump(data, f, indent=4)

print(f"\n✅ Successfully updated {seed_file}")
print(f"📊 Total records: {len(data)}")
