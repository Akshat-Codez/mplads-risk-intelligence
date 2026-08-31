import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference prices...');

  // Delete existing
  await prisma.referencePrice.deleteMany({});

  const benchmarks = [
    {
      item: 'Cement (OPC 43 Grade)',
      specification: 'Ordinary Portland Cement, 43 Grade bags',
      unit: 'bag',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 420.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    },
    {
      item: 'Reinforcement Steel (Fe 500)',
      specification: 'High strength deformed steel bars',
      unit: 'kg',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 65.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    },
    {
      item: 'Coarse Sand (M-Sand)',
      specification: 'Manufactured sand for concrete works',
      unit: 'cum',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 1600.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    },
    {
      item: 'Bricks (Class 75)',
      specification: 'Common burnt clay building bricks',
      unit: 'thousand',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 7500.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    },
    {
      item: 'Concrete M20 Grade',
      specification: 'Ready mixed concrete M20 grade',
      unit: 'cum',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 4500.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    },
    {
      item: 'Excavation in Soil',
      specification: 'Earthwork excavation in all types of soil up to 1.5m depth',
      unit: 'cum',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 220.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    },
    {
      item: 'Unskilled Labor',
      specification: 'Daily wage for unskilled helper/worker',
      unit: 'day',
      region: 'Uttar Pradesh',
      period: '2025-2026',
      referencePrice: 450.0,
      source: 'DEMO - synthetic reference benchmark',
      isDemo: true
    }
  ];

  for (const b of benchmarks) {
    await prisma.referencePrice.create({ data: b });
  }

  console.log(`Successfully seeded ${benchmarks.length} reference price items.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
