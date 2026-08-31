import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Delete existing records to re-seed
  await prisma.auditLog.deleteMany({});
  await prisma.caseAction.deleteMany({});
  await prisma.case.deleteMany({});
  await prisma.anomaly.deleteMany({});
  await prisma.project.deleteMany({});
  console.log('Cleared existing project data.');

  const csvPath = path.resolve(process.cwd(), '../data/processed/master_dataset_scored.csv');
  console.log(`Reading CSV from ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    console.error('CSV file not found!');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: false
  });
  
  console.log(`Parsed ${records.length} records. Inserting...`);
  
  let inserted = 0;
  for (const record of records) {
    const parseFloatSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? Number(val) : null;
    const parseIntSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? parseInt(val, 10) : null;
    const parseBooleanSafe = (val) => val === 'True' || val === 'true';

    try {
      await prisma.project.create({
        data: {
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
          
          // Module Specific Financial Risk
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
      inserted++;
      if (inserted % 100 === 0) console.log(`Inserted ${inserted} projects...`);
    } catch (err) {
      console.error(`Error inserting project ${record.work_id}:`, err.message);
    }
  }

  console.log(`Successfully seeded ${inserted} projects.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
