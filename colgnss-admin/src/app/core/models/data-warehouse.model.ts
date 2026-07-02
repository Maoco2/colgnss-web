export interface DataWarehouseEntry {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete' | 'sync';
  recordId: string;
  data: Record<string, unknown>;
  source: string;
  syncedAt: string;
  status: 'pending' | 'synced' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export interface DataWarehouseSummary {
  totalEntries: number;
  pendingSync: number;
  synced: number;
  failed: number;
  byTable: Record<string, number>;
  lastSync: string;
  storageUsed: number;
}
