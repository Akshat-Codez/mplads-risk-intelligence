import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import { getAuthorityScopeFilter, isProjectInScope } from '../utils/scopeFilter.js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { execSync } from 'child_process';
import { aggregateRisk } from '../risk/riskAggregator.js';

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

  // 7-Dimension Risk Scores (snake_case aliases)
  p.progress_risk_score = p.progressRiskScore || 0;
  p.progress_risk_level = p.progressRiskLevel || 'LOW';
  p.gis_risk_score = p.gisRiskScore || 0;
  p.gis_risk_level = p.gisRiskLevel || 'LOW';
  p.documentation_risk_score = p.documentationRiskScore || 0;
  p.documentation_risk_level = p.documentationRiskLevel || 'LOW';
  p.cross_signal_score = p.crossSignalScore || 0;
  p.cross_signal_level = p.crossSignalLevel || 'LOW';
  p.contractor_risk_score = p.contractorRiskScore || 0;
  p.contractor_risk_level = p.contractorRiskLevel || 'LOW';
  p.procurement_risk_score = p.procurementRiskScore || 0;
  p.procurement_risk_level = p.procurementRiskLevel || 'LOW';

  // Progress & GIS data
  p.physical_progress = p.physicalProgress;
  p.financial_progress = p.financialProgress;
  p.latitude = p.latitude;
  p.longitude = p.longitude;
  p.document_completeness = p.documentCompleteness || 0;
  p.confidence_score = p.confidenceScore || 50;
  p.data_completeness = p.dataCompleteness || 0;

  // Parse JSON components
  const safeParseJSON = (val, fallback) => {
    if (!val) return fallback;
    try { return JSON.parse(val); } catch (e) { return fallback; }
  };

  p.risk_components_parsed = safeParseJSON(p.riskComponents, {});
  p.financial_signals_parsed = safeParseJSON(p.financialSignals, []);
  p.structured_reasons_parsed = safeParseJSON(p.structuredReasons, []);
  p.progress_signals_parsed = safeParseJSON(p.progressSignals, []);
  p.gis_signals_parsed = safeParseJSON(p.gisSignals, []);
  p.documentation_signals_parsed = safeParseJSON(p.documentationSignals, []);
  p.cross_signals_parsed = safeParseJSON(p.crossSignals, []);
  p.contractor_signals_parsed = safeParseJSON(p.contractorSignals, []);
  p.procurement_signals_parsed = safeParseJSON(p.procurementSignals, []);
  p.top_risk_factors = safeParseJSON(p.topRiskFactors, []);
  p.recommended_actions = safeParseJSON(p.recommendedActions, []);
  p.missing_data_list = safeParseJSON(p.missingDataList, []);
  p.documents_checklist = safeParseJSON(p.documentsChecklist, {});
  p.progress_timeline = safeParseJSON(p.progressTimeline, []);

  // Ensure document compliance checklist is calculated from actual available data
  if (!p.documents_checklist || Object.keys(p.documents_checklist).length === 0) {
    const hasSanction = Boolean(p.sanctionDate || (p.sanctionedAmount && p.sanctionedAmount > 0));
    const hasSpent = Boolean((p.totalDisbursed && p.totalDisbursed > 0) || (p.paymentCount && p.paymentCount > 0));
    const statusStr = (p.workStatus || '').toLowerCase();
    const isCompleted = statusStr.includes('completed') || Boolean(p.actualCompletionDate);
    const isInspected = statusStr.includes('physical inspection completed') || statusStr.includes('inspection passed') || Boolean(p.inspectionStatus === 'INSPECTED');

    p.documents_checklist = {
      aa: Boolean(p.recommendationDate || p.recommendedAmount || p.sanctionDate),
      ts: hasSanction,
      estimate: Boolean(p.recommendedAmount || p.sanctionedAmount),
      boq: hasSanction,
      tender: Boolean(p.vendorName || hasSanction),
      workOrder: Boolean(p.workOrderDate || p.vendorName || hasSpent || ['work in progress', 'work partially completed', 'work completed', 'physical inspection'].some(s => statusStr.includes(s))),
      mb: Boolean(hasSpent || isInspected),
      bills: hasSpent,
      uc: Boolean(p.totalDisbursed && p.sanctionedAmount && (p.totalDisbursed / p.sanctionedAmount) >= 0.5),
      cc: isCompleted,
      inspection: isInspected,
      photos: Boolean(p.imageAvailable)
    };
  }

  const docCount = Object.values(p.documents_checklist).filter(Boolean).length;
  p.document_completeness = p.documentCompleteness || Math.round((docCount / 12) * 100);
  p.inspection_status = p.documents_checklist?.inspection ? 'INSPECTED' : 'NOT INSPECTED';

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
      vendor,
      vendor_name,
      contractor,
      sort_by = 'riskScore',
      sort_order = 'desc'
    } = req.query;

    // Base authority scoping filter
    const scopeFilter = getAuthorityScopeFilter(req.user);

    let where = {};

    // Apply user filters
    if (state) where.state = state;
    if (district) where.district = district;
    if (constituency) where.constituency = constituency;
    if (work_type) where.workType = work_type;
    if (status) where.workStatus = status;
    if (risk_level) where.riskLevel = risk_level.toUpperCase();

    // Apply vendor/contractor filter
    const vendorQuery = vendor || vendor_name || contractor;
    if (vendorQuery && vendorQuery !== 'ALL') {
      where.vendorName = { contains: vendorQuery.trim() };
    }

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

    // Merge with mandatory server-side authority scope
    if (Object.keys(scopeFilter).length > 0) {
      if (scopeFilter.AND) {
        where.AND = [...(where.AND || []), ...scopeFilter.AND];
      } else {
        where = { ...where, ...scopeFilter };
      }
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

// GET /api/projects/:id - single project details by projectId (work_id) or internal id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const rawId = decodeURIComponent(req.params.id);
    
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { projectId: rawId },
          { id: rawId }
        ]
      },
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

    // Verify authority scope authorization
    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Project '${rawId}' in ${project.district || 'Unknown'}, ${project.state || 'Unknown'} is outside your authorized authority scope.`
      });
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
    const rawId = decodeURIComponent(req.params.id);
    const { status, notes } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { projectId: rawId },
          { id: rawId }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify authority scope authorization
    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Cannot modify investigation for project '${projectId}' outside your authorized authority scope.`
      });
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

// GET /api/projects/:id/audit - retrieve audit dossier and inspection case for project
router.get('/:id/audit', authMiddleware, async (req, res) => {
  try {
    const rawId = decodeURIComponent(req.params.id);
    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { projectId: rawId },
          { id: rawId }
        ]
      },
      include: {
        cases: {
          orderBy: { createdAt: 'desc' },
          include: {
            actions: {
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        procurements: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        feedback: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true, authorityId: true }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: `Project '${rawId}' not found in database.` });
    }

    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Project '${rawId}' in ${project.district || 'Unknown'}, ${project.state || 'Unknown'} is outside your authorized authority scope.`
      });
    }

    const mapped = mapProjectToFrontend(project);
    const latestCase = project.cases && project.cases.length > 0 ? project.cases[0] : null;
    mapped.investigation_status = latestCase ? latestCase.status : 'Unreviewed';
    mapped.investigation_info = {
      status: latestCase ? latestCase.status : 'Unreviewed',
      notes: latestCase && latestCase.actions && latestCase.actions.length > 0 ? latestCase.actions[0].notes : ''
    };
    mapped.audit_cases = project.cases || [];
    mapped.audit_feedbacks = project.feedback || [];

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching project audit information:', err);
    res.status(500).json({ error: 'Failed to retrieve project audit information' });
  }
});

// POST /api/projects/:id/audit - create/start an audit or submit inspection findings
router.post('/:id/audit', authMiddleware, async (req, res) => {
  try {
    const rawId = decodeURIComponent(req.params.id);
    const { status, notes, priority } = req.body;

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { projectId: rawId },
          { id: rawId }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: `Project '${rawId}' not found` });
    }

    if (!isProjectInScope(req.user, project)) {
      return res.status(403).json({
        error: `Access denied. Cannot create audit for project '${rawId}' outside your authorized authority scope.`
      });
    }

    // Resolve valid user foreign key
    let officerUser = req.user.id ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;
    if (!officerUser) {
      officerUser = await prisma.user.findFirst();
    }
    const creatorId = officerUser ? officerUser.id : req.user.id;

    const caseNumber = `AUD-${Date.now().toString().slice(-6)}`;
    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        projectId: project.id,
        title: `Official Audit Dossier for ${project.projectId}`,
        priority: priority || (project.riskScore >= 50 ? 'HIGH' : 'MEDIUM'),
        status: status || 'Under Audit',
        createdById: creatorId
      }
    });

    await prisma.caseAction.create({
      data: {
        caseId: newCase.id,
        userId: creatorId,
        action: 'START_AUDIT',
        notes: notes || 'Official audit initiated by authorized authority officer.'
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: creatorId,
        projectId: project.id,
        action: 'INITIATE_PROJECT_AUDIT',
        entity: 'ProjectAudit',
        details: `Audit dossier initiated for project ${project.projectId} by ${req.user.name || req.user.authorityId}.`
      }
    });

    res.status(201).json({
      success: true,
      message: 'Audit record created successfully',
      case: newCase
    });
  } catch (err) {
    console.error('Error initiating project audit:', err);
    res.status(500).json({ error: 'Failed to initiate project audit' });
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
  console.log('Recalculating overall project risk scores using 7-dimension aggregator...');
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

  // Pre-process: set procurement scores from procurement relations
  for (const p of projects) {
    const latestProc = p.procurements && p.procurements.length > 0 ? p.procurements[0] : null;
    if (latestProc && latestProc.status === 'Analyzed' && latestProc.procurementRiskScore) {
      p.procurementRiskScore = latestProc.procurementRiskScore;
    }
  }

  const districtMap = new Map();
  projects.forEach(p => {
    const d = (p.district || 'UNKNOWN').toUpperCase();
    if (!districtMap.has(d)) districtMap.set(d, []);
    districtMap.get(d).push(p);
  });

  let count = 0;
  for (const p of projects) {
    // Resolve contractor profile
    let contractorProfile = null;
    if (p.vendorName) {
      const norm = normalizeName(p.vendorName);
      contractorProfile = contractorMap.get(norm) || null;
    }

    // Run the 7-dimension aggregator with district-scoped projects
    const districtProjects = districtMap.get((p.district || 'UNKNOWN').toUpperCase()) || [p];
    const result = aggregateRisk(p, districtProjects, contractorProfile);

    // Determine risk level string
    const overallLevel = result.overallLevel;
    const overallScore = result.overallScore;

    // Build legacy-compatible riskComponents JSON
    const comps = {
      financial: result.dimensions.financial.score,
      procurement: result.dimensions.procurement.score,
      progress: result.dimensions.progress.score,
      contractor: result.dimensions.contractor.score,
      gis: result.dimensions.gis.score,
      documentation: result.dimensions.documentation.score,
      crossSignal: result.dimensions.crossSignal.score,
      confidence: result.confidence
    };

    await prismaInstance.project.update({
      where: { id: p.id },
      data: {
        riskScore: overallScore,
        riskLevel: overallLevel,
        riskComponents: JSON.stringify(comps),

        // 7-Dimension individual scores
        financialRiskScore: result.dimensions.financial.score,
        financialRiskLevel: result.dimensions.financial.level,
        financialSignals: JSON.stringify(result.dimensions.financial.signals || []),

        progressRiskScore: result.dimensions.progress.score,
        progressRiskLevel: result.dimensions.progress.level,
        progressSignals: JSON.stringify(result.dimensions.progress.signals || []),

        gisRiskScore: result.dimensions.gis.score,
        gisRiskLevel: result.dimensions.gis.level,
        gisSignals: JSON.stringify(result.dimensions.gis.signals || []),

        documentationRiskScore: result.dimensions.documentation.score,
        documentationRiskLevel: result.dimensions.documentation.level,
        documentationSignals: JSON.stringify(result.dimensions.documentation.signals || []),

        crossSignalScore: result.dimensions.crossSignal.score,
        crossSignalLevel: result.dimensions.crossSignal.level,
        crossSignals: JSON.stringify(result.dimensions.crossSignal.signals || []),

        // Contractor score from aggregator
        contractorRiskScore: result.dimensions.contractor.score,
        contractorRiskLevel: result.dimensions.contractor.level,
        contractorSignals: JSON.stringify(result.dimensions.contractor.signals || []),

        // Explainability & Confidence
        confidenceScore: result.confidence,
        dataCompleteness: result.dataCompleteness,
        topRiskFactors: JSON.stringify(result.topRiskFactors || []),
        recommendedActions: JSON.stringify(result.recommendedActions || []),
        missingDataList: JSON.stringify(result.missingData || [])
      }
    });
    count++;
  }
  console.log(`Recalculated 7-dimension risk for ${count} projects.`);
}

// POST /api/projects/run-analysis - trigger AI analysis and sync results
router.post('/run-analysis', authMiddleware, async (req, res) => {
  try {
    console.log('[AI DEBUG] Request received: POST /api/projects/run-analysis');
    console.log('[AI DEBUG] Triggered by User:', req.user ? req.user.id : 'anonymous', `(${req.user ? req.user.role : 'NO_ROLE'})`);
    
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    console.log('[AI DEBUG] AI provider: Python ML Risk Engine (Isolation Forest + Peer Benchmarking + NLP)');
    console.log('[AI DEBUG] AI endpoint:', `${aiServiceUrl}/api/run_analysis`);
    
    let analysisRan = false;
    
    // Attempt 1: Call FastAPI microservice if running
    try {
      console.log('[AI DEBUG] Calling AI service at:', `${aiServiceUrl}/api/run_analysis`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
      const response = await fetch(`${aiServiceUrl}/api/run_analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('[AI DEBUG] AI response status:', response.status);
      if (response.ok) {
        const body = await response.json();
        console.log('[AI DEBUG] AI response body:', JSON.stringify(body));
        analysisRan = true;
      } else {
        const errText = await response.text();
        console.warn('[AI DEBUG] FastAPI error:', errText);
      }
    } catch (connErr) {
      console.log('[AI DEBUG] FastAPI microservice on port 8000 not reachable (', connErr.message, '). Falling back to deterministic risk engine...');
    }

    // Attempt 2: If external service was not reachable, execute deterministic risk engine directly in Node
    if (!analysisRan) {
      console.log('[AI DEBUG] External AI service unavailable. Executing deterministic risk engine directly on database...');
    } else {
      console.log('[AI DEBUG] Syncing database with scored dataset...');
      await syncDatabaseWithScoredCsv();
    }

    console.log('[AI DEBUG] Recalculating 7-dimension risk aggregations...');
    await recalculateOverallProjectRisks(prisma);

    console.log('[AI DEBUG] Analysis completed successfully.');

    // Create Audit Log
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'RUN_AI_ANALYSIS',
          entity: 'System',
          details: analysisRan 
            ? 'Triggered full-constituency AI anomaly and financial z-score risk re-analysis.'
            : 'Executed deterministic multi-dimensional risk engine recalculation (AI microservice offline fallback).'
        }
      });
    }

    res.json({
      success: true,
      message: analysisRan 
        ? 'AI Analysis complete and database synced successfully.' 
        : 'AI service unavailable – deterministic risk engine used',
      ai_status: analysisRan 
        ? 'AI Analysis complete' 
        : 'AI service unavailable – deterministic risk engine used',
      fallbackUsed: !analysisRan
    });
  } catch (err) {
    console.error('[AI DEBUG] Error running analysis:', err);
    res.status(500).json({ error: 'AI Analysis could not be completed. Please try again.' });
  }
});

export default router;
