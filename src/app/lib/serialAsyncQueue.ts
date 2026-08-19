/**
 * Runs async tasks one at a time, in enqueue order.
 * A failed task does not prevent later tasks from running.
 */
export function createSerialAsyncQueue(): <T>(
  task: () => Promise<T>
) => Promise<T> {
  let tail: Promise<unknown> = Promise.resolve();

  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = tail.then(
      () => task(),
      () => task()
    );
    tail = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };
}
