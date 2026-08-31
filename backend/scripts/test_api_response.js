import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testResponse() {
  console.log('Testing GET /api/projects query...');
  
  // Let's call mapProjectToFrontend on a project
  const project = await prisma.project.findFirst({});
  if (!project) {
    console.error('No projects in database!');
    return;
  }
  
  // Let's inspect the keys of the mapped project
  const keys = Object.keys(project);
  console.log('Database Project Keys:', keys);

  // Helper mapProjectToFrontend
  function mapProjectToFrontend(project) {
    if (!project) return null;
    const p = { ...project };
    
    // Add snake_case aliases for frontend compatibility
    p.work_id = p.projectId;
    p.work_type = p.workType;
    p.work_description = p.workDescription;
    p.recommended_amount = p.recommendedAmount;
    p.sanctioned_amount = p.sanctionedAmount;
    p.total_disbursed = p.totalDisbursed;
    p.expenditure_ratio = p.expenditureRatio;
    p.amount_deviation = p.amountDeviation;
    p.recommendation_date = p.recommendationDate;
    p.sanction_date = p.sanctionDate;
    p.actual_completion_date = p.actualCompletionDate;
    p.sanction_delay_days = p.sanctionDelayDays;
    p.completion_duration_days = p.completionDurationDays;
    p.work_status = p.workStatus;
    p.payment_count = p.paymentCount;
    p.average_payment = p.averagePayment;
    p.maximum_payment = p.maximumPayment;
    p.first_payment_date = p.firstPaymentDate;
    p.last_payment_date = p.lastPaymentDate;
    p.payment_duration_days = p.paymentDurationDays;
    p.vendor_name = p.vendorName;
    p.vendor_count_per_work = p.vendorCountPerWork;
    p.prototype_risk_score = p.riskScore;
    p.risk_level = p.riskLevel;
    p.risk_components = p.riskComponents;
    p.structured_reasons = p.structuredReasons;
    p.risk_evidence_explanation = p.riskEvidenceExplanation;
    p.ai_justification_summary = p.aiJustificationSummary;
    p.peer_median_amount = p.peerMedianAmount;
    p.peer_deviation = p.peerDeviation;
    p.if_anomaly_signal = p.ifAnomalySignal;
    p.similar_work_detected = p.similarWorkDetected;
    p.similar_work_id = p.similarWorkId;
    p.image_available = p.imageAvailable;
    p.final_completed_amount = p.finalCompletedAmount;
    return p;
  }

  const mapped = mapProjectToFrontend(project);
  console.log('\nMapped Project Keys:', Object.keys(mapped));
  console.log('\nMapped Project Sample Properties:');
  console.log(`work_id: ${mapped.work_id}`);
  console.log(`work_description: ${mapped.work_description}`);
  console.log(`work_type: ${mapped.work_type}`);
  console.log(`state: ${mapped.state}`);
  console.log(`district: ${mapped.district}`);
  console.log(`prototype_risk_score: ${mapped.prototype_risk_score}`);
  console.log(`risk_level: ${mapped.risk_level}`);
}

testResponse()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
