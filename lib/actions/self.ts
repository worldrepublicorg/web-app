"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";

export async function getSelfUserUuid(userId: number) {
  try {
    if (!userId) {
      return { error: "User ID is required" };
    }

    const authUserId = parseInt(String(userId), 10);

    // Get UUID from users table
    const [user] = await db
      .select({ uuid: users.uuid })
      .from(users)
      .where(eq(users.id, authUserId))
      .limit(1);

    if (!user || !user.uuid) {
      return { error: "User UUID not found" };
    }

    return { success: true, uuid: user.uuid };
  } catch (error) {
    console.error("Error getting Self user UUID:", error);
    return { error: "Failed to get user UUID" };
  }
}
