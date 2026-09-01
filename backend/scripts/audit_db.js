import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAudit() {
  const total = await prisma.project.count();
  const allProjects = await prisma.project.findMany();
  
  const withWorkId = allProjects.filter(p => p.projectId && p.projectId.trim() !== '').length;
  const withDesc = allProjects.filter(p => p.workDescription && p.workDescription.trim() !== '').length;
  const withDistrict = allProjects.filter(p => p.district && p.district.trim() !== '').length;
  const withSanctioned = allProjects.filter(p => p.sanctionedAmount != null).length;
  const withRiskScore = allProjects.filter(p => p.riskScore != null).length;
  const withRiskLevel = allProjects.filter(p => p.riskLevel != null).length;
  const withStatus = allProjects.filter(p => p.workStatus != null).length;
  const withAlert = allProjects.filter(p => p.riskEvidenceExplanation && p.riskEvidenceExplanation.trim() !== '').length;

  const blrProjects = allProjects.filter(p => (p.district || '').toUpperCase() === 'BENGALURU URBAN');
  const blrRiskCounts = {};
  blrProjects.forEach(p => {
    blrRiskCounts[p.riskLevel || 'UNKNOWN'] = (blrRiskCounts[p.riskLevel || 'UNKNOWN'] || 0) + 1;
  });

  const natRiskCounts = {};
  allProjects.forEach(p => {
    natRiskCounts[p.riskLevel || 'UNKNOWN'] = (natRiskCounts[p.riskLevel || 'UNKNOWN'] || 0) + 1;
  });

  console.log('=== FORENSIC DB AUDIT ===');
  console.log(JSON.stringify({
    totalCount: total,
    withWorkId,
    withDesc,
    withDistrict,
    withSanctioned,
    withRiskScore,
    withRiskLevel,
    withStatus,
    withAlert,
    blrCount: blrProjects.length,
    blrRiskCounts,
    natRiskCounts
  }, null, 2));

  // Also check top 5 projects in Bengaluru Urban
  console.log('\n=== TOP 5 BENGALURU URBAN PROJECTS BY RISK SCORE ===');
  console.log(blrProjects
    .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
    .slice(0, 5)
    .map(p => ({
      projectId: p.projectId,
      desc: p.workDescription?.slice(0, 50),
      district: p.district,
      sanctioned: p.sanctionedAmount,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      alert: p.riskEvidenceExplanation
    }))
  );

  await prisma.$disconnect();
}

runAudit().catch(console.error);
