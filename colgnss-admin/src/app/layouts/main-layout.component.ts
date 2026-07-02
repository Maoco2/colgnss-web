import { Component, OnInit, OnDestroy, ViewChild, HostListener, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  children?: SidebarItem[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NgClass,
    NgIf,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatBadgeModule,
    MatMenuModule,
    MatInputModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
  template: `
    <mat-sidenav-container class="layout-container">
      <mat-sidenav
        #sidenav
        [mode]="sidenavMode()"
        [opened]="sidenavOpen()"
        [fixedInViewport]="true"
        class="sidebar"
      >
        <div class="sidebar-brand">
          <mat-icon class="brand-icon">satellite_alt</mat-icon>
          <span class="brand-text">ColGnss Admin</span>
        </div>
        <div class="sidebar-divider"></div>
        <nav class="sidebar-nav">
          @for (section of sidebarSections; track section.title) {
            <div class="nav-section">
              <div class="nav-section-title">{{ section.title }}</div>
              @for (item of section.items; track item.label) {
                @if (item.children && item.children.length) {
                  <mat-expansion-panel
                    class="nav-expansion"
                    hideToggle
                    [expanded]="isParentActive(item)"
                  >
                    <mat-expansion-panel-header class="nav-item">
                      <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                      <span class="nav-label">{{ item.label }}</span>
                      <mat-icon class="nav-expand-icon">expand_more</mat-icon>
                    </mat-expansion-panel-header>
                    @for (child of item.children; track child.label) {
                      <a
                        mat-list-item
                        class="nav-child-item"
                        [routerLink]="[child.route]"
                        routerLinkActive="active"
                        (click)="closeSidenavOnMobile()"
                      >
                        <mat-icon class="nav-child-icon">chevron_right</mat-icon>
                        <span class="nav-label">{{ child.label }}</span>
                      </a>
                    }
                  </mat-expansion-panel>
                } @else {
                  <a
                    mat-list-item
                    class="nav-item"
                    [routerLink]="[item.route]"
                    routerLinkActive="active"
                    (click)="closeSidenavOnMobile()"
                  >
                    <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                    <span class="nav-label">{{ item.label }}</span>
                  </a>
                }
              }
            </div>
          }
        </nav>
      </mat-sidenav>

      <mat-sidenav-content class="content-area">
        <mat-toolbar class="header" color="primary">
          <button
            mat-icon-button
            class="menu-toggle"
            (click)="toggleSidenav()"
            matTooltip="Toggle menu"
          >
            <mat-icon>menu</mat-icon>
          </button>

          <div class="header-search">
            <mat-icon class="search-icon">search</mat-icon>
            <input
              matInput
              type="text"
              placeholder="Buscar..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="onSearch()"
              class="search-input"
            />
          </div>

          <span class="spacer"></span>

          <button
            mat-icon-button
            [matBadge]="notificationCount()"
            matBadgeColor="accent"
            matBadgeSize="small"
            class="header-btn"
            matTooltip="Notificaciones"
          >
            <mat-icon>notifications</mat-icon>
          </button>

          <button
            mat-icon-button
            [matMenuTriggerFor]="userMenu"
            class="header-btn user-btn"
            matTooltip="Usuario"
          >
            <mat-icon>account_circle</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before" class="user-menu">
            <button mat-menu-item routerLink="/users/profile" (click)="closeSidenavOnMobile()">
              <mat-icon>person</mat-icon>
              <span>Perfil</span>
            </button>
            <button mat-menu-item routerLink="/settings" (click)="closeSidenavOnMobile()">
              <mat-icon>settings</mat-icon>
              <span>Configuración</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Cerrar sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    :host { display: block; height: 100vh; }
    .layout-container { height: 100vh; background: var(--bg-page); }
    .sidebar { width: var(--sidebar-width); background: var(--bg-sidebar); border: none; }
    .sidebar-brand {
      display: flex; align-items: center; gap: 12px; padding: 20px 16px;
      height: var(--header-height); color: var(--text-white);
    }
    .brand-icon { font-size: 28px; width: 28px; height: 28px; color: var(--secondary); }
    .brand-text { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; white-space: nowrap; }
    .sidebar-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 0 16px; }
    .sidebar-nav { padding: 8px 0; overflow-y: auto; height: calc(100vh - var(--header-height)); }
    .nav-section { margin-bottom: 4px; }
    .nav-section-title {
      padding: 16px 20px 4px; font-size: 10px; font-weight: 600;
      text-transform: uppercase; letter-spacing: 1.2px; color: rgba(255,255,255,0.35);
    }
    .nav-item {
      display: flex !important; align-items: center; gap: 8px; padding: 8px 16px !important;
      margin: 2px 8px; border-radius: 8px; cursor: pointer; color: rgba(255,255,255,0.7);
      font-size: 13px; font-weight: 500; transition: all var(--transition-fast); height: 40px !important;
    }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: var(--text-white); }
    .nav-item.active {
      background: rgba(39, 174, 96, 0.15); color: var(--secondary);
    }
    .nav-icon { font-size: 20px; width: 20px; height: 20px; min-width: 20px; }
    .nav-label { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .nav-expand-icon { font-size: 18px; width: 18px; height: 18px; transition: transform var(--transition-fast); }
    .nav-child-item {
      display: flex !important; align-items: center; gap: 8px; padding-left: 48px !important;
      height: 36px !important; font-size: 12px; color: rgba(255,255,255,0.55); cursor: pointer;
      border-radius: 6px; margin: 1px 8px; transition: all var(--transition-fast);
    }
    .nav-child-item:hover { color: var(--text-white); background: rgba(255,255,255,0.06); }
    .nav-child-item.active { color: var(--secondary-light); background: rgba(39,174,96,0.1); }
    .nav-child-icon { font-size: 16px; width: 16px; height: 16px; min-width: 16px; }
    .nav-expansion { background: transparent !important; box-shadow: none !important; }
    ::ng-deep .nav-expansion .mat-expansion-panel-body { padding: 0 !important; }
    ::ng-deep .nav-expansion .mat-expansion-panel-header.mat-expanded { background: rgba(255,255,255,0.04); margin: 2px 8px; border-radius: 8px; }
    .header {
      height: var(--header-height); background: white !important; color: var(--text-primary) !important;
      box-shadow: var(--shadow-sm); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border-color);
    }
    .menu-toggle { margin-right: 8px; color: var(--text-secondary); }
    .header-search {
      display: flex; align-items: center; background: var(--bg-page); border-radius: 8px;
      padding: 0 12px; width: 320px; height: 40px; border: 1px solid transparent;
      transition: all var(--transition-normal);
    }
    .header-search:focus-within { border-color: var(--primary-light); background: white; box-shadow: 0 0 0 3px rgba(26,82,118,0.1); }
    .search-icon { font-size: 20px; width: 20px; height: 20px; color: var(--text-light); margin-right: 8px; }
    .search-input {
      border: none; background: transparent; outline: none; width: 100%;
      font-size: 13px; color: var(--text-primary); font-family: var(--font-family);
    }
    .header-btn { color: var(--text-secondary); }
    .user-btn { margin-left: 4px; }
    .main-content { padding: 24px; min-height: calc(100vh - var(--header-height)); overflow-y: auto; }
    @media (max-width: 768px) {
      .sidebar { width: 100vw !important; }
      .header-search { width: 160px; }
      .main-content { padding: 16px; }
    }
  `],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  searchQuery = '';
  notificationCount = signal(3);
  sidenavOpen = signal(true);
  sidenavMode = signal<'side' | 'over'>('side');
  isMobile = false;

  private destroy$ = new Subject<void>();

  readonly sidebarSections: SidebarSection[] = [
    {
      title: 'Principal',
      items: [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Analíticas', icon: 'analytics', route: '/analytics' },
      ],
    },
    {
      title: 'Gestión',
      items: [
        { label: 'Usuarios', icon: 'people', route: '/users' },
        { label: 'Perfiles', icon: 'badge', route: '/users' },
        { label: 'Procesamientos', icon: 'play_circle', route: '/processing' },
      ],
    },
    {
      title: 'GNSS',
      items: [
        { label: 'Estadísticas', icon: 'bar_chart', route: '/gnss-stats' },
        { label: 'Catálogos', icon: 'folder', route: '/catalogs' },
        { label: 'Estaciones', icon: 'cell_tower', route: '/stations' },
      ],
    },
    {
      title: 'Sistema',
      items: [
        { label: 'Monitor', icon: 'monitor_heart', route: '/monitor' },
        { label: 'Auditoría', icon: 'fact_check', route: '/audit' },
        { label: 'Notificaciones', icon: 'notifications', route: '/notifications' },
        { label: 'Configuración', icon: 'settings', route: '/settings' },
      ],
    },
    {
      title: 'Monetización',
      items: [
        { label: 'Publicidad', icon: 'ads_click', route: '/advertising' },
        { label: 'Suscripciones', icon: 'subscriptions', route: '/subscriptions' },
        { label: 'Reportes', icon: 'assessment', route: '/reports' },
      ],
    },
    {
      title: 'Avanzado',
      items: [
        { label: 'IA', icon: 'psychology', route: '/ai' },
        { label: 'Data Warehouse', icon: 'storage', route: '/data-warehouse' },
        { label: 'API Pública', icon: 'api', route: '/api-public' },
        { label: 'Alertas', icon: 'warning_amber', route: '/alerts' },
      ],
    },
  ];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.isMobile = result.matches;
        if (result.matches) {
          this.sidenavMode.set('over');
          this.sidenavOpen.set(false);
        } else {
          this.sidenavMode.set('side');
          this.sidenavOpen.set(true);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidenav(): void {
    this.sidenavOpen.update((v) => !v);
  }

  closeSidenavOnMobile(): void {
    if (this.isMobile) {
      this.sidenavOpen.set(false);
    }
  }

  isParentActive(item: SidebarItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) =>
      this.router.isActive(child.route, { paths: 'subset', queryParams: 'subset', fragment: 'ignored', matrixParams: 'ignored' })
    );
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: this.searchQuery.trim() } });
    }
  }

  logout(): void {
    localStorage.removeItem('access_token');
    this.router.navigate(['/auth/login']);
  }
}
