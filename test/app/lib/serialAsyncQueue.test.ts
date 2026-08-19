import { createSerialAsyncQueue } from "@/app/lib/serialAsyncQueue";
import { describe, expect, it } from "vitest";

describe("createSerialAsyncQueue", () => {
  it("runs tasks in enqueue order", async () => {
    const enqueue = createSerialAsyncQueue();
    const order: string[] = [];

    const first = enqueue(async () => {
      order.push("first-start");
      await Promise.resolve();
      order.push("first-end");
      return 1;
    });
    const second = enqueue(async () => {
      order.push("second-start");
      return 2;
    });

    await expect(Promise.all([first, second])).resolves.toEqual([1, 2]);
    expect(order).toEqual(["first-start", "first-end", "second-start"]);
  });

  it("runs the next task after a previous failure", async () => {
    const enqueue = createSerialAsyncQueue();
    const order: string[] = [];

    const first = enqueue(async () => {
      order.push("first");
      throw new Error("boom");
    });
    const second = enqueue(async () => {
      order.push("second");
      return "ok";
    });

    await expect(first).rejects.toThrow("boom");
    await expect(second).resolves.toBe("ok");
    expect(order).toEqual(["first", "second"]);
  });
});
