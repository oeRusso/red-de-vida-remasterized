/** Error esperado de negocio: su mensaje se muestra tal cual al usuario. */
export class DomainError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
