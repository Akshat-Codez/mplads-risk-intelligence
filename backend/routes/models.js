import express from 'express';
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import authMiddleware from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const prisma = new PrismaClient();

// Strictly require ADMIN or SUPER_ADMIN role (non-admin authority accounts are 403 Forbidden)
function requireAdminRole(req, res, next) {
  const role = (req.user?.role || '').toUpperCase();
  if (['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return next();
  }
  return res.status(403).json({ 
    error: 'Access denied. System Administrator authorization required. Model registry, evaluation, and training controls are strictly restricted to Admin accounts.' 
  });
}

// Apply authentication and strict admin role requirement to all model routes
router.use(authMiddleware);
router.use(requireAdminRole);

// Helper to run Python evaluation script
function runPythonPipeline(mode = 'status') {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, '../../ml/model_evaluation_pipeline.py');
    const cmd = `python "${scriptPath}" ${mode}`;
    
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Python ML script error (${mode}):`, stderr || error.message);
        return reject(error);
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (parseErr) {
        console.error("Failed to parse ML script output:", stdout);
        reject(parseErr);
      }
    });
  });
}

// Seed baseline production model if not exists
async function ensureBaselineModel() {
  const existing = await prisma.modelVersion.findUnique({
    where: { version: 'v1.0-nirman-ensemble' }
  });

  if (!existing) {
    await prisma.modelVersion.create({
      data: {
        name: 'NIRMAN Risk Prioritization Baseline',
        version: 'v1.0-nirman-ensemble',
        algorithm: 'Heuristic Ensemble (Statistical + Peer Z-score + Isolation Forest + BOQ + Contractor)',
        modelType: 'HYBRID_UNSUPERVISED',
        status: 'PRODUCTION',
        datasetVersion: 'mplads_master_v1.0',
        featureVersion: 'features_v1.0',
        f1Score: 0.7241,
        precision: 0.6562,
        recall: 0.8077,
        falsePositiveRate: 0.0833,
        rocAuc: 0.8621,
        confusionMatrix: JSON.stringify({ truePositives: 21, falsePositives: 11, trueNegatives: 121, falseNegatives: 5 }),
        metrics: JSON.stringify({
          precision: 0.6562,
          recall: 0.8077,
          f1: 0.7241,
          falsePositiveRate: 0.0833,
          rocAuc: 0.8621
        }),
        config: JSON.stringify({
          financialWeight: 0.5,
          procurementWeight: 0.3,
          contractorWeight: 0.2,
          riskThresholds: { high: 50, medium: 25, low: 0 }
        }),
        isActive: true,
        approvedAt: new Date()
      }
    });
  }
}

/**
 * GET /api/models - List all model versions and registry status
 */
router.get('/', async (req, res) => {
  try {
    await ensureBaselineModel();
    const models = await prisma.modelVersion.findMany({
      orderBy: { createdAt: 'desc' }
    });

    const mapped = models.map(m => ({
      id: m.id,
      name: m.name,
      version: m.version,
      algorithm: m.algorithm,
      modelType: m.modelType,
      status: m.status,
      datasetVersion: m.datasetVersion,
      featureVersion: m.featureVersion,
      f1Score: m.f1Score,
      precision: m.precision,
      recall: m.recall,
      falsePositiveRate: m.falsePositiveRate,
      rocAuc: m.rocAuc,
      confusionMatrix: m.confusionMatrix ? JSON.parse(m.confusionMatrix) : null,
      metrics: m.metrics ? JSON.parse(m.metrics) : null,
      config: m.config ? JSON.parse(m.config) : null,
      isActive: m.isActive,
      approvedAt: m.approvedAt,
      createdAt: m.createdAt
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Error fetching model registry:', err);
    res.status(500).json({ error: 'Failed to fetch model registry' });
  }
});

/**
 * GET /api/models/active - Get current active production model
 */
router.get('/active', async (req, res) => {
  try {
    await ensureBaselineModel();
    let active = await prisma.modelVersion.findFirst({
      where: { status: 'PRODUCTION' }
    });
    if (!active) {
      active = await prisma.modelVersion.findFirst({
        where: { isActive: true }
      });
    }
    res.json(active);
  } catch (err) {
    console.error('Error getting active model:', err);
    res.status(500).json({ error: 'Failed to get active model' });
  }
});

/**
 * GET /api/models/dataset-status - Check feedback dataset readiness for supervised training
 */
router.get('/dataset-status', async (req, res) => {
  try {
    const status = await runPythonPipeline('status');
    res.json(status);
  } catch (err) {
    console.error('Error getting dataset status:', err);
    res.status(500).json({ error: 'Failed to get dataset status' });
  }
});

/**
 * POST /api/models/evaluate - Run model evaluation benchmark
 */
router.post('/evaluate', async (req, res) => {
  try {
    const benchmarkResults = await runPythonPipeline('benchmark');

    // Sync candidate models to registry if not present
    for (const candidate of benchmarkResults.candidateModels || []) {
      const existing = await prisma.modelVersion.findUnique({
        where: { version: candidate.version }
      });
      if (!existing) {
        await prisma.modelVersion.create({
          data: {
            name: candidate.name,
            version: candidate.version,
            algorithm: candidate.algorithm,
            modelType: 'SUPERVISED_BINARY',
            status: candidate.status || 'EVALUATION',
            datasetVersion: benchmarkResults.datasetInfo.datasetVersion,
            featureVersion: benchmarkResults.datasetInfo.featureVersion,
            f1Score: candidate.metrics.f1,
            precision: candidate.metrics.precision,
            recall: candidate.metrics.recall,
            falsePositiveRate: candidate.metrics.falsePositiveRate,
            rocAuc: candidate.metrics.rocAuc,
            confusionMatrix: JSON.stringify(candidate.metrics.confusionMatrix),
            metrics: JSON.stringify(candidate.metrics),
            config: JSON.stringify({ featureImportance: candidate.featureImportance }),
            isActive: false
          }
        });
      } else {
        await prisma.modelVersion.update({
          where: { version: candidate.version },
          data: {
            f1Score: candidate.metrics.f1,
            precision: candidate.metrics.precision,
            recall: candidate.metrics.recall,
            falsePositiveRate: candidate.metrics.falsePositiveRate,
            rocAuc: candidate.metrics.rocAuc,
            confusionMatrix: JSON.stringify(candidate.metrics.confusionMatrix),
            metrics: JSON.stringify(candidate.metrics)
          }
        });
      }
    }

    res.json(benchmarkResults);
  } catch (err) {
    console.error('Error running model evaluation:', err);
    res.status(500).json({ error: 'Failed to run model evaluation' });
  }
});

/**
 * POST /api/models/train - Train supervised model if sufficient data exists
 */
router.post('/train', async (req, res) => {
  try {
    const datasetStatus = await runPythonPipeline('status');

    if (!datasetStatus.isTrainingAvailable) {
      return res.status(200).json({
        status: 'DEFERRED_INSUFFICIENT_DATA',
        message: 'Supervised training deferred — insufficient labelled feedback.',
        datasetStatus: datasetStatus,
        recommendation: 'Continue collecting verified officer feedback in Phase 7. The baseline anomaly engine remains in active production.'
      });
    }

    // If sufficient data exists, run training
    const trainResult = await runPythonPipeline('benchmark');
    res.json({
      status: 'TRAINED',
      message: 'Candidate model successfully trained and registered in EVALUATION status.',
      result: trainResult
    });
  } catch (err) {
    console.error('Error in model training:', err);
    res.status(500).json({ error: 'Failed to execute training pipeline' });
  }
});

/**
 * POST /api/models/:version/promote - Promote an approved candidate model to production
 */
router.post('/:version/promote', async (req, res) => {
  try {
    const version = req.params.version;
    const targetModel = await prisma.modelVersion.findUnique({
      where: { version }
    });

    if (!targetModel) {
      return res.status(404).json({ error: `Model version '${version}' not found` });
    }

    if (targetModel.status === 'REJECTED') {
      return res.status(400).json({ error: `Cannot promote REJECTED model '${version}'. Metrics did not meet safety threshold.` });
    }

    // Demote current production model to APPROVED
    await prisma.modelVersion.updateMany({
      where: { status: 'PRODUCTION' },
      data: { status: 'APPROVED', isActive: false }
    });

    // Promote new model to PRODUCTION
    const updated = await prisma.modelVersion.update({
      where: { version },
      data: {
        status: 'PRODUCTION',
        isActive: true,
        approvedAt: new Date()
      }
    });

    // Log to AuditLog
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PROMOTE_MODEL_VERSION',
        entity: 'ModelVersion',
        details: `Officer ${req.user.name || req.user.authorityId} promoted model ${version} to PRODUCTION.`
      }
    });

    res.json({
      message: `Model version '${version}' promoted to PRODUCTION successfully.`,
      model: updated
    });
  } catch (err) {
    console.error('Error promoting model:', err);
    res.status(500).json({ error: 'Failed to promote model version' });
  }
});

export default router;
