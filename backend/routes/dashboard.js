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

export default router;
