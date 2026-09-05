const MAX_ACTIVE_BROWSERS = 2;
let activeBrowsers = 0;
const waiters: Array<() => void> = [];

export async function withBrowserSlot<T>(
  operation: () => Promise<T>
): Promise<T> {
  if (activeBrowsers >= MAX_ACTIVE_BROWSERS) {
    await new Promise<void>((resolve) => waiters.push(resolve));
  }
  activeBrowsers += 1;
  try {
    return await operation();
  } finally {
    activeBrowsers -= 1;
    waiters.shift()?.();
  }
}
