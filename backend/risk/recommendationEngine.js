export function generateRecommendations(project, riskResults) {
  const recommendations = [];

  const addRec = (condition, action, priority, reason, engine) => {
    if (condition) {
      recommendations.push({ action, priority, reason, engine });
    }
  };

  const financialRisk = riskResults.financial || {score: 0};
  const procurementRisk = riskResults.procurement || {score: 0};
  const progressRisk = riskResults.progress || {score: 0};
  const contractorRisk = riskResults.contractor || {score: 0};
  const gisRisk = riskResults.gis || {score: 0};
  const documentationRisk = riskResults.documentation || {score: 0};
  const crossSignalRisk = riskResults.crossSignal || {score: 0};

  addRec(financialRisk.score > 60, 'Detailed Financial Audit and Expenditure Verification', 'CRITICAL', 'High financial risk score detected', 'financial');
  addRec(procurementRisk.score > 50, 'BOQ Rate Verification against CPWD DSR Schedule', 'HIGH', 'High procurement deviation or risk', 'procurement');
  addRec(progressRisk.score > 50, 'Physical Site Inspection and Progress Verification', 'HIGH', 'Physical progress lags or risks detected', 'progress');
  addRec(contractorRisk.score > 50, 'Contractor Performance Audit and Concentration Review', 'HIGH', 'High contractor risk or concentration', 'contractor');
  addRec(gisRisk.score > 50, 'Geographic Cluster Investigation and Site Verification', 'MEDIUM', 'Spatial anomalies detected', 'gis');
  addRec(documentationRisk.score > 40, 'Document Compliance Scrutiny and Missing Document Recovery', 'MEDIUM', 'Poor document completeness', 'documentation');
  addRec(crossSignalRisk.score > 40, 'Multi-Dimensional Anomaly Review by Senior Officer', 'HIGH', 'Correlated risk signals detected', 'crossSignal');

  const overallScore = riskResults.overallScore || 0;
  addRec(overallScore > 70, 'Immediate Escalation to Supervisory Authority', 'CRITICAL', 'Overall risk score is dangerously high', 'overall');
  
  if (project.stagnationDays > 120) {
    addRec(true, 'Progress Stagnation Review and Contractor Show-Cause', 'HIGH', 'Project progress stagnated for over 120 days', 'progress');
  }

  return recommendations;
}

export default generateRecommendations;
