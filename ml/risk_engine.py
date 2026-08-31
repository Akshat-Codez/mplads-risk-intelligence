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
            self.df['if_decision_score'] = model.decision_function(X)
        else:
            self.df['if_anomaly_signal'] = False
            self.df['if_decision_score'] = 0.0
            
        return self.df

    def run_similarity_detection(self):
        """Phase 12: Similar Work Detection"""
        print("Running Similar Work Detection (NLP)...")
        self.df['similar_work_detected'] = False
        self.df['similar_work_id'] = None
        self.df['similarity_score_val'] = 0.0
        
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
                    self.df.at[row_idx, 'similarity_score_val'] = float(max_sim[i])
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
        
        # Calculate decision score thresholds for continuous ML mapping
        if 'if_decision_score' in self.df.columns:
            decision_scores = self.df['if_decision_score'].fillna(0.0).values
            min_dec = float(decision_scores.min())
            max_dec = float(decision_scores.max())
            # T is 5th percentile (separating outliers)
            T = float(np.percentile(decision_scores, 5))
        else:
            min_dec, max_dec, T = 0.0, 0.0, 0.0

        risk_scores = []
        risk_levels = []
        explanations_json = []
        risk_components = []
        ai_summaries = []

        for idx_val, row in self.df.iterrows():
            reasons = []
            comps = {
                "financial": 0.0,
                "ml": 0.0,
                "payment": 0.0,
                "delay": 0.0,
                "similarity": 0.0
            }
            
            # --- Financial Signal (Max 40) ---
            fin_ratio_score = 0.0
            sanc_amt = row.get('sanctioned_amount', 0)
            exp_amt = row.get('total_disbursed', 0)
            exp_ratio = row.get('expenditure_ratio', 0.0)
            
            if pd.notna(exp_ratio) and exp_ratio > 1.0:
                ratio_dev = exp_ratio - 1.0
                fin_ratio_score = min(15.0, (ratio_dev / 0.5) * 15.0)
                ratio_pct = ratio_dev * 100
                reasons.append({
                    "type": "Financial Anomaly",
                    "evidence": f"Expenditure = Rs. {exp_amt:,.2f} | Sanctioned = Rs. {sanc_amt:,.2f}",
                    "calculation": f"(Expenditure - Sanctioned) / Sanctioned * 100 = {ratio_pct:.1f}%",
                    "explanation": f"Expenditure is {ratio_pct:.1f}% above the sanctioned amount.",
                    "score": round(fin_ratio_score, 1)
                })
            
            peer_dev = row.get('peer_deviation', 0.0)
            peer_med = row.get('peer_median_amount', 0.0)
            if pd.notna(peer_dev) and peer_dev > 0.2:
                fin_peer_score = min(25.0, ((peer_dev - 0.2) / 0.3) * 15.0 + 10.0 if peer_dev < 0.5 else 25.0)
                reasons.append({
                    "type": "Peer Deviation",
                    "evidence": f"Expenditure = Rs. {exp_amt:,.2f} | Peer Median = Rs. {peer_med:,.2f}",
                    "calculation": f"(Expenditure - Peer Median) / Peer Median = {peer_dev*100:.1f}%",
                    "explanation": f"The expenditure is {peer_dev*100:.1f}% higher than comparable works in the available dataset.",
                    "score": round(fin_peer_score, 1)
                })
            else:
                fin_peer_score = 0.0
            
            comps['financial'] = round(min(fin_ratio_score + fin_peer_score, 40.0), 1)
            
            # --- ML Anomaly Signal (Max 25) ---
            # FIX: Only confirmed anomalies (decision_score < 0, below IF boundary) get ML points.
            # Normal projects (decision_score >= 0) get 0 — the old bug gave them up to 12 pts.
            # Anomaly score varies continuously 20–25 based on depth below boundary,
            # ensuring continuous variation while preserving HIGH risk classification.
            ml_score_val = 0.0
            score_val = 0.0
            if 'if_decision_score' in self.df.columns:
                score_val = float(row.get('if_decision_score', 0.0))
                if score_val < 0:  # Confirmed anomaly: decision boundary is at 0
                    # Depth: 0 (boundary) → 1 (most anomalous at min_dec)
                    depth = min(1.0, abs(score_val) / max(abs(min_dec), 1e-6))
                    # Scale 20–25: mild anomaly at boundary gets 20, extreme gets 25
                    ml_score_val = 20.0 + (5.0 * depth)
                # else: normal project → ml_score_val stays 0.0
            
            ml_score_val = min(max(0.0, ml_score_val), 25.0)
            comps['ml'] = round(ml_score_val, 1)
            
            if ml_score_val >= 1.0:
                reasons.append({
                    "type": "ML Anomaly",
                    "evidence": f"Decision score = {score_val:.4f} (boundary = 0.0000)",
                    "calculation": "Isolation Forest: anomaly depth below decision boundary mapped to [20, 25].",
                    "explanation": f"The Isolation Forest model flagged this as an unusual observation (anomaly score {ml_score_val:.1f}/25).",
                    "score": round(ml_score_val, 1)
                })
                
            # --- Payment Signal (Max 15) ---
            # FIX: Restore threshold to >= 4 payments (was incorrectly lowered to >= 2).
            # 2-payment disbursements are routine for large projects; flagging them inflates scores.
            pay_count_score = 0.0
            pay_dur_score = 0.0
            pay_count = row.get('payment_count', 0)
            pay_dur = row.get('payment_duration_days', 0)
            
            if pd.notna(pay_count) and pay_count >= 4:
                # Continuous: 4 payments → ~6.7 pts; 6 payments → 10 pts; caps at 10
                pay_count_score = min(10.0, (pay_count / 6.0) * 10.0)
                reasons.append({
                    "type": "Payment Anomaly",
                    "evidence": f"Total Installments = {int(pay_count)}",
                    "calculation": f"(pay_count / 6.0) * 10 = {pay_count_score:.1f} pts (capped at 10)",
                    "explanation": f"Unusual payment pattern: {int(pay_count)} separate disbursements detected.",
                    "score": round(pay_count_score, 1)
                })
            if pd.notna(pay_dur) and pay_count >= 2 and pay_dur < 15:
                pay_dur_score = 5.0 * (15.0 - pay_dur) / 15.0
                reasons.append({
                    "type": "Rapid Disbursements",
                    "evidence": f"Duration = {int(pay_dur)} days between first and last payment",
                    "calculation": f"5.0 * (15 - {int(pay_dur)}) / 15 = {pay_dur_score:.1f} pts",
                    "explanation": f"Multiple disbursements executed within a short timeframe ({int(pay_dur)} days).",
                    "score": round(pay_dur_score, 1)
                })
            
            comps['payment'] = round(min(pay_count_score + pay_dur_score, 15.0), 1)
            
            # --- Delay Signal (Max 10) ---
            delay_sanc_score = 0.0
            delay_exec_score = 0.0
            sanc_delay = row.get('sanction_delay_days', 0)
            comp_dur = row.get('completion_duration_days', 0)
            
            if pd.notna(sanc_delay) and sanc_delay > 180:
                delay_sanc_score = min(5.0, (sanc_delay / 365.0) * 5.0)
                reasons.append({
                    "type": "Sanctioning Delay",
                    "evidence": f"Delay = {int(sanc_delay)} days from recommendation to sanction",
                    "calculation": f"({int(sanc_delay)} / 365) * 5 = {delay_sanc_score:.1f} pts",
                    "explanation": f"Delay of {int(sanc_delay)} days between recommendation and sanctioning.",
                    "score": round(delay_sanc_score, 1)
                })
            if pd.notna(comp_dur) and comp_dur > 365:
                delay_exec_score = min(5.0, (comp_dur / 730.0) * 5.0)
                reasons.append({
                    "type": "Execution Delay",
                    "evidence": f"Duration = {int(comp_dur)} days from sanction to completion",
                    "calculation": f"({int(comp_dur)} / 730) * 5 = {delay_exec_score:.1f} pts",
                    "explanation": f"Execution took longer than 1 year ({int(comp_dur)} days).",
                    "score": round(delay_exec_score, 1)
                })
                
            comps['delay'] = round(min(delay_sanc_score + delay_exec_score, 10.0), 1)
            
            # --- Similarity Signal (Max 10) ---
            sim_score = 0.0
            sim_val = row.get('similarity_score_val', 0.0)
            if row.get('similar_work_detected', False) and pd.notna(sim_val):
                sim_score = min(10.0, 5.0 + (5.0 * (sim_val - 0.85) / 0.15))
                reasons.append({
                    "type": "Similar Work Detected",
                    "evidence": f"Matched Work ID = {row.get('similar_work_id')}",
                    "calculation": f"Cosine Similarity = {sim_val:.3f} → {sim_score:.1f} pts",
                    "explanation": f"Potentially similar work detected (description similarity {sim_val*100:.1f}%).",
                    "score": round(sim_score, 1)
                })
                
            comps['similarity'] = round(sim_score, 1)
            
            # --- Final Assembly ---
            raw_score = comps['financial'] + comps['ml'] + comps['payment'] + comps['delay'] + comps['similarity']
            score = round(min(max(0.0, raw_score), 100.0), 1)
            
            # Thresholds calibrated for continuous scoring:
            # ML now gives 20–25 for confirmed anomalies (vs old binary 25).
            # All other components are continuous and sum ~10% lower than old binary system.
            # HIGH ≥ 50 (was 60), MEDIUM ≥ 25 (was 30), LOW < 25
            if score >= 50.0:
                level = "HIGH"
            elif score >= 25.0:
                level = "MEDIUM"
            else:
                level = "LOW"
                
            risk_scores.append(score)
            risk_levels.append(level)
            risk_components.append(json.dumps(comps))
            
            if not reasons:
                explanations_json.append("[]")
                self.df.at[row.name, 'risk_evidence_explanation'] = "No unusual patterns detected."
                summary = "The AI engine evaluated this project and assigned a LOW risk score. No unusual financial, temporal, or structural patterns were detected in the available data."
            else:
                explanations_json.append(json.dumps(reasons))
                self.df.at[row.name, 'risk_evidence_explanation'] = " | ".join([r["type"] for r in reasons])
                
                summary = f"The AI engine assigned a {level} risk score of {score}/100. "
                summary += f"The justification for this score is based on {len(reasons)} detected anomalies: "
                descriptions = [r['explanation'].rstrip('.') for r in reasons]
                if len(descriptions) == 1:
                    summary += descriptions[0] + "."
                else:
                    summary += "; ".join(descriptions[:-1]) + "; and " + descriptions[-1] + "."
            ai_summaries.append(summary)
            
        self.df['prototype_risk_score'] = risk_scores
        self.df['risk_level'] = risk_levels
        self.df['risk_components'] = risk_components
        self.df['structured_reasons'] = explanations_json
        self.df['ai_justification_summary'] = ai_summaries
        
        return self.df
        
    def execute_pipeline(self):
        self.run_peer_benchmarking()
        self.run_anomaly_detection()
        self.run_similarity_detection()
        self.calculate_risk_score_and_explain()
        return self.df
