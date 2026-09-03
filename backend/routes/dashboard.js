import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import { getAuthorityScopeFilter } from '../utils/scopeFilter.js';
import { getDistrictQueryVariants } from '../data/indiaHierarchy.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to parse JSON fields safely
function parseProjectJsonFields(project) {
  if (!project) return null;
  const clone = { ...project };
  
  if (clone.riskComponents) {
    try {
      clone.riskComponents = JSON.parse(clone.riskComponents);
    } catch (e) {
      clone.riskComponents = {};
    }
  } else {
    clone.riskComponents = {};
  }

  if (clone.structuredReasons) {
    try {
      clone.structuredReasons = JSON.parse(clone.structuredReasons);
    } catch (e) {
      clone.structuredReasons = [];
    }
  } else {
    clone.structuredReasons = [];
  }
  
  return clone;
}

// GET /api/dashboard/summary
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const { state, district } = req.query;
    const scopeFilter = getAuthorityScopeFilter(req.user);

    let where = {};
    if (state && state !== 'ALL' && state !== 'All India') where.state = state;
    if (district && district !== 'ALL' && district !== 'All Districts') {
      const variants = getDistrictQueryVariants(district);
      where.OR = [
        ...(where.OR || []),
        ...variants.map(v => ({ district: { contains: v } }))
      ];
    }

    // Apply mandatory authority scope
    if (Object.keys(scopeFilter).length > 0) {
      if (scopeFilter.AND) {
        where.AND = [...(where.AND || []), ...scopeFilter.AND];
      } else {
        where = { ...where, ...scopeFilter };
      }
    }

    const [
      totalProjects,
      highRisk,
      mediumRisk,
      lowRisk,
      similarWorks,
      aggregations
    ] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.count({ where: { ...where, riskLevel: 'HIGH' } }),
      prisma.project.count({ where: { ...where, riskLevel: 'MEDIUM' } }),
      prisma.project.count({ where: { ...where, riskLevel: 'LOW' } }),
      prisma.project.count({ where: { ...where, similarWorkDetected: true } }),
      prisma.project.aggregate({
        where,
        _sum: {
          sanctionedAmount: true,
          totalDisbursed: true
        }
      })
    ]);

    // Calculate delayed works (sanctionDelayDays > 180 or completionDurationDays > 365)
    const delayedWorks = await prisma.project.count({
      where: {
        ...where,
        OR: [
          { sanctionDelayDays: { gt: 180 } },
          { completionDurationDays: { gt: 365 } }
        ]
      }
    });
    // Compute 7-dimension risk averages
    const dimensionAverages = await prisma.project.aggregate({
      where,
      _avg: {
        financialRiskScore: true,
        procurementRiskScore: true,
        progressRiskScore: true,
        contractorRiskScore: true,
        gisRiskScore: true,
        documentationRiskScore: true,
        crossSignalScore: true,
        confidenceScore: true,
        dataCompleteness: true,
        riskScore: true
      }
    });

    res.json({
      totalProjects,
      highRisk,
      mediumRisk,
      lowRisk,
      totalSanctioned: aggregations._sum.sanctionedAmount || 0,
      totalExpenditure: aggregations._sum.totalDisbursed || 0,
      similarWorks,
      delayedWorks,

      // 7-Dimension Risk Averages
      dimensionAverages: {
        financial: Math.round((dimensionAverages._avg.financialRiskScore || 0) * 10) / 10,
        procurement: Math.round((dimensionAverages._avg.procurementRiskScore || 0) * 10) / 10,
        progress: Math.round((dimensionAverages._avg.progressRiskScore || 0) * 10) / 10,
        contractor: Math.round((dimensionAverages._avg.contractorRiskScore || 0) * 10) / 10,
        gis: Math.round((dimensionAverages._avg.gisRiskScore || 0) * 10) / 10,
        documentation: Math.round((dimensionAverages._avg.documentationRiskScore || 0) * 10) / 10,
        crossSignal: Math.round((dimensionAverages._avg.crossSignalScore || 0) * 10) / 10,
        overall: Math.round((dimensionAverages._avg.riskScore || 0) * 10) / 10,
        confidence: Math.round((dimensionAverages._avg.confidenceScore || 0) * 10) / 10,
        dataCompleteness: Math.round((dimensionAverages._avg.dataCompleteness || 0) * 10) / 10
      },

      // Frontend compatibility aliases (snake_case)
      total_works: totalProjects,
      high_risk_count: highRisk,
      medium_risk_count: mediumRisk,
      low_risk_count: lowRisk,
      total_sanctioned: aggregations._sum.sanctionedAmount || 0,
      total_expenditure: aggregations._sum.totalDisbursed || 0,
      similar_works_count: similarWorks,
      delayed_works_count: delayedWorks
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard summary' });
  }
});

// GET /api/dashboard/dataset-info
router.get('/dataset-info', authMiddleware, async (req, res) => {
  try {
    const count = await prisma.project.count();
    res.json({
      source: 'MPLADS e-SAKSHI Portal (Scored Pipeline)',
      records: count,
      fields: [
        'projectId', 'workType', 'workDescription', 'state', 'district', 
        'mpName', 'recommendedAmount', 'sanctionedAmount', 'totalDisbursed', 
        'expenditureRatio', 'sanctionDelayDays', 'completionDurationDays', 
        'paymentCount', 'vendorName', 'riskScore', 'riskLevel'
      ],
      hasGeolocation: true,

      // Frontend compatibility aliases
      available_fields: '16 columns',
      has_geolocation: false
    });
  } catch (err) {
    console.error('Error fetching dataset info:', err);
    res.status(500).json({ error: 'Failed to retrieve dataset info' });
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', authMiddleware, async (req, res) => {
  try {
    const { state, district } = req.query;
    const scopeFilter = getAuthorityScopeFilter(req.user);

    let where = {};
    if (state) where.state = state;
    if (district) where.district = district;

    // Apply mandatory authority scope
    if (Object.keys(scopeFilter).length > 0) {
      if (scopeFilter.AND) {
        where.AND = [...(where.AND || []), ...scopeFilter.AND];
      } else {
        where = { ...where, ...scopeFilter };
      }
    }

    // Get distribution of risk levels
    const [high, medium, low] = await Promise.all([
      prisma.project.count({ where: { ...where, riskLevel: 'HIGH' } }),
      prisma.project.count({ where: { ...where, riskLevel: 'MEDIUM' } }),
      prisma.project.count({ where: { ...where, riskLevel: 'LOW' } })
    ]);

    const riskDistribution = [
      { name: 'High Risk', value: high, color: '#ef4444' },
      { name: 'Medium Risk', value: medium, color: '#f59e0b' },
      { name: 'Low Risk', value: low, color: '#10b981' }
    ];

    // Get state-wise expenditure (grouped)
    const rawStateExp = await prisma.project.groupBy({
      by: ['state'],
      where,
      _sum: {
        totalDisbursed: true,
        sanctionedAmount: true
      },
      _count: {
        id: true
      }
    });

    const expenditureByState = rawStateExp
      .map(group => ({
        state: group.state || 'Unknown',
        amount: group._sum.totalDisbursed || 0,
        sanctioned: group._sum.sanctionedAmount || 0,
        count: group._count.id
      }))
      .sort((a, b) => b.amount - a.amount);

    // Get category-wise expenditure
    const rawCategoryExp = await prisma.project.groupBy({
      by: ['workType'],
      where,
      _sum: {
        totalDisbursed: true
      },
      _count: {
        id: true
      }
    });

    const expenditureByCategory = rawCategoryExp
      .map(group => ({
        category: group.workType || 'General',
        amount: group._sum.totalDisbursed || 0,
        count: group._count.id
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Limit to top 10

    // Top risk projects
    const rawTopRisk = await prisma.project.findMany({
      where,
      orderBy: { riskScore: 'desc' },
      take: 10
    });

    const topRiskProjects = rawTopRisk.map(parseProjectJsonFields);

    res.json({
      riskDistribution,
      expenditureByState,
      expenditureByCategory,
      topRiskProjects
    });
  } catch (err) {
    console.error('Error fetching dashboard analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

/**
 * GET /api/dashboard/portfolio-analytics
 * Dedicated decision-support analytics for Minister / State / District portfolio.
 * Free of ML internals; computes financial overview, MP-level state benchmarking,
 * project cost distributions, district breakdown, and prioritized attention queue.
 */
router.get('/portfolio-analytics', authMiddleware, async (req, res) => {
  try {
    const scopeFilter = getAuthorityScopeFilter(req.user);
    const assignedState = req.user?.state && req.user.state !== 'All India' ? req.user.state : 'Uttar Pradesh';

    let portfolioWhere = {};
    if (Object.keys(scopeFilter).length > 0) {
      if (scopeFilter.AND) {
        portfolioWhere.AND = [...scopeFilter.AND];
      } else {
        portfolioWhere = { ...scopeFilter };
      }
    }

    // 1. Fetch all portfolio projects
    const portfolioProjects = await prisma.project.findMany({
      where: portfolioWhere,
      orderBy: { riskScore: 'desc' }
    });

    const totalProjects = portfolioProjects.length;

    // Financial Overview
    let totalSanctioned = 0;
    let totalExpenditure = 0;
    let completedCount = 0;
    let ongoingCount = 0;
    let delayedCount = 0;
    let pendingCount = 0;
    let completedExpenditure = 0;
    let ongoingExpenditure = 0;
    let highRiskExpenditure = 0;
    let projectsWithSanction = 0;
    let projectsWithExpenditure = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let insufficientDataCount = 0;

    const sanctionedValues = [];
    const districtAgg = {};
    const categoryAgg = {};

    portfolioProjects.forEach(p => {
      const sanc = p.sanctionedAmount || 0;
      const exp = p.totalDisbursed || 0;
      const status = (p.workStatus || '').toLowerCase();
      const risk = (p.riskLevel || '').toUpperCase();
      const score = p.riskScore || 0;

      if (sanc > 0) {
        totalSanctioned += sanc;
        projectsWithSanction += 1;
        sanctionedValues.push(sanc);
      }

      if (p.totalDisbursed !== null && p.totalDisbursed !== undefined) {
        totalExpenditure += exp;
        projectsWithExpenditure += 1;
      }

      // Status classification
      if (status.includes('complete')) {
        completedCount += 1;
        completedExpenditure += exp;
      } else if (status.includes('delay') || score >= 65) {
        delayedCount += 1;
      } else if (status.includes('sanction') || status.includes('recom')) {
        pendingCount += 1;
      } else {
        ongoingCount += 1;
        ongoingExpenditure += exp;
      }

      // Risk classification
      if (risk === 'HIGH' || risk === 'CRITICAL' || score >= 60) {
        highRiskCount += 1;
        highRiskExpenditure += exp;
      } else if (risk === 'MEDIUM' || (score >= 35 && score < 60)) {
        mediumRiskCount += 1;
      } else if (risk === 'LOW' || (score < 35 && score > 0)) {
        lowRiskCount += 1;
      }

      if (
        !p.sanctionedAmount ||
        p.totalDisbursed === null ||
        p.totalDisbursed === undefined ||
        !p.vendorName ||
        p.vendorName.trim() === '' ||
        p.vendorName === 'Unknown Vendor'
      ) {
        insufficientDataCount += 1;
      }

      // District aggregation
      const dName = p.district ? p.district.trim() : 'Unassigned';
      if (!districtAgg[dName]) {
        districtAgg[dName] = {
          district: dName,
          count: 0,
          sanctioned: 0,
          expenditure: 0,
          highRiskCount: 0,
          completedCount: 0
        };
      }
      districtAgg[dName].count += 1;
      districtAgg[dName].sanctioned += sanc;
      districtAgg[dName].expenditure += exp;
      if (risk === 'HIGH' || score >= 60) districtAgg[dName].highRiskCount += 1;
      if (status.includes('complete')) districtAgg[dName].completedCount += 1;

      // Category aggregation
      const cat = p.workType || 'General';
      if (!categoryAgg[cat]) {
        categoryAgg[cat] = { category: cat, count: 0, sanctioned: 0, expenditure: 0 };
      }
      categoryAgg[cat].count += 1;
      categoryAgg[cat].sanctioned += sanc;
      categoryAgg[cat].expenditure += exp;
    });

    // Median and extremes
    sanctionedValues.sort((a, b) => a - b);
    const medianCost = sanctionedValues.length > 0 
      ? sanctionedValues[Math.floor(sanctionedValues.length / 2)] 
      : 0;

    const sortedBySanction = [...portfolioProjects].sort((a, b) => (b.sanctionedAmount || 0) - (a.sanctionedAmount || 0));
    const largestProject = sortedBySanction.length > 0 ? {
      id: sortedBySanction[0].projectId,
      workTitle: sortedBySanction[0].workDescription || sortedBySanction[0].workTitle,
      sanctionedAmount: sortedBySanction[0].sanctionedAmount,
      district: sortedBySanction[0].district
    } : null;

    const projectsWithNonZeroSanction = sortedBySanction.filter(p => (p.sanctionedAmount || 0) > 0);
    const smallestProject = projectsWithNonZeroSanction.length > 0 ? {
      id: projectsWithNonZeroSanction[projectsWithNonZeroSanction.length - 1].projectId,
      workTitle: projectsWithNonZeroSanction[projectsWithNonZeroSanction.length - 1].workDescription || projectsWithNonZeroSanction[projectsWithNonZeroSanction.length - 1].workTitle,
      sanctionedAmount: projectsWithNonZeroSanction[projectsWithNonZeroSanction.length - 1].sanctionedAmount,
      district: projectsWithNonZeroSanction[projectsWithNonZeroSanction.length - 1].district
    } : null;

    const utilization = totalSanctioned > 0 ? ((totalExpenditure / totalSanctioned) * 100) : 0;
    const avgProjectCost = projectsWithSanction > 0 ? (totalSanctioned / projectsWithSanction) : 0;
    const avgExpenditurePerProject = projectsWithExpenditure > 0 ? (totalExpenditure / projectsWithExpenditure) : 0;
    const remainingAmount = Math.max(0, totalSanctioned - totalExpenditure);

    const completedAvgSpend = completedCount > 0 ? (completedExpenditure / completedCount) : 0;
    const ongoingAvgSpend = ongoingCount > 0 ? (ongoingExpenditure / ongoingCount) : 0;
    const highRiskAvgSpend = highRiskCount > 0 ? (highRiskExpenditure / highRiskCount) : 0;

    // 2. State-level MP Benchmark calculation (Section 8)
    const stateProjects = await prisma.project.findMany({
      where: { state: assignedState },
      select: { mpName: true, sanctionedAmount: true, totalDisbursed: true, workStatus: true }
    });

    const mpMap = {};
    let stateTotalExp = 0;
    let stateExpProjectCount = 0;

    stateProjects.forEach(p => {
      const mp = (p.mpName || '').trim();
      const sanc = p.sanctionedAmount || 0;
      const exp = p.totalDisbursed || 0;
      const status = (p.workStatus || '').toLowerCase();

      if (p.totalDisbursed !== null && p.totalDisbursed !== undefined) {
        stateTotalExp += exp;
        stateExpProjectCount += 1;
      }

      if (mp && mp !== 'N/A' && mp !== 'Unknown') {
        if (!mpMap[mp]) {
          mpMap[mp] = { count: 0, sanctioned: 0, expenditure: 0, completed: 0 };
        }
        mpMap[mp].count += 1;
        mpMap[mp].sanctioned += sanc;
        mpMap[mp].expenditure += exp;
        if (status.includes('complete')) mpMap[mp].completed += 1;
      }
    });

    const mpList = Object.values(mpMap);
    const mpsWithExp = mpList.filter(m => m.expenditure > 0);
    const stateAvgSpendPerMp = mpsWithExp.length > 0
      ? (mpsWithExp.reduce((a, m) => a + m.expenditure, 0) / mpsWithExp.length)
      : 0;

    const mpsWithSanc = mpList.filter(m => m.sanctioned > 0);
    const stateAvgSanctionedPerMp = mpsWithSanc.length > 0
      ? (mpsWithSanc.reduce((a, m) => a + m.sanctioned, 0) / mpsWithSanc.length)
      : 0;

    const stateTotalSancAllMps = mpList.reduce((a, m) => a + m.sanctioned, 0);
    const stateTotalExpAllMps = mpList.reduce((a, m) => a + m.expenditure, 0);
    const stateAvgUtilization = stateTotalSancAllMps > 0
      ? ((stateTotalExpAllMps / stateTotalSancAllMps) * 100)
      : 0;

    const stateTotalProjectsAllMps = mpList.reduce((a, m) => a + m.count, 0);
    const stateTotalCompletedAllMps = mpList.reduce((a, m) => a + m.completed, 0);
    const stateAvgCompletionRate = stateTotalProjectsAllMps > 0
      ? ((stateTotalCompletedAllMps / stateTotalProjectsAllMps) * 100)
      : 0;

    const stateAvgSpendPerProject = stateExpProjectCount > 0 ? (stateTotalExp / stateExpProjectCount) : 0;

    // District summary list
    const districtSummary = Object.values(districtAgg).map(d => ({
      ...d,
      utilization: d.sanctioned > 0 ? Number(((d.expenditure / d.sanctioned) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.count - a.count);

    // Top attention projects
    const topAttentionProjects = portfolioProjects
      .filter(p => (p.riskScore || 0) >= 40 || p.riskLevel === 'HIGH' || p.riskLevel === 'CRITICAL')
      .slice(0, 10)
      .map(p => {
        const parsed = parseProjectJsonFields(p);
        return {
          id: p.id,
          projectId: p.projectId,
          workTitle: p.workDescription || p.workTitle,
          district: p.district,
          state: p.state,
          sanctionedAmount: p.sanctionedAmount,
          actualExpenditure: p.totalDisbursed,
          riskScore: p.riskScore || 0,
          riskLevel: p.riskLevel || 'MEDIUM',
          reasons: parsed.structuredReasons || [],
          action: (p.riskScore || 0) >= 70 ? 'Formal Field Audit Required' : 'Physical Verification Recommended'
        };
      });

    res.json({
      summary: {
        totalProjects,
        totalSanctioned,
        totalExpenditure,
        utilization: Number(utilization.toFixed(1)),
        completedCount,
        ongoingCount,
        delayedCount,
        pendingCount,
        highRiskCount,
        mediumRiskCount,
        lowRiskCount,
        insufficientDataCount
      },
      financialOverview: {
        totalSanctioned,
        totalExpenditure,
        remainingAmount,
        avgProjectCost,
        avgExpenditurePerProject,
        utilizationPercentage: Number(utilization.toFixed(1)),
        completedAvgSpend,
        ongoingAvgSpend,
        highRiskAvgSpend
      },
      stateBenchmark: {
        state: assignedState,
        mpCountEvaluated: mpList.length,
        yourAvgSpendPerProject: avgExpenditurePerProject,
        stateAvgSpendPerProject,
        yourAvgSpendPerMp: totalExpenditure,
        stateAvgSpendPerMp,
        yourSanctionedTotal: totalSanctioned,
        stateAvgSanctionedPerMp,
        yourUtilization: Number(utilization.toFixed(1)),
        stateAvgUtilization: Number(stateAvgUtilization.toFixed(1)),
        yourCompletionRate: totalProjects > 0 ? Number(((completedCount / totalProjects) * 100).toFixed(1)) : 0,
        stateAvgCompletionRate: Number(stateAvgCompletionRate.toFixed(1))
      },
      costOverview: {
        avgCost: avgProjectCost,
        medianCost,
        largestProject,
        smallestProject,
        categoryBreakdown: Object.values(categoryAgg).sort((a, b) => b.sanctioned - a.sanctioned)
      },
      districtSummary,
      topAttentionProjects
    });
  } catch (err) {
    console.error('Error fetching portfolio analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve portfolio analytics' });
  }
});

export default router;
