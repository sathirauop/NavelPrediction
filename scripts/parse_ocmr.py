import re
import json
import os
import sys

def parse_value(val):
    if not val:
        return None
    val = val.strip()
    if val.upper() in ['N/A', 'N/C', 'N/I', '-', '']:
        return None
    
    # Handle < 1.00
    if val.startswith('<') or val.startswith('&lt;'):
        return 0.5 # Default for trace amounts
            
    try:
        # Remove commas
        clean_val = val.replace(',', '')
        return float(clean_val)
    except:
        return val

def parse_text_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Replace control characters (like \x07 used by textutil for table cells) with space
    content = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', ' ', content)
    
    # Fix split Sample IDs (e.g. "S/I- M123" -> "S/I-M123")
    content = re.sub(r'S/I\s*-\s*M', 'S/I-M', content, flags=re.IGNORECASE)
    content = re.sub(r'S/I\s+M', 'S/I-M', content, flags=re.IGNORECASE)

    # Helper to parse date parts
    def parse_date_str(day, month, year):
        month_map = {
            'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
            'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
        }
        m = month_map.get(month.lower()[:3], '01')
        if len(year) == 2: year = "20" + year
        return f"{year}-{m}-{day.zfill(2)} 10:00:00"

    created_at_val = "2025-01-01 10:00:00"
    header = content[:1000]
    
    # Pattern for DD Mon YY or DD Mon YYYY (e.g. 11 Jul 25, 11 Jul 2025)
    months = r"Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec"
    date_pattern = r"\b(\d{1,2})\s+(" + months + r")\s+(\d{2,4})\b"
    
    # 1. Look for "Date..." followed by date
    date_keywords = re.search(r"(Date\s*(?:of\s+Sampling|sampling)?\s*[:\-]?)", header, re.IGNORECASE)
    found = False
    if date_keywords:
        post_keyword = header[date_keywords.end():]
        # Match date pattern
        match = re.search(date_pattern, post_keyword, re.IGNORECASE)
        if match:
            day, month, year = match.groups()
            created_at_val = parse_date_str(day, month, year)
            found = True
        else:
            # Try DD.MM.YYYY
            match_dot = re.search(r"\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b", post_keyword)
            if match_dot:
                day, month, year = match_dot.groups()
                if len(year) == 2: year = "20" + year
                created_at_val = f"{year}-{month.zfill(2)}-{day.zfill(2)} 10:00:00"
                found = True

    # 2. If not found, look for any recent date (>= 2023) in header
    if not found:
        matches = re.findall(date_pattern, header, re.IGNORECASE)
        for day, month, year in matches:
            y = year
            if len(y) == 2: y = "20" + y
            if int(y) >= 2023:
                created_at_val = parse_date_str(day, month, year)
                found = True
                break
    
    tokens = content.split()
    
    # Find all indices where a Sample ID starts
    sample_indices = [i for i, t in enumerate(tokens) if 'S/I' in t and 'M' in t]
    
    if not sample_indices:
        print(f"No sample IDs found in {filepath}")
        return {}

    # Group consecutive sample IDs into blocks
    blocks = []
    if sample_indices:
        current_block = [sample_indices[0]]
        for i in range(1, len(sample_indices)):
            if sample_indices[i] == sample_indices[i-1] + 1:
                current_block.append(sample_indices[i])
            else:
                blocks.append(current_block)
                current_block = [sample_indices[i]]
        blocks.append(current_block)

    categorized_records = {} # key: category (e.g., 'Port', 'Stbd', 'Default'), value: list of records

    for block_indices in blocks:
        # Determine category for this block
        # Look backwards from block start for keywords
        block_start_idx = block_indices[0]
        preceding_text = " ".join(tokens[max(0, block_start_idx-500):block_start_idx]).upper()
        
        category = 'Default'
        if 'PORT' in preceding_text and 'STBD' not in preceding_text.split('PORT')[-1]:
            category = 'Port'
        elif 'STBD' in preceding_text or 'STARBOARD' in preceding_text:
            category = 'Stbd'
        elif 'NO 01' in preceding_text or 'NO.01' in preceding_text or 'NO. 01' in preceding_text:
             category = 'No1'
        elif 'NO 02' in preceding_text or 'NO.02' in preceding_text or 'NO. 02' in preceding_text:
             category = 'No2'
             
        if category not in categorized_records:
            categorized_records[category] = []

        # Extract sample IDs
        sample_ids = [tokens[i] for i in block_indices]
        
        # Find extraction window
        search_text = " ".join(tokens[block_indices[-1]+1:])
        
        # Helper to extract a row of values
        def extract_row(keywords, count):
            # Pattern for a single value:
            # - Number (maybe with < prefix, maybe separated by space, maybe with * suffix, maybe with commas)
            # - Or N/A, N/C, etc.
            # We allow space between < and number: (?:(?:<|&lt;)\s*)?
            # Number: [\d,\.]+\*?
            val_pattern = r'(?:(?:<|&lt;)\s*)?[\d,\.]+\*?|N/A|N/C|N/I|-'
            
            # Regex for a sequence of values
            # We want to capture the whole sequence
            # The sequence starts after the keyword (and potential units/junk)
            # It consists of values separated by whitespace
            # We use \s+ to ensure separation, but the first value might be immediate
            seq_pattern = f"((?:\\s*(?:{val_pattern}))+)"
            
            for keyword in keywords:
                # Find keyword
                kw_pattern = f"\\b{re.escape(keyword)}\\b"
                kw_match = re.search(kw_pattern, search_text, re.IGNORECASE)
                
                if kw_match:
                    post_text = search_text[kw_match.end():]
                    
                    # Find the first sequence of values
                    # We use re.search to find the first sequence
                    # This will stop when it hits something that is NOT a value (like the next keyword)
                    seq_match = re.search(seq_pattern, post_text)
                    
                    if seq_match:
                        vals_str = seq_match.group(1)
                        # Extract individual values from the sequence string
                        vals = re.findall(val_pattern, vals_str)
                        
                        # If we found enough values, take the last 'count' values
                        if len(vals) >= count:
                            return vals[-count:]
                        
            return [None] * count

        count = len(sample_ids)
        
        oil_hrs = extract_row(['Oil Running Hrs', 'Oil Running Hours'], count)
        total_hrs = extract_row(['T/R/H of Machinery', 'Total Running Hours'], count)
        visc_40 = extract_row(['Viscosity@ 40oC', 'Viscosity @ 40oC', 'Viscosity  @ 40oC', 'ViViscosity@ 40oC'], count)
        visc_100 = extract_row(['Viscosity@ 100oC', 'Viscosity @ 100oC', 'Viscosity  @ 100oC'], count)
        visc_index = extract_row(['Viscosity Index'], count)
        tbn = extract_row(['Total Base No.', 'TB No.'], count)
        water = extract_row(['Water content'], count)
        flash = extract_row(['Flash Point'], count)
        
        fe = extract_row(['Fe', 'Iron'], count)
        cr = extract_row(['Cr', 'Chromium'], count)
        si = extract_row(['Si', 'Silicon'], count)
        al = extract_row(['Al', 'Aluminum'], count)
        pb = extract_row(['Pb', 'Lead'], count)
        cu = extract_row(['Cu', 'Copper'], count)
        sn = extract_row(['Sn', 'Tin'], count)
        ni = extract_row(['Ni', 'Nickel'], count)

        for i in range(count):
            record = {
                'sample_id': sample_ids[i],
                'oil_hrs': parse_value(oil_hrs[i]),
                'total_hrs': parse_value(total_hrs[i]),
                'viscosity_40': parse_value(visc_40[i]),
                'viscosity_100': parse_value(visc_100[i]),
                'viscosity_index': parse_value(visc_index[i]),
                'tbn': parse_value(tbn[i]),
                'water_content': water[i],
                'flash_point': parse_value(flash[i]),
                'fe_ppm': parse_value(fe[i]),
                'cr_ppm': parse_value(cr[i]),
                'si_ppm': parse_value(si[i]),
                'al_ppm': parse_value(al[i]),
                'pb_ppm': parse_value(pb[i]),
                'cu_ppm': parse_value(cu[i]),
                'sn_ppm': parse_value(sn[i]),
                'ni_ppm': parse_value(ni[i]),
                'oil_refill_start': 0,
                'oil_topup': 0,
                'health_score_lag_1': 0.1,
                'ml_raw_score': 0.1,
                'gemini_final_score': 0.1,
                'status': 'OPTIMAL_CONDITION',
                'trend': 'STABLE',
                'recommendation': 'Maintain current operations',
                'confidence': 'historical',
                'created_at': created_at_val
            }
            categorized_records[category].append(record)
            
    return categorized_records

def process_file(txt_file, output_map):
    print(f"Processing {txt_file}")
    categorized_records = parse_text_file(txt_file)
    
    if not categorized_records:
        print("No records found!")
        return

    # output_map: {'Port': 'file_port.json', 'Stbd': 'file_stbd.json', 'Default': 'file_default.json'}
    
    for category, records in categorized_records.items():
        target_file = output_map.get(category)
        if not target_file:
            # Fallback to Default if available
            target_file = output_map.get('Default')
            
        if target_file:
            print(f"  -> Saving {len(records)} records for category '{category}' to {target_file}")
            
            # Sort and ID
            # Remove duplicates by sample_id
            unique_records = {}
            for rec in records:
                sid = rec.get('sample_id')
                if sid:
                    unique_records[sid] = rec
            records = list(unique_records.values())

            # Sort and ID
            def get_sort_key(x):
                val = x.get('total_hrs')
                if isinstance(val, (int, float)):
                    return val
                return 0
            records.sort(key=get_sort_key)
            for i, rec in enumerate(records):
                rec['id'] = i + 1
                
            with open(target_file, 'w') as f:
                json.dump(records, f, indent=4)
        else:
            print(f"  -> Warning: No output file mapped for category '{category}' with {len(records)} records")

if __name__ == "__main__":
    base_dir = "temp_text_extracts"
    seed_dir = "lib/seed-data"
    
    # Define mappings: Input File -> {Category -> Output File}
    mappings = {
        "Gajabahu_DA1.txt": {
            "Default": os.path.join(seed_dir, "seed-data-gajabahu-diesel-alternator-no1.json")
        },
        "Gajabahu_DA2.txt": {
            "Default": os.path.join(seed_dir, "seed-data-gajabahu-diesel-alternator-no2.json")
        },
        "Sagara_ME.txt": {
            "Port": os.path.join(seed_dir, "seed-data-sagara-main-engine-port.json"),
            "Stbd": os.path.join(seed_dir, "seed-data-sagara-main-engine-starboard.json")
        },
        "Sagara_GB.txt": {
            "Port": os.path.join(seed_dir, "seed-data-sagara-gearbox-port.json"),
            "Stbd": os.path.join(seed_dir, "seed-data-sagara-gearbox-starboard.json")
        },
        "Sayura_ME_Port.txt": {
            "Default": os.path.join(seed_dir, "seed-data-sayura-main-engine-port.json")
        },
        "Sayura_ME_Stbd.txt": {
            "Default": os.path.join(seed_dir, "seed-data-sayura-main-engine-starboard.json")
        },
        "Sayura_GB_Port.txt": {
            "Default": os.path.join(seed_dir, "seed-data-sayura-gearbox-port.json")
        },
        "Sayura_GB_Stbd.txt": {
            "Default": os.path.join(seed_dir, "seed-data-sayura-gearbox-starboard.json")
        }
    }
    
    for txt, output_map in mappings.items():
        txt_path = os.path.join(base_dir, txt)
        if os.path.exists(txt_path):
            process_file(txt_path, output_map)
