from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import math
import os
import sys
import sqlite3

app = FastAPI(title="MPLADS Risk Intelligence API")

# Allow CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'processed', 'master_dataset_scored.csv')

# In-memory store for investigation status (MVP only - replace with DB later)
investigations = {}

import pandas as pd
import numpy as np

def load_data():
    if not os.path.exists(DATA_FILE):
        return pd.DataFrame()
    df = pd.read_csv(DATA_FILE)
    # Convert NaNs to None for JSON compliance safely
    df = df.replace({np.nan: None})
    return df

@app.get("/api/dataset-info")
def get_dataset_info():
    df = load_data()
    if df.empty:
        return {"error": "Data not found"}
    
    total_records = len(df)
    columns = list(df.columns)
    
    # We explicitly check for geolocation to instruct UI
    has_geo = 'latitude' in columns and 'longitude' in columns
    
    return {
        "source": "Uploaded MPLADS Dataset",
        "records": total_records,
        "available_fields": len(columns),
        "fields": columns,
        "has_geolocation": has_geo
    }

@app.get("/api/dashboard/stats")
def get_dashboard_stats():
    df = load_data()
    if df.empty:
        return {"error": "Data not found"}
        
    total_works = len(df)
    total_sanctioned = df['sanctioned_amount'].sum() if 'sanctioned_amount' in df else 0
    total_expenditure = df['total_disbursed'].sum() if 'total_disbursed' in df else 0
    
    high_risk_count = len(df[df['risk_level'] == 'HIGH']) if 'risk_level' in df else 0
    medium_risk_count = len(df[df['risk_level'] == 'MEDIUM']) if 'risk_level' in df else 0
    similar_works = len(df[df['similar_work_detected'] == True]) if 'similar_work_detected' in df else 0
    
    delayed = len(df[df['sanction_delay_days'] > 180]) if 'sanction_delay_days' in df else 0
    
    return {
        "total_works": total_works,
        "total_sanctioned": total_sanctioned,
        "total_expenditure": total_expenditure,
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "similar_works_count": similar_works,
        "delayed_works_count": delayed
    }

@app.get("/api/works")
def get_works(risk_level: str = None, limit: int = 50):
    df = load_data()
    if df.empty:
        return []
        
    if risk_level:
        df = df[df['risk_level'] == risk_level.upper()]
        
    if 'prototype_risk_score' in df:
        df = df.sort_values(by='prototype_risk_score', ascending=False)
        
    records = df.head(limit).to_dict(orient="records")
    
    for r in records:
        wid = r['work_id']
        r['investigation_status'] = investigations.get(wid, {}).get('status', 'Unreviewed')
        r['investigation_notes'] = investigations.get(wid, {}).get('notes', '')
        
        # Parse structured reasons
        try:
            if r.get('structured_reasons'):
                r['structured_reasons_parsed'] = json.loads(r['structured_reasons'])
            else:
                r['structured_reasons_parsed'] = []
        except:
            r['structured_reasons_parsed'] = []
            
        try:
            if r.get('risk_components'):
                r['risk_components_parsed'] = json.loads(r['risk_components'])
        except:
            r['risk_components_parsed'] = {}
        
    return records

@app.get("/api/works/{work_id}")
def get_work_details(work_id: str):
    df = load_data()
    if df.empty:
        raise HTTPException(status_code=404, detail="Data not found")
        
    # Since work_ids have slashes, URL routing might be tricky. 
    # FastAPI handles it if passed as query, but path requires URL encoding.
    # Alternatively, decode here.
    import urllib.parse
    decoded_id = urllib.parse.unquote(work_id)
    
    work = df[df['work_id'] == decoded_id]
    if work.empty:
        raise HTTPException(status_code=404, detail="Work ID not found")
        
    record = work.iloc[0].to_dict()
    
    # Parse JSON risk components safely
    try:
        if record.get('risk_components'):
            record['risk_components_parsed'] = json.loads(record['risk_components'])
    except:
        record['risk_components_parsed'] = {}
        
    record['investigation_info'] = investigations.get(decoded_id, {
        "status": "Unreviewed",
        "notes": ""
    })
        
    return record

@app.post("/api/works/{work_id}/investigate")
def update_investigation(work_id: str, payload: dict = Body(...)):
    import urllib.parse
    decoded_id = urllib.parse.unquote(work_id)
    
    status = payload.get('status', 'Unreviewed')
    notes = payload.get('notes', '')
    
    valid_statuses = ["Unreviewed", "Needs Verification", "Legitimate / False Positive", "Confirmed Irregularity", "Under Investigation"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    investigations[decoded_id] = {
        "status": status,
        "notes": notes
    }
    
    return {"message": "Investigation updated successfully", "data": investigations[decoded_id]}

from procurement_engine import extract_text_from_pdf, extract_structured_data

@app.post("/api/procurement/analyze")
def analyze_procurement(payload: dict = Body(...)):
    pdf_path = payload.get("pdf_path")
    filename = payload.get("filename")
    
    if not pdf_path or not os.path.exists(pdf_path):
        raise HTTPException(status_code=400, detail="Invalid or missing pdf_path")

    # Step 1: Extract Text
    text = extract_text_from_pdf(pdf_path)
    extraction_method = "DIGITAL"
    if not text:
        extraction_method = "OCR (Simulated - Scanned PDF)"
        text = "[Scanned document simulated text]"

    # Step 2: Structured LLM Extraction (or Mock Fallback)
    data = extract_structured_data(text, filename)
    if not data:
        raise HTTPException(status_code=500, detail="Failed to extract structured data from PDF")

    # Step 3: Reference Price Benchmarking
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend', 'prisma', 'dev.db')
    benchmarks = []
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT item, referencePrice, source, isDemo FROM ReferencePrice")
        rows = cursor.fetchall()
        for r in rows:
            benchmarks.append({
                "item": r[0],
                "reference_price": r[1],
                "source": r[2],
                "is_demo": bool(r[3])
            })
        conn.close()
    except Exception as e:
        print(f"Error querying SQLite reference prices: {e}")

    # Helper function for matching
    def find_reference_price(item_name):
        item_lower = item_name.lower()
        # Look for partial matches (e.g. "cement" in "cement (opc 43 grade)")
        for b in benchmarks:
            b_lower = b["item"].lower()
            if b_lower in item_lower or item_lower in b_lower:
                return b
        return None

    # Step 4: Numerical Calculations and Signal Generation
    processed_items = []
    signals = []
    high_deviation_count = 0
    total_items = 0

    items_list = data.get("items", [])
    for it in items_list:
        total_items += 1
        item_name = it.get("item_name", "Unknown Item")
        desc = it.get("description", "")
        qty = it.get("quantity", 1)
        unit = it.get("unit", "")
        est_price = it.get("estimated_price")
        quoted_price = it.get("quoted_price")
        awarded_price = it.get("awarded_price")

        ref_match = find_reference_price(item_name)
        ref_price = None
        ref_source = "Demo/Synthetic reference dataset"
        is_demo = True
        deviation = None

        if ref_match:
            ref_price = ref_match["reference_price"]
            ref_source = ref_match["source"]
            is_demo = ref_match["is_demo"]
            
            # Backend numerical calculation
            if quoted_price is not None:
                deviation = round(((quoted_price - ref_price) / ref_price) * 100, 2)
                
                # Check deviation threshold
                if deviation > 20:
                    high_deviation_count += 1
                    signals.append(f"Potential procurement anomaly: {item_name} quoted price is {deviation}% above benchmark (₹{quoted_price}/{unit} vs benchmark ₹{ref_price}/{unit})")
        else:
            signals.append(f"Insufficient benchmark data: No verified reference price available for {item_name}")

        # Est vs Quoted
        est_vs_quoted = None
        if est_price and quoted_price:
            est_vs_quoted = round(((quoted_price - est_price) / est_price) * 100, 2)
            if est_vs_quoted > 25:
                signals.append(f"Unusual price deviation: {item_name} quote is {est_vs_quoted}% above initial estimate (₹{quoted_price} vs ₹{est_price})")

        # Quoted vs Awarded
        quoted_vs_awarded = None
        if quoted_price and awarded_price:
            quoted_vs_awarded = round(((awarded_price - quoted_price) / quoted_price) * 100, 2)
            if quoted_vs_awarded != 0:
                signals.append(f"Unusual quoted-to-awarded difference: Bid quote of ₹{quoted_price} does not match award price of ₹{awarded_price} for {item_name}")

        processed_items.append({
            "item_name": item_name,
            "description": desc,
            "quantity": qty,
            "unit": unit,
            "estimated_price": est_price,
            "quoted_price": quoted_price,
            "awarded_price": awarded_price,
            "reference_price": ref_price,
            "reference_source": ref_source,
            "is_demo_benchmark": is_demo,
            "deviation_percentage": deviation,
            "estimated_vs_quoted_deviation": est_vs_quoted,
            "quoted_vs_awarded_deviation": quoted_vs_awarded
        })

    # Step 5: Risk Scoring
    score = 0
    # Add weight for high deviations
    if total_items > 0:
        score += min((high_deviation_count / total_items) * 75, 75)
    
    # Check document completeness
    missing_critical = False
    if not data.get("tender_number"):
        missing_critical = True
        signals.append("Missing critical procurement information: Tender number could not be extracted")
    if not data.get("contractor_vendor"):
        missing_critical = True
        signals.append("Missing critical procurement information: Contractor/vendor name could not be extracted")
        
    if missing_critical:
        score += 25

    score = min(int(round(score)), 100)
    
    if score >= 60:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"
        
    if high_deviation_count > 0:
        level = "REQUIRES REVIEW" # override to requires review if any high deviations exist

    return {
        "tender_number": data.get("tender_number"),
        "project_name": data.get("project_name"),
        "issuing_authority": data.get("issuing_authority"),
        "contractor_vendor": data.get("contractor_vendor"),
        "tender_date": data.get("tender_date"),
        "total_estimated_value": data.get("total_estimated_value"),
        "total_quoted_value": data.get("total_quoted_value"),
        "items": processed_items,
        "procurement_risk_score": score,
        "procurement_risk_level": level,
        "procurement_signals": signals,
        "extraction_method": extraction_method
    }

import subprocess

@app.post("/api/run_analysis")
def run_analysis():
    # Run the feature engineering and risk pipeline scripts
    try:
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        script_path = os.path.join(root_dir, 'scripts', 'run_risk_pipeline.py')
        subprocess.run([sys.executable, script_path], cwd=root_dir, check=True)
        return {"message": "Analysis complete"}
    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail="Analysis failed to run")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
