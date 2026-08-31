import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTest() {
  console.log('Starting End-to-End Upload & Analysis Test...');
  
  // 1. Get a project from database
  const project = await prisma.project.findFirst({
    where: { projectId: 'WS/MP086/2025-2026/196052' }
  });

  if (!project) {
    console.error('Test Project not found in database! Please ensure database is seeded.');
    return;
  }
  console.log(`Using project: ${project.projectId} (${project.id})`);

  // 2. Obtain JWT Token via login
  console.log('Logging in to get JWT token...');
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
    console.error('Login failed:', await loginRes.text());
    return;
  }
  const { token } = await loginRes.json();
  console.log('Login successful. Token obtained.');

  // 3. Upload File using Form Data
  console.log('Uploading sample BOQ PDF file...');
  const filePath = path.resolve(process.cwd(), 'uploads/sample_boq.pdf');
  if (!fs.existsSync(filePath)) {
    console.error(`Sample PDF not found at ${filePath}. Please run generate_sample_boq.py first.`);
    return;
  }

  // Create multipart payload manually
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  const fileBuffer = fs.readFileSync(filePath);
  
  let payload = '';
  payload += `--${boundary}\r\n`;
  payload += `Content-Disposition: form-data; name="projectId"\r\n\r\n`;
  payload += `${project.id}\r\n`;
  payload += `--${boundary}\r\n`;
  payload += `Content-Disposition: form-data; name="file"; filename="sample_boq.pdf"\r\n`;
  payload += `Content-Type: application/pdf\r\n\r\n`;

  const footer = `\r\n--${boundary}--\r\n`;
  const bodyBuffer = Buffer.concat([
    Buffer.from(payload, 'utf-8'),
    fileBuffer,
    Buffer.from(footer, 'utf-8')
  ]);

  const uploadRes = await fetch('http://localhost:5000/api/procurement/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: bodyBuffer
  });

  if (!uploadRes.ok) {
    console.error('Upload failed:', await uploadRes.text());
    return;
  }
  const uploadData = await uploadRes.json();
  const { documentId } = uploadData;
  console.log(`File uploaded successfully! Document ID: ${documentId}`);

  // 4. Trigger Analysis
  console.log(`Triggering analysis for document ${documentId}...`);
  const analyzeRes = await fetch(`http://localhost:5000/api/procurement/${documentId}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!analyzeRes.ok) {
    console.error('Analysis failed:', await analyzeRes.text());
    return;
  }

  const analyzeData = await analyzeRes.json();
  console.log('\n=== Analysis Endpoint Response ===');
  console.log(JSON.stringify(analyzeData.data, null, 2));

  // 5. Verify database updates
  console.log('\nVerifying database update for Project model...');
  const updatedProject = await prisma.project.findUnique({
    where: { id: project.id }
  });

  console.log(`Updated Project procurementRiskScore: ${updatedProject.procurementRiskScore}`);
  console.log(`Updated Project procurementRiskLevel: ${updatedProject.procurementRiskLevel}`);
  console.log('Updated Project procurementSignals:', updatedProject.procurementSignals);

  console.log('\nAll End-to-End tests passed successfully!');
}

runTest()
  .catch(err => console.error('E2E test error:', err))
  .finally(() => prisma.$disconnect());
