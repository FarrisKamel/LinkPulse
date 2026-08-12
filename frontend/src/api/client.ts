// Relative path — Vite proxies /api to the backend (see vite.config.ts).
const API_BASE = '/api'

export async function apiGet<T>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`)
  if (!resp.ok) {
    throw new Error(`Request failed with status ${resp.status}`)
  }
  return resp.json() as Promise<T>
}

export async function apiSend<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) {
    // Surface the backend's error detail (e.g. the 409 duplicate message).
    let detail = `Request failed with status ${resp.status}`
    try {
      const data = (await resp.json()) as { detail?: string }
      if (data.detail) detail = data.detail
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(detail)
  }
  return resp.json() as Promise<T>
}

export async function apiDelete(path: string): Promise<void> {
  const resp = await fetch(`${API_BASE}${path}`, { method: 'DELETE' })
  if (!resp.ok) {
    throw new Error(`Delete failed with status ${resp.status}`)
  }
}
