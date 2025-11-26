
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const isLogged = localStorage.getItem('adminLogged') === 'true';

  if (!isLogged) {
    router.navigate(['/admin-login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
