import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective } from 'ng2-charts';
import { SubscriptionsService } from '@core/services/subscriptions.service';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subscription, Payment } from '@core/models';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatChipsModule, MatDividerModule, MatTabsModule, MatTooltipModule, BaseChartDirective,
  ],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss'],
})
export class SubscriptionsComponent implements OnInit {
  private subscriptionsService = inject(SubscriptionsService);

  loading = signal(true);
  subscriptions = signal<Subscription[]>([]);
  payments = signal<Payment[]>([]);
  stats = signal<any>(null);

  subColumns = ['user', 'plan', 'status', 'startDate', 'endDate', 'autoRenew', 'price', 'actions'];
  paymentColumns = ['user', 'amount', 'method', 'status', 'date'];

  revenueChartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });
  planChartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } },
  };

  doughnutOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } },
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.subscriptionsService.getSubscriptions().subscribe({
      next: (res) => this.subscriptions.set(res.data || []),
      error: () => {},
    });
    this.subscriptionsService.getSubscriptionStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.buildCharts(data);
      },
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 600);
  }

  private buildCharts(stats: any): void {
    const months = stats.revenueByMonth ? Object.keys(stats.revenueByMonth) : [];
    this.revenueChartData.set({
      labels: months,
      datasets: [{
        label: 'Ingresos',
        data: months.map((m) => stats.revenueByMonth[m] || 0),
        borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 3,
      }],
    });
    const plans = stats.byPlan ? Object.keys(stats.byPlan) : [];
    const colors = ['#3b82f6', '#22c55e', '#f97316'];
    this.planChartData.set({
      labels: plans,
      datasets: [{
        data: plans.map((p) => stats.byPlan[p] || 0),
        backgroundColor: colors.slice(0, plans.length),
        borderWidth: 0,
      }],
    });
  }

  getPlanClass(plan: string): string {
    const map: Record<string, string> = { free: '', professional: 'primary', enterprise: 'accent' };
    return map[plan] || '';
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = { active: 'primary', trialing: 'accent', canceled: 'warn', expired: '' };
    return map[status] || '';
  }
}
