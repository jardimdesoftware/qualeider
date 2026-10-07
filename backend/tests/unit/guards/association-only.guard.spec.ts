import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AssociationOnlyGuard } from '@/application/guards/association-only.guard';

const contextWith = (user: unknown) =>
  ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as unknown as ExecutionContext;

describe('AssociationOnlyGuard', () => {
  const guard = new AssociationOnlyGuard();

  it('libera login de associação', () => {
    expect(guard.canActivate(contextWith({ id: 1, userType: 'association' }))).toBe(true);
  });

  it.each([
    ['usuário comum', { id: 1, userType: 'user', role: 'ADMIN' }],
    ['sem userType', { id: 1 }],
    ['sem usuário no request', undefined],
  ])('nega %s', (_label, user) => {
    expect(() => guard.canActivate(contextWith(user))).toThrow(ForbiddenException);
  });
});
