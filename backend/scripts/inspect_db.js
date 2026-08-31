import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspect() {
  console.log('=== Inspecting SQLite database records ===');
  const count = await prisma.project.count();
  console.log(`Total projects in DB: ${count}`);

  const sample = await prisma.project.findMany({
    take: 3
  });
  console.log(JSON.stringify(sample, null, 2));
}

inspect()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
