import { db } from "../src/db";
import { files } from "../src/db/schema";

async function clearDb() {
  console.log("Clearing files table...");
  await db.delete(files);
  console.log("Files table cleared.");
}

clearDb().catch(console.error);
