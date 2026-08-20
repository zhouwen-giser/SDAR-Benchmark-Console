export interface TransportRequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class BenchmarkApiHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryable: boolean,
    readonly details: unknown,
  ) {
    super(`${status} ${code}`);
    this.name = "BenchmarkApiHttpError";
  }
}

function readViteEnv(name: string): string | undefined {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
  return env?.[name];
}

export class BenchmarkApiTransport {
  readonly baseUrl: string;
  readonly defaultTimeoutMs: number;

  constructor(
    baseUrl = readViteEnv("VITE_BENCHMARK_API_BASE_URL") ?? "/benchmark-api",
    defaultTimeoutMs = 15_000,
  ) {
    this.baseUrl = baseUrl.replace(/\/$/u, "");
    this.defaultTimeoutMs = defaultTimeoutMs;
  }

  async get<T>(path: string, options?: TransportRequestOptions): Promise<T> {
    return this.request<T>(path, { method: "GET" }, options);
  }

  async post<T>(path: string, body: unknown, options?: TransportRequestOptions): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) }, options);
  }

  async patch<T>(path: string, body: unknown, options?: TransportRequestOptions): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) }, options);
  }

  private async request<T>(path: string, init: RequestInit, options?: TransportRequestOptions): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => controller.abort(new DOMException("Benchmark API request timed out", "TimeoutError")),
      options?.timeoutMs ?? this.defaultTimeoutMs,
    );
    const abort = () => controller.abort(options?.signal?.reason);
    options?.signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
        },
        signal: controller.signal,
      });
      const text = await response.text();
      const payload = text ? (JSON.parse(text) as unknown) : null;
      if (!response.ok) {
        const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
        const error = record.error && typeof record.error === "object" ? record.error as Record<string, unknown> : record;
        throw new BenchmarkApiHttpError(
          response.status,
          typeof error.code === "string" ? error.code : "HTTP_ERROR",
          error.retryable === true,
          payload,
        );
      }
      return payload as T;
    } finally {
      window.clearTimeout(timeout);
      options?.signal?.removeEventListener("abort", abort);
    }
  }
}
