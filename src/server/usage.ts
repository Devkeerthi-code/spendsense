import type { UsageEventType } from "@/generated/prisma/client";
import { db } from "./db";

/** Fire-and-forget counter. Tracking must never break the action being tracked. */
export async function track(type: UsageEventType, userId: string | null): Promise<void> {
  try {
    await db.usageEvent.create({ data: { type, userId } });
  } catch (err) {
    console.error("usage tracking failed", err);
  }
}

export async function countSince(type: UsageEventType, userId: string, since: Date): Promise<number> {
  return db.usageEvent.count({ where: { type, userId, createdAt: { gte: since } } });
}
