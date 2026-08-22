export class VehicleDomainError extends Error {
  readonly status: 404 | 409;

  constructor(message: string, status: 404 | 409 = 409) {
    super(message);
    this.name = "VehicleDomainError";
    this.status = status;
  }
}
