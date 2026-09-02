const API_BASE_URL = 'http://localhost:3001/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, token may be expired
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-logout'));
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  }

  // ── Auth ──
  login(body: { email: string; password: string }) {
    return this.request<{ message: string; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  register(body: { name: string; email: string; password: string; role?: string }) {
    return this.request<{ message: string; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  // ── Projects ──
  getProjects(includeInactive = false) {
    return this.request<{ projects: any[] }>(`/projects?includeInactive=${includeInactive}`);
  }

  getProject(id: string) {
    return this.request<{ project: any }>(`/projects/${id}`);
  }

  createProject(body: { name: string; description?: string }) {
    return this.request<{ message: string; project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  updateProject(id: string, body: { name?: string; description?: string; isActive?: boolean }) {
    return this.request<{ message: string; project: any }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  deleteProject(id: string) {
    return this.request<{ message: string; project?: any }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ── Reports ──
  getMyReports(params: { status?: string; projectId?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.projectId) query.append('projectId', params.projectId);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.request<{ reports: any[]; pagination: any }>(`/reports/mine?${query.toString()}`);
  }

  getAllReports(params: { userId?: string; projectId?: string; status?: string; startDate?: string; endDate?: string; page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.userId) query.append('userId', params.userId);
    if (params.projectId) query.append('projectId', params.projectId);
    if (params.status) query.append('status', params.status);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.request<{ reports: any[]; pagination: any }>(`/reports?${query.toString()}`);
  }

  getReport(id: string) {
    return this.request<{ report: any }>(`/reports/${id}`);
  }

  createReport(body: any) {
    return this.request<{ message: string; report: any }>('/reports', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  updateReport(id: string, body: any) {
    return this.request<{ message: string; report: any }>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  submitReport(id: string, body: any = {}) {
    return this.request<{ message: string; report: any }>(`/reports/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  getReportVersions(id: string) {
    return this.request<{ versions: any[] }>(`/reports/${id}/versions`);
  }

  reviewReport(id: string, body: { action: 'APPROVED' | 'REQUEST_CHANGES'; comment: string }) {
    return this.request<{ message: string; review: any; report: any }>(`/reports/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // ── Dashboard ──
  getDashboardSummary() {
    return this.request<{ summary: any }>('/dashboard/summary');
  }

  getDashboardCharts() {
    return this.request<{ charts: any }>('/dashboard/charts');
  }

  // ── Stats (diagnostic) ──
  getStats() {
    return this.request<any>('/stats');
  }
}

export const api = new ApiClient();
