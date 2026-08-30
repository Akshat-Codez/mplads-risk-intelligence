# MPLADS Data Foundation & Quality Report

## 1. Overview of Inspected Data
We analyzed data for 7 Members of Parliament located in `data/raw/` (MP1 through MP7). Each MP folder typically contains four reports representing different stages of the work lifecycle:
- **Recommended** (`Recommend_*.csv` / `Recommended_*.csv`)
- **Sanctioned** (`Sanctioned_*.csv`)
- **Expenditure** (`Expenditure_*.csv`)
- **Completed** (`Completed_*.csv`)

## 2. Proposed Standard Schema
Based on the approved schema guidelines, we propose the following base fields for the **Master Dataset** at the work level:
- `work_id` (Primary Join Key)
- `mp_id` (Derived from MP Name/Constituency)
- `mp_name`
- `state`
- `district` (Mapped from IDA, pending verification)
- `constituency` (Mapped from Elected/Nominated or Constituency)
- `work_type` (Mapped from Work Category)
- `work_description`
- `recommended_amount`
- `recommendation_date`
- `sanctioned_amount`
- `sanction_date`
- `expenditure_amount` (Aggregate/Final from Completed or Expenditure)
- `payment_count` (Derived from Expenditure)
- `total_disbursed` (Derived from Expenditure)
- `first_payment_date` (Derived from Expenditure)
- `last_payment_date` (Derived from Expenditure)
- `payment_status` (From Expenditure)
- `vendor_name` (From Expenditure)
- `work_status` (From Sanctioned/Completed)
- `actual_completion_date` (From Completed)
- `image_available` (From Completed)

## 3. Data Quality Issues Identified
- **Concatenated Identifiers**: In `Recommended`, `Sanctioned`, and `Completed` datasets, the `WORK` column actually contains the `work_id` and the `work_category` joined by a hyphen (e.g. `WS/MP053/2023-2024/43938-Construction of roads...`). This must be split to extract a clean `work_id`.
- **Inconsistent Column Naming**: The column for constituency is named `Elected/Nominated` for some MPs (e.g., MP1, MP2, MP3, MP5) and `Constituency` for others (MP4, MP6, MP7). 
- **Column Meaning Shifts**: In the `Expenditure` datasets, there is a clean `Work ID` column, but the `Work` column holds the category description rather than the concatenated ID.
- **Empty Trailing Rows**: All CSVs seem to have 1 entirely missing row, likely an empty trailing line or malformed EOF.

## 4. Ambiguous Fields (Needs Human Verification)
- **`IDA`**: Often formatted as `MUNGER(DISTRICT PLANNING OFFICER MUNGER_IDA)`. We assume this maps to `district`, but needs human verification to ensure it's not a more specific entity.
- **`Fund Disbursed Amount ( ₹ )` in Expenditure**: Need to verify if this is a discrete transaction amount or a cumulative amount up to that date.
- **`Amount Disbursed ( ₹ )` in Completed**: Need to verify if this represents the *total* disbursed amount for the completed work.
- **`Work` in Expenditure vs. Others**: Need to verify if `Work` in expenditure strictly maps to `work_type`.

## 5. Missing / Unavailable Fields
The following schema fields are not natively present in the raw reports and should **not** be fabricated:
- `progress_percentage`
- `expected_completion_date`
- `estimated_cost`
- `latitude`
- `longitude`

## 6. Plan to Create the Master Dataset
The master dataset will be created through a reproducible Python/Pandas pipeline (`scripts/build_master_dataset.py`) using the following steps:

1. **Extraction & Standardization**:
   - Loop over all MP folders.
   - Load each CSV, strip whitespaces, fix currency encodings.
   - Rename columns according to `docs/column_mapping.csv`.
   - Extract the pure `work_id` from the concatenated `WORK` string in Recommended/Sanctioned/Completed using string splitting.
   - Clean the `IDA` column to extract a simple `district` name.

2. **Work-Level Aggregation (Expenditure)**:
   - Group the `Expenditure` data by `work_id`.
   - Calculate derivations: `payment_count`, `total_disbursed`, `first_payment_date`, `last_payment_date`.

3. **Record Linking (Merging)**:
   - Perform an outer join on `work_id` across the four cleaned datasets (Recommended $\rightarrow$ Sanctioned $\rightarrow$ Aggregated Expenditure $\rightarrow$ Completed).
   - Resolve conflicts (e.g., preserving MP name, State, District from the earliest available record).

4. **Export**:
   - Save the final granular, one-row-per-project table to `data/processed/master_dataset.csv`.

## 7. Files and Scripts to be Created Next
Once the column mapping and verification step is approved, we will create:
- `scripts/clean_data.py`: Functions to parse dates, currency strings, and extract identifiers.
- `scripts/build_master_dataset.py`: The main pipeline applying `clean_data.py` to `data/raw/` and outputting to `data/processed/master_dataset.csv`.
- `data/processed/master_dataset.csv`: The resulting linked dataset.
