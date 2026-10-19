import { UserRole } from '@/domain/enums/enums';
import { canReadOwner, resolveReadScope } from '@/domain/utils/read-scope.util';

const admin = (over = {}) => ({ id: 1, role: UserRole.ADMIN, adminId: null, ...over });
const vaqueiro = (over = {}) => ({ id: 5, role: UserRole.VAQUEIRO, adminId: 1, ...over });
const owner = (over = {}) => ({ id: 20, role: UserRole.VAQUEIRO, adminId: null as number | null, ...over });

describe('resolveReadScope', () => {
  it('admin: o próprio grupo', () => {
    expect(resolveReadScope(admin())).toEqual({ adminGroupId: 1 });
  });

  it('vaqueiro de um admin: o grupo do admin', () => {
    expect(resolveReadScope(vaqueiro())).toEqual({ adminGroupId: 1 });
  });

  it('vaqueiro sem vínculo: só ele mesmo', () => {
    expect(resolveReadScope(vaqueiro({ adminId: null }))).toEqual({ userId: 5 });
  });
});

describe('canReadOwner', () => {
  it('lê os próprios dados', () => {
    expect(canReadOwner(admin(), owner({ id: 1, role: UserRole.ADMIN }))).toBe(true);
  });

  it('admin lê funcionário vinculado, mas não o de outro admin nem outro admin', () => {
    expect(canReadOwner(admin(), owner({ adminId: 1 }))).toBe(true);
    expect(canReadOwner(admin(), owner({ adminId: 99 }))).toBe(false);
    expect(canReadOwner(admin(), owner({ role: UserRole.ADMIN }))).toBe(false);
  });

  it('vaqueiro lê o admin e os colegas do grupo, não outro grupo', () => {
    expect(canReadOwner(vaqueiro(), owner({ id: 1, role: UserRole.ADMIN }))).toBe(true);
    expect(canReadOwner(vaqueiro(), owner({ adminId: 1 }))).toBe(true);
    expect(canReadOwner(vaqueiro(), owner({ adminId: 2 }))).toBe(false);
  });

  it('vaqueiro sem vínculo não lê ninguém além dele', () => {
    expect(canReadOwner(vaqueiro({ adminId: null }), owner())).toBe(false);
  });

});
