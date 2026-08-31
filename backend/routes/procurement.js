import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import { recalculateOverallProjectRisks } from './projects.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure storage
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    cb(null, `${Date.now()}_${sanitized}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF documents are allowed'), false);
    }
  }
});

// Helper to map DB camelCase to snake_case for frontend
function mapProcurementToFrontend(doc) {
  if (!doc) return null;
  return {
    id: doc.id,
    projectId: doc.projectId,
    uploaded_file: doc.uploadedFile,
    extracted_text: doc.extractedText,
    extraction_method: doc.extractionMethod,
    items: doc.items ? JSON.parse(doc.items) : [],
    procurement_risk_score: doc.procurementRiskScore || 0,
    procurement_risk_level: doc.procurementRiskLevel || 'LOW',
    summary: doc.summary,
    createdAt: doc.createdAt,
    // Add additional meta extracted fields if present
    tender_number: doc.tenderNumber,
    project_name: doc.projectName,
    issuing_authority: doc.issuingAuthority,
    contractor_vendor: doc.contractorVendor,
    tender_date: doc.tenderDate,
    total_estimated_value: doc.totalEstimatedValue,
    total_quoted_value: doc.totalQuotedValue,
    status: doc.status || 'Analyzed'
  };
}

// POST /api/procurement/upload
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { projectId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }

    // Create record in Procurement table
    const doc = await prisma.procurement.create({
      data: {
        projectId,
        uploadedFile: req.file.path,
        extractionMethod: 'DIGITAL',
        procurementRiskScore: 0,
        procurementRiskLevel: 'LOW',
        status: 'Uploaded',
        items: JSON.stringify([])
      }
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        projectId: project.id,
        action: 'UPLOAD_BOQ',
        entity: 'Procurement',
        details: `Uploaded tender/BOQ document ${req.file.originalname} for project ${project.projectId}`
      }
    });

    res.status(201).json({
      message: 'Tender/BOQ PDF uploaded successfully.',
      documentId: doc.id,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    res.status(500).json({ error: err.message || 'File upload failed' });
  }
});

// POST /api/procurement/:documentId/analyze - run Python extraction and benchmarking
router.post('/:documentId/analyze', authMiddleware, async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await prisma.procurement.findUnique({
      where: { id: documentId },
      include: { project: true }
    });

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Call FastAPI microservice to extract and benchmark
    console.log(`Sending document ${doc.uploadedFile} to FastAPI for analysis...`);
    const fastapiRes = await fetch('http://localhost:8000/api/procurement/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdf_path: doc.uploadedFile,
        filename: path.basename(doc.uploadedFile)
      })
    });

    if (!fastapiRes.ok) {
      const errMsg = await fastapiRes.text();
      console.error('FastAPI procurement error:', errMsg);
      return res.status(500).json({ error: 'FastAPI extraction service failed' });
    }

    const report = await fastapiRes.json();
    console.log('FastAPI analysis complete. Saving to database...');

    // Update Procurement record in database
    const updatedDoc = await prisma.procurement.update({
      where: { id: documentId },
      data: {
        extractionMethod: report.extraction_method,
        items: JSON.stringify(report.items),
        procurementRiskScore: report.procurement_risk_score,
        procurementRiskLevel: report.procurement_risk_level,
        tenderNumber: report.tender_number,
        projectName: report.project_name,
        issuingAuthority: report.issuing_authority,
        contractorVendor: report.contractor_vendor,
        tenderDate: report.tender_date,
        totalEstimatedValue: report.total_estimated_value,
        totalQuotedValue: report.total_quoted_value,
        status: 'Analyzed',
        summary: `Procurement audit completed. Detected ${report.procurement_signals.length} potential anomalies.`
      }
    });

    // Update main Project model risk score and signals
    await prisma.project.update({
      where: { id: doc.projectId },
      data: {
        procurementRiskScore: report.procurement_risk_score,
        procurementRiskLevel: report.procurement_risk_level,
        procurementSignals: JSON.stringify(report.procurement_signals)
      }
    });

    // Recalculate overall integrated project risk
    await recalculateOverallProjectRisks(prisma);

    // Log the audit action
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        projectId: doc.projectId,
        action: 'ANALYZE_BOQ',
        entity: 'Procurement',
        details: `Successfully completed procurement analysis for tender ${report.tender_number || doc.id}. Level: ${report.procurement_risk_level}`
      }
    });

    res.json({
      message: 'Procurement analysis completed successfully.',
      data: mapProcurementToFrontend(updatedDoc)
    });
  } catch (err) {
    console.error('Error analyzing document:', err);
    res.status(500).json({ error: 'Failed to run procurement analysis' });
  }
});

// GET /api/procurement/:projectId
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Retrieve the latest procurement document associated with this project id
    const doc = await prisma.procurement.findFirst({
      where: {
        OR: [
          { projectId: projectId },
          { project: { projectId: projectId } } // Allow looking up by work_id string
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!doc) {
      return res.status(200).json(null); // return null if no documents uploaded yet
    }

    res.json(mapProcurementToFrontend(doc));
  } catch (err) {
    console.error('Error fetching procurement details:', err);
    res.status(500).json({ error: 'Failed to retrieve procurement details' });
  }
});

export default router;
