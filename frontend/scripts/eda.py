import pandas as pd
import os

def run_eda(input_csv, output_md):
    if not os.path.exists(input_csv):
        print(f"File {input_csv} not found.")
        return
        
    df = pd.read_csv(input_csv)
    
    with open(output_md, 'w', encoding='utf-8') as f:
        f.write('# Exploratory Data Analysis (EDA) Report\n\n')
        
        # Helper to write section
        def write_section(title, data_str):
            f.write(f'## {title}\n```text\n{data_str}\n```\n\n')
            
        if 'state' in df.columns:
            write_section('Works by State', df['state'].value_counts().to_string())
            
        if 'district' in df.columns:
            write_section('Works by District (Top 15)', df['district'].value_counts().head(15).to_string())
            
        if 'work_type' in df.columns:
            write_section('Works by Category (Top 10)', df['work_type'].value_counts().head(10).to_string())
            
        if 'total_disbursed' in df.columns:
            write_section('Expenditure Distribution', df['total_disbursed'].describe().to_string())
            
        if 'sanctioned_amount' in df.columns:
            write_section('Sanctioned Amount Distribution', df['sanctioned_amount'].describe().to_string())
            
        if 'work_status' in df.columns:
            write_section('Work Status Distribution', df['work_status'].value_counts().to_string())
            
        if 'completion_duration_days' in df.columns:
            write_section('Completion Duration (Days) Distribution', df['completion_duration_days'].describe().to_string())
            
        if 'expenditure_ratio' in df.columns:
            write_section('Expenditure Ratio Distribution', df['expenditure_ratio'].describe().to_string())

    print(f"EDA report generated at {output_md}")

def main():
    os.makedirs('docs', exist_ok=True)
    run_eda('data/processed/master_dataset_features.csv', 'docs/eda_report.md')

if __name__ == '__main__':
    main()
