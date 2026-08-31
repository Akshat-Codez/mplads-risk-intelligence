import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to map DB project schema to both camelCase and snake_case for frontend compatibility
function mapProjectToFrontend(project) {
  if (!project) return null;
  const p = { ...project };
  
  // Add snake_case aliases for frontend compatibility
  p.work_id = p.projectId;
  p.work_type = p.workType;
  p.work_description = p.workDescription;
  p.recommended_amount = p.recommendedAmount;
  p.sanctioned_amount = p.sanctionedAmount;
  p.total_disbursed = p.totalDisbursed;
  p.expenditure_ratio = p.expenditureRatio;
  p.amount_deviation = p.amountDeviation;
  p.recommendation_date = p.recommendationDate;
  p.sanction_date = p.sanctionDate;
  p.actual_completion_date = p.actualCompletionDate;
  p.sanction_delay_days = p.sanctionDelayDays;
  p.completion_duration_days = p.completionDurationDays;
  p.work_status = p.workStatus;
  p.payment_count = p.paymentCount;
  p.average_payment = p.averagePayment;
  p.maximum_payment = p.maximumPayment;
  p.first_payment_date = p.firstPaymentDate;
  p.last_payment_date = p.lastPaymentDate;
  p.payment_duration_days = p.paymentDurationDays;
  p.vendor_name = p.vendorName;
  p.vendor_count_per_work = p.vendorCountPerWork;
  p.prototype_risk_score = p.riskScore;
  p.risk_level = p.riskLevel;
  p.risk_components = p.riskComponents;
  p.structured_reasons = p.structuredReasons;
  p.risk_evidence_explanation = p.riskEvidenceExplanation;
  p.ai_justification_summary = p.aiJustificationSummary;
  p.peer_median_amount = p.peerMedianAmount;
  p.peer_deviation = p.peerDeviation;
  p.if_anomaly_signal = p.ifAnomalySignal;
  p.similar_work_detected = p.similarWorkDetected;
  p.similar_work_id = p.similarWorkId;
  p.image_available = p.imageAvailable;
  p.final_completed_amount = p.finalCompletedAmount;

  // Module Specific Financial Risk
  p.financial_risk_score = p.financialRiskScore || 0;
  p.financial_risk_level = p.financialRiskLevel || 'LOW';
  p.financial_signals = p.financialSignals;

  // Parse JSON components
  if (p.riskComponents) {
    try {
      p.risk_components_parsed = JSON.parse(p.riskComponents);
    } catch (e) {
      p.risk_components_parsed = {};
    }
  } else {
    p.risk_components_parsed = {};
  }

  if (p.financialSignals) {
    try {
      p.financial_signals_parsed = JSON.parse(p.financialSignals);
    } catch (e) {
      p.financial_signals_parsed = [];
    }
  } else {
    p.financial_signals_parsed = [];
  }

  if (p.structuredReasons) {
    try {
      p.structured_reasons_parsed = JSON.parse(p.structuredReasons);
    } catch (e) {
      p.structured_reasons_parsed = [];
    }
  } else {
    p.structured_reasons_parsed = [];
  }

  return p;
}

// GET /api/projects - paginated & filtered list
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const {
      state,
      district,
      constituency,
      work_type,
      status,
      year,
      risk_level,
      search,
      sort_by = 'riskScore',
      sort_order = 'desc'
    } = req.query;

    const where = {};

    // Filter by fields if specified
    if (state) where.state = state;
    if (district) where.district = district;
    if (constituency) where.constituency = constituency;
    if (work_type) where.workType = work_type;
    if (status) where.workStatus = status;
    if (risk_level) where.riskLevel = risk_level.toUpperCase();

    // Year filter
    if (year) {
      where.OR = [
        { recommendationDate: { contains: year } },
        { sanctionDate: { contains: year } }
      ];
    }

    // Search query
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        ...(where.OR || []),
        { projectId: { contains: searchLower } },
        { workDescription: { contains: searchLower } },
        { vendorName: { contains: searchLower } },
        { mpName: { contains: searchLower } }
      ];
    }

    // Order By
    const orderBy = {};
    if (sort_by === 'riskScore' || sort_by === 'prototype_risk_score') {
      orderBy.riskScore = sort_order;
    } else if (sort_by === 'recommendedAmount' || sort_by === 'recommended_amount') {
      orderBy.recommendedAmount = sort_order;
    } else if (sort_by === 'sanctionedAmount' || sort_by === 'sanctioned_amount') {
      orderBy.sanctionedAmount = sort_order;
    } else if (sort_by === 'totalDisbursed' || sort_by === 'total_disbursed') {
      orderBy.totalDisbursed = sort_order;
    } else {
      orderBy.createdAt = 'desc';
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy
      }),
      prisma.project.count({ where })
    ]);

    const mappedProjects = projects.map(mapProjectToFrontend);

    // If query risk_level is HIGH and no projects found, return empty list or all projects
    res.json(mappedProjects); // React code expects array response or object containing it
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Failed to retrieve projects' });
  }
});

// GET /api/projects/:id - single project details by projectId (work_id)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const projectId = decodeURIComponent(req.params.id);
    
    const project = await prisma.project.findUnique({
      where: { projectId },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            actions: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const mapped = mapProjectToFrontend(project);
    
    // Construct investigation_info
    const latestCase = project.cases && project.cases.length > 0 ? project.cases[0] : null;
    const latestAction = latestCase && latestCase.actions && latestCase.actions.length > 0 ? latestCase.actions[0] : null;
    
    mapped.investigation_status = latestCase ? latestCase.status : 'Unreviewed';
    mapped.investigation_info = {
      status: latestCase ? latestCase.status : 'Unreviewed',
      notes: latestAction ? latestAction.notes : ''
    };

    // Normalize contractor names helper
    function normalizeName(name) {
      if (!name) return 'unknown';
      const primary = name.split(',')[0].trim();
      return primary
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
        .replace(/\s+/g, '')
        .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
    }

    let contractorRisk = null;
    if (project.vendorName) {
      const normName = normalizeName(project.vendorName);
      const contractor = await prisma.contractor.findUnique({
        where: { normalizedName: normName }
      });
      if (contractor) {
        contractorRisk = {
          id: contractor.id,
          score: contractor.contractorRiskScore,
          level: contractor.contractorRiskLevel,
          signals: contractor.contractorRiskSignals ? JSON.parse(contractor.contractorRiskSignals) : [],
          confidence: contractor.confidenceScore
        };
      }
    }
    mapped.contractor_risk = contractorRisk;

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching project detail:', err);
    res.status(500).json({ error: 'Failed to retrieve project detail' });
  }
});

// POST /api/projects/:id/investigate - quick inline investigation status update
router.post('/:id/investigate', authMiddleware, async (req, res) => {
  try {
    const projectId = decodeURIComponent(req.params.id);
    const { status, notes } = req.body;

    const project = await prisma.project.findUnique({
      where: { projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if there is an existing case for this project
    let caseRecord = await prisma.case.findFirst({
      where: { projectId: project.id }
    });

    if (!caseRecord) {
      const caseNumber = `CASE-${Date.now()}`;
      caseRecord = await prisma.case.create({
        data: {
          caseNumber,
          projectId: project.id,
          title: `Verification for project ${project.projectId}`,
          priority: project.riskLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
          status: status || 'OPEN',
          createdById: req.user.id
        }
      });
    } else {
      caseRecord = await prisma.case.update({
        where: { id: caseRecord.id },
        data: {
          status: status || 'OPEN'
        }
      });
    }

    // Add action log
    await prisma.caseAction.create({
      data: {
        caseId: caseRecord.id,
        userId: req.user.id,
        action: 'UPDATE_STATUS',
        notes: notes || `Status updated to ${status}`
      }
    });

    // Add audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        projectId: project.id,
        action: 'UPDATE_INVESTIGATION',
        entity: 'Project',
        details: `Investigation status of ${project.projectId} updated to ${status}`
      }
    });

    res.json({ success: true, case: caseRecord });
  } catch (err) {
    console.error('Error updating investigation:', err);
    res.status(500).json({ error: 'Failed to update investigation' });
  }
});

// Helper function to sync database with scored CSV
async function syncDatabaseWithScoredCsv() {
  const csvPath = path.resolve(process.cwd(), '../data/processed/master_dataset_scored.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('Scored CSV not found at:', csvPath);
    return;
  }
  
  console.log('Syncing database with scored CSV at:', csvPath);
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: false
  });
  
  const parseFloatSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? Number(val) : null;
  const parseIntSafe = (val) => val && val.trim() !== '' && !isNaN(Number(val)) ? parseInt(val, 10) : null;
  const parseBooleanSafe = (val) => val === 'True' || val === 'true';

  let count = 0;
  for (const record of records) {
    if (!record.work_id) continue;
    try {
      await prisma.project.upsert({
        where: { projectId: record.work_id },
        update: {
          riskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          riskLevel: record.risk_level || 'LOW',
          riskComponents: record.risk_components || null,
          structuredReasons: record.structured_reasons || null,
          riskEvidenceExplanation: record.risk_evidence_explanation || null,
          aiJustificationSummary: record.ai_justification_summary || null,
          financialRiskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          financialRiskLevel: record.risk_level || 'LOW',
          financialSignals: record.structured_reasons || null,
          anomalyScore: parseFloatSafe(record.peer_deviation) || 0,
          peerMedianAmount: parseFloatSafe(record.peer_median_amount),
          peerDeviation: parseFloatSafe(record.peer_deviation),
          ifAnomalySignal: parseBooleanSafe(record.if_anomaly_signal),
          similarWorkDetected: parseBooleanSafe(record.similar_work_detected),
          similarWorkId: record.similar_work_id || null,
          imageAvailable: parseBooleanSafe(record.image_available),
          finalCompletedAmount: parseFloatSafe(record.final_completed_amount),
        },
        create: {
          projectId: record.work_id,
          workType: record.work_type || null,
          workDescription: record.work_description || null,
          state: record.state || null,
          district: record.district || null,
          constituency: record.constituency || null,
          mpName: record.mp_name || null,
          recommendedAmount: parseFloatSafe(record.recommended_amount),
          sanctionedAmount: parseFloatSafe(record.sanctioned_amount),
          totalDisbursed: parseFloatSafe(record.total_disbursed),
          expenditureRatio: parseFloatSafe(record.expenditure_ratio),
          amountDeviation: parseFloatSafe(record.amount_deviation),
          recommendationDate: record.recommendation_date || null,
          sanctionDate: record.sanction_date || null,
          actualCompletionDate: record.actual_completion_date || null,
          sanctionDelayDays: parseFloatSafe(record.sanction_delay_days),
          completionDurationDays: parseFloatSafe(record.completion_duration_days),
          workStatus: record.work_status || null,
          paymentCount: parseFloatSafe(record.payment_count),
          averagePayment: parseFloatSafe(record.average_payment),
          maximumPayment: parseFloatSafe(record.maximum_payment),
          firstPaymentDate: record.first_payment_date || null,
          lastPaymentDate: record.last_payment_date || null,
          paymentDurationDays: parseFloatSafe(record.payment_duration_days),
          vendorName: record.vendor_name || null,
          vendorCountPerWork: parseIntSafe(record.vendor_count_per_work),
          riskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          riskLevel: record.risk_level || 'LOW',
          riskComponents: record.risk_components || null,
          structuredReasons: record.structured_reasons || null,
          riskEvidenceExplanation: record.risk_evidence_explanation || null,
          aiJustificationSummary: record.ai_justification_summary || null,
          financialRiskScore: parseFloatSafe(record.prototype_risk_score) || 0,
          financialRiskLevel: record.risk_level || 'LOW',
          financialSignals: record.structured_reasons || null,
          anomalyScore: parseFloatSafe(record.peer_deviation) || 0,
          peerMedianAmount: parseFloatSafe(record.peer_median_amount),
          peerDeviation: parseFloatSafe(record.peer_deviation),
          ifAnomalySignal: parseBooleanSafe(record.if_anomaly_signal),
          similarWorkDetected: parseBooleanSafe(record.similar_work_detected),
          similarWorkId: record.similar_work_id || null,
          imageAvailable: parseBooleanSafe(record.image_available),
          finalCompletedAmount: parseFloatSafe(record.final_completed_amount),
        }
      });
      count++;
    } catch (err) {
      console.error(`Error syncing project ${record.work_id}:`, err.message);
    }
  }
  console.log(`Synced ${count} projects into database.`);
  await recalculateOverallProjectRisks(prisma);
}

export async function recalculateOverallProjectRisks(prismaInstance) {
  console.log('Recalculating overall project risk scores and levels...');
  const projects = await prismaInstance.project.findMany({
    include: {
      procurements: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const contractors = await prismaInstance.contractor.findMany();
  const contractorMap = new Map();
  contractors.forEach(c => {
    contractorMap.set(c.normalizedName, c);
  });

  function normalizeName(name) {
    if (!name) return 'unknown';
    const primary = name.split(',')[0].trim();
    return primary
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, '')
      .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
  }

  let count = 0;
  for (const p of projects) {
    const finScore = p.financialRiskScore || 0;
    
    const latestProc = p.procurements && p.procurements.length > 0 ? p.procurements[0] : null;
    const procScore = latestProc && latestProc.status === 'Analyzed' ? latestProc.procurementRiskScore : null;

    let contractorScore = null;
    if (p.vendorName) {
      const norm = normalizeName(p.vendorName);
      const c = contractorMap.get(norm);
      if (c) {
        contractorScore = c.contractorRiskScore || 0;
      }
    }

    let weightSum = 0.5;
    let weightedScoreSum = 0.5 * finScore;
    let confidence = 50;

    if (procScore !== null) {
      weightSum += 0.3;
      weightedScoreSum += 0.3 * procScore;
      confidence += 30;
    }
    if (contractorScore !== null) {
      weightSum += 0.2;
      weightedScoreSum += 0.2 * contractorScore;
      confidence += 20;
    }

    const overallScore = Math.round((weightedScoreSum / weightSum) * 10) / 10;

    let overallLevel = 'LOW';
    if (confidence < 60 && overallScore < 25.0) {
      overallLevel = 'INSUFFICIENT DATA';
    } else if (overallScore >= 50.0) {
      overallLevel = 'HIGH';
    } else if (overallScore >= 25.0) {
      overallLevel = 'MEDIUM';
    }

    const comps = {
      financial: finScore,
      procurement: procScore,
      contractor: contractorScore,
      confidence: confidence
    };

    await prismaInstance.project.update({
      where: { id: p.id },
      data: {
        riskScore: overallScore,
        riskLevel: overallLevel,
        riskComponents: JSON.stringify(comps)
      }
    });
    count++;
  }
  console.log(`Recalculated overall risk for ${count} projects.`);
}

// POST /api/projects/run-analysis - trigger AI analysis and sync results
router.post('/run-analysis', authMiddleware, async (req, res) => {
  try {
    console.log('Triggering AI Analysis...');
    const response = await fetch('http://localhost:8000/api/run_analysis', {
      method: 'POST'
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      console.error('FastAPI error:', errorMsg);
      return res.status(500).json({ error: 'AI analysis service failed' });
    }

    const data = await response.json();
    console.log('AI Analysis completed successfully. Syncing database...');
    
    // Sync SQLite database with updated master_dataset_scored.csv
    await syncDatabaseWithScoredCsv();

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RUN_AI_ANALYSIS',
        entity: 'System',
        details: 'Triggered full-constituency AI anomaly and financial z-score risk re-analysis.'
      }
    });

    res.json({ message: 'AI Analysis complete and database synced successfully.' });
  } catch (err) {
    console.error('Error running analysis:', err);
    res.status(500).json({ error: 'Failed to complete analysis pipeline' });
  }
});

export default router;
