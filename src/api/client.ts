import { mockRequest } from "../demo/mock";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  try { return mockRequest(path, method, typeof options.body === "string" ? options.body : undefined) as T; }
  catch (error) { throw new ApiError(400, "DEMO_ONLY", error instanceof Error ? error.message : "Demo request failed"); }
}

export function qs(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => value !== undefined && value !== "" && params.set(key, String(value)));
  const query = params.toString();
  return query ? `?${query}` : "";
}
