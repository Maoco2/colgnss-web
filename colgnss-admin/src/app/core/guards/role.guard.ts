import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const requiredRoles = route.data?.['roles'] as string[] | undefined;

  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  const token = localStorage.getItem('access_token');
  if (!token) {
    return router.parseUrl('/auth/login');
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const userRole: string = payload.role || payload.roles?.[0];
    if (requiredRoles.includes(userRole)) {
      return true;
    }
    return router.parseUrl('/dashboard');
  } catch {
    return router.parseUrl('/auth/login');
  }
};
