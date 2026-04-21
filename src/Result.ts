export type Failure<TError> = {
  success: false
  error: TError
}

export type Success<TData> = {
  success: true
  data: TData
}

export class Result<TData, TError> {
  private constructor(private readonly result: Success<TData> | Failure<TError>) {}

  static success<TData, TError>(data: TData): Result<TData, TError> {
    return new Result<TData, TError>({success: true, data})
  }

  static failure<TData, TError>(error: TError): Result<TData, TError> {
    return new Result<TData, TError>({success: false, error})
  }

  static async from<TData, TError>(promise: Promise<TData>): Promise<Result<TData, TError>> {
    return promise
      .then(data => Result.success<TData, TError>(data))
      .catch(error => Result.failure<TData, TError>(error))
  }

  isSuccess(): this is {result: Success<TData>} {
    return this.result.success
  }

  isFailure(): this is {result: Failure<TError>} {
    return !this.result.success
  }

  map<TNewData>(fn: (data: TData) => TNewData): Result<TNewData, TError> {
    const result = this.result
    if (result.success) {
      return Result.success<TNewData, TError>(fn(result.data))
    }
    return Result.failure<TNewData, TError>(result.error)
  }

  flatMap<TNewData>(fn: (data: TData) => Result<TNewData, TError>): Result<TNewData, TError> {
    const result = this.result
    if (!result.success) {
      return Result.failure<TNewData, TError>(result.error)
    }
    return fn(result.data)
  }

  fold<TNewData>({
    onSuccess,
    onFailure
  }: {
    onSuccess: (data: TData) => TNewData
    onFailure: (error: TError) => TNewData
  }): TNewData {
    const result = this.result
    if (result.success) {
      return onSuccess(result.data)
    }
    return onFailure(result.error)
  }

  orElse<TNewData>(defaultValue: TNewData): TData | TNewData {
    const result = this.result
    if (result.success) {
      return result.data
    }
    return defaultValue
  }

  orElseThrow(): TData {
    const result = this.result
    if (result.success) {
      return result.data
    }
    throw result.error
  }

  swap(): Result<TError, TData> {
    const result = this.result
    if (!result.success) {
      return Result.success<TError, TData>(result.error as unknown as TError)
    }
    return Result.failure<TError, TData>(result.data as unknown as TData)
  }

  mapError<TNewError>(fn: (error: TError) => TNewError): Result<TData, TNewError> {
    const result = this.result
    if (result.success) {
      return Result.success<TData, TNewError>(result.data)
    }
    return Result.failure<TData, TNewError>(fn(result.error))
  }
}
