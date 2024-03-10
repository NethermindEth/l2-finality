export class ApiClient {
  baseUrl: string
  apiKey: string

  constructor() {
    this.baseUrl = process.env.BASE_URL as string
    this.apiKey = process.env.API_KEY as string
  }

  async request<T>(path: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': this.apiKey,
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
