const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  params?: Record<string, string | number | undefined>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('colgnss_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('colgnss_token', token);
    } else {
      localStorage.removeItem('colgnss_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    let url = `${API_URL}${path}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, params } = options;
    const url = this.buildUrl(path, params);

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (this.token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  }

  async register(data: { fullName: string; email: string; phone?: string; profession?: string; gender?: string; password: string; confirmPassword: string }) {
    return this.request<any>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  async getStations(params?: Record<string, any>) {
    return this.request<any>('/stations', { params });
  }

  async getStation(id: string) {
    return this.request<any>(`/stations/${id}`);
  }

  async getNearestStations(lat: number, lng: number, type?: string, limit?: number) {
    return this.request<any>('/stations/nearest', {
      params: { lat: String(lat), lng: String(lng), type, limit: limit ? String(limit) : undefined },
    });
  }

  async getStationStatistics() {
    return this.request<any>('/stations/statistics');
  }

  async getDepartments() {
    return this.request<any>('/stations/departments');
  }

  async calculateTrackingTime(data: { latitude: number; longitude: number; networkType: string; isDualFrequency?: boolean }) {
    return this.request<any>('/calculations/tracking-time', {
      method: 'POST',
      body: data,
    });
  }

  async getCalculationHistory(page?: number, limit?: number) {
    return this.request<any>('/calculations', { params: { page, limit } });
  }

  async getCalculation(id: string) {
    return this.request<any>(`/calculations/${id}`);
  }

  async deleteCalculation(id: string) {
    return this.request<any>(`/calculations/${id}`, { method: 'DELETE' });
  }

  async clearHistory() {
    return this.request<any>('/calculations', { method: 'DELETE' });
  }

  async getHistory(page?: number, limit?: number) {
    return this.request<any>('/history', { params: { page, limit } });
  }

  async getReferenceSystems() {
    return this.request<any>('/coordinate/reference-systems');
  }

  async getCoordinateTypes(systemId: number) {
    return this.request<any>('/coordinate/coordinate-types', { params: { systemId } });
  }

  async getGaussZones(systemId: number) {
    return this.request<any>('/coordinate/gauss-zones', { params: { systemId } });
  }

  async getCoordinateDepartments() {
    return this.request<any>('/coordinate/departments');
  }

  async getCoordinateMunicipalities(departmentId: number) {
    return this.request<any>('/coordinate/municipalities', { params: { departmentId } });
  }

  async getOrigins(systemId: number, municipalityPk?: number) {
    const params: any = { systemId };
    if (municipalityPk) params.municipalityPk = municipalityPk;
    return this.request<any>('/coordinate/origins', { params });
  }

  async convertCoordinate(data: any) {
    return this.request<any>('/coordinate/convert', { method: 'POST', body: data });
  }

  async batchConvertCoordinate(data: any) {
    const url = `${API_URL}/coordinate/batch-convert`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: data,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Batch convert failed' }));
      throw new Error(err.message || 'Batch convert failed');
    }
    return response.json();
  }

  async getCoordinateHistory(page?: number) {
    return this.request<any>('/coordinate/history', { params: { page } });
  }

  async exportPdf(calculationId: string) {
    const url = `${API_URL}/export/pdf/${calculationId}`;
    const response = await fetch(url, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }

  async getNews(page?: number, limit?: number) {
    return this.request<any>('/news', { params: { page, limit } });
  }

  async getPremiumStatus() {
    return this.request<any>('/premium/status');
  }

  async activatePremium() {
    return this.request<any>('/premium/activate', { method: 'POST' });
  }

  async cancelPremium() {
    return this.request<any>('/premium/cancel', { method: 'DELETE' });
  }

  async getAdminDashboard() {
    return this.request<any>('/admin/dashboard');
  }

  async getAdminUsers(page?: number, limit?: number) {
    return this.request<any>('/admin/users', { params: { page, limit } });
  }

  async getSystemStats() {
    return this.request<any>('/analytics/stats');
  }

  async getProfile() {
    return this.request<any>('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request<any>('/users/profile', { method: 'PUT', body: data });
  }

  // RINEX Analysis
  async uploadRinexFile(file: File) {
    const url = `${API_URL}/rinex/upload`;
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(err.message || 'Upload failed');
    }
    return response.json();
  }

  async selectZipFile(sessionId: string, fileName: string) {
    return this.request<any>(`/rinex/session/${sessionId}/select-file`, {
      method: 'POST',
      body: { fileName },
    });
  }

  async analyzeRinex(sessionId: string, data: { networkType: string; isDualFrequency: boolean }) {
    return this.request<any>(`/rinex/analyze/${sessionId}`, {
      method: 'POST',
      body: data,
    });
  }

  subscribeRinexProgress(sessionId: string, callbacks: {
    onProgress: (event: { step: string; percent: number; message: string }) => void;
    onComplete: () => void;
    onError: (err: Error) => void;
  }): () => void {
    const url = `${API_URL}/rinex/progress/${sessionId}${this.token ? `?token=${encodeURIComponent(this.token)}` : ''}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.step === 'complete') {
          callbacks.onComplete();
          eventSource.close();
        } else {
          callbacks.onProgress(data);
        }
      } catch {
        callbacks.onProgress({ step: 'unknown', percent: 0, message: event.data });
      }
    };

    eventSource.onerror = () => {
      callbacks.onError(new Error('Conexión SSE perdida'));
      eventSource.close();
    };

    return () => eventSource.close();
  }

  async cancelRinexAnalysis(sessionId: string) {
    return this.request<any>(`/rinex/analyze/${sessionId}`, { method: 'DELETE' });
  }

  async getRinexAnalysis(id: string) {
    return this.request<any>(`/rinex/analysis/${id}`);
  }

  async getRinexHistory(page?: number, limit?: number) {
    return this.request<any>('/rinex/history', { params: { page, limit } });
  }

  async downloadRinexPdf(id: string) {
    const url = `${API_URL}/rinex/pdf/${id}`;
    const response = await fetch(url, {
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {},
    });
    if (!response.ok) throw new Error('PDF download failed');
    return response.blob();
  }

  async deleteRinexTemp(sessionId: string) {
    return this.request<any>(`/rinex/temp/${sessionId}`, { method: 'DELETE' });
  }

  async deleteRinexAnalysis(id: string) {
    return this.request<any>(`/rinex/history/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
