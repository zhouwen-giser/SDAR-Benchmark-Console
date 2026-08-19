type Handler = { method: string; path: string; resolver: (...args: any[]) => any };

function factory(method: string) {
  return (path: string, resolver: (...args: any[]) => any): Handler => ({ method, path, resolver });
}

export const http = {
  get: factory("GET"),
  post: factory("POST"),
  patch: factory("PATCH"),
  put: factory("PUT"),
  delete: factory("DELETE"),
};

export class HttpResponse {
  static json(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
  }
}
