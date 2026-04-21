# ts-result-monad

A lightweight, fully-typed `Result` monad for TypeScript. Model success and failure explicitly without throwing exceptions.

## Installation

```sh
npm install @nomis/ts-result-monad
# or
pnpm add @nomis/ts-result-monad
# or
yarn add @nomis/ts-result-monad
```

## Usage

### Creating a Result

```ts
import { Result } from '@nomis/ts-result-monad'

const success = Result.success(42)
const failure = Result.failure(new Error('something went wrong'))
```

### Wrapping a Promise

```ts
const result = await Result.from(fetch('/api/data').then(r => r.json()))

if (result.isSuccess()) {
  console.log(result.result.data)
} else {
  console.error(result.result.error)
}
```

### Checking the outcome

```ts
const result = Result.success(42)

result.isSuccess() // true
result.isFailure() // false
```

### Transforming the value — `map`

Applies a function to the data if the result is successful. Does nothing on failure.

```ts
const result = Result.success(2).map(n => n * 3)

result.orElseThrow() // 6
```

### Chaining results — `flatMap`

Like `map`, but the function itself returns a `Result`.

```ts
function divide(a: number, b: number): Result<number, Error> {
  if (b === 0) return Result.failure(new Error('Division by zero'))
  return Result.success(a / b)
}

const result = Result.success(10).flatMap(n => divide(n, 2))

result.orElseThrow() // 5
```

### Handling both cases — `fold`

Provide handlers for both success and failure and get a single value back.

```ts
const message = result.fold({
  onSuccess: data => `Got: ${data}`,
  onFailure: err => `Error: ${err.message}`
})
```

### Unwrapping safely — `orElse`

Returns the data on success, or a fallback value on failure.

```ts
Result.success(10).orElse(0)  // 10
Result.failure(new Error()).orElse(0)  // 0
```

### Unwrapping unsafely — `orElseThrow`

Returns the data on success, or throws the error on failure.

```ts
Result.success('ok').orElseThrow() // 'ok'
Result.failure(new Error('boom')).orElseThrow() // throws Error: boom
```

### Transforming the error — `mapError`

```ts
const result = Result.failure<number, Error>(new Error('original'))
  .mapError(err => err.message)

// result now holds Result<number, string>
```

### Swapping success and failure — `swap`

Turns a success into a failure and vice versa.

```ts
const swapped = Result.failure<string, Error>(new Error('oops')).swap()

swapped.isSuccess() // true
swapped.orElseThrow() // Error: oops
```

## React example — data fetching with typed errors

```tsx
import { useState, useEffect } from 'react'
import { Result } from '@nomis/ts-result-monad'

type RawUser = { id: number; first_name: string; last_name: string; email: string }
type User = { id: number; name: string; email: string }

type ApiError =
  | { kind: 'network'; message: string }
  | { kind: 'not_found' }
  | { kind: 'unauthorized' }

async function fetchUser(id: number): Promise<Result<User, ApiError>> {
  const result = await Result.from<RawUser, unknown>(
    fetch(`/api/users/${id}`).then(async response => {
      if (response.status === 404) throw { kind: 'not_found' }
      if (response.status === 401) throw { kind: 'unauthorized' }
      if (!response.ok) throw { kind: 'network', message: response.statusText }
      return response.json()
    })
  )

  return result
    .map((raw): User => ({ id: raw.id, name: `${raw.first_name} ${raw.last_name}`, email: raw.email }))
    .mapError((err): ApiError => err as ApiError)
}

function UserProfile({ userId }: { userId: number }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)  const [error, setError] = useState<ApiError | null>(null)

  useEffect(() => {
    setLoading(true)
    setUser(null)
    setError(null)

    fetchUser(userId).then(result =>
      result.fold({
        onSuccess: data => setUser(data),
        onFailure: err => setError(err)
      })
    ).finally(() => setLoading(false))
  }, [userId])

  if (loading) return <p>Loading...</p>
  if (error) {
    if (error.kind === 'not_found') return <p>User not found.</p>
    if (error.kind === 'unauthorized') return <p>You are not authorized.</p>
    return <p>Network error: {error.message}</p>
  }

  return (
    <div>
      <h1>{user!.name}</h1>
      <p>{user!.email}</p>
    </div>
  )
}
```

`fold` in the `useEffect` dispatches to typed state — `error` is narrowed to `ApiError` in the render, so each `kind` branch has full type safety.

## API Reference

| Method | Description |
|---|---|
| `Result.success(data)` | Creates a successful result |
| `Result.failure(error)` | Creates a failure result |
| `Result.from(promise)` | Wraps a promise into a `Result` |
| `.isSuccess()` | Type guard — returns `true` if successful |
| `.isFailure()` | Type guard — returns `true` if failed |
| `.map(fn)` | Transforms the data on success |
| `.flatMap(fn)` | Chains another `Result`-returning function |
| `.fold({ onSuccess, onFailure })` | Handles both cases and returns a single value |
| `.orElse(defaultValue)` | Returns data or a fallback |
| `.orElseThrow()` | Returns data or throws the error |
| `.mapError(fn)` | Transforms the error on failure |
| `.swap()` | Swaps success and failure |

## License

ISC
