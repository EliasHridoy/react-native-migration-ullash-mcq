export class AppFailure {
  constructor(public readonly message: string) {}
}

export class ServerFailure extends AppFailure {}
export class NetworkFailure extends AppFailure {}
export class AuthFailure extends AppFailure {}
export class NotFoundFailure extends AppFailure {}
export class ValidationFailure extends AppFailure {}
export class PaymentFailure extends AppFailure {}
export class UnauthorizedFailure extends AppFailure {}

export function isFailure(value: unknown): value is AppFailure {
  return value instanceof AppFailure;
}
