# NIRMAN — AI-Assisted MPLADS Risk Intelligence & Governance System

NIRMAN is an AI-assisted risk prioritization and anomaly detection system developed for the Ministry of Statistics and Programme Implementation (MoSPI) to monitor, audit, and safeguard **Member of Parliament Local Area Development Scheme (MPLADS)** works across India.

---

## 🏛️ System Architecture

NIRMAN operates as a multi-tier, data-grounded intelligence pipeline:

```
MPLADS Dataset (1,051 Projects)
        ↓
Financial Risk Engine (Peer Z-score + Isolation Forest ML + Payment/Delay Rules)
        ↓
Procurement Intelligence Engine (PDF Extraction + CPWD Reference Price Benchmarking)
        ↓
Contractor Intelligence Engine (Fuzzy Normalization + Concentration Analysis)
        ↓
Multi-Factor Overall Risk Integrator (Dynamic Confidence Rescaling)
        ↓
AI Officer Executive Summary (Zero-Hallucination MoSPI Intelligence Briefings)
        ↓
Human-in-the-Loop Verification (Confirmed / False Positive / Under Investigation)
        ↓
Model Registry & Active Learning Governance (Train/Val/Test Benchmarking)
```

---

## 🚀 Key Features

1. **Continuous Multi-Factor Scoring**:
   - Integrates Financial ($0.5$), Procurement ($0.3$), and Contractor ($0.2$) risk components with automatic weight normalization when data components are absent.
   - Preserves mathematical continuity (no artificial 5-point bucket rounding).
   - Distinct 4-tier risk classification: `HIGH` ($\ge 50$), `MEDIUM` ($\ge 25$), `LOW` ($< 25$, confidence $\ge 60\%$), `INSUFFICIENT DATA` ($< 25$, confidence $< 60\%$).

2. **Procurement Intelligence & BOQ Auditing**:
   - Automated extraction of line items, quantities, and quoted unit prices from tender PDFs.
   - Real-time comparison against state and CPWD Schedule of Rates (SOR) benchmarks.
   - Clear visual distinction between verified government benchmark datasets and synthetic demo benchmarks.

3. **Contractor Concentration Profiling**:
   - Fuzzy text normalization consolidating vendor spelling variations (e.g., PWD vs Private Limited designations).
   - District-level allocation concentration, project load clustering, and capacity deviation metrics.

4. **Zero-Hallucination AI Officer Executive Briefings**:
   - Synthesizes complex multi-dimensional risk signals into concise, non-accusatory administrative intelligence.
   - Bounded strictly to pre-calculated numerical evidence; never fabricates allegations, prices, or records.
   - Fault-tolerant fallback ensuring 100% dashboard uptime even during external LLM outages.

5. **Human-in-the-Loop Active Learning**:
   - Authorized officers record official verification decisions (`CONFIRMED`, `FALSE_POSITIVE`, `REQUIRES_INVESTIGATION`, `INSUFFICIENT_DATA`) with ground justifications.
   - Preserves historical AI prediction snapshots without modifying baseline project risk scores.
   - Auditable governance trail with strict role-based access control.

6. **Model Registry & Governance Pipeline**:
   - Tracks model versions, algorithm architectures, feature versions, and performance metrics (Precision, Recall, F1, FPR, ROC-AUC).
   - Honest insufficient data handling: Automatically defers supervised model training when human feedback volume is below statistical thresholds ($N < 50$).

---

## 🛠️ Technology Stack

* **Backend**: Node.js, Express.js, TypeScript / ES Modules, Prisma ORM, SQLite / PostgreSQL
* **Machine Learning & Python Service**: Python 3.11+, Scikit-Learn (Isolation Forest, Random Forest, Gradient Boosting), Pandas, NumPy, FastAPI
* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons
* **Security**: JWT Authentication, Argon2 / Bcrypt password hashing, Role-Based Access Control (`MINISTRY`, `STATE`, `DISTRICT`)

---

## 📋 Environment Configuration

Create a `.env` file in `backend/`:
```env
PORT=5000
JWT_SECRET=nirman-sih-2026-secret-key-gov-mospi
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY=your_gemini_api_key_here
FASTAPI_ML_URL=http://localhost:8000
```

---

## ⚙️ Installation & Running

### 1. Backend Setup
```bash
cd backend
npm install
npx prisma db push
node server.js
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build
npm run dev
```

### 3. Run Validation Test Suite
```bash
cd backend
node scripts/run_master_validation.js
```

---

## 📊 Default Demo Credentials

* **Role**: National Ministry Officer
* **Authority ID**: `GOV-MOSPI-001`
* **Password**: `password`
* **Access Scope**: All 1,051 works, 44 districts, Model Registry, Human Verification Audit Trail

---

## ⚖️ System Governance & Terminology Guidelines

* **Risk Prioritization Signal**: Indicates a statistical or documentation anomaly requiring administrative review, not definitive proof of wrongdoing.
* **Non-Accusatory Language**: Uses neutral terminology such as *"Potential risk signal"*, *"Peer rate deviation"*, and *"Requires priority verification"*.
* **Honest Data Transparency**: Clearly labels insufficient documentation as *"Insufficient data available"* and synthetic benchmarks as *"DEMO - synthetic reference benchmark"*.
