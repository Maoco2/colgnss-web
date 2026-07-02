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
import { AiService } from '@core/services/ai.service';
import { AiModel, AiPrediction, QualityScore, AnomalyDetection } from '@core/models';

@Component({
  selector: 'app-ai',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatChipsModule, MatDividerModule, MatTabsModule, MatTooltipModule,
  ],
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss'],
})
export class AiComponent implements OnInit {
  private aiService = inject(AiService);

  loading = signal(true);
  models = signal<AiModel[]>([]);
  predictions = signal<AiPrediction[]>([]);
  qualityScores = signal<QualityScore[]>([]);
  anomalies = signal<AnomalyDetection[]>([]);

  modelColumns = ['name', 'type', 'version', 'status', 'accuracy', 'lastTrained'];
  predictionColumns = ['type', 'inputSummary', 'outputSummary', 'confidence', 'status', 'time'];
  qualityColumns = ['file', 'score', 'category', 'observations', 'issues', 'recommendations'];
  anomalyColumns = ['type', 'entity', 'value', 'expected', 'deviation', 'severity', 'date', 'resolved'];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.aiService.getModels().subscribe({
      next: (data) => this.models.set(Array.isArray(data) ? data : []),
      error: () => {},
    });
    this.aiService.getPredictions().subscribe({
      next: (data) => this.predictions.set(Array.isArray(data) ? data : []),
      error: () => {},
    });
    this.aiService.getQualityScores().subscribe({
      next: (data) => this.qualityScores.set(Array.isArray(data) ? data : []),
      error: () => {},
    });
    this.aiService.getAnomalies().subscribe({
      next: (data) => this.anomalies.set(Array.isArray(data) ? data : []),
      error: () => {},
    });
    setTimeout(() => this.loading.set(false), 600);
  }

  getStatusColor(status: string): string {
    const map: Record<string, string> = { ready: 'primary', training: 'accent', failed: 'warn', deprecated: '' };
    return map[status] || '';
  }

  getSeverityColor(severity: string): string {
    const map: Record<string, string> = { low: '#3b82f6', medium: '#f97316', high: '#ef4444', critical: '#dc2626' };
    return map[severity] || '#64748b';
  }

  getSeverityClass(severity: string): string {
    const map: Record<string, string> = { low: '', medium: 'accent', high: 'warn', critical: 'warn' };
    return map[severity] || '';
  }

  getObjectKeysCount(obj: any): number {
    return obj ? Object.keys(obj).length : 0;
  }

  truncate(obj: any, len = 60): string {
    const str = typeof obj === 'object' ? JSON.stringify(obj) : String(obj);
    return str.length > len ? str.slice(0, len) + '...' : str;
  }

  resolveAnomaly(anomaly: AnomalyDetection): void {
    this.aiService.resolveAnomaly(anomaly.id).subscribe({
      next: () => this.loadData(),
      error: () => {},
    });
  }
}
