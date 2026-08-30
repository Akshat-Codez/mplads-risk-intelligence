from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import math
import os

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

def load_data():
    if not os.path.exists(DATA_FILE):
        return pd.DataFrame()
    df = pd.read_csv(DATA_FILE)
    # Convert NaNs to None for JSON compliance
    df = df.where(pd.notnull(df), None)
    return df

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
    
    # Delayed works (simplistic calculation based on feature)
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
        
    # Sort by risk score descending
    if 'prototype_risk_score' in df:
        df = df.sort_values(by='prototype_risk_score', ascending=False)
        
    records = df.head(limit).to_dict(orient="records")
    
    # Inject investigation status
    for r in records:
        wid = r['work_id']
        r['investigation_status'] = investigations.get(wid, {}).get('status', 'Unreviewed')
        
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
