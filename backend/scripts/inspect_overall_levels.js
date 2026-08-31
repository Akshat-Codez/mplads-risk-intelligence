import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectLevels() {
  console.log('=== Inspecting Overall Risk Levels in DB ===');
  
  const levels = await prisma.project.groupBy({
    by: ['riskLevel'],
    _count: {
      id: true
    }
  });

  console.log(JSON.stringify(levels, null, 2));

  // Let's also fetch 5 real projects and show their risk score details
  const projects = await prisma.project.findMany({
    where: {
      riskScore: { gt: 0 }
    },
    take: 5,
    include: {
      procurements: true
    }
  });

  const contractors = await prisma.contractor.findMany();
  const contractorMap = new Map();
  contractors.forEach(c => contractorMap.set(c.normalizedName, c));

  function normalizeName(name) {
    if (!name) return 'unknown';
    const primary = name.split(',')[0].trim();
    return primary
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, '')
      .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
  }

  projects.forEach(p => {
    const latestProc = p.procurements && p.procurements.length > 0 ? p.procurements[0] : null;
    const procScore = latestProc ? latestProc.procurementRiskScore : 'N/A';
    
    let contractorScore = 'N/A';
    if (p.vendorName) {
      const normName = normalizeName(p.vendorName);
      const c = contractorMap.get(normName);
      if (c) {
        contractorScore = c.contractorRiskScore;
      }
    }

    console.log(`\nProject ID:      ${p.projectId}`);
    console.log(`Description:     ${p.workDescription}`);
    console.log(`Financial Risk:  ${p.financialRiskScore}`);
    console.log(`Procurement Risk:${procScore}`);
    console.log(`Contractor Risk: ${contractorScore}`);
    console.log(`Overall Risk:    ${p.riskScore}`);
    console.log(`Risk Level:      ${p.riskLevel}`);
    console.log(`Top Signals:     ${p.riskEvidenceExplanation}`);
  });
}

inspectLevels()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
