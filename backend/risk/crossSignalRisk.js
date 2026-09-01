export function calculateCrossSignalRisk(project) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  const addSignal = (points, message) => {
    score += points;
    signals.push({ message, points });
  };

  // Case 1: High Financial Progress + Low Physical Progress
  if (project.financialProgress !== undefined && project.physicalProgress !== undefined) {
    dataUsed.push('financialProgress', 'physicalProgress');
    if (project.financialProgress > 80 && project.physicalProgress < 50) {
      addSignal(25, 'Financial-Physical Progress Divergence');
    }
  } else {
    if (project.financialProgress === undefined) missingData.push('financialProgress');
    if (project.physicalProgress === undefined) missingData.push('physicalProgress');
  }

  // Case 2: Completed status + Zero expenditure
  if (project.workStatus !== undefined && project.totalDisbursed !== undefined) {
    dataUsed.push('workStatus', 'totalDisbursed');
    if (String(project.workStatus).toLowerCase().includes('completed') && (!project.totalDisbursed || project.totalDisbursed === 0)) {
      addSignal(30, 'Completed With Zero Expenditure');
    }
  } else {
    if (project.workStatus === undefined) missingData.push('workStatus');
    if (project.totalDisbursed === undefined) missingData.push('totalDisbursed');
  }

  // Case 3: High financial risk + High contractor risk
  if (project.financialRiskScore !== undefined && project.contractorRiskScore !== undefined) {
    dataUsed.push('financialRiskScore', 'contractorRiskScore');
    if (project.financialRiskScore > 50 && project.contractorRiskScore > 50) {
      addSignal(20, 'Dual Financial-Contractor Risk');
    }
  }

  // Case 4: Multiple cost revisions + High contractor concentration
  if (project.revisedEstimatesCount !== undefined && project.contractorRiskScore !== undefined) {
    dataUsed.push('revisedEstimatesCount');
    if (project.revisedEstimatesCount > 2 && project.contractorRiskScore > 40) {
      addSignal(15, 'Revised Estimates + Concentrated Contractor');
    }
  }

  // Case 5: High procurement deviation + Monopoly contractor pattern
  if (project.procurementDeviation !== undefined && project.monopolyPattern !== undefined) {
    dataUsed.push('procurementDeviation', 'monopolyPattern');
    if (project.procurementDeviation > 20 && project.monopolyPattern === true) {
      addSignal(15, 'High procurement deviation + Monopoly contractor pattern');
    }
  }

  // Case 6: Large stagnation + High expenditure
  if (project.stagnationDays !== undefined && project.expenditureRatio !== undefined) {
    dataUsed.push('stagnationDays', 'expenditureRatio');
    if (project.stagnationDays > 120 && project.expenditureRatio > 0.7) {
      addSignal(20, 'Spending Without Progress');
    }
  }

  // Case 7: Missing critical documents + High risk score
  if (project.documentCompleteness !== undefined && project.riskScore !== undefined) {
    dataUsed.push('documentCompleteness', 'riskScore');
    if (project.documentCompleteness < 40 && project.riskScore > 50) {
      addSignal(10, 'High Risk With Poor Documentation');
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed: [...new Set(dataUsed)], missingData: [...new Set(missingData)] };
}

export default calculateCrossSignalRisk;
