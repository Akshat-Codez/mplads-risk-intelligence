import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { recalculateOverallProjectRisks } from '../routes/projects.js';

const prisma = new PrismaClient();

async function runAndSync() {
  console.log('=== Step 1: Running Python Risk Pipeline ===');
  try {
    const pythonExecutable = process.platform === 'win32' ? 'python' : 'python3';
    execSync(`${pythonExecutable} scripts/run_risk_pipeline.py`, { 
      cwd: path.resolve(process.cwd(), '..'), 
      stdio: 'inherit' 
    });
  } catch (err) {
    console.error('Python pipeline failed:', err.message);
    process.exit(1);
  }

  console.log('\n=== Step 2: Syncing SQLite Database with Scored CSV ===');
  const csvPath = path.resolve(process.cwd(), '../data/processed/master_dataset_scored.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('Scored CSV not found at:', csvPath);
    process.exit(1);
  }
  
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: false
  });
  
  const parseFloatSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? Number(val) : null;
  const parseIntSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? parseInt(val, 10) : null;
  const parseBooleanSafe = (val) => val === 'True' || val === 'true';

  let count = 0;
  for (const record of records) {
    if (!record.work_id) continue;
    try {
      await prisma.project.upsert({
        where: { projectId: record.work_id },
        update: {
          riskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          riskLevel: record.risk_level || 'LOW',
          riskComponents: record.risk_components || null,
          structuredReasons: record.structured_reasons || null,
          riskEvidenceExplanation: record.risk_evidence_explanation || null,
          aiJustificationSummary: record.ai_justification_summary || null,
          financialRiskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          financialRiskLevel: record.risk_level || 'LOW',
          financialSignals: record.structured_reasons || null,
          anomalyScore: parseFloatSafe(record.peer_deviation) || 0,
          peerMedianAmount: parseFloatSafe(record.peer_median_amount),
          peerDeviation: parseFloatSafe(record.peer_deviation),
          ifAnomalySignal: parseBooleanSafe(record.if_anomaly_signal),
          similarWorkDetected: parseBooleanSafe(record.similar_work_detected),
          similarWorkId: record.similar_work_id || null,
          imageAvailable: parseBooleanSafe(record.image_available),
          finalCompletedAmount: parseFloatSafe(record.final_completed_amount),
        },
        create: {
          projectId: record.work_id,
          workType: record.work_type || null,
          workDescription: record.work_description || null,
          state: record.state || null,
          district: record.district || null,
          constituency: record.constituency || null,
          mpName: record.mp_name || null,
          recommendedAmount: parseFloatSafe(record.recommended_amount),
          sanctionedAmount: parseFloatSafe(record.sanctioned_amount),
          totalDisbursed: parseFloatSafe(record.total_disbursed),
          expenditureRatio: parseFloatSafe(record.expenditure_ratio),
          amountDeviation: parseFloatSafe(record.amount_deviation),
          recommendationDate: record.recommendation_date || null,
          sanctionDate: record.sanction_date || null,
          actualCompletionDate: record.actual_completion_date || null,
          sanctionDelayDays: parseFloatSafe(record.sanction_delay_days),
          completionDurationDays: parseFloatSafe(record.completion_duration_days),
          workStatus: record.work_status || null,
          paymentCount: parseFloatSafe(record.payment_count),
          averagePayment: parseFloatSafe(record.average_payment),
          maximumPayment: parseFloatSafe(record.maximum_payment),
          firstPaymentDate: record.first_payment_date || null,
          lastPaymentDate: record.last_payment_date || null,
          paymentDurationDays: parseFloatSafe(record.payment_duration_days),
          vendorName: record.vendor_name || null,
          vendorCountPerWork: parseIntSafe(record.vendor_count_per_work),
          riskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          riskLevel: record.risk_level || 'LOW',
          riskComponents: record.risk_components || null,
          structuredReasons: record.structured_reasons || null,
          riskEvidenceExplanation: record.risk_evidence_explanation || null,
          aiJustificationSummary: record.ai_justification_summary || null,
          financialRiskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          financialRiskLevel: record.risk_level || 'LOW',
          financialSignals: record.structured_reasons || null,
          anomalyScore: parseFloatSafe(record.peer_deviation) || 0,
          peerMedianAmount: parseFloatSafe(record.peer_median_amount),
          peerDeviation: parseFloatSafe(record.peer_deviation),
          ifAnomalySignal: parseBooleanSafe(record.if_anomaly_signal),
          similarWorkDetected: parseBooleanSafe(record.similar_work_detected),
          similarWorkId: record.similar_work_id || null,
          imageAvailable: parseBooleanSafe(record.image_available),
          finalCompletedAmount: parseFloatSafe(record.final_completed_amount),
        }
      });
      count++;
    } catch (err) {
      console.error(`Error syncing project ${record.work_id}:`, err.message);
    }
  }
  console.log(`Synced ${count} projects into SQLite database.`);

  console.log('\n=== Step 3: Refreshing Contractor Profiling ===');
  try {
    execSync('node scripts/profile_contractors.js', { stdio: 'inherit' });
  } catch (err) {
    console.error('Contractor profiling refresh failed:', err.message);
    process.exit(1);
  }

  console.log('\n=== Step 4: Recalculating Overall Project Risks ===');
  await recalculateOverallProjectRisks(prisma);

  console.log('\n=== Re-analysis & Sync Complete ===');
}

runAndSync()
  .catch(err => console.error('E2E run & sync failed:', err))
  .finally(() => prisma.$disconnect());
