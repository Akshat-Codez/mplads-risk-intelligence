import pandas as pd
import os
import sys

# Add root directory to path to import ml
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.risk_engine import RiskEngine

def main():
    input_file = 'data/processed/master_dataset_features.csv'
    output_file = 'data/processed/master_dataset_scored.csv'
    
    print(f"Loading data from {input_file}...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("Error: Feature dataset not found. Please run feature_engineering.py first.")
        return
        
    engine = RiskEngine(df)
    df_scored = engine.execute_pipeline()
    
    # Save the output
    df_scored.to_csv(output_file, index=False)
    print(f"\nPipeline complete! Scored dataset saved to {output_file}")
    
    # Print a quick summary of the risk distribution
    print("\n--- Prototype Risk Score Distribution ---")
    print(df_scored['risk_level'].value_counts().to_string())
    
    high_risk = df_scored[df_scored['risk_level'] == 'HIGH']
    if not high_risk.empty:
        print("\n--- Example HIGH Risk Explanations ---")
        for i, row in high_risk.head(3).iterrows():
            print(f"\nWork ID: {row['work_id']}")
            print(f"Score: {row['prototype_risk_score']}")
            print(f"Explanation: {row['risk_evidence_explanation']}")

if __name__ == '__main__':
    main()
