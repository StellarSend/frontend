const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export interface ApiStream {
  id:              string;
  contractStreamId:string;
  sender:          string;
  recipient:       string;
  token:           string;
  ratePerSecond:   string; // bigint serialised as string
  startTime:       number;
  stopTime:        number;
  withdrawn:       string;
  status:          'active' | 'cancelled' | 'completed';
  txHash:          string;
  createdAt:       string;
}

export interface ApiVestingSchedule {
  id:          string;
  beneficiary: string;
  token:       string;
  totalAmount: string;
  startTime:   number;
  cliffTime:   number;
  endTime:     number;
  claimed:     string;
  revoked:     boolean;
}

export interface StreamAnalytics {
  total:              number;
  active:             number;
  cancelled:          number;
  totalRatePerSecond: string;
}

// ── Streams ────────────────────────────────────────────────────────────────

export const streamsApi = {
  list: (address?: string) =>
    request<ApiStream[]>(`/streams${address ? `?address=${address}` : ''}`),

  get: (id: string) =>
    request<ApiStream>(`/streams/${id}`),

  analytics: (address: string) =>
    request<StreamAnalytics>(`/streams/analytics?address=${address}`),
};

// ── Vesting ────────────────────────────────────────────────────────────────

export const vestingApi = {
  list: (address?: string) =>
    request<ApiVestingSchedule[]>(`/vesting${address ? `?address=${address}` : ''}`),

  get: (id: string) =>
    request<ApiVestingSchedule>(`/vesting/${id}`),
};

// ── Webhooks ───────────────────────────────────────────────────────────────

export const webhooksApi = {
  subscribe: (url: string, events: string[], address: string) =>
    request('/webhooks/subscribe', {
      method: 'POST',
      body: JSON.stringify({ url, events, address }),
    }),

  unsubscribe: (id: string) =>
    request(`/webhooks/${id}`, { method: 'DELETE' }),
};
