import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { BaseChartDirective } from 'ng2-charts';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProfileService } from '@core/services/profile.service';
import { AnalyticsService } from '@core/services/analytics.service';
import { User } from '@core/models';
import { ChartConfiguration, ChartData } from 'chart.js';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule,
    MatDividerModule, MatProgressBarModule, MatTabsModule, MatListModule,
    BaseChartDirective, RouterLink,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private analyticsService = inject(AnalyticsService);

  user = signal<User | null>(null);
  stats = signal<any>(null);
  activity = signal<any[]>([]);
  loading = signal(true);

  activityChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  moduleChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } },
    },
    elements: { line: { tension: 0.4 } },
  };

  doughnutOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 10 } } } },
  };

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id') || 'me';
    this.loadProfile(userId);
  }

  private loadProfile(id: string): void {
    this.profileService.getProfile(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.loadStats(id);
        this.loadActivity(id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadStats(id: string): void {
    this.profileService.getProfileStats(id).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.buildCharts(stats);
      },
      error: () => {},
    });
  }

  private loadActivity(id: string): void {
    this.profileService.getProfileActivity(id).subscribe({
      next: (activity) => {
        this.activity.set(Array.isArray(activity) ? activity.slice(0, 10) : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private buildCharts(stats: any): void {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthlyActivity = stats?.monthlyActivity || stats?.activityByMonth || [];
    const values = months.map((_, i) => {
      const match = monthlyActivity.find((m: any) => m.month === i + 1 || m.month === months[i]);
      return match?.count || match?.value || 0;
    });
    this.activityChartData.set({
      labels: months,
      datasets: [{
        label: 'Actividad',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
      }],
    });

    const moduleStats = stats?.moduleUsage || stats?.processingByModule || [];
    const defaultModules = ['PPP', 'DGPS', 'RTK', 'PPK', 'RINEX'];
    const moduleLabels = moduleStats.length ? moduleStats.map((m: any) => m.module || m.name) : defaultModules;
    const moduleValues = moduleStats.length ? moduleStats.map((m: any) => m.count || m.value || 0) : [0, 0, 0, 0, 0];
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444'];
    this.moduleChartData.set({
      labels: moduleLabels,
      datasets: [{ data: moduleValues, backgroundColor: colors.slice(0, moduleLabels.length), borderWidth: 0 }],
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }

  getAvatarColor(name: string): string {
    const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#14b8a6', '#eab308', '#6366f1'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  getBrowser(ua?: string): string {
    if (!ua) return '—';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Otro';
  }

  getOS(ua?: string): string {
    if (!ua) return '—';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Otro';
  }

  getDevice(ua?: string): string {
    if (!ua) return '—';
    if (ua.includes('Mobile')) return 'Móvil';
    if (ua.includes('Tablet')) return 'Tablet';
    return 'Escritorio';
  }
}
