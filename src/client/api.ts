export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

interface ErrorBody {
  error?: string;
  details?: unknown;
}

/** fetch() that turns network failures and `{ error }` responses into one ApiError with a readable message. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("Couldn't reach SpendSense. Check your connection and try again.", 0);
  }
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (body ?? {}) as ErrorBody;
    throw new ApiError(err.error ?? `Something went wrong (error ${res.status}). Try again.`, res.status, err.details);
  }
  return body as T;
}

export function jsonInit(method: string, data: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) };
}

export function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}
