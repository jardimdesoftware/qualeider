import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { DefaultAccountsService } from './default-accounts.service';

/** Nome do registro em `one_off_tasks`: enquanto existir, a limpeza nunca repete. */
export const ACCOUNT_PURGE_TASK = 'purge-all-accounts-except-defaults-2026-10';

export interface PurgeResult {
  status: 'done' | 'skipped';
  reason?: string;
  usersRemoved?: number;
  associationsRemoved?: number;
}

/**
 * Limpeza UNICA de contas: remove todos os usuarios e associacoes, e os dados
 * deles, MENOS as contas padrao (admin e vaqueiro de teste). Existe porque o
 * deploy e automatico e so o codigo e alcancavel.
 *
 * Salvaguardas:
 * - So roda com NODE_ENV=production (nao apaga a base de quem roda local/dev/CI).
 * - So roda se as duas contas padrao existem; senao nao apaga nada e tenta de
 *   novo na proxima subida.
 * - Roda uma unica vez: o registro em `one_off_tasks` entra na MESMA transacao
 *   da limpeza (chave primaria impede duas instancias de repetirem).
 * - Falha aqui nunca derruba a API.
 *
 * Depois que rodar em producao, este servico e a tabela podem ser removidos.
 */
@Injectable()
export class AccountPurgeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AccountPurgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly defaultAccounts: DefaultAccountsService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.configService.get<string>('NODE_ENV') !== 'production') return;
    try {
      // Garante que as contas a manter existem antes de apagar o resto.
      await this.defaultAccounts.ensureDefaultAccounts();
      const result = await this.purgeOnce();
      if (result.status === 'done') {
        this.logger.warn(
          `Limpeza de contas concluida: ${result.usersRemoved} usuario(s) e ${result.associationsRemoved} associacao(oes) removidos.`,
        );
      } else {
        this.logger.log(`Limpeza de contas nao executada: ${result.reason}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Limpeza de contas falhou (nada foi apagado): ${reason}`);
    }
  }

  async purgeOnce(): Promise<PurgeResult> {
    const keepEmails = this.defaultAccounts.getDefaultEmails();
    if (keepEmails.length !== 2) {
      return { status: 'skipped', reason: 'contas padrao desligadas ou incompletas' };
    }

    if (await this.prisma.oneOffTask.findUnique({ where: { name: ACCOUNT_PURGE_TASK } })) {
      return { status: 'skipped', reason: 'ja executada antes' };
    }

    return this.prisma.$transaction(async (tx) => {
      const keep = await tx.user.findMany({
        where: { email: { in: keepEmails, mode: 'insensitive' } },
        select: { id: true },
      });
      if (keep.length !== 2) {
        return { status: 'skipped', reason: 'as duas contas padrao nao existem' } as PurgeResult;
      }

      // Marca primeiro: uma segunda instancia batendo na mesma chave falha aqui
      // e a transacao inteira volta atras.
      await tx.oneOffTask.create({ data: { name: ACCOUNT_PURGE_TASK } });

      const keepIds = keep.map((user) => user.id);
      const users = await tx.user.findMany({
        where: { id: { notIn: keepIds } },
        select: { id: true },
      });
      const userIds = users.map((user) => user.id);

      const animals = await tx.animal.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });
      const animalIds = animals.map((animal) => animal.id);
      const collections = await tx.dailyCollection.findMany({
        where: { userId: { in: userIds } },
        select: { id: true },
      });
      const collectionIds = collections.map((collection) => collection.id);

      await tx.notificationRecipient.deleteMany({ where: { userId: { in: userIds } } });
      await tx.activityLog.deleteMany({ where: { userId: { in: userIds } } });
      await tx.invite.deleteMany({ where: { userId: { in: userIds } } });
      await tx.dailyCollectionItem.deleteMany({
        where: {
          OR: [{ dailyCollectionId: { in: collectionIds } }, { animalId: { in: animalIds } }],
        },
      });
      await tx.dailyCollection.deleteMany({ where: { id: { in: collectionIds } } });
      // Animais que ficam podem apontar para pai/mae que serao apagados.
      await tx.animal.updateMany({ where: { motherId: { in: animalIds } }, data: { motherId: null } });
      await tx.animal.updateMany({ where: { fatherId: { in: animalIds } }, data: { fatherId: null } });
      await tx.animal.deleteMany({ where: { id: { in: animalIds } } });
      // Liberacoes de e-mail de admins apagados viram "sem dono" (valem para todos).
      await tx.allowedEmail.deleteMany({ where: { adminId: { in: userIds } } });
      const removedUsers = await tx.user.deleteMany({ where: { id: { in: userIds } } });

      // Contas de associacao (tambem entram com e-mail e senha).
      await tx.notificationRecipient.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.invite.deleteMany({});
      await tx.user.updateMany({ where: { associationId: { not: null } }, data: { associationId: null } });
      const removedAssociations = await tx.association.deleteMany({});

      return {
        status: 'done',
        usersRemoved: removedUsers.count,
        associationsRemoved: removedAssociations.count,
      } as PurgeResult;
    }, { timeout: 120_000, maxWait: 10_000 });
  }
}
