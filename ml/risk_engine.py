import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

class RiskEngine:
    def __init__(self, df):
        self.df = df.copy()

    def run_peer_benchmarking(self):
        """Phase 11: Peer Benchmarking"""
        print("Running Peer Benchmarking...")
        # Group by State -> District -> Work Type
        # Calculate peer median for total_disbursed
        if 'total_disbursed' in self.df.columns and 'district' in self.df.columns and 'work_type' in self.df.columns:
            group_cols = ['state', 'district', 'work_type']
            # Fill missing with 'UNKNOWN' so grouping doesn't drop rows
            for c in group_cols:
                if c in self.df.columns:
                    self.df[c] = self.df[c].fillna('UNKNOWN')
            
            peer_medians = self.df.groupby(group_cols)['total_disbursed'].transform('median')
            self.df['peer_median_amount'] = peer_medians
            
            # Avoid division by zero
            safe_median = np.where(peer_medians == 0, np.nan, peer_medians)
            self.df['peer_deviation'] = (self.df['total_disbursed'] - self.df['peer_median_amount']) / safe_median
            self.df['peer_deviation'] = self.df['peer_deviation'].fillna(0)
        else:
            self.df['peer_median_amount'] = np.nan
            self.df['peer_deviation'] = 0.0
            
        return self.df

    def run_anomaly_detection(self):
        """Phase 9: Isolation Forest"""
        print("Running Isolation Forest Anomaly Detection...")
        # Select numeric features for ML
        ml_features = [
            'sanctioned_amount', 'recommended_amount', 'total_disbursed',
            'expenditure_ratio', 'payment_count', 'average_payment',
            'payment_duration_days', 'completion_duration_days'
        ]
        
        # Keep only features that exist
        available_features = [f for f in ml_features if f in self.df.columns]
        
        # We need to impute missing values for IF to work
        # We will create a temporary dataframe for modeling
        X = self.df[available_features].copy()
        for col in available_features:
            X[col] = X[col].fillna(X[col].median())
            
        if not X.empty:
            # Train Isolation Forest
            # contamination is the expected proportion of outliers
            model = IsolationForest(n_estimators=100, contamination=0.05, random_state=42)
            preds = model.fit_predict(X)
            
            # -1 is anomaly, 1 is normal
            self.df['if_anomaly_signal'] = preds == -1
        else:
            self.df['if_anomaly_signal'] = False
            
        return self.df

    def run_similarity_detection(self):
        """Phase 12: Similar Work Detection"""
        print("Running Similar Work Detection (NLP)...")
        self.df['similar_work_detected'] = False
        self.df['similar_work_id'] = None
        
        if 'work_description' not in self.df.columns or 'district' not in self.df.columns:
            return self.df
            
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        
        # We process similarity within each district to make it computationally efficient and contextually relevant
        for district in self.df['district'].unique():
            idx = self.df[self.df['district'] == district].index
            district_df = self.df.loc[idx]
            
            if len(district_df) < 2:
                continue
                
            # Fill NaNs
            descriptions = district_df['work_description'].fillna('').astype(str).tolist()
            if not any(descriptions):
                continue
                
            try:
                tfidf_matrix = vectorizer.fit_transform(descriptions)
                sim_matrix = cosine_similarity(tfidf_matrix)
                
                # Zero out the diagonal (self-similarity)
                np.fill_diagonal(sim_matrix, 0)
                
                # Find max similarity for each work
                max_sim = sim_matrix.max(axis=1)
                best_match_idx = sim_matrix.argmax(axis=1)
                
                for i, row_idx in enumerate(idx):
                    if max_sim[i] > 0.85: # Threshold for high similarity
                        self.df.at[row_idx, 'similar_work_detected'] = True
                        matched_work_id = district_df.iloc[best_match_idx[i]]['work_id']
                        self.df.at[row_idx, 'similar_work_id'] = matched_work_id
            except ValueError:
                # E.g. empty vocabulary
                pass
                
        return self.df

    def calculate_risk_score_and_explain(self):
        """Phases 10, 13, 14: Risk Engine and Explainability"""
        print("Calculating Risk Scores & Generating Explanations...")
        
        risk_scores = []
        risk_levels = []
        explanations_json = []
        risk_components = []

        for _, row in self.df.iterrows():
            score = 0
            reasons = []
            comps = {
                "financial": 0,
                "ml": 0,
                "payment": 0,
                "delay": 0,
                "similarity": 0
            }
            
            # --- Financial Signal (Max 40) ---
            fin_score = 0
            
            sanc_amt = row.get('sanctioned_amount', 0)
            exp_amt = row.get('total_disbursed', 0)
            
            if pd.notna(row.get('expenditure_ratio')) and row['expenditure_ratio'] > 1.0:
                fin_score += 15
                ratio_pct = ((row['expenditure_ratio']-1)*100)
                reasons.append({
                    "type": "Financial Anomaly",
                    "evidence": f"Expenditure = ₹{exp_amt:,.2f} | Sanctioned = ₹{sanc_amt:,.2f}",
                    "calculation": f"(Expenditure - Sanctioned) / Sanctioned * 100 = {ratio_pct:.1f}%",
                    "explanation": f"Expenditure is {ratio_pct:.1f}% above the sanctioned amount.",
                    "score": 15
                })
            
            peer_dev = row.get('peer_deviation', 0)
            peer_med = row.get('peer_median_amount', 0)
            if pd.notna(peer_dev) and peer_dev > 0.2:
                points = 25 if peer_dev > 0.5 else 10
                fin_score += points
                reasons.append({
                    "type": "Peer Deviation",
                    "evidence": f"Expenditure = ₹{exp_amt:,.2f} | Peer Median = ₹{peer_med:,.2f}",
                    "calculation": f"(Expenditure - Peer Median) / Peer Median = {peer_dev*100:.1f}%",
                    "explanation": f"The expenditure is {peer_dev*100:.1f}% higher than comparable works in the available dataset.",
                    "score": points
                })
            
            comps['financial'] = min(fin_score, 40)
            score += comps['financial']
            
            # --- ML Anomaly Signal (Max 25) ---
            if row.get('if_anomaly_signal', False):
                comps['ml'] = 25
                score += comps['ml']
                reasons.append({
                    "type": "ML Anomaly",
                    "evidence": "Isolation Forest Model Prediction = -1 (Anomaly)",
                    "calculation": "Algorithm evaluates distance of 8 numerical features from normal clusters.",
                    "explanation": "The Isolation Forest model classified this work as an unusual observation based on its numerical features.",
                    "score": 25
                })
                
            # --- Payment Signal (Max 15) ---
            pay_score = 0
            pay_count = row.get('payment_count', 0)
            pay_dur = row.get('payment_duration_days', 0)
            
            if pd.notna(pay_count) and pay_count >= 4:
                pay_score += 10
                reasons.append({
                    "type": "Payment Anomaly",
                    "evidence": f"Total Installments = {int(pay_count)}",
                    "calculation": f"{int(pay_count)} >= 4 installments threshold",
                    "explanation": f"Unusual payment pattern: {int(pay_count)} separate disbursements detected.",
                    "score": 10
                })
            if pd.notna(pay_dur) and pay_count >= 2 and pay_dur < 7:
                pay_score += 5
                reasons.append({
                    "type": "Rapid Disbursements",
                    "evidence": f"Duration between first and last payment = {int(pay_dur)} days",
                    "calculation": f"{int(pay_dur)} < 7 days threshold",
                    "explanation": f"Multiple disbursements executed within a very short timeframe ({int(pay_dur)} days).",
                    "score": 5
                })
            
            comps['payment'] = min(pay_score, 15)
            score += comps['payment']
            
            # --- Delay Signal (Max 10) ---
            delay_score = 0
            if pd.notna(row.get('sanction_delay_days')) and row['sanction_delay_days'] > 180:
                delay_score += 5
                reasons.append({
                    "type": "Sanctioning Delay",
                    "evidence": f"Recommendation to Sanction = {int(row['sanction_delay_days'])} days",
                    "calculation": f"{int(row['sanction_delay_days'])} > 180 days",
                    "explanation": f"Long delay ({int(row['sanction_delay_days'])} days) between recommendation and sanctioning.",
                    "score": 5
                })
            if pd.notna(row.get('completion_duration_days')) and row['completion_duration_days'] > 365:
                delay_score += 5
                reasons.append({
                    "type": "Execution Delay",
                    "evidence": f"Sanction to Completion = {int(row['completion_duration_days'])} days",
                    "calculation": f"{int(row['completion_duration_days'])} > 365 days",
                    "explanation": f"Execution took longer than 1 year ({int(row['completion_duration_days'])} days).",
                    "score": 5
                })
                
            comps['delay'] = min(delay_score, 10)
            score += comps['delay']
            
            # --- Similarity Signal (Max 10) ---
            if row.get('similar_work_detected', False):
                comps['similarity'] = 10
                score += comps['similarity']
                reasons.append({
                    "type": "Similar Work Detected",
                    "evidence": f"Matched Work ID = {row.get('similar_work_id')}",
                    "calculation": "TF-IDF Cosine Similarity > 0.85 in same district",
                    "explanation": "Potentially similar work detected based on NLP description analysis.",
                    "score": 10
                })
                
            # --- Final Assembly ---
            score = min(score, 100)
            
            if score >= 60:
                level = "HIGH"
            elif score >= 30:
                level = "MEDIUM"
            else:
                level = "LOW"
                
            risk_scores.append(score)
            risk_levels.append(level)
            risk_components.append(json.dumps(comps))
            
            if not reasons:
                explanations_json.append("[]")
                self.df.at[row.name, 'risk_evidence_explanation'] = "No unusual patterns detected."
            else:
                explanations_json.append(json.dumps(reasons))
                self.df.at[row.name, 'risk_evidence_explanation'] = " | ".join([r["type"] for r in reasons])
            
        self.df['prototype_risk_score'] = risk_scores
        self.df['risk_level'] = risk_levels
        self.df['risk_components'] = risk_components
        self.df['structured_reasons'] = explanations_json
        
        return self.df
        
    def execute_pipeline(self):
        self.run_peer_benchmarking()
        self.run_anomaly_detection()
        self.run_similarity_detection()
        self.calculate_risk_score_and_explain()
        return self.df
