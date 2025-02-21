export type ValidationError = {
  field: string;
  message: string;
};

export class CustomError extends Error {
  public status: number;
  public message: string;
  public errors?: ValidationError[];

  constructor(status: number, message: string, errors?: ValidationError[]) {
    super(message);
    this.status = status;
    this.message = message;
    this.errors = errors;
  }
}
