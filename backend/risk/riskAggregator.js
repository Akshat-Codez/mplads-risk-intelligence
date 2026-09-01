import calculateFinancialRisk from './financialRisk.js';
import calculateProcurementRisk from './procurementRisk.js';
import calculateProgressRisk from './progressRisk.js';
import calculateContractorRisk from './contractorRisk.js';
import calculateGisRisk from './gisRisk.js';
import calculateDocumentationRisk from './documentationRisk.js';
import { calculateCrossSignalRisk } from './crossSignalRisk.js';
import { calculateConfidence } from './confidenceCalculator.js';
import { generateRecommendations } from './recommendationEngine.js';

export function aggregateRisk(project, allProjects, contractorProfile) {
  // Determine which engines have sufficient data
  const engineAvailability = {
    financial: project.sanctionedAmount != null || project.totalDisbursed != null,
    procurement: project.procurementRiskScore != null && project.procurementRiskScore > 0,
    progress: project.physicalProgress != null || project.financialProgress != null || project.completionDurationDays != null,
    contractor: project.vendorName != null,
    gis: project.latitude != null && project.longitude != null,
    documentation: project.documentsChecklist != null,
    crossSignal: true // Can always run, handles missing data internally
  };

  // 1. Call all dimension engines safely based on availability
  const results = {
    financial: engineAvailability.financial ? calculateFinancialRisk(project) : { score: 0, level: 'LOW', signals: [] },
    procurement: engineAvailability.procurement ? calculateProcurementRisk(project) : { score: 0, level: 'LOW', signals: [] },
    progress: engineAvailability.progress ? calculateProgressRisk(project) : { score: 0, level: 'LOW', signals: [] },
    contractor: engineAvailability.contractor ? calculateContractorRisk(project, contractorProfile) : { score: 0, level: 'LOW', signals: [] },
    gis: engineAvailability.gis ? calculateGisRisk(project, allProjects) : { score: 0, level: 'LOW', signals: [] },
    documentation: engineAvailability.documentation ? calculateDocumentationRisk(project) : { score: 0, level: 'LOW', signals: [] }
  };

  // Enhance project with interim scores for crossSignalRisk
  const enrichedProject = {
    ...project,
    financialRiskScore: results.financial.score,
    contractorRiskScore: results.contractor.score,
    riskScore: Math.max(results.financial.score, results.progress.score, results.contractor.score) // Rough proxy if needed
  };

  results.crossSignal = calculateCrossSignalRisk(enrichedProject);

  // 4. Apply Dynamic Weight Redistribution
  const baseWeights = {
    financial: 0.20,
    procurement: 0.15,
    progress: 0.20,
    contractor: 0.15,
    gis: 0.10,
    documentation: 0.10,
    crossSignal: 0.10
  };

  let totalAvailableWeight = 0;
  for (const [engine, isAvailable] of Object.entries(engineAvailability)) {
    if (isAvailable) {
      totalAvailableWeight += baseWeights[engine];
    }
  }

  const activeWeights = {};
  let overallScore = 0;
  // 5. Calculate weighted overall score
  for (const [engine, isAvailable] of Object.entries(engineAvailability)) {
    if (isAvailable) {
      activeWeights[engine] = baseWeights[engine] / totalAvailableWeight;
      overallScore += results[engine].score * activeWeights[engine];
    } else {
      activeWeights[engine] = 0;
    }
  }

  overallScore = Math.min(100, Math.round(overallScore));

  const { confidence, dataCompleteness } = calculateConfidence(project, engineAvailability);

  // 7. Determine level
  let overallLevel = 'LOW';
  if (confidence < 40) {
    overallLevel = 'INSUFFICIENT DATA';
  } else if (overallScore >= 50) {
    overallLevel = 'HIGH';
  } else if (overallScore >= 25) {
    overallLevel = 'MEDIUM';
  }

  // 6. Extract top 5 contributing factors
  let allSignals = [];
  for (const [engine, weight] of Object.entries(activeWeights)) {
    if (results[engine] && results[engine].signals && weight > 0) {
      results[engine].signals.forEach(sig => {
        const points = sig.points || Math.round(results[engine].score * weight);
        const factor = sig.signal || sig.factor || sig.name || sig.description || `${engine} signal`;
        const evidence = sig.evidence || sig.description || factor;
        allSignals.push({
          factor,
          engine,
          points,
          evidence
        });
      });
    }
  }
  
  allSignals.sort((a, b) => b.points - a.points);
  const topRiskFactors = allSignals.slice(0, 5);

  // 8. Call recommendationEngine
  const riskResultsForRecs = { ...results, overallScore };
  const recommendedActions = generateRecommendations(project, riskResultsForRecs);

  let missingData = [];
  for (const res of Object.values(results)) {
    if (res.missingData) {
      missingData.push(...res.missingData);
    }
  }
  missingData = [...new Set(missingData)];

  // 9. Return comprehensive result
  return {
    overallScore,
    overallLevel,
    dimensions: {
      financial: { ...results.financial, weight: activeWeights.financial },
      procurement: { ...results.procurement, weight: activeWeights.procurement },
      progress: { ...results.progress, weight: activeWeights.progress },
      contractor: { ...results.contractor, weight: activeWeights.contractor },
      gis: { ...results.gis, weight: activeWeights.gis },
      documentation: { ...results.documentation, weight: activeWeights.documentation },
      crossSignal: { ...results.crossSignal, weight: activeWeights.crossSignal }
    },
    topRiskFactors,
    confidence,
    dataCompleteness,
    recommendedActions,
    missingData,
    activeWeights,
    engineAvailability
  };
}

export default aggregateRisk;
