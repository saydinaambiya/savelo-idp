/**
 * Ensures a function execution takes at least a constant minimum amount of time.
 * Mitigates timing attacks / user enumeration on authentication endpoints.
 */
export async function withConstantLatency<T>(
  fn: () => Promise<T>,
  targetMs = 400
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const elapsed = Date.now() - start;
    const remaining = targetMs - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }
}
