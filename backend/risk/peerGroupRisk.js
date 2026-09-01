/**
 * Peer Group Risk Engine
 * Groups projects by category, scale tier, district/state, and duration to
 * evaluate risk strictly relative to peer cohort.
 */

/**
 * Classify a project into a peer group key
 */
function getPeerGroupKey(project) {
  const workType = (project.workType || 'OTHER').toUpperCase();
  const district = (project.district || 'UNKNOWN').toUpperCase();
  const state = (project.state || 'UNKNOWN').toUpperCase();
  
  // Scale tier classification
  const amount = project.sanctionedAmount || 0;
  let scaleTier = 'MICRO';  // < 5L
  if (amount >= 5000000) scaleTier = 'LARGE';      // >= 50L
  else if (amount >= 2000000) scaleTier = 'MEDIUM'; // >= 20L
  else if (amount >= 500000) scaleTier = 'SMALL';   // >= 5L
  
  return `${state}|${district}|${workType}|${scaleTier}`;
}

/**
 * Build peer groups from an array of all projects
 */
function buildPeerGroups(allProjects) {
  const groups = new Map();
  
  for (const p of allProjects) {
    const key = getPeerGroupKey(p);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(p);
  }
  
  return groups;
}

/**
 * Calculate peer-relative statistics for a project
 */
function getPeerStatistics(project, peerGroup) {
  if (!peerGroup || peerGroup.length < 3) {
    return null; // Not enough peers for meaningful comparison
  }
  
  const amounts = peerGroup.map(p => p.sanctionedAmount || 0).sort((a, b) => a - b);
  const durations = peerGroup.map(p => p.completionDurationDays || 0).filter(d => d > 0).sort((a, b) => a - b);
  const ratios = peerGroup.map(p => p.expenditureRatio || 0).filter(r => r > 0);
  
  const median = arr => {
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };
  
  const mean = arr => arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
  const stdDev = arr => {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
  };
  
  return {
    peerCount: peerGroup.length,
    amountMedian: median(amounts),
    amountStdDev: stdDev(amounts),
    durationMedian: median(durations),
    durationStdDev: stdDev(durations),
    ratioMean: mean(ratios),
    ratioStdDev: stdDev(ratios)
  };
}

/**
 * Calculate peer group anomaly score for a project
 * @param {Object} project - Project with all DB fields
 * @param {Array} allProjects - All projects for peer group construction
 * @returns {{ score, level, signals, dataUsed, missingData }}
 */
export function calculatePeerGroupRisk(project, allProjects = []) {
  const signals = [];
  const dataUsed = [];
  const missingData = [];
  let score = 0;
  
  if (!allProjects || allProjects.length < 5) {
    return { score: 0, level: 'LOW', signals: [], dataUsed: [], missingData: ['Insufficient project pool for peer analysis'] };
  }
  
  const peerGroups = buildPeerGroups(allProjects);
  const peerKey = getPeerGroupKey(project);
  const peerGroup = peerGroups.get(peerKey) || [];
  
  const stats = getPeerStatistics(project, peerGroup);
  
  if (!stats) {
    return { score: 0, level: 'LOW', signals: [], dataUsed: ['peerGroupKey'], missingData: ['Peer group too small (<3 projects)'] };
  }
  
  dataUsed.push('sanctionedAmount', 'workType', 'district', 'state', 'peerGroup');
  
  // 1. Cost anomaly relative to peer median
  const amount = project.sanctionedAmount || 0;
  if (stats.amountStdDev > 0 && amount > 0) {
    const zScore = Math.abs((amount - stats.amountMedian) / stats.amountStdDev);
    if (zScore > 2.5) {
      const pts = Math.min(20, Math.round(zScore * 5));
      score += pts;
      signals.push({
        signal: 'Peer Cost Outlier',
        description: `Project cost ₹${(amount / 100000).toFixed(1)}L deviates ${zScore.toFixed(1)} std devs from peer median ₹${(stats.amountMedian / 100000).toFixed(1)}L (${stats.peerCount} peers)`,
        points: pts,
        evidence: `Z-score: ${zScore.toFixed(2)}, Peer group: ${peerKey}`
      });
    }
  }
  
  // 2. Duration anomaly relative to peers
  const duration = project.completionDurationDays || 0;
  if (stats.durationStdDev > 0 && duration > 0) {
    const zScore = (duration - stats.durationMedian) / stats.durationStdDev;
    if (zScore > 2.0) {
      const pts = Math.min(15, Math.round(zScore * 4));
      score += pts;
      signals.push({
        signal: 'Peer Duration Outlier',
        description: `Completion took ${duration} days vs peer median ${stats.durationMedian.toFixed(0)} days`,
        points: pts,
        evidence: `Z-score: ${zScore.toFixed(2)}`
      });
      dataUsed.push('completionDurationDays');
    }
  }
  
  // 3. Expenditure ratio anomaly
  const ratio = project.expenditureRatio || 0;
  if (stats.ratioStdDev > 0 && ratio > 0) {
    const zScore = Math.abs((ratio - stats.ratioMean) / stats.ratioStdDev);
    if (zScore > 2.0) {
      const pts = Math.min(12, Math.round(zScore * 4));
      score += pts;
      signals.push({
        signal: 'Peer Expenditure Ratio Outlier',
        description: `Expenditure ratio ${ratio.toFixed(2)} vs peer mean ${stats.ratioMean.toFixed(2)}`,
        points: pts,
        evidence: `Z-score: ${zScore.toFixed(2)}`
      });
      dataUsed.push('expenditureRatio');
    }
  }
  
  // 4. Peer deviation from existing ML pipeline
  if (project.peerDeviation && Math.abs(project.peerDeviation) > 0.5) {
    const pts = Math.min(10, Math.round(Math.abs(project.peerDeviation) * 10));
    score += pts;
    signals.push({
      signal: 'ML Peer Deviation Signal',
      description: `Pre-computed peer deviation: ${(project.peerDeviation * 100).toFixed(1)}%`,
      points: pts,
      evidence: `Peer median: ₹${((project.peerMedianAmount || 0) / 100000).toFixed(1)}L`
    });
    dataUsed.push('peerDeviation', 'peerMedianAmount');
  }
  
  score = Math.min(100, score);
  const level = score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW';
  
  return { score, level, signals, dataUsed, missingData };
}

export default calculatePeerGroupRisk;
