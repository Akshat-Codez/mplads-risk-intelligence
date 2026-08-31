import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('=== AI Risk Scoring Distribution Diagnostics ===\n');

  // Fetch all projects
  const projects = await prisma.project.findMany({
    select: {
      projectId: true,
      riskScore: true,
      riskLevel: true
    }
  });

  const projectScores = projects.map(p => p.riskScore || 0);
  
  // Fetch all contractors
  const contractors = await prisma.contractor.findMany({
    select: {
      id: true,
      contractorRiskScore: true,
      contractorRiskLevel: true
    }
  });

  const contractorScores = contractors.map(c => c.contractorRiskScore || 0);

  function getStats(scores) {
    if (scores.length === 0) return { min: 0, max: 0, mean: 0, median: 0, std: 0, uniqueCount: 0, multiplesOf5Count: 0 };
    
    scores.sort((a, b) => a - b);
    const min = scores[0];
    const max = scores[scores.length - 1];
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = sum / scores.length;
    
    const mid = Math.floor(scores.length / 2);
    const median = scores.length % 2 !== 0 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
    
    const sqDiffs = scores.map(s => Math.pow(s - mean, 2));
    const std = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / scores.length);
    
    const uniqueScores = new Set(scores);
    
    // Count multiples of 5 (e.g. 5.0, 10.0, 15.0... with tolerance for precision like 5.0001)
    let multiplesOf5 = 0;
    scores.forEach(s => {
      if (Math.abs(s % 5) < 1e-4) {
        multiplesOf5++;
      }
    });

    return {
      min,
      max,
      mean,
      median,
      std,
      totalCount: scores.length,
      uniqueCount: uniqueScores.size,
      multiplesOf5Count: multiplesOf5
    };
  }

  const pStats = getStats(projectScores);
  const cStats = getStats(contractorScores);

  console.log('--- Project Risk Scores ---');
  console.log(`Total Count:          ${pStats.totalCount}`);
  console.log(`Minimum Score:        ${pStats.min.toFixed(2)}`);
  console.log(`Maximum Score:        ${pStats.max.toFixed(2)}`);
  console.log(`Mean Score:           ${pStats.mean.toFixed(2)}`);
  console.log(`Median Score:         ${pStats.median.toFixed(2)}`);
  console.log(`Std Dev:              ${pStats.std.toFixed(2)}`);
  console.log(`Unique Scores count:  ${pStats.uniqueCount} (out of ${pStats.totalCount})`);
  console.log(`Multiples of 5 count: ${pStats.multiplesOf5Count} (${(pStats.multiplesOf5Count / pStats.totalCount * 100).toFixed(1)}%)`);
  console.log();

  console.log('--- Contractor Risk Scores ---');
  console.log(`Total Count:          ${cStats.totalCount}`);
  console.log(`Minimum Score:        ${cStats.min.toFixed(2)}`);
  console.log(`Maximum Score:        ${cStats.max.toFixed(2)}`);
  console.log(`Mean Score:           ${cStats.mean.toFixed(2)}`);
  console.log(`Median Score:         ${cStats.median.toFixed(2)}`);
  console.log(`Std Dev:              ${cStats.std.toFixed(2)}`);
  console.log(`Unique Scores count:  ${cStats.uniqueCount} (out of ${cStats.totalCount})`);
  console.log(`Multiples of 5 count: ${cStats.multiplesOf5Count} (${(cStats.multiplesOf5Count / cStats.totalCount * 100).toFixed(1)}%)`);
  console.log();

  console.log('Diagnostics complete!');
}

diagnose()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
