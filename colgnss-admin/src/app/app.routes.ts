import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'analytics', loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
      { path: 'users/:id', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'calculations', loadComponent: () => import('./features/calculations/calculations.component').then(m => m.CalculationsComponent) },
      { path: 'gnss-stats', loadComponent: () => import('./features/gnss-stats/gnss-stats.component').then(m => m.GnssStatsComponent) },
      { path: 'catalogs', loadComponent: () => import('./features/catalogs/catalogs.component').then(m => m.CatalogsComponent) },
      { path: 'stations', loadComponent: () => import('./features/stations/stations.component').then(m => m.StationsComponent) },
      { path: 'monitor', loadComponent: () => import('./features/monitor/monitor.component').then(m => m.MonitorComponent) },
      { path: 'audit', loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent) },
      { path: 'advertising', loadComponent: () => import('./features/advertising/advertising.component').then(m => m.AdvertisingComponent) },
      { path: 'subscriptions', loadComponent: () => import('./features/subscriptions/subscriptions.component').then(m => m.SubscriptionsComponent) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'notifications', loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'ai', loadComponent: () => import('./features/ai/ai.component').then(m => m.AiComponent) },
      { path: 'data-warehouse', loadComponent: () => import('./features/data-warehouse/data-warehouse.component').then(m => m.DataWarehouseComponent) },
      { path: 'api-public', loadComponent: () => import('./features/api-public/api-public.component').then(m => m.ApiPublicComponent) },
      { path: 'alerts', loadComponent: () => import('./features/alerts/alerts.component').then(m => m.AlertsComponent) },
    ],
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
