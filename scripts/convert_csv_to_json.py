import json
import pandas as pd
import numpy as np

STATE_COORDS = {
    'Andhra Pradesh': (15.9129, 79.7400),
    'Assam': (26.2006, 92.9376),
    'Bihar': (25.0961, 85.3131),
    'Chandigarh': (30.7333, 76.7794),
    'Chhattisgarh': (21.2787, 81.8661),
    'Delhi': (28.7041, 77.1025),
    'Goa': (15.2993, 74.1240),
    'Gujarat': (22.2587, 71.1924),
    'Haryana': (29.0588, 76.0856),
    'Himachal Pradesh': (31.1048, 77.1734),
    'Jammu and Kashmir': (33.7782, 76.5762),
    'Jharkhand': (23.6102, 85.2799),
    'Karnataka': (15.3173, 75.7139),
    'Kerala': (10.8505, 76.2711),
    'Madhya Pradesh': (22.9734, 78.6569),
    'Maharashtra': (19.7515, 75.7139),
    'Manipur': (24.6637, 93.9063),
    'Nagaland': (26.1584, 94.5624),
    'Odisha': (20.9517, 85.0985),
    'Puducherry': (11.9416, 79.8083),
    'Punjab': (31.1471, 75.3412),
    'Rajasthan': (27.0238, 74.2179),
    'Sikkim': (27.5330, 88.5122),
    'Tamil Nadu': (11.1271, 78.6569),
    'Telangana': (18.1124, 79.0193),
    'Tripura': (23.9408, 91.9882),
    'Uttar Pradesh': (26.8467, 80.9462),
    'Uttarakhand': (30.0668, 79.0193),
    'West Bengal': (22.9868, 87.8550)
}

def sanitize(val, default=''):
    if pd.isna(val) or val is None or str(val).strip().lower() in ['nan', 'none', 'null']:
        return default
    return str(val).strip()

def sanitize_num(val, default=0.0):
    if pd.isna(val) or val is None:
        return default
    try:
        return float(val)
    except:
        return default

def main():
    csv_path = 'data/processed/master_dataset_scored.csv'
    json_path = 'frontend/src/data/realDataset.json'
    
    print(f"Reading {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"Total rows in CSV: {len(df)}")
    
    records = []
    for idx, row in df.iterrows():
        work_id = sanitize(row.get('work_id'), f"PROJ-{idx}")
        state = sanitize(row.get('state'), 'Unknown')
        district = sanitize(row.get('district'), 'UNKNOWN')
        
        base_lat, base_lng = STATE_COORDS.get(state, (20.5937, 78.9629))
        jitter_lat = round(base_lat + (hash(work_id) % 1000 - 500) * 0.001, 4)
        jitter_lng = round(base_lng + (hash(work_id[::-1]) % 1000 - 500) * 0.001, 4)
        
        anomalies_raw = row.get('structured_reasons', '[]')
        anomalies = []
        if isinstance(anomalies_raw, str) and anomalies_raw.strip().startswith('['):
            try:
                anomalies = json.loads(anomalies_raw)
            except:
                anomalies = []
                
        rec_amt = sanitize_num(row.get('recommended_amount'))
        sanc_amt = sanitize_num(row.get('sanctioned_amount'), rec_amt)
        act_exp = sanitize_num(row.get('total_disbursed'), sanc_amt)
        peer_med = sanitize_num(row.get('peer_median_amount'), sanc_amt)
        
        item = {
            'id': work_id,
            'projectId': work_id,
            'workTitle': sanitize(row.get('work_description'), 'Work Recommendation'),
            'category': sanitize(row.get('work_type'), 'Normal/Others'),
            'state': state,
            'district': district,
            'constituency': sanitize(row.get('constituency'), 'Elected MP'),
            'mpName': sanitize(row.get('mp_name'), 'MP Member'),
            'implementingAgency': f"{district} IDA",
            'vendorName': sanitize(row.get('vendor_name'), 'N/A'),
            'recommendedAmount': rec_amt,
            'sanctionedAmount': sanc_amt,
            'actualExpenditure': act_exp,
            'peerMedianAmount': peer_med,
            'recommendationDate': sanitize(row.get('recommendation_date'), '2024-01-01'),
            'sanctionDate': sanitize(row.get('sanction_date'), '2024-02-01'),
            'targetCompletionDate': sanitize(row.get('actual_completion_date'), '2025-12-31'),
            'status': sanitize(row.get('work_status'), 'In Progress'),
            'riskScore': sanitize_num(row.get('prototype_risk_score'), 0.0),
            'riskLevel': sanitize(row.get('risk_level'), 'LOW'),
            'regLatitude': jitter_lat,
            'regLongitude': jitter_lng,
            'anomalies': anomalies
        }
        records.append(item)
        
    print(f"Writing {len(records)} items to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(records, f, indent=2)
    print("Done!")

if __name__ == '__main__':
    main()
