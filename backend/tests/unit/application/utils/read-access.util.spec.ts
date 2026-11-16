import { ForbiddenException } from '@nestjs/common';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { UserRole } from '@/domain/enums/enums';
import { assertCanReadOwner, assertCanReadUserData } from '@/application/utils/read-access.util';

const repo = (found: unknown) => ({ findByIdAny: jest.fn().mockResolvedValue(found) }) as any;
const admin = { id: 1, role: UserRole.ADMIN, adminId: null };

describe('assertCanReadOwner', () => {
  it('o próprio dono lê sem consultar o banco', async () => {
    const r = repo(null);

    await expect(assertCanReadOwner(r, 1, admin)).resolves.toBeUndefined();
    expect(r.findByIdAny).not.toHaveBeenCalled();
  });

  it('dono do mesmo grupo: ok (mesmo inativo, pois usa findByIdAny)', async () => {
    const r = repo({ id: 5, role: UserRole.VAQUEIRO, adminId: 1 });

    await expect(assertCanReadOwner(r, 5, admin)).resolves.toBeUndefined();
  });

  it('dono de outro grupo ou inexistente: 403', async () => {
    await expect(
      assertCanReadOwner(repo({ id: 9, role: UserRole.ADMIN, adminId: null }), 9, admin),
    ).rejects.toThrow(ForbiddenException);
    await expect(assertCanReadOwner(repo(null), 9, admin)).rejects.toThrow(ForbiddenException);
  });

});

describe('assertCanReadUserData', () => {
  it('usuário lê o próprio id; id de outro grupo dá 403; inexistente dá 404', async () => {
    await expect(assertCanReadUserData(repo(null), 1, admin)).resolves.toBeUndefined();
    await expect(
      assertCanReadUserData(repo({ id: 9, role: UserRole.ADMIN, adminId: null }), 9, admin),
    ).rejects.toThrow(ForbiddenException);
    await expect(assertCanReadUserData(repo(null), 9, admin)).rejects.toThrow(EntityNotFoundException);
  });
});
