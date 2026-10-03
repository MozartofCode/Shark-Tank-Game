import type { GameView, Health, LeaderboardEntry, PublicConfig, RevealView, RunSummary, SharkPersona } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? ''

let accessToken: string | null = null

/** Set by the auth layer; sent as a Bearer token on every API call. */
export function setAccessToken(token: string | null) {
  accessToken = token
}

function authHeaders(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers },
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      detail = (await res.json()).detail ?? detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail)
  }
  return res.json() as Promise<T>
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export const api = {
  health: () => request<Health>('/api/health'),
  sharks: () => request<SharkPersona[]>('/api/sharks'),
  config: () => request<PublicConfig>('/api/config'),
  newGame: (mode: 'random' | 'daily' = 'random') => post<GameView>('/api/games', { mode }),
  claim: (id: string) => post<GameView>(`/api/games/${id}/claim`),
  leaderboard: (scope: 'daily' | 'all') => request<LeaderboardEntry[]>(`/api/leaderboard?scope=${scope}`),
  myRuns: () => request<RunSummary[]>('/api/me/runs'),
  getGame: (id: string) => request<GameView>(`/api/games/${id}`),
  offer: (id: string, round: number, amount: number, equity: number) =>
    post<GameView>(`/api/games/${id}/rounds/${round}/offer`, { amount, equity }),
  pass: (id: string, round: number) =>
    post<GameView>(`/api/games/${id}/rounds/${round}/offer`, { pass: true }),
  counter: (id: string, round: number, accept: boolean) =>
    post<GameView>(`/api/games/${id}/rounds/${round}/counter`, { accept }),
  reveal: (id: string) => post<RevealView>(`/api/games/${id}/reveal`),
  mediaUrl: (pitchId: string, file: string) => `${BASE}/media/${pitchId}/${file}`,

  /** Ask the founder a question; calls onDelta as the answer streams in (SSE over POST). */
  async ask(id: string, round: number, question: string, onDelta: (text: string) => void) {
    const res = await fetch(`${BASE}/api/games/${id}/rounds/${round}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...authHeaders() },
      body: JSON.stringify({ question }),
    })
    if (!res.ok || !res.body) {
      let detail = res.statusText
      try {
        detail = (await res.json()).detail ?? detail
      } catch {
        /* ignore */
      }
      throw new ApiError(res.status, detail)
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
    let buffer = ''
    let final: { answer: string; questions_left: number } | null = null
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += value.replace(/\r\n/g, '\n')
      let sep: number
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, sep)
        buffer = buffer.slice(sep + 2)
        const event = /^event: (.*)$/m.exec(block)?.[1]
        const data = block
          .split('\n')
          .filter((l) => l.startsWith('data: '))
          .map((l) => l.slice(6))
          .join('\n')
        if (!data) continue
        const parsed = JSON.parse(data)
        if (event === 'delta') onDelta(parsed.text)
        if (event === 'done') final = parsed
      }
    }
    return final
  },
}
