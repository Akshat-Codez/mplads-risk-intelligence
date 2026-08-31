async function runFeedbackTests() {
  console.log('=== Running Phase 7 Human Verification & Feedback Pipeline Tests ===\n');

  // 1. Obtain JWT Token via login as an authorized officer
  console.log('1. Logging in as Ministry Officer (GOV-MOSPI-001)...');
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authorityId: 'GOV-MOSPI-001',
      password: 'password',
      role: 'MINISTRY'
    })
  });

  if (!loginRes.ok) throw new Error(`Login failed with status ${loginRes.status}`);
  const { token } = await loginRes.json();
  console.log('Login successful. Token obtained.\n');

  // Use a real high-risk test project
  const testProjectId = 'WS/MP086/2025-2026/196052';
  const encodedId = encodeURIComponent(testProjectId);

  // 2. Fetch baseline project state before feedback
  console.log('2. Fetching baseline project state before feedback...');
  const projResBefore = await fetch(`http://localhost:5000/api/projects/${encodedId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!projResBefore.ok) throw new Error(`Fetch project failed: ${projResBefore.status}`);
  const projectBefore = await projResBefore.json();
  const baselineScore = projectBefore.riskScore || projectBefore.prototype_risk_score;
  const baselineLevel = projectBefore.riskLevel || projectBefore.risk_level;
  console.log(`Baseline Project Risk: ${baselineScore}/100 (${baselineLevel})\n`);

  // 3. Test submitting all 4 official decisions
  const decisionsToTest = [
    {
      decision: 'CONFIRMED',
      reason: 'Physical site verification confirmed structural delay and peer rate deviation without adequate documentation.'
    },
    {
      decision: 'FALSE_POSITIVE',
      reason: 'Executing agency provided authorized technical justification explaining the specific terrain and material transportation costs.'
    },
    {
      decision: 'REQUIRES_INVESTIGATION',
      reason: 'Field measurement books show discrepancy with contractor invoice. Forwarded to state vigilance officer.'
    },
    {
      decision: 'INSUFFICIENT_DATA',
      reason: 'Tender BOQ documents and revised completion certificates have not yet been uploaded to e-SAKSHI portal.'
    }
  ];

  for (const item of decisionsToTest) {
    console.log(`3. Testing Feedback Submission: [${item.decision}]...`);
    const submitRes = await fetch(`http://localhost:5000/api/projects/${encodedId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        decision: item.decision,
        reason: item.reason,
        modelType: 'OVERALL'
      })
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      throw new Error(`Submission of ${item.decision} failed with status ${submitRes.status}: ${err}`);
    }

    const resData = await submitRes.json();
    console.log(`Feedback Created ID: ${resData.feedback.id}`);
    console.log(`Stored Snapshot AI Score: ${resData.feedback.overallRiskScore} (${resData.feedback.riskLevel})`);
    console.log(`Stored Officer Decision: ${resData.feedback.officerDecision}`);
    console.log(`Officer Name/Role: ${resData.feedback.officer.name} (${resData.feedback.officer.role})`);
    console.log('Submission verified successfully.\n');
  }

  // 4. CRITICAL CHECK: Verify that project risk score did NOT change
  console.log('4. Verifying CRITICAL DATA INTEGRITY PRINCIPLE: Project risk score must remain unchanged...');
  const projResAfter = await fetch(`http://localhost:5000/api/projects/${encodedId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const projectAfter = await projResAfter.json();
  const scoreAfter = projectAfter.riskScore || projectAfter.prototype_risk_score;
  const levelAfter = projectAfter.riskLevel || projectAfter.risk_level;

  if (scoreAfter !== baselineScore || levelAfter !== baselineLevel) {
    throw new Error(`CRITICAL FAILURE: Project risk score changed from ${baselineScore} (${baselineLevel}) to ${scoreAfter} (${levelAfter})!`);
  }
  console.log(`CONFIRMED: Project risk score is still ${scoreAfter}/100 (${levelAfter}). Original AI prediction preserved intact.\n`);

  // 5. Test Negative & Validation Cases
  console.log('5. Testing Security & Input Validation Error Cases...');

  // 5.1 Unauthorized (Missing Token)
  console.log('- Testing Unauthorized request (No Token)...');
  const unauthRes = await fetch(`http://localhost:5000/api/projects/${encodedId}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision: 'CONFIRMED', reason: 'Test reason' })
  });
  if (unauthRes.status === 401) {
    console.log('  PASS: Unauthorized request rejected with 401.');
  } else {
    throw new Error(`Expected 401 but got ${unauthRes.status}`);
  }

  // 5.2 Invalid Decision
  console.log('- Testing Invalid decision string...');
  const invalidDecRes = await fetch(`http://localhost:5000/api/projects/${encodedId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ decision: 'ARBITRARY_DECISION', reason: 'Valid reason here' })
  });
  if (invalidDecRes.status === 400) {
    console.log('  PASS: Invalid decision rejected with 400.');
  } else {
    throw new Error(`Expected 400 but got ${invalidDecRes.status}`);
  }

  // 5.3 Missing / Short Reason
  console.log('- Testing Missing / Short reason string...');
  const shortReasonRes = await fetch(`http://localhost:5000/api/projects/${encodedId}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ decision: 'CONFIRMED', reason: 'ok' })
  });
  if (shortReasonRes.status === 400) {
    console.log('  PASS: Short reason rejected with 400.');
  } else {
    throw new Error(`Expected 400 but got ${shortReasonRes.status}`);
  }

  // 5.4 Invalid Project ID
  console.log('- Testing Invalid Project ID...');
  const nonExistentRes = await fetch('http://localhost:5000/api/projects/NON_EXISTENT_WORK_99999/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ decision: 'CONFIRMED', reason: 'This is a valid long reason' })
  });
  if (nonExistentRes.status === 404) {
    console.log('  PASS: Non-existent project rejected with 404.\n');
  } else {
    throw new Error(`Expected 404 but got ${nonExistentRes.status}`);
  }

  // 6. Test Feedback History Retrieval
  console.log('6. Testing GET /api/projects/:projectId/feedback...');
  const historyRes = await fetch(`http://localhost:5000/api/projects/${encodedId}/feedback`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const historyData = await historyRes.json();
  console.log(`Retrieved ${historyData.length} historical feedback records for project ${testProjectId}:`);
  historyData.slice(0, 2).forEach((f, i) => {
    console.log(`  [${i+1}] Decision: ${f.officerDecision} | AI Snapshot Risk: ${f.overallRiskScore} | Officer: ${f.officer?.name} | Time: ${f.createdAt}`);
    console.log(`      Reason: "${f.reason}"`);
  });
  console.log('');

  // 7. Test Dashboard Feedback Metrics
  console.log('7. Testing GET /api/feedback/metrics...');
  const metricsRes = await fetch('http://localhost:5000/api/feedback/metrics', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const metricsData = await metricsRes.json();
  console.log('Feedback Metrics Response:', metricsData);
  console.log('');

  console.log('=== All Phase 7 Human Verification & Feedback Pipeline Tests Passed 100%! ===');
}

runFeedbackTests().catch(err => {
  console.error('Feedback pipeline test failed:', err);
  process.exit(1);
});
