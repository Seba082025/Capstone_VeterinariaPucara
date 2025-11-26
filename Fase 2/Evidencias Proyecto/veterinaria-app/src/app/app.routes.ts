import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage),
  },

  {
    path: 'reserva',
    loadComponent: () =>
      import('./reserva/reserva.page').then(m => m.ReservaPage),
  },

  {
    path: 'blog',
    loadComponent: () =>
      import('./blog/blog.page').then(m => m.BlogPage),
  },

  {
    path: 'blog/:id',
    loadComponent: () =>
      import('./blog-detalle/blog-detalle.page').then(m => m.BlogDetallePage),
  },

  // -------------------
  // 🔐 SECCIÓN ADMIN
  // -------------------

  {
    path: 'admin-login',
    loadComponent: () =>
      import('./admin-login/admin-login.page').then(m => m.AdminLoginPage),
  },

  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./admin-dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
    canActivate: [adminGuard],
  },

  {
    path: 'admin-blog',
    loadComponent: () =>
      import('./admin-blog/admin-blog.page').then(m => m.AdminBlogPage),
    canActivate: [adminGuard],
  },

  {
    path: 'admin-profesionales',
    loadComponent: () =>
      import('./admin-profesionales/admin-profesionales.page').then(m => m.AdminProfesionalesPage),
    canActivate: [adminGuard],
  },

  // -------------------
  // RUTA WILDCARD
  // -------------------
  {
    path: '**',
    redirectTo: 'home',
  },
];
