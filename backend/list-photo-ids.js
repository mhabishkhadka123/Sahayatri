import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const photos = await prisma.photo.findMany({
    select: {
      id: true,
      userId: true,
      isPrimary: true,
    },
  });
  
  console.log('\n=== PHOTO IDs IN DATABASE ===\n');
  photos.forEach((photo, index) => {
    console.log(`${index + 1}. ID: ${photo.id} | User: ${photo.userId} | Primary: ${photo.isPrimary}`);
  });
  console.log(`\n=== TOTAL: ${photos.length} photos ===\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
