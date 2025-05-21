import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

teardown("cleanup database", async () => {
  if (!process.env.E2E_USERNAME_ID) {
    throw new Error("E2E_USERNAME_ID environment variable is required for database cleanup");
  }

  // eslint-disable-next-line no-console
  console.log("Cleaning up test database...");

  const supabase = createClient<Database>(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_KEY ?? "", // This should be the anon/public key
    {
      auth: {
        persistSession: false,
      },
    }
  );

  const testUserId = process.env.E2E_USERNAME_ID;
  // eslint-disable-next-line no-console
  console.log(`Cleaning up data for test user: ${testUserId}`);

  try {
    // Delete all records from tables in reverse order of dependencies
    const { error: flashcardsError } = await supabase.from("flashcards").delete().eq("user_id", testUserId);

    if (flashcardsError) throw flashcardsError;

    const { error: generationsError } = await supabase.from("generations").delete().eq("user_id", testUserId);

    if (generationsError) throw generationsError;

    const { error: errorLogsError } = await supabase.from("generation_error_logs").delete().eq("user_id", testUserId);

    if (errorLogsError) throw errorLogsError;

    // eslint-disable-next-line no-console
    console.log("Database cleanup completed successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error during database cleanup:", error);
    throw error;
  }
});
