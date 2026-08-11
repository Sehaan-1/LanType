import { db } from "../src/db";
import { serverConfig } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function setupTestDb() {
  console.log("Setting PIN to 1234 for testing...");
  const existing = await db
    .select()
    .from(serverConfig)
    .where(eq(serverConfig.id, 1))
    .limit(1);

  if (existing[0]) {
    await db
      .update(serverConfig)
      .set({ pin: "1234" })
      .where(eq(serverConfig.id, 1));
  } else {
    await db.insert(serverConfig).values({ id: 1, pin: "1234" });
  }
  console.log("PIN set successfully.");
}

setupTestDb().catch(console.error);
