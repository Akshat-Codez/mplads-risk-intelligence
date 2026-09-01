import os
import glob
import pandas as pd
import numpy as np

RAW_DIR = 'data/raw'
PROCESSED_DIR = 'data/processed'

def clean_currency(val):
    if pd.isna(val):
        return np.nan
    if isinstance(val, (int, float)):
        return val
    # Remove commas and weird characters
    val = str(val).replace(',', '').strip()
    try:
        return float(val)
    except ValueError:
        return np.nan

def clean_date(val):
    if pd.isna(val) or str(val).strip() == '':
        return pd.NaT
    try:
        return pd.to_datetime(val, errors='coerce')
    except:
        return pd.NaT

def extract_work_id(val):
    if pd.isna(val):
        return np.nan
    val_str = str(val).strip()
    
    # Example format: WS/MP053/2023-2024/43938-Construction of roads...
    # We want to split at the hyphen that comes AFTER the last slash
    if '/' in val_str:
        parts = val_str.rsplit('/', 1)
        if len(parts) == 2 and '-' in parts[1]:
            # Split the part after the last slash by the first hyphen
            subparts = parts[1].split('-', 1)
            return f"{parts[0]}/{subparts[0]}".strip()
    return val_str.split('-', 1)[0].strip()

def extract_district(val):
    if pd.isna(val):
        return np.nan
    val_str = str(val)
    if '(' in val_str:
        return val_str.split('(')[0].strip()
    return val_str.strip()

def process_mp_folder(mp_path):
    print(f"Processing {mp_path}...")
    
    # 1. Recommended
    rec_files = glob.glob(os.path.join(mp_path, '*Recommend*.csv'))
    df_rec = pd.DataFrame()
    if rec_files:
        df_rec = pd.read_csv(rec_files[0], encoding='utf-8', encoding_errors='replace')
        
        # Rename columns safely matching on keywords
        col_map = {}
        for c in df_rec.columns:
            cl = c.lower()
            if 'work description' in cl: col_map[c] = 'work_description'
            elif 'recommended amount' in cl: col_map[c] = 'recommended_amount'
            elif 'sanction date' in cl: col_map[c] = 'sanction_date'
            elif 'recommended date' in cl: col_map[c] = 'recommendation_date'
            elif 'work category' in cl: col_map[c] = 'work_type'
            elif cl == 'work': col_map[c] = 'work_id'
            elif 'elected' in cl or 'constituency' in cl: col_map[c] = 'constituency'
            elif 'parliament' in cl: col_map[c] = 'mp_name'
            elif 'state' in cl: col_map[c] = 'state'
            elif 'ida' in cl: col_map[c] = 'district'
            
        df_rec = df_rec.rename(columns=col_map)
        if 'work_id' in df_rec.columns:
            df_rec['work_id'] = df_rec['work_id'].apply(extract_work_id)
        if 'district' in df_rec.columns:
            df_rec['district'] = df_rec['district'].apply(extract_district)
        if 'recommended_amount' in df_rec.columns:
            df_rec['recommended_amount'] = df_rec['recommended_amount'].apply(clean_currency)
        if 'recommendation_date' in df_rec.columns:
            df_rec['recommendation_date'] = df_rec['recommendation_date'].apply(clean_date)
        if 'sanction_date' in df_rec.columns:
            df_rec['sanction_date'] = df_rec['sanction_date'].apply(clean_date)

    # 2. Sanctioned
    sanc_files = glob.glob(os.path.join(mp_path, '*Sanction*.csv'))
    df_sanc = pd.DataFrame()
    if sanc_files:
        df_sanc = pd.read_csv(sanc_files[0], encoding='utf-8', encoding_errors='replace')
        col_map = {}
        for c in df_sanc.columns:
            cl = c.lower()
            if 'sanction amount' in cl: col_map[c] = 'sanctioned_amount'
            elif 'work status' in cl: col_map[c] = 'work_status'
            elif cl == 'work': col_map[c] = 'work_id'
            
        df_sanc = df_sanc.rename(columns=col_map)
        if 'work_id' in df_sanc.columns:
            df_sanc['work_id'] = df_sanc['work_id'].apply(extract_work_id)
        if 'sanctioned_amount' in df_sanc.columns:
            df_sanc['sanctioned_amount'] = df_sanc['sanctioned_amount'].apply(clean_currency)
            
        # Keep only relevant columns from sanctioned to merge
        keep_cols = ['work_id', 'sanctioned_amount', 'work_status']
        df_sanc = df_sanc[[c for c in keep_cols if c in df_sanc.columns]]

    # 3. Expenditure
    exp_files = glob.glob(os.path.join(mp_path, '*Expenditure*.csv'))
    df_exp_agg = pd.DataFrame()
    if exp_files:
        df_exp = pd.read_csv(exp_files[0], encoding='utf-8', encoding_errors='replace')
        col_map = {}
        for c in df_exp.columns:
            cl = c.lower()
            if 'work id' in cl: col_map[c] = 'work_id'
            elif 'expenditure date' in cl: col_map[c] = 'expenditure_date'
            elif 'fund disbursed' in cl: col_map[c] = 'payment_amount'
            elif 'vendor' in cl: col_map[c] = 'vendor_name'
            elif 'payment status' in cl: col_map[c] = 'payment_status'
            
        df_exp = df_exp.rename(columns=col_map)
        
        if 'work_id' in df_exp.columns and 'payment_amount' in df_exp.columns:
            df_exp['payment_amount'] = df_exp['payment_amount'].apply(clean_currency)
            df_exp['expenditure_date'] = df_exp['expenditure_date'].apply(clean_date)
            
            # Aggregate per work_id
            agg_funcs = {
                'payment_amount': ['count', 'sum', 'mean', 'max'],
                'expenditure_date': ['min', 'max']
            }
            if 'vendor_name' in df_exp.columns:
                agg_funcs['vendor_name'] = lambda x: ' | '.join(set(x.dropna().astype(str)))
                
            grouped = df_exp.groupby('work_id').agg(agg_funcs).reset_index()
            
            # Flatten columns
            grouped.columns = ['_'.join(col).strip() if col[1] else col[0] for col in grouped.columns.values]
            
            df_exp_agg = grouped.rename(columns={
                'work_id_': 'work_id',
                'payment_amount_count': 'payment_count',
                'payment_amount_sum': 'total_disbursed',
                'payment_amount_mean': 'average_payment',
                'payment_amount_max': 'maximum_payment',
                'expenditure_date_min': 'first_payment_date',
                'expenditure_date_max': 'last_payment_date',
                'vendor_name_<lambda>': 'vendor_name'
            })

    # 4. Completed
    comp_files = glob.glob(os.path.join(mp_path, '*Completed*.csv'))
    df_comp = pd.DataFrame()
    if comp_files:
        df_comp = pd.read_csv(comp_files[0], encoding='utf-8', encoding_errors='replace')
        col_map = {}
        for c in df_comp.columns:
            cl = c.lower()
            if cl == 'work': col_map[c] = 'work_id'
            elif 'image' in cl: col_map[c] = 'image_available'
            elif 'completion date' in cl: col_map[c] = 'actual_completion_date'
            elif 'amount disbursed' in cl: col_map[c] = 'final_completed_amount'
            
        df_comp = df_comp.rename(columns=col_map)
        if 'work_id' in df_comp.columns:
            df_comp['work_id'] = df_comp['work_id'].apply(extract_work_id)
        if 'actual_completion_date' in df_comp.columns:
            df_comp['actual_completion_date'] = df_comp['actual_completion_date'].apply(clean_date)
        if 'final_completed_amount' in df_comp.columns:
            df_comp['final_completed_amount'] = df_comp['final_completed_amount'].apply(clean_currency)
            
        keep_cols = ['work_id', 'image_available', 'actual_completion_date', 'final_completed_amount']
        df_comp = df_comp[[c for c in keep_cols if c in df_comp.columns]]
        
        if 'image_available' in df_comp.columns:
            df_comp['image_available'] = df_comp['image_available'].apply(lambda x: True if pd.notna(x) and 'image' in str(x).lower() else False)

    # 5. Merge all
    if df_rec.empty:
        return pd.DataFrame()
        
    master = df_rec.copy()
    
    if not df_sanc.empty:
        master = pd.merge(master, df_sanc, on='work_id', how='left')
        
    if not df_exp_agg.empty:
        master = pd.merge(master, df_exp_agg, on='work_id', how='left')
        
    if not df_comp.empty:
        master = pd.merge(master, df_comp, on='work_id', how='left')
        
    # Drop Sr. No. columns if they snuck through
    cols_to_drop = [c for c in master.columns if 'Sr. No.' in c or 'Unnamed' in c]
    master = master.drop(columns=cols_to_drop)

    # Convert dates back to string for clean CSV output
    date_cols = master.select_dtypes(include=['datetime64[ns]']).columns
    for c in date_cols:
        master[c] = master[c].dt.strftime('%Y-%m-%d')
        
    return master


def main():
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    
    all_masters = []
    
    # Get all MP folders
    for mp_folder in os.listdir(RAW_DIR):
        mp_path = os.path.join(RAW_DIR, mp_folder)
        if os.path.isdir(mp_path):
            mp_master = process_mp_folder(mp_path)
            if not mp_master.empty:
                all_masters.append(mp_master)
                
    if all_masters:
        final_master = pd.concat(all_masters, ignore_index=True)
        
        # Deduplicate on work_id just in case, keeping the first occurrence
        if 'work_id' in final_master.columns:
            final_master = final_master.drop_duplicates(subset=['work_id'])
            
        out_path = os.path.join(PROCESSED_DIR, 'master_dataset.csv')
        final_master.to_csv(out_path, index=False)
        print(f"Master dataset created at {out_path} with {len(final_master)} rows.")
    else:
        print("No data processed.")

if __name__ == '__main__':
    main()
