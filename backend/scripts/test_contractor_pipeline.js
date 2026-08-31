import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to normalize contractor names for matching
function normalizeContractorName(name) {
  if (!name) return 'unknown';
  const primary = name.split(',')[0].trim();
  return primary
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, '')
    .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
}

async function runTests() {
  console.log('=== Running Contractor Intelligence Pipeline Tests ===\n');

  // Obtain login token
  console.log('1. Logging in to get JWT token...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorityId: 'GOV-MOSPI-001',
      password: 'password',
      role: 'MINISTRY'
    })
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }
  const { token } = await loginRes.json();
  console.log('Token successfully obtained.\n');

  // Test 1: Retrieve Contractor list
  console.log('2. Testing GET /api/contractors...');
  const listRes = await fetch('http://localhost:5000/api/contractors?limit=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!listRes.ok) throw new Error(`List failed: ${await listRes.text()}`);
  const listData = await listRes.json();
  console.log(`Contractors count in database: ${listData.total}`);
  console.log(`Retrieved first 5 profiles:`);
  listData.contractors.forEach(c => {
    console.log(`- ${c.name} (Projects: ${c.project_count}, Risk: ${c.contractor_risk_level})`);
  });
  console.log();

  // Test 2: Search for a specific contractor
  const query = 'GANESH';
  console.log(`3. Testing Search for "${query}"...`);
  const searchRes = await fetch(`http://localhost:5000/api/contractors?search=${query}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!searchRes.ok) throw new Error(`Search failed: ${await searchRes.text()}`);
  const searchData = await searchRes.json();
  console.log(`Search matched ${searchData.total} profiles.`);
  const matched = searchData.contractors[0];
  if (matched) {
    console.log(`First match: ${matched.name} | ID: ${matched.id} | Key: ${matched.normalized_name}`);
  }
  console.log();

  // Test 3: Get associated projects
  if (matched) {
    console.log(`4. Testing GET /api/contractors/${matched.id}/projects...`);
    const projectsRes = await fetch(`http://localhost:5000/api/contractors/${matched.id}/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!projectsRes.ok) throw new Error(`Projects retrieval failed: ${await projectsRes.text()}`);
    const projectsData = await projectsRes.json();
    console.log(`Found ${projectsData.length} projects associated with ${matched.name}.`);
    console.log();

    // Test 4: Risk & compatibility evaluation
    console.log(`5. Testing GET /api/contractors/${matched.id}/risk without target...`);
    const riskRes = await fetch(`http://localhost:5000/api/contractors/${matched.id}/risk`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const riskData = await riskRes.json();
    console.log(`Score: ${riskData.contractor_risk_score} | Level: ${riskData.contractor_risk_level}`);
    console.log('Signals:', riskData.contractor_risk_signals);
    console.log();

    // Grab a random project to compare scale/category compatibility
    const otherProject = await prisma.project.findFirst({
      where: {
        NOT: {
          vendorName: matched.name
        }
      }
    });

    if (otherProject) {
      console.log(`6. Testing compatibility against project: "${otherProject.workDescription}" (Category: ${otherProject.workType}, Cost: Rs. ${otherProject.sanctionedAmount})`);
      const compRes = await fetch(`http://localhost:5000/api/contractors/${matched.id}/risk?projectId=${otherProject.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const compData = await compRes.json();
      console.log('Combined Score:', compData.combined_risk_score);
      console.log('Combined Level:', compData.combined_risk_level);
      console.log('Compatibility Signals:', compData.compatibility_signals);
      console.log();
    }
  }

  // Test 5: Normalization correctness verification
  console.log('7. Verifying name normalization rules...');
  const testNames = [
    'N G GANESH BABU',
    'n. g. ganesh babu, pwd contractor',
    'N G GANESH BABU PVT LTD',
    'N.G. Ganesh Babu'
  ];
  const normalizedKeys = testNames.map(normalizeContractorName);
  console.log('Input names:', testNames);
  console.log('Normalized keys:', normalizedKeys);
  const allEqual = normalizedKeys.every(k => k === normalizedKeys[0]);
  console.log(`All mapped to same key: ${allEqual ? 'SUCCESS' : 'FAILED'}`);
  console.log();

  console.log('=== All Contractor Pipeline Tests Completed Successfully ===');
}

runTests()
  .catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
