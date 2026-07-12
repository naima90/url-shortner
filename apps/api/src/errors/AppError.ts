// Base class for errors we throw on purpose (as opposed to unexpected bugs).
// Controllers and services throw these; the error middleware catches them and
// turns them into a clean JSON response with the right status code.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  // "operational" means an expected error (bad input, not found, etc.) that is
  // safe to show the client. Non-operational errors are programmer bugs.
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    // Restore the prototype chain (needed when extending built-ins in TS).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
