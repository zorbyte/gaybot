export function createGaybotError<T extends unknown[] = []>(
  base: ErrorConstructor,
  message: string | ((...args: T) => string)
) {
  return class GaybotError extends base {
    meta: T;

    constructor(...args: T) {
      super(typeof message === "string" ? message : message(...args));
      Error.captureStackTrace(this, GaybotError);
      this.meta = args;
    }
  };
}
