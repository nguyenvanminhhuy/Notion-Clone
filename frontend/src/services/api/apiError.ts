export class ApiError extends Error {
  public statusCode: number;
  public errors?: string[];
  public isNetworkError: boolean;

  constructor(message: string, statusCode: number = 500, errors?: string[], isNetworkError: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isNetworkError = isNetworkError;

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isValidationError(): boolean {
    return this.statusCode === 400 || (this.errors !== undefined && this.errors.length > 0);
  }

  public static async fromResponse(response: Response): Promise<ApiError> {
    let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
    let errors: string[] | undefined;

    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data) {
          if (data.message) {
            errorMessage = data.message;
          } else if (data.title) {
            errorMessage = data.title;
          } else if (typeof data === 'string') {
            errorMessage = data;
          }

          if (Array.isArray(data.errors)) {
            errors = data.errors;
          } else if (data.errors && typeof data.errors === 'object') {
            // Flatten ASP.NET Core ModelState validation errors dictionary
            errors = Object.values(data.errors).flat() as string[];
          }
        }
      } else {
        const text = await response.text();
        if (text) {
          errorMessage = text;
        }
      }
    } catch {
      // Fallback to generic status text if parsing fails
    }

    return new ApiError(errorMessage, response.status, errors, false);
  }

  public static networkError(message = 'Network error or server unreachable'): ApiError {
    return new ApiError(message, 0, undefined, true);
  }
}
