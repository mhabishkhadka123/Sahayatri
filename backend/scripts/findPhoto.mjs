import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const id = process.argv[2];
if (!id) {
  console.error('Usage: node findPhoto.mjs <photoId>');
  process.exit(1);
}

(async () => {
  try {
    const photo = await prisma.photo.findUnique({ where: { id } });
    console.log(photo ? JSON.stringify(photo, null, 2) : 'Photo not found');
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
