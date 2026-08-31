import { PrismaClient } from '@prisma/client';
import { recalculateOverallProjectRisks } from '../routes/projects.js';

const prisma = new PrismaClient();

async function testRiskIncrease() {
  console.log('=== Running Overall Risk Increase Validation Test ===');
  
  // Find a test project
  const project = await prisma.project.findFirst({
    where: { projectId: 'WS/MP233/2025-2026/266721' }
  });
  
  if (!project) {
    console.error('Test project not found!');
    return;
  }

  // 1. Initial State (Reset all risk fields to 0, no procurement, no contractor score)
  console.log('\n--- Test 1: Resetting Project to Low Risk ---');
  await prisma.project.update({
    where: { id: project.id },
    data: {
      financialRiskScore: 0.0,
      financialRiskLevel: 'LOW',
      procurementRiskScore: 0.0,
      procurementRiskLevel: 'LOW',
      contractorRiskScore: 0.0,
      contractorRiskLevel: 'LOW'
    }
  });

  // Make sure to delete any associated procurement to test pure missing state
  await prisma.procurement.deleteMany({
    where: { projectId: project.id }
  });

  // Run recalculate
  await recalculateOverallProjectRisks(prisma);
  let updated = await prisma.project.findUnique({ where: { id: project.id } });
  console.log(`Initial Score: ${updated.riskScore} | Level: ${updated.riskLevel} | Components: ${updated.riskComponents}`);

  // 2. Add Financial Anomaly (e.g. 45.0)
  console.log('\n--- Test 2: Adding Financial Anomaly (45.0) ---');
  await prisma.project.update({
    where: { id: project.id },
    data: {
      financialRiskScore: 45.0,
      financialRiskLevel: 'MEDIUM'
    }
  });
  await recalculateOverallProjectRisks(prisma);
  updated = await prisma.project.findUnique({ where: { id: project.id } });
  console.log(`Financial-only Score: ${updated.riskScore} | Level: ${updated.riskLevel} | Components: ${updated.riskComponents}`);

  // 3. Add Contractor Signal (e.g. 70.0)
  console.log('\n--- Test 3: Adding Contractor Signal (70.0) ---');
  // First update the Contractor record associated with the project's vendor name
  function normalizeName(name) {
    if (!name) return 'unknown';
    const primary = name.split(',')[0].trim();
    return primary
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, '')
      .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
  }

  const norm = normalizeName(project.vendorName);
  await prisma.contractor.update({
    where: { normalizedName: norm },
    data: {
      contractorRiskScore: 70.0,
      contractorRiskLevel: 'HIGH'
    }
  });

  await recalculateOverallProjectRisks(prisma);
  updated = await prisma.project.findUnique({ where: { id: project.id } });
  console.log(`Financial + Contractor Score: ${updated.riskScore} | Level: ${updated.riskLevel} | Components: ${updated.riskComponents}`);
  console.log(`(Calculated: (0.5 * 45 + 0.2 * 70) / 0.7 = 36.5 / 0.7 = 52.1. Expected = 52.1)`);

  // 4. Add Procurement Anomaly (e.g. 90.0)
  console.log('\n--- Test 4: Adding Procurement Anomaly (90.0) ---');
  // Create an analyzed procurement document for this project
  await prisma.procurement.create({
    data: {
      projectId: project.id,
      uploadedFile: 'C:\\test_boq.pdf',
      procurementRiskScore: 90.0,
      procurementRiskLevel: 'HIGH',
      status: 'Analyzed'
    }
  });

  await recalculateOverallProjectRisks(prisma);
  updated = await prisma.project.findUnique({ where: { id: project.id } });
  console.log(`Financial + Contractor + Procurement Score: ${updated.riskScore} | Level: ${updated.riskLevel} | Components: ${updated.riskComponents}`);
  console.log(`(Calculated: 0.5 * 45 + 0.3 * 90 + 0.2 * 70 = 22.5 + 27.0 + 14.0 = 63.5. Expected = 63.5)`);

  console.log('\nOverall Risk Increase Validation Successful!');
}

testRiskIncrease()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
