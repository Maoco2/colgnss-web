export interface AiModel {
  id: string;
  name: string;
  version: string;
  type: string;
  description?: string;
  status: 'training' | 'ready' | 'failed' | 'deprecated';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingDataSize: number;
  lastTrainedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AiPrediction {
  id: string;
  modelId: string;
  modelName?: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  confidence: number;
  processingTime: number;
  userId?: string;
  createdAt: string;
}

export interface QualityScore {
  overall: number;
  accuracy: number;
  completeness: number;
  consistency: number;
  timeliness: number;
  validity: number;
  details?: Record<string, number>;
}

export interface AnomalyDetection {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  source: string;
  detectedAt: string;
  resolvedAt?: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
}
