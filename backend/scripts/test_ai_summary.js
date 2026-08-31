// Using built-in fetch

async function runTests() {
  console.log('=== Running Phase 6 AI Officer Summary Tests ===\n');

  // 1. Login to get JWT
  console.log('1. Logging in as Ministry Officer...');
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
    throw new Error(`Login failed with status ${loginRes.status}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful. Token obtained.\n');

  // 2. Test GET /api/ai/summary
  console.log('2. Testing GET /api/ai/summary...');
  const summaryRes = await fetch('http://localhost:5000/api/ai/summary', {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!summaryRes.ok) {
    throw new Error(`GET /api/ai/summary failed with status ${summaryRes.status}`);
  }
  const summaryData = await summaryRes.json();
  console.log('Dashboard AI Summary Response:');
  console.log(`- Total Projects: ${summaryData.stats.totalProjects}`);
  console.log(`- Priority Review Count: ${summaryData.stats.priorityReviewCount} (${summaryData.stats.highRiskCount} High, ${summaryData.stats.mediumRiskCount} Medium)`);
  console.log(`- Top Signal: ${summaryData.stats.topSignal}`);
  console.log(`- Multi-Signal Projects: ${summaryData.stats.multiSignalCount}`);
  console.log(`- Districts Count: ${summaryData.districts.length}`);
  console.log(`- Priority Projects Count: ${summaryData.priorityProjects.length}`);
  console.log('\n--- Generated Markdown Preview ---');
  console.log(summaryData.summaryMarkdown);
  console.log('----------------------------------\n');

  // 3. Test GET /api/ai/project/:projectId/summary for 3 distinct types
  const testProjects = [
    { id: 'WS/MP086/2025-2026/196052', label: 'High-Risk Project with BOQ + Contractor' },
    { id: 'WS/MP233/2025-2026/266721', label: 'Normal / Low-Risk Project' },
    { id: 'WS/MP096/2024-2025/146754', label: 'Insufficient Data Project' }
  ];

  for (const t of testProjects) {
    console.log(`3. Testing Project AI Summary for [${t.label}] (ID: ${t.id})...`);
    const encodedId = encodeURIComponent(t.id);
    const pRes = await fetch(`http://localhost:5000/api/ai/project/${encodedId}/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!pRes.ok) {
      console.error(`Failed to fetch summary for ${t.id}: status ${pRes.status}`);
      continue;
    }

    const pData = await pRes.json();
    console.log(`Score: ${pData.structuredData.overallRiskScore} | Level: ${pData.structuredData.overallRiskLevel} | Confidence: ${pData.structuredData.confidence}%`);
    console.log('AI Briefing Output:');
    console.log(pData.summaryMarkdown);
    console.log('\n==================================================\n');
  }

  // 4. Test GET /api/ai/districts
  console.log('4. Testing GET /api/ai/districts...');
  const distRes = await fetch('http://localhost:5000/api/ai/districts', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const distData = await distRes.json();
  console.log(`Retrieved ${distData.length} districts.`);
  console.log('Top 3 Districts by Risk Priority:');
  distData.slice(0, 3).forEach(d => {
    console.log(`- ${d.district} (${d.state}): ${d.projectCount} works | High: ${d.highRiskCount} | Med: ${d.mediumRiskCount} | Avg Risk: ${d.avgRiskScore} | Dominant: ${d.dominantSignal}`);
  });

  console.log('\n=== All Phase 6 API & AI Engine Tests Completed Successfully! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
