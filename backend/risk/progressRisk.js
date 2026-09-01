export default function calculateProgressRisk(project) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  const {
    completionDurationDays,
    plannedDurationDays,
    physicalProgress,
    financialProgress,
    elapsedTimeDays,
    stagnationDays,
    daysRemaining,
    workStatus
  } = project;

  if (completionDurationDays !== undefined && plannedDurationDays !== undefined) {
    dataUsed.push('completionDurationDays', 'plannedDurationDays');
    if (completionDurationDays > plannedDurationDays) {
      score += 15;
      signals.push({ signal: 'Schedule Delay', description: 'Actual duration exceeds planned', points: 15, evidence: `Actual: ${completionDurationDays}, Planned: ${plannedDurationDays}` });
    }
  } else {
    missingData.push('completionDurationDays or plannedDurationDays');
  }

  if (physicalProgress !== undefined && elapsedTimeDays !== undefined && plannedDurationDays !== undefined) {
    dataUsed.push('physicalProgress', 'elapsedTimeDays');
    const timeElapsedPercent = (elapsedTimeDays / plannedDurationDays) * 100;
    if (physicalProgress < 30 && timeElapsedPercent > 50) {
      score += 20;
      signals.push({ signal: 'Low Physical Progress', description: 'Very low progress despite > 50% time elapsed', points: 20, evidence: `Progress: ${physicalProgress}%, Time elapsed: ${timeElapsedPercent}%` });
    }
    
    // Progress Velocity
    if (daysRemaining > 0 && (100 - physicalProgress) > 0) {
       const requiredVelocity = (100 - physicalProgress) / daysRemaining;
       if (requiredVelocity > 1.5) { // Arbitrary threshold for slow rate requiring high future velocity
          score += 10;
          signals.push({ signal: 'Progress Velocity', description: 'Slow rate relative to deadline', points: 10, evidence: `Required progress/day: ${requiredVelocity.toFixed(2)}%` });
       }
    }
  }

  if (physicalProgress !== undefined && financialProgress !== undefined) {
    dataUsed.push('financialProgress');
    const mismatch = Math.abs(physicalProgress - financialProgress);
    if (mismatch > 25) {
      score += 12;
      signals.push({ signal: 'Physical-Financial Mismatch', description: 'Significant difference between physical and financial progress', points: 12, evidence: `Mismatch: ${mismatch}%` });
    }
  }

  if (stagnationDays !== undefined) {
    dataUsed.push('stagnationDays');
    if (stagnationDays > 90) {
      score += 15;
      signals.push({ signal: 'Stagnation', description: 'Project stagnant for > 90 days', points: 15, evidence: `Stagnant for ${stagnationDays} days` });
    }
  }

  if (daysRemaining !== undefined && physicalProgress !== undefined) {
    dataUsed.push('daysRemaining');
    if (daysRemaining < 60 && physicalProgress < 70) {
      score += 12;
      signals.push({ signal: 'Deadline Proximity', description: 'Approaching deadline with low progress', points: 12, evidence: `Remaining days: ${daysRemaining}, Progress: ${physicalProgress}%` });
    }
  }

  if (workStatus !== undefined) {
    dataUsed.push('workStatus');
    if (workStatus === 'Physical Inspection' && !project.completionDate) {
      score += 5;
      signals.push({ signal: 'Status anomaly', description: 'Status is Physical Inspection but no completion date', points: 5, evidence: 'Status vs Date mismatch' });
    }
  }

  score = Math.min(score, 100);
  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed, missingData };
}
