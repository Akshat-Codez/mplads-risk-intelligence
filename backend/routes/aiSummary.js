import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import { generateDashboardSummary, generateProjectSummary } from '../services/aiSummaryService.js';
import { getAuthorityScopeFilter, isProjectInScope } from '../utils/scopeFilter.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to normalize contractor names
function normalizeName(name) {
  if (!name) return 'unknown';
  const primary = name.split(',')[0].trim();
  return primary
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, '')
    .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
}

/**
 * GET /api/ai/summary - Authority Dashboard AI Executive Briefing
 */
router.get('/summary', authMiddleware, async (req, res) => {
  try {
    const scopeFilter = getAuthorityScopeFilter(req.user);

    const totalProjects = await prisma.project.count({ where: scopeFilter });
    const highRiskCount = await prisma.project.count({ where: { ...scopeFilter, riskLevel: 'HIGH' } });
    const mediumRiskCount = await prisma.project.count({ where: { ...scopeFilter, riskLevel: 'MEDIUM' } });
    const lowRiskCount = await prisma.project.count({ where: { ...scopeFilter, riskLevel: 'LOW' } });
    const insufficientDataCount = await prisma.project.count({ where: { ...scopeFilter, riskLevel: 'INSUFFICIENT DATA' } });

    // Fetch projects within scope to compute multi-signal and signal frequencies
    const projects = await prisma.project.findMany({
      where: scopeFilter,
      select: {
        id: true,
        projectId: true,
        workDescription: true,
        district: true,
        state: true,
        workType: true,
        sanctionedAmount: true,
        riskScore: true,
        riskLevel: true,
        structuredReasons: true,
        riskEvidenceExplanation: true,
        riskComponents: true
      }
    });

    const signalFrequency = {};
    let multiSignalCount = 0;

    projects.forEach(p => {
      if (p.structuredReasons) {
        try {
          const reasons = JSON.parse(p.structuredReasons);
          if (Array.isArray(reasons)) {
            if (reasons.length >= 2) multiSignalCount++;
            reasons.forEach(r => {
              const type = r.type || 'Other';
              signalFrequency[type] = (signalFrequency[type] || 0) + 1;
            });
          }
        } catch (e) {}
      }
    });

    // Find top dominant signal
    let topSignal = 'Peer Deviation';
    let maxFreq = 0;
    for (const [sig, count] of Object.entries(signalFrequency)) {
      if (count > maxFreq) {
        maxFreq = count;
        topSignal = sig;
      }
    }

    // Aggregate district metrics
    const districtMap = new Map();
    projects.forEach(p => {
      const d = p.district || 'Unknown';
      if (!districtMap.has(d)) {
        districtMap.set(d, {
          district: d,
          state: p.state || 'N/A',
          projectCount: 0,
          totalRiskScore: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          signalCounts: {}
        });
      }
      const entry = districtMap.get(d);
      entry.projectCount++;
      entry.totalRiskScore += p.riskScore || 0;
      if (p.riskLevel === 'HIGH') entry.highRiskCount++;
      if (p.riskLevel === 'MEDIUM') entry.mediumRiskCount++;

      if (p.riskEvidenceExplanation) {
        const parts = p.riskEvidenceExplanation.split(' | ');
        parts.forEach(part => {
          if (part && part !== 'No unusual patterns detected.') {
            entry.signalCounts[part] = (entry.signalCounts[part] || 0) + 1;
          }
        });
      }
    });

    const districts = Array.from(districtMap.values()).map(d => {
      let dominant = 'Normal Distribution';
      let bestCount = 0;
      for (const [sig, count] of Object.entries(d.signalCounts)) {
        if (count > bestCount) {
          bestCount = count;
          dominant = sig;
        }
      }
      return {
        district: d.district,
        state: d.state,
        projectCount: d.projectCount,
        avgRiskScore: Math.round((d.totalRiskScore / d.projectCount) * 10) / 10,
        highRiskCount: d.highRiskCount,
        mediumRiskCount: d.mediumRiskCount,
        dominantSignal: dominant
      };
    }).sort((a, b) => b.highRiskCount - a.highRiskCount || b.avgRiskScore - a.avgRiskScore);

    // Fetch top priority projects within authority scope
    const priorityProjects = await prisma.project.findMany({
      where: {
        ...scopeFilter,
        riskLevel: { in: ['HIGH', 'MEDIUM'] }
      },
      orderBy: { riskScore: 'desc' },
      take: 10,
      select: {
        id: true,
        projectId: true,
        workDescription: true,
        district: true,
        state: true,
        workType: true,
        sanctionedAmount: true,
        riskScore: true,
        riskLevel: true,
        riskEvidenceExplanation: true
      }
    });

    const stats = {
      totalProjects,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      insufficientDataCount,
      priorityReviewCount: highRiskCount + mediumRiskCount,
      topSignal,
      multiSignalCount,
      districts: districts.slice(0, 5)
    };

    const aiSummary = await generateDashboardSummary(stats);

    res.json({
      summaryMarkdown: aiSummary.summaryMarkdown,
      isLlmGenerated: aiSummary.isLlmGenerated,
      stats,
      districts,
      priorityProjects,
      generatedAt: aiSummary.generatedAt
    });
  } catch (err) {
    console.error('Error generating AI dashboard summary:', err);
    res.status(500).json({ error: 'Failed to generate AI executive summary' });
  }
});

/**
 * GET /api/ai/project/:projectId/summary - Single Project AI Risk Briefing
 */
router.get('/project/:projectId/summary', authMiddleware, async (req, res) => {
  try {
    const projectId = decodeURIComponent(req.params.projectId);

    const project = await prisma.project.findUnique({
      where: { projectId },
      include: {
        procurements: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify authority scope authorization
    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Project '${projectId}' is outside your authorized authority scope.`
      });
    }

    // Financial structured data
    let finSignals = [];
    if (project.structuredReasons) {
      try {
        finSignals = JSON.parse(project.structuredReasons);
      } catch (e) {}
    }

    // Procurement structured data
    const latestProc = project.procurements && project.procurements.length > 0 ? project.procurements[0] : null;
    let procData = null;
    if (latestProc && latestProc.status === 'Analyzed') {
      let procSignals = [];
      if (project.procurementSignals) {
        try {
          procSignals = JSON.parse(project.procurementSignals);
        } catch (e) {}
      }
      procData = {
        score: latestProc.procurementRiskScore || 0,
        level: latestProc.procurementRiskLevel || 'LOW',
        tenderNumber: latestProc.tenderNumber || 'N/A',
        signals: procSignals
      };
    }

    // Contractor structured data
    let contData = null;
    if (project.vendorName) {
      const norm = normalizeName(project.vendorName);
      const contractor = await prisma.contractor.findUnique({
        where: { normalizedName: norm }
      });
      if (contractor) {
        let contSignals = [];
        if (contractor.contractorRiskSignals) {
          try {
            contSignals = JSON.parse(contractor.contractorRiskSignals);
          } catch (e) {}
        }
        contData = {
          name: contractor.name,
          score: contractor.contractorRiskScore,
          level: contractor.contractorRiskLevel,
          confidence: contractor.confidenceScore,
          signals: contSignals
        };
      }
    }

    // Parse risk components
    let confidence = 50;
    if (procData) confidence += 30;
    if (contData) confidence += 20;

    const projectStructuredData = {
      projectId: project.projectId,
      workDescription: project.workDescription,
      district: project.district,
      state: project.state,
      workType: project.workType,
      sanctionedAmount: project.sanctionedAmount,
      overallRiskScore: project.riskScore,
      overallRiskLevel: project.riskLevel,
      confidence,
      financial: {
        score: project.financialRiskScore || 0,
        level: project.financialRiskLevel || 'LOW',
        signals: finSignals
      },
      procurement: procData,
      contractor: contData
    };

    const aiSummary = await generateProjectSummary(projectStructuredData);

    res.json({
      projectId: project.projectId,
      summaryMarkdown: aiSummary.summaryMarkdown,
      isLlmGenerated: aiSummary.isLlmGenerated,
      structuredData: projectStructuredData,
      generatedAt: aiSummary.generatedAt
    });
  } catch (err) {
    console.error('Error generating project AI summary:', err);
    res.status(500).json({ error: 'Failed to generate project AI summary' });
  }
});

/**
 * GET /api/ai/districts - District-level risk aggregations
 */
router.get('/districts', authMiddleware, async (req, res) => {
  try {
    const scopeFilter = getAuthorityScopeFilter(req.user);

    const projects = await prisma.project.findMany({
      where: scopeFilter,
      select: {
        district: true,
        state: true,
        riskScore: true,
        riskLevel: true,
        riskEvidenceExplanation: true
      }
    });

    const districtMap = new Map();
    projects.forEach(p => {
      const d = p.district || 'Unknown';
      if (!districtMap.has(d)) {
        districtMap.set(d, {
          district: d,
          state: p.state || 'N/A',
          projectCount: 0,
          totalRiskScore: 0,
          highRiskCount: 0,
          mediumRiskCount: 0,
          lowRiskCount: 0,
          insufficientCount: 0,
          signalCounts: {}
        });
      }
      const entry = districtMap.get(d);
      entry.projectCount++;
      entry.totalRiskScore += p.riskScore || 0;
      if (p.riskLevel === 'HIGH') entry.highRiskCount++;
      else if (p.riskLevel === 'MEDIUM') entry.mediumRiskCount++;
      else if (p.riskLevel === 'LOW') entry.lowRiskCount++;
      else if (p.riskLevel === 'INSUFFICIENT DATA') entry.insufficientCount++;

      if (p.riskEvidenceExplanation) {
        const parts = p.riskEvidenceExplanation.split(' | ');
        parts.forEach(part => {
          if (part && part !== 'No unusual patterns detected.') {
            entry.signalCounts[part] = (entry.signalCounts[part] || 0) + 1;
          }
        });
      }
    });

    const results = Array.from(districtMap.values()).map(d => {
      let dominant = 'Normal Distribution';
      let bestCount = 0;
      for (const [sig, count] of Object.entries(d.signalCounts)) {
        if (count > bestCount) {
          bestCount = count;
          dominant = sig;
        }
      }
      return {
        district: d.district,
        state: d.state,
        projectCount: d.projectCount,
        avgRiskScore: Math.round((d.totalRiskScore / d.projectCount) * 10) / 10,
        highRiskCount: d.highRiskCount,
        mediumRiskCount: d.mediumRiskCount,
        lowRiskCount: d.lowRiskCount,
        insufficientCount: d.insufficientCount,
        dominantSignal: dominant
      };
    }).sort((a, b) => b.highRiskCount - a.highRiskCount || b.avgRiskScore - a.avgRiskScore);

    res.json(results);
  } catch (err) {
    console.error('Error fetching district risk data:', err);
    res.status(500).json({ error: 'Failed to retrieve district analytics' });
  }
});

export default router;
