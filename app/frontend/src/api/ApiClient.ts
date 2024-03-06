export class ApiClient {
  baseUrl: string

  constructor() {
    this.baseUrl = 'http://localhost:3005'
  }

  async request<T>(path: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        ...(options.headers || {}),
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    return response.json()
  }

  get<T>(
    path: string,
    params?: Record<string, string>,
    cache: RequestCache = 'default'
  ): Promise<T> {
    const queryParams = new URLSearchParams(params).toString()
    return this.request<T>(`${path}${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
      cache,
    })
  }

  post<T>(
    path: string,
    body: Record<string, any>,
    cache: RequestCache = 'default'
  ): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      cache,
    })
  }
}
