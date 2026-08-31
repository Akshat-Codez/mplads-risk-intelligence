import express from 'express';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to map DB Contractor to camelCase/snake_case
function mapContractorToFrontend(c) {
  if (!c) return null;
  
  let districtsArr = [];
  try {
    districtsArr = c.districts ? JSON.parse(c.districts) : [];
  } catch (e) {
    districtsArr = [];
  }

  let workTypesArr = [];
  try {
    workTypesArr = c.workTypes ? JSON.parse(c.workTypes) : [];
  } catch (e) {
    workTypesArr = [];
  }

  let riskSignalsArr = [];
  try {
    riskSignalsArr = c.contractorRiskSignals ? JSON.parse(c.contractorRiskSignals) : [];
  } catch (e) {
    riskSignalsArr = [];
  }

  return {
    id: c.id,
    name: c.name,
    normalized_name: c.normalizedName,
    project_count: c.projectCount,
    total_expenditure: c.totalExpenditure,
    average_project_value: c.averageProjectValue || 0,
    districts: districtsArr,
    work_types: workTypesArr,
    concentration_score: c.concentrationScore || 0,
    risk_level: c.riskLevel || 'LOW',
    is_demo: c.isDemo,
    createdAt: c.createdAt,
    
    // Official status indicators (Future integration ready, clean status)
    official_status_source: c.officialStatusSource || 'MoSPI Contractor Registry (Future Integration)',
    official_status: c.officialStatus || 'Official contractor status: Not available',
    status_verified_at: c.statusVerifiedAt,

    // Scoring fields
    contractor_risk_score: c.contractorRiskScore || 0,
    contractor_risk_level: c.contractorRiskLevel || 'LOW',
    contractor_risk_signals: riskSignalsArr,
    confidence_score: c.confidenceScore || 0
  };
}

// GET /api/contractors - listing
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const riskLevel = req.query.risk_level || '';
    
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = { contains: search };
    }
    if (riskLevel) {
      where.riskLevel = riskLevel.toUpperCase();
    }

    const [contractors, total] = await Promise.all([
      prisma.contractor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { contractorRiskScore: 'desc' }
      }),
      prisma.contractor.count({ where })
    ]);

    res.json({
      contractors: contractors.map(mapContractorToFrontend),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error fetching contractors list:', err);
    res.status(500).json({ error: 'Failed to retrieve contractors' });
  }
});

// Helper to normalize contractor names for matching
function normalizeContractorName(name) {
  if (!name) return 'unknown';
  const primary = name.split(',')[0].trim();
  return primary
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, '')
    .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
}

// GET /api/contractors/:id - details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contractor = await prisma.contractor.findUnique({
      where: { id }
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor profile not found' });
    }

    res.json(mapContractorToFrontend(contractor));
  } catch (err) {
    console.error('Error fetching contractor detail:', err);
    res.status(500).json({ error: 'Failed to retrieve contractor detail' });
  }
});

// GET /api/contractors/:id/projects - associated projects
router.get('/:id/projects', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const contractor = await prisma.contractor.findUnique({
      where: { id }
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    // Find all projects where the normalized contractor name matches
    const projects = await prisma.project.findMany({
      orderBy: { riskScore: 'desc' }
    });

    // Filter projects matching this contractor in memory using normalized names
    const filteredProjects = projects.filter(p => {
      if (!p.vendorName) return false;
      return normalizeContractorName(p.vendorName) === contractor.normalizedName;
    });

    // Format projects to frontend compatibility aliases (snake_case)
    const formatted = filteredProjects.map(p => ({
      ...p,
      work_id: p.projectId,
      work_description: p.workDescription,
      sanctioned_amount: p.sanctionedAmount,
      total_disbursed: p.totalDisbursed,
      risk_level: p.riskLevel,
      prototype_risk_score: p.riskScore
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Error fetching contractor projects:', err);
    res.status(500).json({ error: 'Failed to retrieve contractor projects' });
  }
});

// GET /api/contractors/:id/risk - risk & compatibility evaluation
router.get('/:id/risk', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { projectId } = req.query; // target project UUID

    const contractor = await prisma.contractor.findUnique({
      where: { id }
    });

    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const result = mapContractorToFrontend(contractor);
    const compatibilitySignals = [];
    let compatibilityScoreModifier = 0;

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (project) {
        // Compare project category with historical categories
        const workTypes = result.work_types;
        const projectCategory = project.workType;
        
        if (projectCategory && workTypes.length > 0) {
          const hasCategoryExperience = workTypes.some(type => 
            type.toLowerCase().includes(projectCategory.toLowerCase()) || 
            projectCategory.toLowerCase().includes(type.toLowerCase())
          );
          
          if (!hasCategoryExperience && result.project_count >= 3) {
            compatibilitySignals.push(`Project compatibility concern: Limited historical evidence of similar project type (${projectCategory}) in available dataset`);
            compatibilityScoreModifier += 15;
          }
        }

        // Compare project budget scale with historical scale (Continuous penalty)
        const budget = project.sanctionedAmount || 0;
        const avgScale = result.average_project_value;
        if (avgScale > 0 && budget > avgScale * 2 && result.project_count >= 3) {
          const scaleRatio = budget / avgScale;
          const scalePenalty = Math.min(20.0, 10.0 + ((scaleRatio - 2.0) / 3.0) * 10.0);
          compatibilitySignals.push(`Project compatibility concern: Project budget (Rs. ${(budget/100000).toFixed(1)} Lakh) exceeds contractor's average scale (Rs. ${(avgScale/100000).toFixed(1)} Lakh) by ${scaleRatio.toFixed(1)}x`);
          compatibilityScoreModifier += scalePenalty;
        }
      }
    }

    // Merge static signals and compatibility signals
    result.compatibility_signals = compatibilitySignals;
    result.combined_risk_signals = [...result.contractor_risk_signals, ...compatibilitySignals];
    
    const finalScore = Math.round(Math.min((result.contractor_risk_score || 0) + compatibilityScoreModifier, 100.0) * 10) / 10;
    result.combined_risk_score = finalScore;
    
    let finalLevel = result.contractor_risk_level;
    if (finalScore >= 60) {
      finalLevel = 'HIGH';
    } else if (finalScore >= 30) {
      finalLevel = 'MEDIUM';
    }
    result.combined_risk_level = finalLevel;

    res.json(result);
  } catch (err) {
    console.error('Error fetching contractor risk evaluation:', err);
    res.status(500).json({ error: 'Failed to evaluate contractor risk' });
  }
});

export default router;
