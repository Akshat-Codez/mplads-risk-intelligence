import os
import requests
import json

def test_pipeline():
    print("Testing Procurement Analysis FastAPI Endpoint...")
    url = "http://localhost:8000/api/procurement/analyze"
    
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pdf_path = os.path.join(root_dir, "uploads", "sample_boq.pdf")
    
    if not os.path.exists(pdf_path):
        print(f"Error: Sample PDF not found at {pdf_path}")
        return

    payload = {
        "pdf_path": pdf_path,
        "filename": "sample_boq.pdf"
    }

    try:
        res = requests.post(url, json=payload, timeout=30)
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            data = res.json()
            print("\n=== Extracted Metadata ===")
            print(f"Tender Number: {data['tender_number']}")
            print(f"Project Name: {data['project_name']}")
            print(f"Contractor: {data['contractor_vendor']}")
            print(f"Procurement Risk Score: {data['procurement_risk_score']}")
            print(f"Procurement Risk Level: {data['procurement_risk_level']}")
            
            print("\n=== Extracted Items & Calculations ===")
            for item in data['items']:
                print(f"\nItem: {item['item_name']}")
                print(f"  Qty: {item['quantity']} {item['unit']}")
                print(f"  Quoted Price: Rs. {item['quoted_price']}")
                print(f"  Ref Price: Rs. {item['reference_price']}")
                print(f"  Deviation: {item['deviation_percentage']}%")
                print(f"  Est vs Quoted Deviation: {item['estimated_vs_quoted_deviation']}%")
                
            print("\n=== Risk Signals ===")
            for sig in data['procurement_signals']:
                print(f"- {sig.replace('₹', 'Rs.')}")
                
            print("\nTest passed successfully!")
        else:
            print(f"Error Response: {res.text}")
    except Exception as e:
        print(f"Pipeline test failed: {e}")

if __name__ == "__main__":
    test_pipeline()
