/**
 * Anomaly Models Abstraction Layer
 * Provides unified interface for different anomaly detection strategies:
 * - Isolation Forest (via Python ML pipeline)
 * - Rule-based Engine (heuristic thresholds)
 * - Peer Group Comparison (statistical Z-score)
 * 
 * The Node.js backend uses rule-based and peer-group models directly.
 * Isolation Forest results are consumed from the Python ML pipeline output
 * already stored in the database (ifAnomalySignal, if_decision_score).
 */

/**
 * Rule-based anomaly detector
 * Evaluates a set of configurable rules against project data
 */
export class RuleEngine {
  constructor(rules = []) {
    this.rules = rules;
  }

  /**
   * Add a rule
   * @param {Object} rule - { name, condition: (project) => boolean, score: number, description: string }
   */
  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * Evaluate all rules against a project
   * @param {Object} project
   * @returns {{ triggered: Array, totalScore: number }}
   */
  evaluate(project) {
    const triggered = [];
    let totalScore = 0;

    for (const rule of this.rules) {
      try {
        if (rule.condition(project)) {
          triggered.push({
            name: rule.name,
            score: rule.score,
            description: typeof rule.description === 'function' ? rule.description(project) : rule.description
          });
          totalScore += rule.score;
        }
      } catch (e) {
        // Rule evaluation error - skip silently
      }
    }

    return { triggered, totalScore: Math.min(100, totalScore) };
  }
}

/**
 * Statistical Z-Score anomaly detector
 * Detects anomalies in a numeric field relative to a population
 */
export class ZScoreDetector {
  /**
   * @param {number} threshold - Z-score threshold for anomaly (default 2.0)
   */
  constructor(threshold = 2.0) {
    this.threshold = threshold;
  }

  /**
   * Calculate Z-score for a value relative to a population
   * @param {number} value
   * @param {number[]} population
   * @returns {{ zScore: number, isAnomaly: boolean, percentile: number }}
   */
  evaluate(value, population) {
    if (!population || population.length < 3 || value === null || value === undefined) {
      return { zScore: 0, isAnomaly: false, percentile: 50 };
    }

    const mean = population.reduce((s, v) => s + v, 0) / population.length;
    const variance = population.reduce((s, v) => s + (v - mean) ** 2, 0) / (population.length - 1);
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) {
      return { zScore: 0, isAnomaly: false, percentile: 50 };
    }

    const zScore = (value - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) > this.threshold;
    
    // Approximate percentile from Z-score
    const sorted = [...population].sort((a, b) => a - b);
    const rank = sorted.filter(v => v <= value).length;
    const percentile = Math.round((rank / sorted.length) * 100);

    return { zScore: Math.round(zScore * 100) / 100, isAnomaly, percentile };
  }
}

/**
 * Isolation Forest result consumer
 * Wraps the pre-computed IF results from the Python ML pipeline
 */
export class IsolationForestConsumer {
  /**
   * Get anomaly status from pre-computed results
   * @param {Object} project
   * @returns {{ isAnomaly: boolean, decisionScore: number, confidence: string }}
   */
  evaluate(project) {
    const isAnomaly = project.ifAnomalySignal === true;
    const decisionScore = project.ifDecisionScore || project.if_decision_score || 0;
    
    let confidence = 'LOW';
    if (Math.abs(decisionScore) > 0.3) confidence = 'HIGH';
    else if (Math.abs(decisionScore) > 0.15) confidence = 'MEDIUM';
    
    return { isAnomaly, decisionScore, confidence };
  }
}

/**
 * Create a standard financial anomaly rule engine
 * Pre-configured with common MPLADS financial risk rules
 */
export function createFinancialRuleEngine() {
  const engine = new RuleEngine();
  
  engine.addRule({
    name: 'HIGH_EXPENDITURE_RATIO',
    condition: (p) => (p.expenditureRatio || 0) > 1.15,
    score: 12,
    description: (p) => `Expenditure ratio ${(p.expenditureRatio || 0).toFixed(2)} exceeds sanctioned budget by ${(((p.expenditureRatio || 1) - 1) * 100).toFixed(1)}%`
  });

  engine.addRule({
    name: 'LOW_FUND_UTILIZATION',
    condition: (p) => (p.expenditureRatio || 0) > 0 && (p.expenditureRatio || 0) < 0.5 && (p.completionDurationDays || 0) > 180,
    score: 10,
    description: 'Low fund utilization (<50%) despite extended project duration'
  });

  engine.addRule({
    name: 'PAYMENT_SPIKE',
    condition: (p) => (p.maximumPayment || 0) > 3 * (p.averagePayment || 1) && (p.paymentCount || 0) > 1,
    score: 8,
    description: (p) => `Maximum payment ₹${((p.maximumPayment || 0) / 100000).toFixed(1)}L is ${((p.maximumPayment || 1) / (p.averagePayment || 1)).toFixed(1)}x the average`
  });

  engine.addRule({
    name: 'FY_END_SANCTION',
    condition: (p) => {
      const date = p.sanctionDate || '';
      return date.includes('-03-') || date.includes('/03/');
    },
    score: 5,
    description: 'Project sanctioned in March (Financial Year-end rush indicator)'
  });

  engine.addRule({
    name: 'AMOUNT_DEVIATION',
    condition: (p) => Math.abs(p.amountDeviation || 0) > 0.3,
    score: 8,
    description: (p) => `Amount deviation of ${((p.amountDeviation || 0) * 100).toFixed(1)}% between recommended and sanctioned amounts`
  });

  return engine;
}

export default { RuleEngine, ZScoreDetector, IsolationForestConsumer, createFinancialRuleEngine };
