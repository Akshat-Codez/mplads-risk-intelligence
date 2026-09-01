/**
 * 7-Dimension Risk Intelligence Automated Test Suite
 * Tests 12 distinct edge cases for the risk aggregation engine.
 */
import { aggregateRisk } from '../risk/riskAggregator.js';

const PASS = '✅';
const FAIL = '❌';
let passed = 0;
let failed = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ${PASS} ${testName}`);
    passed++;
  } else {
    console.log(`  ${FAIL} ${testName} — ${detail}`);
    failed++;
  }
}

function makeProject(overrides = {}) {
  return {
    projectId: 'TEST-001',
    workType: 'Normal/Others',
    workDescription: 'Construction of PCC Road',
    state: 'Bihar',
    district: 'PURBI CHAMPARAN',
    sanctionedAmount: 1500000,
    recommendedAmount: 1500000,
    totalDisbursed: 1200000,
    expenditureRatio: 0.8,
    amountDeviation: 0.0,
    physicalProgress: 70,
    financialProgress: 75,
    completionDurationDays: 200,
    paymentCount: 3,
    averagePayment: 400000,
    maximumPayment: 600000,
    vendorName: 'Test Contractor',
    workStatus: 'Physical Inspection',
    sanctionDate: '2025-06-15',
    recommendationDate: '2025-05-01',
    actualCompletionDate: null,
    ifAnomalySignal: false,
    peerDeviation: 0.01,
    imageAvailable: true,
    latitude: 26.65,
    longitude: 84.87,
    documentsChecklist: JSON.stringify({
      aa: true, ts: true, estimate: true, boq: true, tender: true,
      workOrder: true, mb: true, bills: true, uc: false, cc: false,
      inspection: true, photos: true
    }),
    documentCompleteness: 83,
    stagnationDays: 0,
    revisedEstimatesCount: 0,
    procurementRiskScore: 0,
    ...overrides
  };
}

console.log('========================================');
console.log('  7-DIMENSION RISK INTELLIGENCE TESTS');
console.log('========================================\n');

// Test 1: Normal low-risk project
console.log('TEST 1: Normal Low-Risk Project');
{
  const p = makeProject();
  const result = aggregateRisk(p, [p]);
  assert(result.overallScore < 30, 'Score < 30', `Got: ${result.overallScore}`);
  assert(result.confidence > 60, 'Confidence > 60%', `Got: ${result.confidence}`);
  assert(result.overallLevel === 'LOW' || result.overallLevel === 'MEDIUM', 'Level is LOW or MEDIUM', `Got: ${result.overallLevel}`);
}

// Test 2: High expenditure but low physical progress
console.log('\nTEST 2: High Financial, Low Physical Progress');
{
  const p = makeProject({ financialProgress: 90, physicalProgress: 25, expenditureRatio: 1.2 });
  const result = aggregateRisk(p, [p]);
  assert(result.dimensions.financial.score > 10, 'Financial risk triggered', `Score: ${result.dimensions.financial.score}`);
  assert(result.dimensions.progress.score > 10, 'Progress risk triggered', `Score: ${result.dimensions.progress.score}`);
  assert(result.overallScore > result.dimensions.financial.score * 0.1, 'Overall > minimal', `Overall: ${result.overallScore}`);
}

// Test 3: Major BOQ price deviation
console.log('\nTEST 3: Major BOQ Price Deviation');
{
  const p = makeProject({ procurementRiskScore: 65, documentsChecklist: JSON.stringify({ aa: true, ts: true, estimate: true, boq: false, tender: true, workOrder: true, mb: true, bills: true, uc: false, cc: false, inspection: true, photos: true }) });
  const result = aggregateRisk(p, [p]);
  assert(result.dimensions.procurement.score > 15, 'Procurement risk triggered by missing BOQ', `Score: ${result.dimensions.procurement.score}`);
}

// Test 4: Highly concentrated contractor
console.log('\nTEST 4: Highly Concentrated Contractor');
{
  const p = makeProject();
  const contractor = { concentrationScore: 85, projectCount: 20, totalExpenditure: 50000000, contractorRiskScore: 60 };
  const result = aggregateRisk(p, [p], contractor);
  assert(result.dimensions.contractor.score > 15, 'Contractor risk triggered', `Score: ${result.dimensions.contractor.score}`);
}

// Test 5: Long project delay
console.log('\nTEST 5: Long Project Delay');
{
  const p = makeProject({ completionDurationDays: 800, physicalProgress: 40, stagnationDays: 120 });
  const result = aggregateRisk(p, [p]);
  assert(result.dimensions.progress.score > 15, 'Progress risk triggered by delay', `Score: ${result.dimensions.progress.score}`);
}

// Test 6: Missing documentation
console.log('\nTEST 6: Missing Documentation');
{
  const p = makeProject({
    documentsChecklist: JSON.stringify({
      aa: true, ts: false, estimate: false, boq: false, tender: false,
      workOrder: false, mb: false, bills: false, uc: false, cc: false,
      inspection: false, photos: false
    }),
    documentCompleteness: 8
  });
  const result = aggregateRisk(p, [p]);
  assert(result.dimensions.documentation.score > 40, 'Documentation risk HIGH', `Score: ${result.dimensions.documentation.score}`);
}

// Test 7: Multiple simultaneous anomalies (cross-signal)
console.log('\nTEST 7: Multiple Simultaneous Anomalies');
{
  const p = makeProject({
    financialProgress: 90,
    physicalProgress: 30,
    expenditureRatio: 1.3,
    stagnationDays: 150,
    revisedEstimatesCount: 3,
    ifAnomalySignal: true,
    peerDeviation: 0.8
  });
  const contractor = { concentrationScore: 80, contractorRiskScore: 55, projectCount: 25 };
  const result = aggregateRisk(p, [p], contractor);
  assert(result.dimensions.crossSignal.score > 15, 'Cross-signal triggered', `Score: ${result.dimensions.crossSignal.score}`);
  assert(result.overallScore > 25, 'Overall elevated', `Overall: ${result.overallScore}`);
}

// Test 8: Missing BOQ (dynamic weight redistribution)
console.log('\nTEST 8: Missing BOQ — Dynamic Weight Redistribution');
{
  const p = makeProject({ procurementRiskScore: 0 });
  const result = aggregateRisk(p, [p]);
  // Procurement engine should be skipped, weights redistributed
  assert(result.engineAvailability.procurement === false || result.dimensions.procurement.score === 0, 
    'Procurement engine skipped or zero', `Available: ${result.engineAvailability.procurement}`);
  const totalWeight = Object.values(result.activeWeights).reduce((s, w) => s + w, 0);
  assert(Math.abs(totalWeight - 1.0) < 0.01, 'Active weights sum to 1.0', `Sum: ${totalWeight.toFixed(3)}`);
}

// Test 9: Missing contractor data (dynamic redistribution)
console.log('\nTEST 9: Missing Contractor Data');
{
  const p = makeProject({ vendorName: null });
  const result = aggregateRisk(p, [p]);
  assert(result.engineAvailability.contractor === false, 'Contractor engine unavailable');
  const totalWeight = Object.values(result.activeWeights).reduce((s, w) => s + w, 0);
  assert(Math.abs(totalWeight - 1.0) < 0.01, 'Active weights sum to 1.0', `Sum: ${totalWeight.toFixed(3)}`);
}

// Test 10: Missing coordinates (GIS engine omission)
console.log('\nTEST 10: Missing Coordinates');
{
  const p = makeProject({ latitude: null, longitude: null });
  const result = aggregateRisk(p, [p]);
  assert(result.engineAvailability.gis === false, 'GIS engine unavailable');
  assert(result.dimensions.gis.score === 0, 'GIS score is 0');
}

// Test 11: Completed project with zero expenditure
console.log('\nTEST 11: Completed With Zero Expenditure');
{
  const p = makeProject({
    workStatus: 'Completed',
    actualCompletionDate: '2026-01-15',
    totalDisbursed: 0,
    expenditureRatio: 0,
    financialProgress: 0,
    physicalProgress: 100
  });
  const result = aggregateRisk(p, [p]);
  assert(result.dimensions.crossSignal.score > 0 || result.dimensions.financial.score > 0, 
    'Anomaly detected (cross-signal or financial)', 
    `CrossSignal: ${result.dimensions.crossSignal.score}, Financial: ${result.dimensions.financial.score}`);
}

// Test 12: Incomplete project data
console.log('\nTEST 12: Incomplete Project Data');
{
  const p = {
    projectId: 'TEST-INCOMPLETE',
    workType: 'Normal/Others',
    state: 'Bihar',
    district: 'PURBI CHAMPARAN',
    vendorName: null,
    sanctionedAmount: null,
    totalDisbursed: null,
    physicalProgress: null,
    financialProgress: null,
    latitude: null,
    longitude: null,
    documentsChecklist: null,
    procurementRiskScore: null
  };
  const result = aggregateRisk(p, [p]);
  assert(result.confidence < 50, 'Low confidence for sparse data', `Confidence: ${result.confidence}`);
  assert(result.overallLevel === 'INSUFFICIENT DATA' || result.overallLevel === 'LOW', 
    'Level is INSUFFICIENT DATA or LOW', `Level: ${result.overallLevel}`);
  assert(result.missingData.length > 0, 'Missing data list populated', `Missing: ${result.missingData.length} items`);
}

console.log('\n========================================');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log(`  TOTAL:   ${passed + failed} tests`);
console.log('========================================');

if (failed > 0) {
  process.exit(1);
}
