export default function calculateDocumentationRisk(project) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  const { documentsChecklist, workStatus, expenditureRatio, financialProgress, imageAvailable } = project;
  
  // Maps checklist keys to human-readable document names
  const DOC_MAP = {
    aa: 'Administrative Approval',
    ts: 'Technical Sanction',
    estimate: 'Estimate',
    boq: 'BOQ',
    tender: 'Tender Document',
    workOrder: 'Work Order',
    mb: 'Measurement Book',
    bills: 'Bills',
    uc: 'Utilization Certificate',
    cc: 'Completion Certificate',
    inspection: 'Inspection Report',
    photos: 'Progress Photos'
  };

  // Parse documentsChecklist — can be JSON string or object
  let docs = {};
  if (documentsChecklist) {
    dataUsed.push('documentsChecklist');
    if (typeof documentsChecklist === 'string') {
      try { docs = JSON.parse(documentsChecklist); } catch(e) { docs = {}; }
    } else if (typeof documentsChecklist === 'object' && !Array.isArray(documentsChecklist)) {
      docs = documentsChecklist;
    }

    // Count missing documents
    const missingDocs = [];
    for (const [key, name] of Object.entries(DOC_MAP)) {
      if (!docs[key]) {
        missingDocs.push(name);
      }
    }
    
    const missingCount = missingDocs.length;
    if (missingCount > 0) {
      const points = Math.round(missingCount * (100 / 12));
      score += points;
      signals.push({ signal: 'Document Completeness', description: `${missingCount} of 12 statutory documents missing`, points, evidence: `Missing: ${missingDocs.slice(0, 5).join(', ')}${missingDocs.length > 5 ? ` (+${missingDocs.length - 5} more)` : ''}` });
    }
    
    // Consistency violations
    const status = (workStatus || '').toLowerCase();
    const isCompleted = status.includes('completed');
    const expRatio = expenditureRatio || 0;
    const finProgress = financialProgress || 0;
    
    if (isCompleted && !docs.cc) {
      score += 15;
      signals.push({ signal: 'Missing Completion Certificate', description: 'Project marked completed but no Completion Certificate on record', points: 15, evidence: `Status: ${workStatus}` });
    }
    
    if ((expRatio > 0.8 || finProgress > 80) && !docs.bills) {
      score += 12;
      signals.push({ signal: 'Missing Bills', description: 'High expenditure but no Bills document on record', points: 12, evidence: `Expenditure ratio: ${(expRatio * 100).toFixed(0)}%` });
    }
    
    if (finProgress > 0 && !docs.workOrder) {
      score += 10;
      signals.push({ signal: 'Missing Work Order', description: 'Payments recorded but no Work Order on file', points: 10, evidence: 'Financial progress > 0% without Work Order' });
    }
    
    if (finProgress > 50 && !docs.mb) {
      score += 8;
      signals.push({ signal: 'Missing Measurement Book', description: 'Expenditure exceeds 50% but no Measurement Book', points: 8, evidence: `Financial progress: ${finProgress}%` });
    }
    
    if (isCompleted && !docs.inspection) {
      score += 10;
      signals.push({ signal: 'Missing Inspection Report', description: 'Project completed but no Inspection Report', points: 10, evidence: `Status: ${workStatus}` });
    }
    
    if (imageAvailable && !docs.photos) {
      score += 5;
      signals.push({ signal: 'Photo Metadata Mismatch', description: 'Images reported available but not in document checklist', points: 5, evidence: 'imageAvailable=true but photos=false' });
    }

  } else {
    missingData.push('documentsChecklist');
  }

  score = Math.min(score, 100);
  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed, missingData };
}
