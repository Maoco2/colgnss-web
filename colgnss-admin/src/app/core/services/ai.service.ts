import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = inject(ApiService);

  getModels(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/ai/models').pipe(map(r => r.data));
  }

  trainModel(data: any): Observable<any> {
    return this.api.post<any>('enterprise/ai/predict', data).pipe(map(r => r.data));
  }

  getPredictions(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/ai/predictions').pipe(map(r => r.data));
  }

  createPrediction(data: any): Observable<any> {
    return this.api.post<any>('enterprise/ai/predict', data).pipe(map(r => r.data));
  }

  getQualityScores(): Observable<any> {
    return this.api.get<any>('enterprise/ai/quality').pipe(map(r => r.data));
  }

  getAnomalies(): Observable<any[]> {
    return this.api.get<any[]>('enterprise/ai/anomalies').pipe(map(r => r.data));
  }

  resolveAnomaly(id: string): Observable<void> {
    return this.api.post<void>(`enterprise/ai/anomalies`).pipe(map(() => undefined));
  }
}
