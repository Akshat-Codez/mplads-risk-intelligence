import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import { getAuthorityScopeFilter, isProjectInScope } from '../utils/scopeFilter.js';

const router = express.Router();
const prisma = new PrismaClient();

const ALLOWED_DECISIONS = [
  'CONFIRMED',
  'FALSE_POSITIVE',
  'REQUIRES_INVESTIGATION',
  'INSUFFICIENT_DATA'
];

/**
 * POST /api/projects/:projectId/feedback - Submit official officer verification feedback
 */
router.post('/projects/:projectId/feedback', authMiddleware, async (req, res) => {
  try {
    const projectId = decodeURIComponent(req.params.projectId);
    const { decision, reason, modelType } = req.body;

    // 1. Validate decision
    if (!decision || !ALLOWED_DECISIONS.includes(decision)) {
      return res.status(400).json({
        error: `Invalid decision '${decision}'. Allowed decisions: ${ALLOWED_DECISIONS.join(', ')}`
      });
    }

    // 2. Validate reason length
    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return res.status(400).json({
        error: 'A valid justification reason (at least 5 characters) is required for official verification.'
      });
    }

    // 3. Find target project
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { projectId: projectId },
          { id: projectId }
        ]
      },
      include: {
        procurements: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: `Project '${projectId}' not found` });
    }

    // Verify authority scope authorization
    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Cannot record feedback for project '${projectId}' outside your authorized authority scope.`
      });
    }

    // 4. Capture exact snapshot of AI prediction state AT TIME OF REVIEW
    const aiPredictionSnapshot = {
      overallRiskScore: project.riskScore,
      overallRiskLevel: project.riskLevel,
      financialRiskScore: project.financialRiskScore || 0,
      procurementRiskScore: project.procurementRiskScore || 0,
      contractorRiskScore: project.contractorRiskScore || 0,
      riskEvidenceExplanation: project.riskEvidenceExplanation || 'No unusual patterns detected',
      structuredReasons: project.structuredReasons || '[]',
      snapshotTimestamp: new Date().toISOString()
    };

    // 5. Create Feedback record (Do NOT modify project riskScore / riskLevel!)
    const feedback = await prisma.feedback.create({
      data: {
        projectId: project.id,
        modelVersion: 'v1.0-nirman-ensemble',
        overallRiskScore: project.riskScore,
        riskLevel: project.riskLevel,
        aiPrediction: JSON.stringify(aiPredictionSnapshot),
        modelType: modelType || 'OVERALL',
        prediction: JSON.stringify(aiPredictionSnapshot),
        officerDecision: decision,
        decisionReason: reason.trim(),
        reason: reason.trim(),
        createdById: req.user.id
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
            authorityId: true,
            district: true,
            state: true
          }
        }
      }
    });

    // 6. Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        projectId: project.id,
        action: 'SUBMIT_HUMAN_FEEDBACK',
        entity: 'Project',
        details: `Officer ${req.user.name || req.user.authorityId} submitted decision '${decision}' for project ${project.projectId} (AI Risk: ${project.riskScore}). Reason: "${reason.trim()}"`
      }
    });

    res.status(201).json({
      message: 'Official verification feedback recorded successfully.',
      feedback: {
        id: feedback.id,
        projectId: project.projectId,
        modelVersion: feedback.modelVersion,
        overallRiskScore: feedback.overallRiskScore,
        riskLevel: feedback.riskLevel,
        aiPrediction: JSON.parse(feedback.aiPrediction || '{}'),
        officerDecision: feedback.officerDecision,
        reason: feedback.reason,
        officer: feedback.createdBy,
        createdAt: feedback.createdAt
      }
    });
  } catch (err) {
    console.error('Error recording verification feedback:', err);
    res.status(500).json({ error: 'Failed to record verification feedback' });
  }
});

/**
 * GET /api/projects/:projectId/feedback - Retrieve historical feedback reviews for a project
 */
router.get('/projects/:projectId/feedback', authMiddleware, async (req, res) => {
  try {
    const projectId = decodeURIComponent(req.params.projectId);

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { projectId: projectId },
          { id: projectId }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: `Project '${projectId}' not found` });
    }

    // Verify authority scope authorization
    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Feedback for project '${projectId}' is outside your authorized authority scope.`
      });
    }

    const feedbacks = await prisma.feedback.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
            authorityId: true,
            district: true,
            state: true
          }
        }
      }
    });

    const mapped = feedbacks.map(f => ({
      id: f.id,
      projectId: project.projectId,
      modelVersion: f.modelVersion,
      overallRiskScore: f.overallRiskScore,
      riskLevel: f.riskLevel,
      aiPrediction: f.aiPrediction ? JSON.parse(f.aiPrediction) : null,
      officerDecision: f.officerDecision,
      reason: f.reason || f.decisionReason,
      officer: f.createdBy,
      createdAt: f.createdAt
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching project feedback history:', err);
    res.status(500).json({ error: 'Failed to retrieve feedback history' });
  }
});

/**
 * GET /api/feedback - List all verification feedback records
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const scopeFilter = getAuthorityScopeFilter(req.user);
    const feedbackWhere = Object.keys(scopeFilter).length > 0 ? { project: scopeFilter } : {};

    const feedbacks = await prisma.feedback.findMany({
      where: feedbackWhere,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        project: {
          select: {
            projectId: true,
            workDescription: true,
            district: true,
            state: true,
            workType: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true,
            authorityId: true
          }
        }
      }
    });

    res.json(feedbacks.map(f => ({
      id: f.id,
      projectId: f.project.projectId,
      workDescription: f.project.workDescription,
      district: f.project.district,
      state: f.project.state,
      overallRiskScore: f.overallRiskScore,
      riskLevel: f.riskLevel,
      aiPrediction: f.aiPrediction ? JSON.parse(f.aiPrediction) : null,
      officerDecision: f.officerDecision,
      reason: f.reason || f.decisionReason,
      officer: f.createdBy,
      createdAt: f.createdAt
    })));
  } catch (err) {
    console.error('Error listing feedback records:', err);
    res.status(500).json({ error: 'Failed to list feedback records' });
  }
});

/**
 * GET /api/feedback/metrics - Dashboard human verification metrics
 */
router.get('/metrics', authMiddleware, async (req, res) => {
  try {
    const scopeFilter = getAuthorityScopeFilter(req.user);
    const feedbackWhere = Object.keys(scopeFilter).length > 0 ? { project: scopeFilter } : {};

    const totalCount = await prisma.feedback.count({ where: feedbackWhere });
    const confirmedCount = await prisma.feedback.count({ where: { ...feedbackWhere, officerDecision: 'CONFIRMED' } });
    const falsePositiveCount = await prisma.feedback.count({ where: { ...feedbackWhere, officerDecision: 'FALSE_POSITIVE' } });
    const requiresInvestigationCount = await prisma.feedback.count({ where: { ...feedbackWhere, officerDecision: 'REQUIRES_INVESTIGATION' } });
    const insufficientDataCount = await prisma.feedback.count({ where: { ...feedbackWhere, officerDecision: 'INSUFFICIENT_DATA' } });

    // Distinct reviewed projects count
    const distinctProjects = await prisma.feedback.groupBy({
      by: ['projectId'],
      where: feedbackWhere
    });

    res.json({
      totalReviews: totalCount,
      reviewedProjectsCount: distinctProjects.length,
      confirmedCount,
      falsePositiveCount,
      requiresInvestigationCount,
      insufficientDataCount
    });
  } catch (err) {
    console.error('Error getting feedback metrics:', err);
    res.status(500).json({ error: 'Failed to retrieve feedback metrics' });
  }
});

export default router;
