const API_BASE = '/api';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Reading {
  id: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  slot: string;
  value: number;
  notes?: string | null;
  created_at: string;
}

export interface ReportMetrics {
  count: number;
  highest: number | null;
  lowest: number | null;
  average: number | null;
  timeInRange?: {
    lowPercent: number;
    inRangePercent: number;
    highPercent: number;
  };
}

export interface ReportSection {
  title: string;
  dateRange: string;
  start: string;
  end: string;
  metrics: ReportMetrics;
  readings: Reading[];
}

export interface ReportsResponse {
  selectedDate: string;
  reports: {
    daily: ReportSection;
    monthToDate: ReportSection;
    monthly: ReportSection;
  };
}

export const authStorage = {
  getToken: () => localStorage.getItem('sweety_token'),
  setToken: (token: string) => localStorage.setItem('sweety_token', token),
  clearToken: () => localStorage.removeItem('sweety_token'),
  getUser: (): User | null => {
    const raw = localStorage.getItem('sweety_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user: User) => localStorage.setItem('sweety_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('sweety_user'),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(
      'Cannot connect to backend server. Please verify the Node server is running on http://127.0.0.1:5000.'
    );
  }

  if (response.status === 502 || response.status === 503 || response.status === 504) {
    throw new Error(
      'Backend server is offline (502 Bad Gateway). Please ensure the backend is started in server/ directory.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}.`);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string) =>
      request<{ message: string; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email: string, password: string) =>
      request<{ message: string; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    getMe: () => request<{ user: User }>('/auth/me'),
  },

  readings: {
    getAll: (params?: { page?: number; limit?: number; date?: string; month?: string; slot?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.append('page', String(params.page));
      if (params?.limit) query.append('limit', String(params.limit));
      if (params?.date) query.append('date', params.date);
      if (params?.month) query.append('month', params.month);
      if (params?.slot) query.append('slot', params.slot);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return request<{ readings: Reading[]; pagination?: any }>(`/readings${qs}`);
    },
    add: (reading: { date: string; slot: string; value: number | string; notes?: string }) =>
      request<{ message: string; reading: Reading }>('/readings', {
        method: 'POST',
        body: JSON.stringify(reading),
      }),
    update: (id: number, reading: { date: string; slot: string; value: number | string; notes?: string }) =>
      request<{ message: string; reading: Reading }>(`/readings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reading),
      }),
    delete: (id: number) =>
      request<{ message: string; id: number }>(`/readings/${id}`, {
        method: 'DELETE',
      }),
  },

  reports: {
    get: (date?: string) => {
      const qs = date ? `?date=${date}` : '';
      return request<ReportsResponse>(`/reports${qs}`);
    },
  },
};

