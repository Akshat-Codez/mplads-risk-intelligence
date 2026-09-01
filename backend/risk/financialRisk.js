export default function calculateFinancialRisk(project) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  const {
    financialRiskScore,
    financialProgress,
    physicalProgress,
    expenditureRatio,
    maximumPayment,
    averagePayment,
    sanctionDate,
    peerDeviation,
    ifAnomalySignal,
    amountDeviation,
    elapsedTimeDays
  } = project;

  // Use pre-computed ML pipeline financial risk score as baseline
  if (financialRiskScore != null && financialRiskScore > 0) {
    dataUsed.push('financialRiskScore');
    score = financialRiskScore;
  }

  if (financialProgress !== undefined && physicalProgress !== undefined) {
    dataUsed.push('financialProgress', 'physicalProgress');
    const mismatch = Math.abs(financialProgress - physicalProgress);
    if (mismatch > 30) {
      score += 15;
      signals.push({ signal: 'Physical-Financial Mismatch', description: 'Large difference between physical and financial progress', points: 15, evidence: `Mismatch: ${mismatch}%` });
    }
  } else {
    missingData.push('financialProgress', 'physicalProgress');
  }

  if (maximumPayment !== undefined && averagePayment !== undefined) {
    dataUsed.push('maximumPayment', 'averagePayment');
    if (maximumPayment > 3 * averagePayment) {
      score += 8;
      signals.push({ signal: 'Sudden Spikes', description: 'Maximum payment is unusually high compared to average', points: 8, evidence: `Max: ${maximumPayment}, Avg: ${averagePayment}` });
    }
  }

  if (expenditureRatio !== undefined) {
    dataUsed.push('expenditureRatio');
    if (expenditureRatio > 1.15 || expenditureRatio < 0.5) {
      score += 12;
      signals.push({ signal: 'Fund Utilization', description: 'Unusual fund utilization ratio', points: 12, evidence: `Ratio: ${expenditureRatio}` });
    }
  }

  if (sanctionDate) {
    dataUsed.push('sanctionDate');
    const date = new Date(sanctionDate);
    if (date.getMonth() === 2) { // March is 2 (0-indexed)
      score += 5;
      signals.push({ signal: 'FY-End Spike', description: 'Project sanctioned in March', points: 5, evidence: `Sanctioned in March` });
    }
  }

  if (peerDeviation !== undefined) {
    dataUsed.push('peerDeviation');
    if (peerDeviation > 0.5) {
      score += 10;
      signals.push({ signal: 'Peer Deviation', description: 'High deviation from peers', points: 10, evidence: `Deviation: ${peerDeviation}` });
    }
  }

  if (ifAnomalySignal) {
    dataUsed.push('ifAnomalySignal');
    score += 15;
    signals.push({ signal: 'Isolation Forest Signal', description: 'Anomaly detected by model', points: 15, evidence: 'Signal present' });
  }

  if (amountDeviation !== undefined) {
    dataUsed.push('amountDeviation');
    if (amountDeviation > 0.3) {
      score += 8;
      signals.push({ signal: 'Amount Deviation', description: 'High amount deviation', points: 8, evidence: `Deviation: ${amountDeviation}` });
    }
  }
  
  if (financialProgress !== undefined && elapsedTimeDays !== undefined) {
    dataUsed.push('elapsedTimeDays');
    if (financialProgress < 10 && elapsedTimeDays > 180) {
        score += 10;
        signals.push({ signal: 'Unspent Fund Aging', description: 'Low expenditure with long elapsed time', points: 10, evidence: `Progress: ${financialProgress}%, Elapsed: ${elapsedTimeDays} days`});
    }
    const expectedSpend = (elapsedTimeDays / 365) * 100;
    if (financialProgress > expectedSpend * 2 && expectedSpend > 0) {
        score += 10;
        signals.push({ signal: 'Expenditure Velocity', description: 'Spending faster than expected', points: 10, evidence: `Progress: ${financialProgress}%, Expected: ${expectedSpend.toFixed(2)}%` });
    }
  }

  score = Math.min(score, 100);
  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed, missingData };
}
