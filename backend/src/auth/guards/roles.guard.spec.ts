import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(user?: { role?: UserRole }): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('should allow access when no roles are required on route or handler', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: UserRole.TEAM_MEMBER });

      const result = guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should allow access when required roles array is empty', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
      const context = createMockExecutionContext({ role: UserRole.TEAM_MEMBER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has MANAGER role and route requires MANAGER', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.MANAGER]);
      const context = createMockExecutionContext({ role: UserRole.MANAGER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has ADMIN role and route requires ADMIN', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({ role: UserRole.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has ADMIN role and route accepts [MANAGER, ADMIN]', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.MANAGER, UserRole.ADMIN]);
      const context = createMockExecutionContext({ role: UserRole.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should deny access when TEAM_MEMBER attempts to access route requiring [MANAGER, ADMIN]', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.MANAGER, UserRole.ADMIN]);
      const context = createMockExecutionContext({ role: UserRole.TEAM_MEMBER });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when TEAM_MEMBER attempts to access route requiring MANAGER only', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.MANAGER]);
      const context = createMockExecutionContext({ role: UserRole.TEAM_MEMBER });

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });

    it('should deny access when request has no authenticated user and roles are required', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.MANAGER]);
      const context = createMockExecutionContext(undefined);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});