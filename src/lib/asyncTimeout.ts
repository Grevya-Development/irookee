// PromiseLike, not Promise: Supabase query builders are thenables that only
// become real promises when awaited, and they are this helper's main input.
export const withTimeout = async <T>(
  promise: PromiseLike<T>,
  timeoutMs: number,
  message = 'Request timed out'
) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
      }),
    ])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
