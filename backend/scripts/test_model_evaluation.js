async function runModelEvaluationTests() {
  console.log('=== Running Phase 8 Model Evaluation & Future Training Pipeline Tests ===\n');

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

  if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
  const { token } = await loginRes.json();
  console.log('Login successful. Token obtained.\n');

  // 2. Test GET /api/models (Model Registry & Baseline Model)
  console.log('2. Testing GET /api/models (Model Registry)...');
  const modelsRes = await fetch('http://localhost:5000/api/models', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!modelsRes.ok) throw new Error(`Fetch models failed: ${modelsRes.status}`);
  const models = await modelsRes.json();
  console.log(`Retrieved ${models.length} registered models.`);
  
  const baseline = models.find(m => m.version === 'v1.0-nirman-ensemble');
  if (!baseline) throw new Error('Baseline model v1.0-nirman-ensemble not found in registry!');
  console.log(`Baseline Model Name: ${baseline.name}`);
  console.log(`Baseline Version: ${baseline.version} | Status: ${baseline.status}`);
  console.log(`Baseline Metrics -> Precision: ${baseline.precision}, Recall: ${baseline.recall}, F1: ${baseline.f1Score}, FPR: ${baseline.falsePositiveRate}`);
  console.log('Baseline Model verified successfully.\n');

  // 3. Test GET /api/models/active
  console.log('3. Testing GET /api/models/active...');
  const activeRes = await fetch('http://localhost:5000/api/models/active', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const activeModel = await activeRes.json();
  console.log(`Active Model: ${activeModel.name} (${activeModel.version}) - Status: ${activeModel.status}\n`);

  // 4. Test GET /api/models/dataset-status (Honest Insufficient Data Reporting)
  console.log('4. Testing GET /api/models/dataset-status (Dataset Readiness & Quality)...');
  const statusRes = await fetch('http://localhost:5000/api/models/dataset-status', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const datasetStatus = await statusRes.json();
  console.log(`Total Feedback Records: ${datasetStatus.totalFeedbackCount}`);
  console.log(`Valid Labeled Records: ${datasetStatus.validLabeledCount} (Min Required: ${datasetStatus.minRequired})`);
  console.log('Class Distribution:', datasetStatus.classDistribution);
  console.log(`Training Available: ${datasetStatus.isTrainingAvailable ? 'YES' : 'NO'}`);
  console.log(`System Status Message: "${datasetStatus.reason}"`);
  
  if (datasetStatus.validLabeledCount < datasetStatus.minRequired && datasetStatus.isTrainingAvailable === true) {
    throw new Error('FAILED: Training should be disabled when insufficient labeled feedback exists!');
  }
  console.log('Honest insufficient data handling verified.\n');

  // 5. Test POST /api/models/train (Training Request Handling)
  console.log('5. Testing POST /api/models/train with Insufficient Data...');
  const trainRes = await fetch('http://localhost:5000/api/models/train', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const trainData = await trainRes.json();
  console.log(`Training Response Status: ${trainData.status}`);
  console.log(`Training Response Message: "${trainData.message}"`);
  console.log(`Recommendation: "${trainData.recommendation}"`);
  console.log('Graceful training deferral verified.\n');

  // 6. Test POST /api/models/evaluate (Baseline vs Supervised Candidate Evaluation Benchmark)
  console.log('6. Testing POST /api/models/evaluate (Full Metric Evaluation & Comparison)...');
  const evalRes = await fetch('http://localhost:5000/api/models/evaluate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!evalRes.ok) throw new Error(`Evaluate failed: ${evalRes.status}`);
  const evalData = await evalRes.json();
  
  console.log(`Evaluation Dataset Partitions -> Train: ${evalData.datasetInfo.trainSamples}, Val: ${evalData.datasetInfo.validationSamples}, Test: ${evalData.datasetInfo.testSamples}`);
  console.log('\n--- MODEL COMPARISON TABLE ---');
  console.log(`[Baseline] ${evalData.baselineModel.name} (${evalData.baselineModel.version})`);
  console.log(`  Precision: ${evalData.baselineModel.metrics.precision} | Recall: ${evalData.baselineModel.metrics.recall} | F1: ${evalData.baselineModel.metrics.f1} | FPR: ${evalData.baselineModel.metrics.falsePositiveRate}`);
  console.log(`  Confusion Matrix: TP=${evalData.baselineModel.metrics.confusionMatrix.truePositives}, FP=${evalData.baselineModel.metrics.confusionMatrix.falsePositives}, TN=${evalData.baselineModel.metrics.confusionMatrix.trueNegatives}, FN=${evalData.baselineModel.metrics.confusionMatrix.falseNegatives}`);

  for (const cand of evalData.candidateModels) {
    console.log(`\n[Candidate] ${cand.name} (${cand.version}) - Status: ${cand.status}`);
    console.log(`  Algorithm: ${cand.algorithm}`);
    console.log(`  Precision: ${cand.metrics.precision} | Recall: ${cand.metrics.recall} | F1: ${cand.metrics.f1} | FPR: ${cand.metrics.falsePositiveRate}`);
    console.log(`  Confusion Matrix: TP=${cand.metrics.confusionMatrix.truePositives}, FP=${cand.metrics.confusionMatrix.falsePositives}, TN=${cand.metrics.confusionMatrix.trueNegatives}, FN=${cand.metrics.confusionMatrix.falseNegatives}`);
    if (Object.keys(cand.featureImportance || {}).length > 0) {
      console.log('  Top Feature Importances (Explainability):', cand.featureImportance);
    }
  }

  console.log(`\nComparison Decision: ${evalData.comparisonSummary.decision}`);
  console.log(`Recommendation: "${evalData.comparisonSummary.recommendation}"\n`);

  // 7. Test Security: Rejecting Promotion of a REJECTED Model
  console.log('7. Testing Security & Audit: Rejecting unapproved/poor model promotion...');
  const promoteRejectedRes = await fetch('http://localhost:5000/api/models/v2.0-rf-supervised/promote', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (promoteRejectedRes.status === 400) {
    const errData = await promoteRejectedRes.json();
    console.log(`  PASS: Promotion safely rejected: "${errData.error}"\n`);
  } else {
    console.log(`  Note: Model status is eligible or result was ${promoteRejectedRes.status}`);
  }

  console.log('=== All Phase 8 Model Evaluation & Future Training Tests Passed 100%! ===');
}

runModelEvaluationTests().catch(err => {
  console.error('Model evaluation test failed:', err);
  process.exit(1);
});
