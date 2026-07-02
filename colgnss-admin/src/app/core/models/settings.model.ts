export interface SystemConfig {
  id: string;
  key: string;
  value: unknown;
  type: string;
  group: string;
  label: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
