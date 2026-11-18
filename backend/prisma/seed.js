import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const dummyProfiles = [
    // Female Profiles
    {
      email: 'aakriti.shrestha@test.com',
      password: hashedPassword,
      firstName: 'Aakriti',
      lastName: 'Shrestha',
      bio: 'Software engineering student exploring Vedic astrology and web dev.',
      city: 'Itahari',
      district: 'Sunsari',
      region: 'Province 1',
      country: 'Nepal',
      gender: 'Female',
      dateOfBirth: new Date('2003-05-14'),
      height: '5\'4"',
      religion: 'Hindu',
      occupation: 'Student',
      latitude: 26.6646,
      longitude: 87.2718,
      isVisible: true,
    },
    {
      email: 'sneha.rai@test.com',
      password: hashedPassword,
      firstName: 'Sneha',
      lastName: 'Rai',
      bio: 'Passionate about design, music, and coffee.',
      city: 'Itahari',
      district: 'Sunsari',
      region: 'Province 1',
      country: 'Nepal',
      gender: 'Female',
      dateOfBirth: new Date('2002-11-22'),
      height: '5\'2"',
      religion: 'Hindu',
      occupation: 'Designer',
      latitude: 26.6700,
      longitude: 87.2800,
      isVisible: true,
    },
    // Male Profiles
    {
      email: 'rohan.karki@test.com',
      password: hashedPassword,
      firstName: 'Rohan',
      lastName: 'Karki',
      bio: 'Tech enthusiast and mountain hiker based in Itahari.',
      city: 'Itahari',
      district: 'Sunsari',
      region: 'Province 1',
      country: 'Nepal',
      gender: 'Male',
      dateOfBirth: new Date('2001-03-10'),
      height: '5\'10"',
      religion: 'Hindu',
      occupation: 'Software Developer',
      latitude: 26.6650,
      longitude: 87.2720,
      isVisible: true,
    },
    {
      email: 'bipul.thapa@test.com',
      password: hashedPassword,
      firstName: 'Bipul',
      lastName: 'Thapa',
      bio: 'Civil engineer interested in sports and matchmaking astrology.',
      city: 'Itahari',
      district: 'Sunsari',
      region: 'Province 1',
      country: 'Nepal',
      gender: 'Male',
      dateOfBirth: new Date('2000-07-19'),
      height: '5\'9"',
      religion: 'Hindu',
      occupation: 'Engineer',
      latitude: 26.6680,
      longitude: 87.2750,
      isVisible: true,
    },
  ];

  for (const profileData of dummyProfiles) {
    const user = await prisma.user.upsert({
      where: { email: profileData.email },
      update: {
        gender: profileData.gender,
        city: profileData.city,
      },
      create: {
        ...profileData,
        kundali: {
          create: {
            birthTime: '08:30',
            birthPlace: profileData.city,
            latitude: profileData.latitude,
            longitude: profileData.longitude,
            timezone: 'Asia/Kathmandu',
            zodiacSign: 'Kanya',
            moonSign: 'Vrishchika',
            nakshatra: 'Jyeshtha',
            isVisible: true,
          },
        },
      },
    });
    console.log(`Created/Updated user: ${user.firstName} (${user.gender})`);
  }

  console.log('✅ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });