import { db } from "./src/db";
import { serverConfig } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding PIN...");
  const pin = "1234";

  // Upsert the PIN
  await db.insert(serverConfig)
    .values({ id: 1, pin })
    .onConflictDoUpdate({
      target: serverConfig.id,
      set: { pin },
    });

  console.log(`PIN set to ${pin}`);
}

seed().catch(console.error);
