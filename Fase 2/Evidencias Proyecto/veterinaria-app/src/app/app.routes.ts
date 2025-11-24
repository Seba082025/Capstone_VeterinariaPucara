import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'reserva',
    loadComponent: () => import('./reserva/reserva.page').then((m) => m.ReservaPage)
  },
  {
    path: 'admin-login',
    loadComponent: () => import('./admin-login/admin-login.page').then( m => m.AdminLoginPage)
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./admin-dashboard/admin-dashboard.page').then( m => m.AdminDashboardPage)
  },
  {
    path: 'admin-blog',
    loadComponent: () => import('./admin-blog/admin-blog.page').then( m => m.AdminBlogPage)
  },
  {
    path: 'blog',
    loadComponent: () => import('./blog/blog.page').then( m => m.BlogPage)
  },
  {
    path: 'blog-detalle',
    loadComponent: () => import('./blog-detalle/blog-detalle.page').then( m => m.BlogDetallePage)
  },
  {
  path: 'blog/:id',
  loadComponent: () => import('./blog-detalle/blog-detalle.page').then(m => m.BlogDetallePage)
  },


];
