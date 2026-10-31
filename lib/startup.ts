/** An unavailable service must lead to recovery instead of an endless launch spinner. */
export async function withStartupDeadline<T>(
  task: PromiseLike<T>,
  milliseconds = 12000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(task),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Startup service timed out')), milliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Optional startup integrations must not produce unhandled rejections. */
export async function runOptionalStartup(
  task: () => unknown | PromiseLike<unknown>,
  onFailure: () => void,
): Promise<void> {
  try {
    await task();
  } catch {
    onFailure();
  }
}
