/**
 * Recalculate 7-Dimension Risk Scores
 * Runs the full 7-dimension risk aggregator against all projects in the database.
 */
import { PrismaClient } from '@prisma/client';
import { recalculateOverallProjectRisks } from '../routes/projects.js';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Running 7-Dimension Risk Recalculation ===');
  const startTime = Date.now();
  
  await recalculateOverallProjectRisks(prisma);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nCompleted in ${elapsed}s`);
  
  // Print summary statistics
  const stats = await prisma.project.groupBy({
    by: ['riskLevel'],
    _count: { id: true },
    _avg: { riskScore: true, confidenceScore: true, dataCompleteness: true }
  });
  
  console.log('\n=== Risk Distribution Summary ===');
  stats.forEach(s => {
    console.log(`  ${s.riskLevel}: ${s._count.id} projects (avg score: ${(s._avg.riskScore || 0).toFixed(1)}, avg confidence: ${(s._avg.confidenceScore || 0).toFixed(1)}%, data completeness: ${(s._avg.dataCompleteness || 0).toFixed(1)}%)`);
  });
}

main()
  .catch(err => console.error('Recalculation failed:', err))
  .finally(() => prisma.$disconnect());
