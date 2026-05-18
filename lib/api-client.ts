import { getSession } from 'next-auth/react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
export const ML_URL = process.env.NEXT_PUBLIC_ML_URL || 'http://localhost:8000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return headers;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    // FastAPI 422 returns detail as array of validation errors
    let message = 'Request failed';
    if (typeof err.detail === 'string') {
      message = err.detail;
    } else if (Array.isArray(err.detail)) {
      message = err.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join('; ');
    }
    throw new Error(message || `API error: ${res.status}`);
  }

  return res.json();
}

// ── Onboarding ──

export async function completeOnboarding(data: {
  name: string;
  experience_level: string;
  domain_preferences: Array<{
    domain_id: string;
    experience_level: string;
    is_selected: boolean;
  }>;
  current_role?: string;
  college_or_company?: string;
  skills?: string[];
}) {
  return apiFetch('/api/profile/onboard', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadResume(file: File) {
  const session = await getSession();
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BACKEND_URL}/api/profile/resume`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session?.accessToken || ''}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

// ── Sessions ──

export async function startSession(mode: string, domain: string, topic?: string) {
  const data = await apiFetch<any>('/api/sessions/start', {
    method: 'POST',
    body: JSON.stringify({ mode, domain, topic }),
  });

  // Store session data in sessionStorage for the session page
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(`session_${data.session_id}`, JSON.stringify(data));
  }

  return data;
}

export async function submitAttempt(data: {
  session_id: string;
  question_id: string;
  transcript: string;
  answer_duration: number;
  emotion_frames: Array<{ emotion: string; confidence: number; timestamp: number }>;
}) {
  return apiFetch<any>('/api/attempts/submit', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function endSession(sessionId: string) {
  return apiFetch<any>(`/api/sessions/end?session_id=${sessionId}`, {
    method: 'POST',
  });
}

export async function getSessionHistory(page: number = 1, limit: number = 20) {
  return apiFetch<any>(`/api/sessions?page=${page}&limit=${limit}`);
}

export async function getSessionDetail(sessionId: string) {
  return apiFetch<any>(`/api/sessions/${sessionId}`);
}

// ── Leaderboard ──

export async function getLeaderboard(limit: number = 20) {
  return apiFetch<any>(`/api/rating/leaderboard?limit=${limit}`);
}

// ── Dashboard ──

export async function getDashboardData() {
  return apiFetch<any>('/api/dashboard');
}

// ── User Profile ──

export async function getUserProfile() {
  return apiFetch<any>('/api/profile');
}

export async function updateUserProfile(data: Record<string, any>) {
  return apiFetch<any>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Rating ──

export async function getMyRating() {
  return apiFetch<any>('/api/rating/me');
}

// ── Domains & Modes ──

export async function getDomains() {
  return apiFetch<any>('/api/sessions/domains');
}

export async function getModes() {
  return apiFetch<any>('/api/sessions/modes');
}
