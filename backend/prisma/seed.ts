import { PrismaClient, UserType, UserCategory, AnimalType, MilkingPlace, CoverageArea, Status } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Limpar banco (opcional, cuidado em prod)
  // await prisma.dailyCollection.deleteMany();
  // await prisma.animal.deleteMany();
  // await prisma.user.deleteMany();
  // await prisma.association.deleteMany();

  // 2. Criar Associação
  const passwordHash = await bcrypt.hash('123456', 10);
  
  const associacao = await prisma.association.upsert({
    where: { email: 'associacao@qualeider.com' },
    update: {},
    create: {
      name: 'Associação Leiteira do Nordeste',
      tradeName: 'Leite Nordeste',
      cnpj: '12.345.678/0001-90',
      email: 'associacao@qualeider.com',
      password: passwordHash,
      landlinePhone: '8133334444',
      zipCode: '50000-000',
      state: 'PE',
      city: 'Recife',
      street: 'Rua da Aurora',
      number: '100',
      neighborhood: 'Santo Amaro',
      coverageArea: CoverageArea.Estadual,
      presidentName: 'Carlos Presidente',
      presidentCpf: '111.222.333-44',
      presidentEmail: 'carlos@qualeider.com',
      presidentPhone: '81999998888',
      status: Status.Active
    },
  });
  console.log(`🏢 Association created: ${associacao.name}`);

  // 3. Criar Produtor vinculado à Associação
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
      associationId: associacao.id,
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

  // 6. Criar Convite Pendente
  await prisma.invite.create({
    data: {
      associationId: associacao.id,
      userId: produtor.id, // O convite tecnicamente liga um usuário a uma associação, mas aqui so pra teste
      token: 'convite-teste-123',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // +7 dias
    }
  });
  console.log(`📩 Created pending invite.`);

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
