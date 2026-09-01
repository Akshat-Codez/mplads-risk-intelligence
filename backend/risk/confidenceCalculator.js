export function calculateConfidence(project, availableEngines) {
  let confidence = 30; // base confidence since financial data always present from CSV

  const engines = ['procurement', 'progress', 'contractor', 'gis', 'documentation'];
  engines.forEach(eng => {
    if (availableEngines[eng]) confidence += 10;
  });
  if (availableEngines.crossSignal) confidence += 5;
  
  confidence = Math.min(100, Math.max(0, confidence));

  const importantFields = [
    'sanctionedAmount', 'totalDisbursed', 'expenditureRatio', 
    'physicalProgress', 'financialProgress', 'latitude', 
    'longitude', 'documentsChecklist', 'vendorName', 
    'workStatus', 'recommendationDate', 'sanctionDate', 
    'actualCompletionDate', 'completionDurationDays', 'paymentCount'
  ];

  let presentCount = 0;
  importantFields.forEach(field => {
    if (project[field] !== undefined && project[field] !== null && project[field] !== '') {
      presentCount++;
    }
  });

  const dataCompleteness = importantFields.length > 0 ? (presentCount / importantFields.length) * 100 : 0;
  
  let engineCount = Object.values(availableEngines).filter(v => v === true).length;

  return { 
    confidence, 
    dataCompleteness, 
    availableEngines, 
    engineCount 
  };
}

export default calculateConfidence;
