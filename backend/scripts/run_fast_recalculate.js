import { PrismaClient } from '@prisma/client';
import aggregateRisk from '../risk/riskAggregator.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Fast 7-Dimension Risk Recalculation ===');
  const startTime = Date.now();

  const projects = await prisma.project.findMany({
    include: {
      procurements: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const contractors = await prisma.contractor.findMany();
  const contractorMap = new Map();
  contractors.forEach(c => {
    contractorMap.set(c.normalizedName, c);
  });

  function normalizeName(name) {
    if (!name) return 'unknown';
    const primary = name.split(',')[0].trim();
    return primary
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .replace(/\s+/g, '')
      .replace(/(pvtltd|pvt|ltd|limited|company|co|construction|constructions|infra|infrastructure|developers|projects)$/g, '');
  }

  for (const p of projects) {
    const latestProc = p.procurements && p.procurements.length > 0 ? p.procurements[0] : null;
    if (latestProc && latestProc.status === 'Analyzed' && latestProc.procurementRiskScore) {
      p.procurementRiskScore = latestProc.procurementRiskScore;
    }
  }

  console.log(`Calculating 7-dimension risk for ${projects.length} projects in memory...`);
  
  // Index by district for instant GIS evaluation
  const districtMap = new Map();
  projects.forEach(p => {
    const d = (p.district || 'UNKNOWN').toUpperCase();
    if (!districtMap.has(d)) districtMap.set(d, []);
    districtMap.get(d).push(p);
  });

  const updates = [];

  for (const p of projects) {
    let contractorProfile = null;
    if (p.vendorName) {
      const norm = normalizeName(p.vendorName);
      contractorProfile = contractorMap.get(norm) || null;
    }

    const districtProjects = districtMap.get((p.district || 'UNKNOWN').toUpperCase()) || [p];
    const result = aggregateRisk(p, districtProjects, contractorProfile);

    const comps = {
      financial: result.dimensions.financial.score,
      procurement: result.dimensions.procurement.score,
      progress: result.dimensions.progress.score,
      contractor: result.dimensions.contractor.score,
      gis: result.dimensions.gis.score,
      documentation: result.dimensions.documentation.score,
      crossSignal: result.dimensions.crossSignal.score,
      confidence: result.confidence
    };

    updates.append ? null : updates.push([
      result.overallScore,
      result.overallLevel,
      JSON.stringify(comps),
      result.dimensions.financial.score,
      result.dimensions.financial.level,
      JSON.stringify(result.dimensions.financial.signals || []),
      result.dimensions.progress.score,
      result.dimensions.progress.level,
      JSON.stringify(result.dimensions.progress.signals || []),
      result.dimensions.gis.score,
      result.dimensions.gis.level,
      JSON.stringify(result.dimensions.gis.signals || []),
      result.dimensions.documentation.score,
      result.dimensions.documentation.level,
      JSON.stringify(result.dimensions.documentation.signals || []),
      result.dimensions.crossSignal.score,
      result.dimensions.crossSignal.level,
      JSON.stringify(result.dimensions.crossSignal.signals || []),
      result.dimensions.contractor.score,
      result.dimensions.contractor.level,
      JSON.stringify(result.dimensions.contractor.signals || []),
      result.confidence,
      result.dataCompleteness,
      JSON.stringify(result.topRiskFactors || []),
      JSON.stringify(result.recommendedActions || []),
      JSON.stringify(result.missingData || []),
      p.id
    ]);
  }

  const outPath = path.resolve('../scratch/calculated_risks.json');
  fs.writeFileSync(outPath, JSON.stringify(updates));
  console.log(`Computed ${updates.length} records in ${((Date.now() - startTime) / 1000).toFixed(2)}s.`);

  // Apply via Python sqlite3 executemany
  console.log('Applying bulk transaction to SQLite database...');
  execSync('python ../scratch/apply_calculated_risks.py', { stdio: 'inherit' });

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\nCompleted full 7-dimension risk recalculation in ${totalElapsed}s.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
