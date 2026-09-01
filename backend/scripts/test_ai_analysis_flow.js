import { PrismaClient } from '@prisma/client';
import { recalculateOverallProjectRisks } from '../routes/projects.js';
import { generateProjectSummary, generateDashboardSummary } from '../services/aiSummaryService.js';
import { aggregateRisk } from '../risk/riskAggregator.js';

const prisma = new PrismaClient();

async function testAiAnalysisFlow() {
  console.log('====================================================');
  console.log('  TESTING END-TO-END AI ANALYSIS & RISK BRIEFINGS   ');
  console.log('====================================================\n');

  // Step 1: Pick a real project from the database
  const sampleProject = await prisma.project.findFirst({
    where: { projectId: { not: '' } },
    include: { procurements: true }
  });

  if (!sampleProject) {
    console.error('❌ No project found in database');
    process.exit(1);
  }

  console.log('[AI DEBUG] Project ID:', sampleProject.projectId);
  console.log('[AI DEBUG] Project Description:', sampleProject.workDescription?.slice(0, 60));
  console.log('[AI DEBUG] District:', sampleProject.district, '| State:', sampleProject.state);
  console.log('[AI DEBUG] Sanctioned Amount: ₹' + (sampleProject.sanctionedAmount || 0).toLocaleString());

  // Step 2: Test 7-Dimension Risk Aggregation
  console.log('\n[AI DEBUG] 1. Testing 7-Dimension Risk Aggregator...');
  const allProjects = await prisma.project.findMany({ take: 20 });
  const riskResult = aggregateRisk(sampleProject, allProjects, null);
  console.log('  ✅ Overall Score:', riskResult.overallScore, '| Level:', riskResult.overallLevel);
  console.log('  ✅ Confidence:', riskResult.confidence + '% | Data Completeness:', riskResult.dataCompleteness + '%');
  console.log('  ✅ Dimensions Evaluated:');
  Object.entries(riskResult.dimensions).forEach(([dim, res]) => {
    console.log(`     - ${dim}: score=${res.score}, level=${res.level}, weight=${(res.weight * 100).toFixed(0)}%`);
  });
  console.log('  ✅ Top Risk Factors:', riskResult.topRiskFactors.length);
  console.log('  ✅ Recommended Actions:', riskResult.recommendedActions.length);

  // Step 3: Test Single Project AI Risk Briefing
  console.log('\n[AI DEBUG] 2. Testing Project AI Risk Intelligence Briefing...');
  const projectStructuredData = {
    projectId: sampleProject.projectId,
    workDescription: sampleProject.workDescription,
    district: sampleProject.district,
    state: sampleProject.state,
    workType: sampleProject.workType,
    sanctionedAmount: sampleProject.sanctionedAmount,
    overallRiskScore: riskResult.overallScore,
    overallRiskLevel: riskResult.overallLevel,
    confidence: riskResult.confidence,
    financial: {
      score: riskResult.dimensions.financial.score,
      level: riskResult.dimensions.financial.level,
      signals: riskResult.dimensions.financial.signals
    },
    procurement: null,
    contractor: null
  };

  const projectBriefing = await generateProjectSummary(projectStructuredData);
  console.log('  ✅ Project Briefing Generated At:', projectBriefing.generatedAt);
  console.log('  ✅ Is LLM Generated:', projectBriefing.isLlmGenerated);
  console.log('  ✅ Briefing Preview (first 200 chars):\n');
  console.log(projectBriefing.summaryMarkdown.slice(0, 200) + '...\n');

  // Step 4: Test Dashboard Portfolio AI Executive Briefing
  console.log('[AI DEBUG] 3. Testing Portfolio AI Executive Briefing...');
  const dashboardStats = {
    totalProjects: 1051,
    highRiskCount: 3,
    mediumRiskCount: 217,
    lowRiskCount: 831,
    insufficientDataCount: 0,
    priorityReviewCount: 220,
    topSignal: 'Peer Deviation',
    multiSignalCount: 18,
    districts: [
      { district: 'UNNAO', state: 'Uttar Pradesh', projectCount: 96, avgRiskScore: 35.2, highRiskCount: 2, mediumRiskCount: 15 }
    ]
  };

  const dashboardBriefing = await generateDashboardSummary(dashboardStats);
  console.log('  ✅ Dashboard Briefing Generated At:', dashboardBriefing.generatedAt);
  console.log('  ✅ Is LLM Generated:', dashboardBriefing.isLlmGenerated);
  console.log('  ✅ Dashboard Briefing Preview:\n');
  console.log(dashboardBriefing.summaryMarkdown.slice(0, 250) + '...\n');

  console.log('====================================================');
  console.log('  ALL AI ANALYSIS FLOWS VERIFIED SUCCESSFULLY ✅   ');
  console.log('====================================================');

  await prisma.$disconnect();
}

testAiAnalysisFlow().catch(err => {
  console.error('❌ AI analysis flow test failed:', err);
  process.exit(1);
});
