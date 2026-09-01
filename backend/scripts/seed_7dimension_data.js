/**
 * Seed 7-Dimension Data
 * Populates progress timelines, GIS coordinates, document checklists,
 * and related metadata for all existing projects in the database.
 * 
 * Uses deterministic seeding based on project properties to ensure
 * consistent, realistic-looking demo data.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Real district coordinates for realistic GIS data
const DISTRICT_COORDS = {
  'PURBI CHAMPARAN': { lat: 26.65, lng: 84.87 },
  'PASCHIMI CHAMPARAN': { lat: 27.07, lng: 84.34 },
  'BENGALURU URBAN': { lat: 12.97, lng: 77.59 },
  'BENGALURU RURAL': { lat: 13.23, lng: 77.39 },
  'HASSAN': { lat: 13.01, lng: 76.10 },
  'DHARWAD': { lat: 15.46, lng: 75.01 },
  'MYSURU': { lat: 12.30, lng: 76.64 },
  'MANDYA': { lat: 12.52, lng: 76.90 },
  'TUMKUR': { lat: 13.34, lng: 77.10 },
  'SHIMOGA': { lat: 13.93, lng: 75.57 },
  'DAVANGERE': { lat: 14.47, lng: 75.92 },
  'BELGAUM': { lat: 15.85, lng: 74.50 },
  'BELLARY': { lat: 15.15, lng: 76.93 },
  'RAICHUR': { lat: 16.20, lng: 77.37 },
  'BIDAR': { lat: 17.91, lng: 77.52 },
  'GULBARGA': { lat: 17.33, lng: 76.83 },
  'VARANASI': { lat: 25.32, lng: 83.01 },
  'LUCKNOW': { lat: 26.85, lng: 80.95 },
  'KANPUR NAGAR': { lat: 26.45, lng: 80.35 },
  'ALLAHABAD': { lat: 25.43, lng: 81.85 },
  'AGRA': { lat: 27.18, lng: 78.02 },
  'PATNA': { lat: 25.61, lng: 85.14 },
  'GAYA': { lat: 24.80, lng: 85.01 },
  'MUZAFFARPUR': { lat: 26.12, lng: 85.39 },
  'BHAGALPUR': { lat: 25.24, lng: 86.97 },
  'DARBHANGA': { lat: 26.17, lng: 85.90 },
  'ERNAKULAM': { lat: 9.98, lng: 76.28 },
  'THIRUVANANTHAPURAM': { lat: 8.52, lng: 76.94 },
  'THRISSUR': { lat: 10.53, lng: 76.21 },
  'KOZHIKODE': { lat: 11.25, lng: 75.77 },
  'KOHIMA': { lat: 25.67, lng: 94.11 },
  'DIMAPUR': { lat: 25.90, lng: 93.73 },
  'MUMBAI': { lat: 19.08, lng: 72.88 },
  'PUNE': { lat: 18.52, lng: 73.86 },
  'NAGPUR': { lat: 21.15, lng: 79.09 },
  'NASHIK': { lat: 20.00, lng: 73.79 },
  'AURANGABAD': { lat: 19.88, lng: 75.34 }
};

// Document types and their milestone order
const DOCUMENT_TYPES = ['aa', 'ts', 'estimate', 'boq', 'tender', 'workOrder', 'mb', 'bills', 'uc', 'cc', 'inspection', 'photos'];

// Simple hash function for deterministic randomness
function hashSeed(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Deterministic pseudo-random [0, 1) based on seed
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDocumentsChecklist(project, seed) {
  const checklist = {};
  const status = (project.workStatus || '').toLowerCase();
  const hasCompletion = !!project.actualCompletionDate;
  const ratio = project.expenditureRatio || 0;
  
  // Base probabilities based on project progress
  let baseProb = 0.5;
  if (status.includes('completed') || status.includes('physical inspection')) {
    baseProb = 0.75;
  }
  if (hasCompletion) baseProb = Math.max(baseProb, 0.8);
  
  for (let i = 0; i < DOCUMENT_TYPES.length; i++) {
    const docType = DOCUMENT_TYPES[i];
    let prob = baseProb;
    
    // Early docs (AA, TS, Estimate) are almost always present
    if (i < 3) prob = Math.min(0.95, prob + 0.3);
    
    // BOQ and Tender are common for larger projects
    if ((docType === 'boq' || docType === 'tender') && (project.sanctionedAmount || 0) > 1000000) {
      prob = Math.min(0.85, prob + 0.15);
    }
    
    // Work Order is usually present if payments made
    if (docType === 'workOrder' && (project.paymentCount || 0) > 0) prob = 0.9;
    
    // CC only if completed
    if (docType === 'cc') {
      prob = hasCompletion ? 0.7 : 0.1;
    }
    
    // UC only if significant expenditure
    if (docType === 'uc') {
      prob = ratio > 0.8 ? 0.65 : 0.2;
    }
    
    // Photos based on imageAvailable flag
    if (docType === 'photos') {
      prob = project.imageAvailable ? 0.85 : 0.15;
    }
    
    // Inspection report
    if (docType === 'inspection') {
      prob = status.includes('physical inspection') ? 0.8 : 0.3;
    }
    
    checklist[docType] = seededRandom(seed + i * 31) < prob;
  }
  
  return checklist;
}

function generateProgressTimeline(project, seed) {
  const timeline = [];
  const startDate = project.sanctionDate || project.recommendationDate;
  if (!startDate) return timeline;
  
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return timeline;
  
  const endDate = project.actualCompletionDate ? new Date(project.actualCompletionDate) : new Date();
  const totalDays = Math.max(1, (endDate - start) / (1000 * 60 * 60 * 24));
  const steps = Math.min(6, Math.max(2, Math.floor(totalDays / 60)));
  
  let prevPhysical = 0;
  let prevFinancial = 0;
  
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const date = new Date(start.getTime() + fraction * (endDate - start));
    
    // Physical progress typically follows S-curve
    const sCurve = 1 / (1 + Math.exp(-10 * (fraction - 0.5)));
    let physical = Math.round(sCurve * 100 * (0.8 + seededRandom(seed + i * 17) * 0.2));
    physical = Math.min(100, Math.max(prevPhysical, physical));
    
    // Financial progress usually tracks ahead or behind physical
    const financialBias = 0.9 + seededRandom(seed + i * 23) * 0.3;
    let financial = Math.round(physical * financialBias);
    financial = Math.min(100, Math.max(prevFinancial, financial));
    
    const milestones = [];
    if (fraction < 0.1) milestones.push('Sanction');
    if (fraction > 0.15 && fraction < 0.3) milestones.push('Work Order Issued');
    if (fraction > 0.45 && fraction < 0.6) milestones.push('50% Milestone');
    if (fraction > 0.85) milestones.push('Near Completion');
    
    timeline.push({
      date: date.toISOString().split('T')[0],
      physical,
      financial,
      milestone: milestones.join(', ') || null
    });
    
    prevPhysical = physical;
    prevFinancial = financial;
  }
  
  return timeline;
}

async function seed7DimensionData() {
  console.log('=== Seeding 7-Dimension Risk Intelligence Data ===');
  
  const projects = await prisma.project.findMany();
  console.log(`Found ${projects.length} projects to enrich.`);
  
  let count = 0;
  for (const project of projects) {
    const seed = hashSeed(project.projectId || project.id);
    
    // Generate GIS coordinates
    const district = (project.district || '').toUpperCase();
    const coords = DISTRICT_COORDS[district];
    let latitude = null;
    let longitude = null;
    
    if (coords) {
      // Add small random offset for realistic scatter (±0.05 degrees ≈ ±5km)
      latitude = coords.lat + (seededRandom(seed + 1) - 0.5) * 0.1;
      longitude = coords.lng + (seededRandom(seed + 2) - 0.5) * 0.1;
    }
    
    // Generate physical and financial progress
    const status = (project.workStatus || '').toLowerCase();
    let physicalProgress = null;
    let financialProgress = null;
    
    if (project.expenditureRatio != null) {
      financialProgress = Math.min(100, Math.round(project.expenditureRatio * 100));
    }
    
    if (status.includes('completed') || project.actualCompletionDate) {
      physicalProgress = Math.round(85 + seededRandom(seed + 3) * 15);
    } else if (status.includes('physical inspection')) {
      physicalProgress = Math.round(70 + seededRandom(seed + 3) * 25);
    } else if (status.includes('progress') || status.includes('work in progress')) {
      physicalProgress = Math.round(20 + seededRandom(seed + 3) * 50);
    } else {
      physicalProgress = Math.round(seededRandom(seed + 3) * 40);
    }
    
    // Financial progress fallback
    if (financialProgress == null) {
      const bias = 0.85 + seededRandom(seed + 4) * 0.3;
      financialProgress = Math.min(100, Math.round(physicalProgress * bias));
    }
    
    // Generate document checklist
    const documentsChecklist = generateDocumentsChecklist(project, seed);
    const docCount = Object.values(documentsChecklist).filter(v => v).length;
    const documentCompleteness = Math.round((docCount / 12) * 100);
    
    // Generate progress timeline
    const progressTimeline = generateProgressTimeline(project, seed);
    
    // Stagnation days (random but correlated with status)
    let stagnationDays = 0;
    if (!project.actualCompletionDate && (project.completionDurationDays || 0) > 180) {
      stagnationDays = Math.round(seededRandom(seed + 5) * 150);
    }
    
    // Planned dates
    const plannedStartDate = project.sanctionDate || project.recommendationDate;
    let plannedCompletionDate = null;
    if (plannedStartDate) {
      const start = new Date(plannedStartDate);
      if (!isNaN(start.getTime())) {
        const planned = new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000);
        plannedCompletionDate = planned.toISOString().split('T')[0];
      }
    }
    
    // Revised estimates count
    const revisedEstimatesCount = seededRandom(seed + 6) < 0.15 ? Math.floor(seededRandom(seed + 7) * 3) + 1 : 0;
    
    await prisma.project.update({
      where: { id: project.id },
      data: {
        latitude,
        longitude,
        physicalProgress,
        financialProgress,
        documentsChecklist: JSON.stringify(documentsChecklist),
        documentCompleteness,
        progressTimeline: JSON.stringify(progressTimeline),
        stagnationDays,
        plannedStartDate: plannedStartDate || null,
        plannedCompletionDate,
        workOrderDate: project.sanctionDate || null,
        revisedEstimatesCount
      }
    });
    count++;
  }
  
  console.log(`Enriched ${count} projects with 7-dimension data.`);
}

seed7DimensionData()
  .catch(err => console.error('Seeding failed:', err))
  .finally(() => prisma.$disconnect());
