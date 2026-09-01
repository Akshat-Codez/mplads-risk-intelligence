export default function calculateContractorRisk(project, contractorProfile) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  if (contractorProfile) {
    dataUsed.push('contractorProfile');
    
    if (contractorProfile.contractorRiskScore !== undefined) {
      score += contractorProfile.contractorRiskScore;
    }

    if (contractorProfile.concentrationScore > 70) {
      score += 15;
      signals.push({ signal: 'High concentration', description: 'High concentration of projects with this contractor', points: 15, evidence: `Score: ${contractorProfile.concentrationScore}` });
    }

    if (contractorProfile.projectCount > 15) { // Assuming same district context based on profile scope
      score += 10;
      signals.push({ signal: 'Too many projects', description: 'Contractor has > 15 projects', points: 10, evidence: `Count: ${contractorProfile.projectCount}` });
    }

    if (contractorProfile.totalExpenditure && contractorProfile.totalExpenditure > 10000000) { // arbitrary high threshold
      score += 8;
      signals.push({ signal: 'High total expenditure', description: 'Indicator of monopoly', points: 8, evidence: `Expenditure: ${contractorProfile.totalExpenditure}` });
    }
    
    if (contractorProfile.vendorCountPerWork === 1 && project.sanctionedAmount > 1000000) {
      score += 5;
      signals.push({ signal: 'Single vendor', description: 'Single vendor for large project', points: 5, evidence: `Single vendor for amount ${project.sanctionedAmount}` });
    }

    if (contractorProfile.workTypes && project.workType) {
      if (!contractorProfile.workTypes.includes(project.workType)) {
        score += 10;
        signals.push({ signal: 'Category compatibility', description: 'Contractor workTypes do not include project workType', points: 10, evidence: `Contractor types: ${contractorProfile.workTypes}, Project type: ${project.workType}` });
      }
    }

  } else {
    missingData.push('contractorProfile');
  }

  score = Math.min(score, 100);
  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed, missingData };
}
