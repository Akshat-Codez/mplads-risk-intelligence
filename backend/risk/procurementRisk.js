export default function calculateProcurementRisk(project) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  const {
    procurementRiskScore,
    documentsChecklist,
    sanctionedAmount,
    tenderToSanctionRatio
  } = project;

  // Use existing procurement analysis score if available
  if (procurementRiskScore != null && procurementRiskScore > 0) {
    dataUsed.push('procurementRiskScore');
    score += procurementRiskScore;
  }

  // Check BOQ availability from documentsChecklist (stored as JSON object {boq: bool, ...})
  if (documentsChecklist) {
    dataUsed.push('documentsChecklist');
    let docs = {};
    if (typeof documentsChecklist === 'string') {
      try { docs = JSON.parse(documentsChecklist); } catch (e) { docs = {}; }
    } else if (typeof documentsChecklist === 'object' && !Array.isArray(documentsChecklist)) {
      docs = documentsChecklist;
    }
    
    if (!docs.boq) {
      score += 15;
      signals.push({ signal: 'Missing BOQ document', description: 'Bill of Quantities is missing from project documentation', points: 15, evidence: 'No BOQ found in documents checklist' });
    }
  } else {
    missingData.push('documentsChecklist');
  }

  // Round-number clustering detection
  if (sanctionedAmount != null && sanctionedAmount > 0) {
    dataUsed.push('sanctionedAmount');
    if (sanctionedAmount % 100000 === 0) {
      score += 5;
      signals.push({ signal: 'Round-number clustering', description: 'Sanctioned amount is a suspicious round number', points: 5, evidence: `Amount: ₹${(sanctionedAmount / 100000).toFixed(1)}L` });
    }
  }

  // Tender-to-sanction ratio anomaly
  if (tenderToSanctionRatio != null) {
    dataUsed.push('tenderToSanctionRatio');
    if (tenderToSanctionRatio > 1.2 || tenderToSanctionRatio < 0.8) {
      score += 8;
      signals.push({ signal: 'Tender-to-Sanction Ratio Anomaly', description: 'Unusual ratio between tender and sanction amounts', points: 8, evidence: `Ratio: ${tenderToSanctionRatio.toFixed(2)}` });
    }
  }

  score = Math.min(score, 100);
  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed, missingData };
}
