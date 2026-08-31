import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normalizeContractorName(name) {
  if (!name) return 'unknown';
  
  const primary = name.split(',')[0].trim();
  return primary
    .toLowerCase()
    // Remove punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    // Remove extra spaces
    .replace(/\s+/g, '')
    // Remove standard company suffix terms
    .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
}

async function runProfiling() {
  console.log('Starting Contractor Profiling Pipeline...');

  // Get all projects from SQLite
  const projects = await prisma.project.findMany({});
  console.log(`Analyzing contractor fields across ${projects.length} projects...`);

  // Aggregate contractor details in memory
  const contractorsMap = new Map();

  for (const p of projects) {
    const rawName = p.vendorName ? p.vendorName.trim() : null;
    if (!rawName) continue;

    const norm = normalizeContractorName(rawName);
    
    if (!contractorsMap.has(norm)) {
      contractorsMap.set(norm, {
        name: rawName,
        normalizedName: norm,
        projects: [],
        totalExpenditure: 0,
        districts: new Set(),
        workTypes: new Set(),
        missingMetaCount: 0
      });
    }

    const c = contractorsMap.get(norm);
    c.projects.push(p);
    c.totalExpenditure += p.totalDisbursed || 0;
    if (p.district) c.districts.add(p.district);
    if (p.workType) c.workTypes.add(p.workType);
    
    // Check data completeness for this project record
    if (!p.sanctionDate) c.missingMetaCount++;
    if (!p.recommendedAmount) c.missingMetaCount++;
    if (!p.paymentCount) c.missingMetaCount++;
  }

  console.log(`Found ${contractorsMap.size} unique contractors after normalization.`);

  // Delete existing profiled contractors
  await prisma.contractor.deleteMany({});

  let count = 0;
  for (const [norm, data] of contractorsMap.entries()) {
    const projectCount = data.projects.length;
    const totalExpenditure = data.totalExpenditure;
    const averageProjectValue = projectCount > 0 ? totalExpenditure / projectCount : 0;
    
    const districtsArr = Array.from(data.districts);
    const workTypesArr = Array.from(data.workTypes);

    // Deterministic Contractor Risk Scoring Calculations (Continuous)
    let score = 0.0;
    const signals = [];

    // Volume Concentration Check (Continuous)
    const volume_score = Math.min(25.0, (projectCount / 10.0) * 25.0);
    score += volume_score;
    if (projectCount >= 10) {
      signals.push(`Unusual vendor concentration: Contractor manages a high volume of projects (${projectCount} in available records)`);
    } else if (projectCount >= 5) {
      signals.push(`Moderate vendor concentration: Contractor manages multiple projects (${projectCount} in available records)`);
    }

    // Expenditure Scale Check (Continuous)
    const expenditure_score = Math.min(20.0, (totalExpenditure / 20000000.0) * 20.0);
    score += expenditure_score;
    if (totalExpenditure >= 20000000) {
      signals.push(`Unusual vendor concentration: High aggregate project value allocated to this contractor (Rs. ${(totalExpenditure/10000000).toFixed(2)} Cr)`);
    }

    // Geographic Concentration Check
    let geo_score = 0.0;
    if (districtsArr.length === 1 && projectCount >= 3) {
      geo_score = 15.0;
      score += geo_score;
      signals.push(`Unusual vendor concentration: High geographic focus (all projects clustered within a single district: ${districtsArr[0]})`);
    }

    // Category Focus Check
    let cat_score = 0.0;
    if (workTypesArr.length === 1 && projectCount >= 3) {
      cat_score = 10.0;
      score += cat_score;
      signals.push(`Unusual vendor concentration: High specialization (all projects belong to a single category: ${workTypesArr[0]})`);
    }

    score = Math.round(Math.min(score, 100.0) * 10) / 10;

    let riskLevel = 'LOW';
    if (score >= 60.0) {
      riskLevel = 'HIGH';
    } else if (score >= 30.0) {
      riskLevel = 'MEDIUM';
    }

    if (riskLevel === 'LOW' && signals.length > 0) {
      riskLevel = 'REQUIRES VERIFICATION';
    }

    // Compute Confidence / Data Completeness score (0 to 100)
    // Decreases based on missing metadata fields in projects table
    const totalPossiblePoints = projectCount * 3;
    const completenessRatio = totalPossiblePoints > 0 
      ? ((totalPossiblePoints - data.missingMetaCount) / totalPossiblePoints) 
      : 1.0;
    const confidenceScore = Math.round(completenessRatio * 100);

    // Save Contractor Profile
    await prisma.contractor.create({
      data: {
        name: data.name,
        normalizedName: norm,
        projectCount,
        totalExpenditure,
        averageProjectValue,
        districts: JSON.stringify(districtsArr),
        workTypes: JSON.stringify(workTypesArr),
        concentrationScore: score,
        riskLevel: riskLevel,
        isDemo: true,
        
        // Future-ready Official status (Clean label, no fake data)
        officialStatusSource: 'MoSPI Contractor Registry (Future Integration)',
        officialStatus: 'Official contractor status: Not available',
        statusVerifiedAt: null,

        // Granular contractor risk scores (Phase 4)
        contractorRiskScore: score,
        contractorRiskLevel: riskLevel,
        contractorRiskSignals: JSON.stringify(signals),
        confidenceScore: confidenceScore
      }
    });

    count++;
  }

  console.log(`Successfully profiled and scored ${count} contractors.`);
}

runProfiling()
  .catch(e => {
    console.error('Error profiling contractors:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
