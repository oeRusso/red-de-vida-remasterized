export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

/** Cliente de la API propia: devuelve `payload` o lanza ApiError con el mensaje listo para mostrar. */
export async function api<T = unknown>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: options.body === undefined ? undefined : { "Content-Type": "application/json" },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError("No pudimos conectar con el servidor. Inténtalo de nuevo.", 0);
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message ?? "Ocurrió un error. Inténtalo más tarde.", response.status, data?.errors);
  }
  return data?.payload as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Ocurrió un error. Inténtalo más tarde.";
