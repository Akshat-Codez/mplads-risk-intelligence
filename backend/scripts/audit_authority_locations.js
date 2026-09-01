import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLocations() {
  console.log("=========================================");
  console.log("DATABASE AUDIT: STATES & DISTRICTS IN DB");
  console.log("=========================================");

  const states = await prisma.project.groupBy({
    by: ['state'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });

  console.log(`\nTotal Unique States in DB: ${states.length}`);
  for (const s of states) {
    console.log(`- ${s.state || 'NULL'}: ${s._count.id} projects`);
  }

  const allProjects = await prisma.project.findMany({
    select: { state: true, district: true },
    distinct: ['state', 'district'],
    orderBy: [{ state: 'asc' }, { district: 'asc' }]
  });

  const stateDistricts = {};
  for (const p of allProjects) {
    if (!p.state || !p.state.trim()) continue;
    const st = p.state.trim();
    const dt = p.district ? p.district.trim() : 'UNKNOWN';
    if (!stateDistricts[st]) {
      stateDistricts[st] = new Set();
    }
    stateDistricts[st].add(dt);
  }

  console.log("\n=========================================");
  console.log("DISTRICTS GROUPED BY STATE");
  console.log("=========================================");
  for (const [st, dtSet] of Object.entries(stateDistricts)) {
    const dts = Array.from(dtSet).sort();
    console.log(`\nState: ${st} (${dts.length} districts)`);
    console.log(`  Districts: ${dts.slice(0, 10).join(', ')}${dts.length > 10 ? ' ... and ' + (dts.length - 10) + ' more' : ''}`);
  }

  console.log("\n=========================================");
  console.log("USER / AUTHORITY ACCOUNTS IN DB");
  console.log("=========================================");
  const users = await prisma.user.findMany();
  console.log(`Total users in DB: ${users.length}`);
  for (const u of users) {
    console.log(`- ID: ${u.authorityId} | Name: ${u.name} | Role: ${u.role} | State: ${u.state} | District: ${u.district}`);
  }

  await prisma.$disconnect();
}

checkLocations().catch(console.error);
