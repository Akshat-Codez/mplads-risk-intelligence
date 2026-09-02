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
  await prisma.feedback.deleteMany({});
  await prisma.procurement.deleteMany({});
  await prisma.project.deleteMany({});
  console.log('Cleared existing project data.');

  const candidatePaths = [
    path.resolve(process.cwd(), 'data/processed/master_dataset_scored.csv'),
    path.resolve(process.cwd(), '../data/processed/master_dataset_scored.csv'),
    path.resolve(import.meta.dirname, '../../data/processed/master_dataset_scored.csv')
  ];
  const csvPath = candidatePaths.find(p => fs.existsSync(p)) || candidatePaths[0];
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
  
  console.log(`Parsed ${records.length} records. Preparing batch insertion...`);

  const parseFloatSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? Number(val) : null;
  const parseIntSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? parseInt(val, 10) : null;
  const parseBooleanSafe = (val) => val === 'True' || val === 'true';

  const seenIds = new Set();
  const projectRows = [];

  for (let idx = 0; idx < records.length; idx++) {
    const record = records[idx];
    const rawId = record.work_id || record.id || `PROJ-${idx}`;
    if (seenIds.has(rawId)) continue;
    seenIds.add(rawId);

    projectRows.push({
      projectId: rawId,
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
      sanctionDate: record.sanctionDate || record.sanction_date || null,
      actualCompletionDate: record.actualCompletionDate || record.actual_completion_date || null,
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
    });
  }

  console.log(`Inserting ${projectRows.length} unique projects in chunks of 500...`);
  const CHUNK_SIZE = 500;
  for (let i = 0; i < projectRows.length; i += CHUNK_SIZE) {
    const chunk = projectRows.slice(i, i + CHUNK_SIZE);
    await prisma.project.createMany({ data: chunk });
    if ((i + chunk.length) % 2500 === 0 || i + chunk.length === projectRows.length) {
      console.log(`Seeded ${i + chunk.length} / ${projectRows.length} projects...`);
    }
  }
  console.log(`Successfully seeded ${projectRows.length} projects.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
