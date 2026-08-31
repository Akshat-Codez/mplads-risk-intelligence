import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectLocations() {
  const stateDistricts = await prisma.project.findMany({
    select: { state: true, district: true },
    distinct: ['state', 'district'],
    orderBy: [{ state: 'asc' }, { district: 'asc' }]
  });

  const stateMap = {};
  for (const item of stateDistricts) {
    if (!item.state) continue;
    const st = item.state.trim();
    const dt = item.district ? item.district.trim() : 'Unknown';
    if (!stateMap[st]) stateMap[st] = new Set();
    stateMap[st].add(dt);
  }

  const output = {};
  for (const [st, dtSet] of Object.entries(stateMap)) {
    output[st] = Array.from(dtSet);
  }

  console.log('Location Hierarchy (States and Districts):', JSON.stringify(output, null, 2));

  // Count projects per state
  const stateCounts = await prisma.project.groupBy({
    by: ['state'],
    _count: { id: true }
  });
  console.log('\nState Project Counts:', JSON.stringify(stateCounts, null, 2));

  // Count projects in Karnataka / Bengaluru Urban
  const blrCount = await prisma.project.count({
    where: {
      AND: [
        { state: { contains: 'Karnataka' } },
        { district: { contains: 'BENGALURU' } }
      ]
    }
  });
  console.log('\nBengaluru Urban Count:', blrCount);
}

inspectLocations()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
