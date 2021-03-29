export default class RequestError {
  public error: string;
  public message: string;
  public statusCode: number;
  public data: any;

  constructor(errorType: string, message = '', statusCode = 500, data?: any) {
    this.error = errorType;
    this.message = message;
    this.statusCode = statusCode;

    if (typeof data !== 'undefined') {
      this.data = data;
    }
  }
}
