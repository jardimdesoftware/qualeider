import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminOnlyGuard } from '@/application/guards/admin-only.guard';
import { UserRole } from '@/domain/enums/enums';

const contextWith = (user: unknown) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('AdminOnlyGuard', () => {
  const guard = new AdminOnlyGuard();

  it('libera ADMIN', () => {
    expect(guard.canActivate(contextWith({ id: 1, role: UserRole.ADMIN }))).toBe(true);
  });

  it.each([
    ['funcionário', { id: 2, role: UserRole.VAQUEIRO }],
    ['associação (sem role)', { id: 3, userType: 'association' }],
    ['sem usuário no request', undefined],
    ['usuário sem role', { id: 4 }],
  ])('nega %s', (_label, user) => {
    expect(() => guard.canActivate(contextWith(user))).toThrow(ForbiddenException);
  });
});
