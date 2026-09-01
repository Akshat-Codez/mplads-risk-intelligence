import { PrismaClient } from '@prisma/client';
import aggregateRisk from '../risk/riskAggregator.js';
import calculateConfidence from '../risk/confidenceCalculator.js';
import calculateFinancialRisk from '../risk/financialRisk.js';
import calculateProcurementRisk from '../risk/procurementRisk.js';
import calculateProgressRisk from '../risk/progressRisk.js';
import calculateContractorRisk from '../risk/contractorRisk.js';
import calculateGisRisk from '../risk/gisRisk.js';
import calculateDocumentationRisk from '../risk/documentationRisk.js';
import { calculateCrossSignalRisk } from '../risk/crossSignalRisk.js';

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================================");
  console.log("FORENSIC DIAGNOSIS: RISK INPUT & CONFIDENCE PIPELINE");
  console.log("==================================================================");

  // Fetch 10 sample projects (5 from MP/old data, 5 from other states)
  const mpProjects = await prisma.project.findMany({
    where: { state: 'Madhya Pradesh' },
    take: 5
  });

  const otherProjects = await prisma.project.findMany({
    where: { state: { in: ['Uttar Pradesh', 'Gujarat', 'Chhattisgarh', 'Himachal Pradesh', 'Rajasthan'] } },
    take: 5
  });

  const sampleProjects = [...mpProjects, ...otherProjects];

  console.log(`\nAnalyzing ${sampleProjects.length} representative projects...\n`);

  for (let i = 0; i < sampleProjects.length; i++) {
    const p = sampleProjects[i];
    console.log(`------------------------------------------------------------------`);
    console.log(`PROJECT ${i + 1}: ${p.projectId} (${p.state} - ${p.district})`);
    console.log(`------------------------------------------------------------------`);
    console.log(`  Raw DB Fields:`);
    console.log(`    - sanctionedAmount: ${p.sanctionedAmount}`);
    console.log(`    - recommendedAmount: ${p.recommendedAmount}`);
    console.log(`    - totalDisbursed: ${p.totalDisbursed}`);
    console.log(`    - expenditureRatio: ${p.expenditureRatio}`);
    console.log(`    - physicalProgress: ${p.physicalProgress}`);
    console.log(`    - financialProgress: ${p.financialProgress}`);
    console.log(`    - vendorName: ${p.vendorName}`);
    console.log(`    - latitude: ${p.latitude}, longitude: ${p.longitude}`);
    console.log(`    - documentsChecklist: ${p.documentsChecklist}`);
    console.log(`    - recommendationDate: ${p.recommendationDate}`);
    console.log(`    - sanctionDate: ${p.sanctionDate}`);
    console.log(`    - workStatus: ${p.workStatus}`);
    console.log(`    - procurementRiskScore: ${p.procurementRiskScore}`);

    // Check Engine Availability
    const engineAvailability = {
      financial: p.sanctionedAmount != null || p.totalDisbursed != null,
      procurement: p.procurementRiskScore != null && p.procurementRiskScore > 0,
      progress: p.physicalProgress != null || p.financialProgress != null || p.completionDurationDays != null,
      contractor: p.vendorName != null,
      gis: p.latitude != null && p.longitude != null,
      documentation: p.documentsChecklist != null,
      crossSignal: true
    };

    console.log(`  Engine Availability evaluated by riskAggregator:`, engineAvailability);

    const confResult = calculateConfidence(p, engineAvailability);
    console.log(`  Confidence Calculation result:`, confResult);

    const aggResult = aggregateRisk(p, [p], null);
    console.log(`  Aggregate Risk result:`);
    console.log(`    - overallScore: ${aggResult.overallScore}`);
    console.log(`    - overallLevel: ${aggResult.overallLevel}`);
    console.log(`    - confidence: ${aggResult.confidence}`);
    console.log(`    - dataCompleteness: ${aggResult.dataCompleteness}%`);
    console.log(`    - activeWeights:`, aggResult.activeWeights);
  }

  // Distribution check across DB
  console.log("\n==================================================================");
  console.log("WHOLE DATABASE FIELD COVERAGE STATS");
  console.log("==================================================================");
  const total = await prisma.project.count();
  const withSanc = await prisma.project.count({ where: { sanctionedAmount: { not: null } } });
  const withSpent = await prisma.project.count({ where: { totalDisbursed: { not: null } } });
  const withVendor = await prisma.project.count({ where: { vendorName: { not: null } } });
  const withGis = await prisma.project.count({ where: { latitude: { not: null }, longitude: { not: null } } });
  const withProc = await prisma.project.count({ where: { procurementRiskScore: { not: null, gt: 0 } } });
  const withProg = await prisma.project.count({ where: { OR: [{ physicalProgress: { not: null } }, { financialProgress: { not: null } }, { completionDurationDays: { not: null } }] } });
  const withDocs = await prisma.project.count({ where: { documentsChecklist: { not: null } } });

  console.log(`Total projects: ${total}`);
  console.log(`  - With sanctionedAmount: ${withSanc} (${(withSanc/total*100).toFixed(1)}%)`);
  console.log(`  - With totalDisbursed: ${withSpent} (${(withSpent/total*100).toFixed(1)}%)`);
  console.log(`  - With vendorName: ${withVendor} (${(withVendor/total*100).toFixed(1)}%)`);
  console.log(`  - With GIS coordinates: ${withGis} (${(withGis/total*100).toFixed(1)}%)`);
  console.log(`  - With procurementRiskScore > 0: ${withProc} (${(withProc/total*100).toFixed(1)}%)`);
  console.log(`  - With progress data: ${withProg} (${(withProg/total*100).toFixed(1)}%)`);
  console.log(`  - With documentsChecklist: ${withDocs} (${(withDocs/total*100).toFixed(1)}%)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
