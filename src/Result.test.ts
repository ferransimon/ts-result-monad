import {Result} from './Result.js'

describe('Result', () => {
  describe('success', () => {
    it('should create a successful result', () => {
      const result = Result.success(42)

      expect(result.isSuccess()).toBe(true)
      expect(result.isFailure()).toBe(false)
    })
  })

  describe('failure', () => {
    it('should create a failure result', () => {
      const result = Result.failure(new Error('something went wrong'))

      expect(result.isSuccess()).toBe(false)
      expect(result.isFailure()).toBe(true)
    })
  })

  describe('from', () => {
    it('should wrap a resolved promise as success', async () => {
      const result = await Result.from(Promise.resolve('data'))

      expect(result.isSuccess()).toBe(true)
    })

    it('should wrap a rejected promise as failure', async () => {
      const result = await Result.from(Promise.reject(new Error('oops')))

      expect(result.isFailure()).toBe(true)
    })
  })

  describe('map', () => {
    it('should transform the value on success', () => {
      const result = Result.success(2).map(n => n * 3)

      expect(result.orElseThrow()).toBe(6)
    })

    it('should not apply the function on failure', () => {
      const fn = vi.fn()
      const error = new Error('fail')
      Result.failure<number, Error>(error).map(fn)

      expect(fn).not.toHaveBeenCalled()
    })

    it('should propagate the error on failure', () => {
      const error = new Error('fail')
      const result = Result.failure<number, Error>(error).map(n => n * 2)

      expect(result.isFailure()).toBe(true)
      expect(result.orElse(null)).toBeNull()
    })
  })

  describe('flatMap', () => {
    it('should chain successful results', () => {
      const result = Result.success(2).flatMap(n => Result.success(n + 1))

      expect(result.orElseThrow()).toBe(3)
    })

    it('should propagate failure without calling the function', () => {
      const fn = vi.fn()
      const error = new Error('fail')
      Result.failure<number, Error>(error).flatMap(fn)

      expect(fn).not.toHaveBeenCalled()
    })

    it('should allow the chained function to return a failure', () => {
      const error = new Error('inner fail')
      const result = Result.success(1).flatMap(() => Result.failure<number, Error>(error))

      expect(result.isFailure()).toBe(true)
    })
  })

  describe('fold', () => {
    it('should call onSuccess on a successful result', () => {
      const result = Result.success('hello').fold({
        onSuccess: data => `got: ${data}`,
        onFailure: () => 'failed'
      })

      expect(result).toBe('got: hello')
    })

    it('should call onFailure on a failure result', () => {
      const result = Result.failure<string, Error>(new Error('boom')).fold({
        onSuccess: () => 'ok',
        onFailure: err => `error: ${err.message}`
      })

      expect(result).toBe('error: boom')
    })
  })

  describe('orElse', () => {
    it('should return the data on success', () => {
      expect(Result.success(10).orElse(0)).toBe(10)
    })

    it('should return the default value on failure', () => {
      expect(Result.failure<number, Error>(new Error('x')).orElse(0)).toBe(0)
    })
  })

  describe('orElseThrow', () => {
    it('should return the data on success', () => {
      expect(Result.success('ok').orElseThrow()).toBe('ok')
    })

    it('should throw the error on failure', () => {
      const error = new Error('thrown')
      expect(() => Result.failure<string, Error>(error).orElseThrow()).toThrow(error)
    })
  })

  describe('swap', () => {
    it('should turn a failure into a success with the error as data', () => {
      const error = new Error('original error')
      const swapped = Result.failure<string, Error>(error).swap()

      expect(swapped.isSuccess()).toBe(true)
      expect(swapped.orElseThrow()).toBe(error)
    })

    it('should turn a success into a failure with the data as error', () => {
      const swapped = Result.success<string, Error>('data').swap()

      expect(swapped.isFailure()).toBe(true)
    })
  })

  describe('mapError', () => {
    it('should transform the error on failure', () => {
      const result = Result.failure<number, Error>(new Error('original')).mapError(err => err.message)

      expect(result.isFailure()).toBe(true)
      result.fold({
        onSuccess: () => {},
        onFailure: msg => expect(msg).toBe('original')
      })
    })

    it('should not apply the function on success', () => {
      const fn = vi.fn()
      Result.success<number, Error>(1).mapError(fn)

      expect(fn).not.toHaveBeenCalled()
    })

    it('should preserve the data on success', () => {
      const result = Result.success<number, Error>(99).mapError(err => err.message)

      expect(result.orElseThrow()).toBe(99)
    })
  })
})
