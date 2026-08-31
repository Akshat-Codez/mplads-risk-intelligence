import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectHigh() {
  console.log('=== Inspecting projects with riskScore > 40 ===');
  const projects = await prisma.project.findMany({
    where: {
      riskScore: { gt: 40 }
    },
    orderBy: { riskScore: 'desc' },
    take: 10
  });

  projects.forEach(p => {
    console.log(`\nProject ID: ${p.projectId}`);
    console.log(`Risk Score: ${p.riskScore} | Risk Level: ${p.riskLevel}`);
    console.log(`Components: ${p.riskComponents}`);
    console.log(`Reasons: ${p.structuredReasons}`);
    console.log(`Explanation: ${p.riskEvidenceExplanation}`);
  });
}

inspectHigh()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
