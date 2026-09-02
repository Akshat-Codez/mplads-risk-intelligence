import pandas as pd
import numpy as np
import os

PROCESSED_DIR = 'data/processed'

def generate_features(df):
    df = df.copy()
    
    # Ensure dates are datetime objects (supporting both camelCase and snake_case)
    if 'sanctionDate' in df.columns and 'sanction_date' not in df.columns:
        df['sanction_date'] = df['sanctionDate']
    if 'actualCompletionDate' in df.columns and 'actual_completion_date' not in df.columns:
        df['actual_completion_date'] = df['actualCompletionDate']

    date_cols = ['recommendation_date', 'sanction_date', 'first_payment_date', 'last_payment_date', 'actual_completion_date', 'sanctionDate', 'actualCompletionDate']
    for c in date_cols:
        if c in df.columns:
            df[c] = pd.to_datetime(df[c], errors='coerce')
            
    # 1. Expenditure Ratio
    if 'total_disbursed' in df.columns and 'sanctioned_amount' in df.columns:
        df['expenditure_ratio'] = df['total_disbursed'] / df['sanctioned_amount']
        df['expenditure_ratio'] = df['expenditure_ratio'].replace([np.inf, -np.inf], np.nan)
        
    # 2. Amount Deviation
    if 'sanctioned_amount' in df.columns and 'recommended_amount' in df.columns:
        df['amount_deviation'] = df['sanctioned_amount'] - df['recommended_amount']
        
    # 3. Sanction Delay Days
    sanc_col = 'sanction_date' if 'sanction_date' in df.columns else 'sanctionDate'
    rec_col = 'recommendation_date'
    if sanc_col in df.columns and rec_col in df.columns:
        df['sanction_delay_days'] = (df[sanc_col] - df[rec_col]).dt.days
        
    # 4. Payment Duration Days
    if 'last_payment_date' in df.columns and 'first_payment_date' in df.columns:
        df['payment_duration_days'] = (df['last_payment_date'] - df['first_payment_date']).dt.days
        
    # 5. Completion Duration Days
    comp_col = 'actual_completion_date' if 'actual_completion_date' in df.columns else 'actualCompletionDate'
    if comp_col in df.columns and sanc_col in df.columns:
        df['completion_duration_days'] = (df[comp_col] - df[sanc_col]).dt.days
        
    # 6. Vendor Work Count (approx based on concatenation)
    if 'vendor_name' in df.columns:
        df['vendor_count_per_work'] = df['vendor_name'].apply(lambda x: len(str(x).split(' | ')) if pd.notna(x) else 0)
        
    return df

def main():
    in_path = os.path.join(PROCESSED_DIR, 'master_dataset.csv')
    out_path = os.path.join(PROCESSED_DIR, 'master_dataset_features.csv')
    
    if os.path.exists(in_path):
        df = pd.read_csv(in_path)
        df_feat = generate_features(df)
        df_feat.to_csv(out_path, index=False)
        print(f"Features generated and saved to {out_path}")
    else:
        print(f"Could not find {in_path}")

if __name__ == '__main__':
    main()
