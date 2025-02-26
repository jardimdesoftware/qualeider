import { PrismaClient, Role, UserCategory } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error('Variáveis ADMIN_EMAIL ou ADMIN_PASSWORD não estão definidas no .env!');
    }

    let usuario = await prisma.user.findUnique({ where: { email: adminEmail } });

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (!usuario) {
      usuario = await prisma.user.create({
        data: {
          name: 'Admin',
          email: adminEmail,
          password: hashedPassword,
          role: Role.Admin,
          userCategory: UserCategory.Fisica,
          state: 'PE',
          city: 'Belo Jardim',
        },
      });
      console.log('Usuário admin criado com sucesso:', usuario);
    } else {
      console.log('Usuário admin já existe:', usuario);
    }
  } catch (error) {
    console.error('Erro ao rodar o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();