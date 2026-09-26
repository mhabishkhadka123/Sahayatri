import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.photo.findMany({
    select: {
      id: true,
      userId: true,
      isPrimary: true,
      url: true,
      createdAt: true,
    },
  });
  
  console.log('\n=== ALL PHOTOS IN DATABASE ===\n');
  console.log(JSON.stringify(photos, null, 2));
  console.log('\n=== TOTAL: ' + photos.length + ' photos ===\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
