import { PrismaClient, UserType, UserCategory, AnimalType, MilkingPlace, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Limpar banco (opcional, cuidado em prod)
  // await prisma.dailyCollection.deleteMany();
  // await prisma.animal.deleteMany();
  // await prisma.user.deleteMany();

  // 2. Hash da senha de desenvolvimento
  const passwordHash = await bcrypt.hash('123456', 10);

  // 3. Criar Produtor (admin)
  const produtor = await prisma.user.upsert({
    where: { email: 'produtor@qualeider.com' },
    update: {},
    create: {
      name: 'João Silva (Produtor)',
      email: 'produtor@qualeider.com',
      password: passwordHash,
      userType: UserType.Pecuarista,
      userCategory: UserCategory.Fisica,
      document: '123.456.789-00',
      city: 'Recife',
      state: 'PE',
      status: Status.Active
    },
  });
  console.log(`👨‍🌾 Producer created: ${produtor.name}`);

  // 4. Criar Animais para o Produtor
  const animaisData = [
    { name: 'Mimosa', breed: 'Holandesa', age: 4 },
    { name: 'Estrela', breed: 'Jersey', age: 3 },
    { name: 'Malhada', breed: 'Girolando', age: 5 },
    { name: 'Branquinha', breed: 'Nelore', age: 2 },
    { name: 'Pretinha', breed: 'Mestiça', age: 6 },
  ];

  for (const animal of animaisData) {
    await prisma.animal.create({
      data: {
        ...animal,
        animalType: AnimalType.Vaca,
        userId: produtor.id,
        status: Status.Active
      }
    });
  }
  console.log(`🐄 Created ${animaisData.length} animals for producer.`);

  // 5. Criar Coletas Diárias (Últimos 7 dias)
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    await prisma.dailyCollection.create({
      data: {
        userId: produtor.id,
        quantity: Math.floor(Math.random() * 50) + 100, // 100-150 litros
        collectionDate: date,
        numAnimals: 5,
        numOrdens: 2,
        rationProvided: true,
        numLactation: 5,
        milkingPlace: MilkingPlace.Curral,
        technicalAssistance: true,
      }
    });
  }
  console.log(`🥛 Created daily collections for the last 7 days.`);

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
