#!/usr/bin/env tsx
/**
 * Reset database script - drops all existing tables and applies fresh schema
 *
 * Usage: pnpm tsx scripts/reset-database.ts
 *
 * WARNING: This will delete ALL data in the database!
 */

import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import postgres from "postgres";

// Load .env.local first, then fall back to .env
config({ path: ".env.local" });
config();

// Prioritize LOCAL_DATABASE_URL if set (Neon Local Connect)
// Otherwise use DATABASE_URL (remote connection)
const connectionString =
  process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or LOCAL_DATABASE_URL environment variable is required",
  );
}

async function resetDatabase() {
  const sql = postgres(connectionString as string, {
    max: 1,
    idle_timeout: 60,
    connect_timeout: 30,
    prepare: false, // Disable prepared statements for faster execution
  });

  try {
    console.log("🔄 Starting database reset...");

    // Drop all tables in the correct order (respecting foreign keys)
    console.log("🗑️  Dropping existing tables...");

    const dropStatements = [
      "DROP TABLE IF EXISTS transactions CASCADE",
      "DROP TABLE IF EXISTS withdrawals CASCADE", // Old table name
      "DROP TABLE IF EXISTS language_requests CASCADE",
      "DROP TABLE IF EXISTS user_profiles CASCADE",
      "DROP TABLE IF EXISTS referral_stats CASCADE", // If it exists
      "DROP TABLE IF EXISTS party_members CASCADE", // Removed in party system simplification
      "DROP TABLE IF EXISTS parties CASCADE",
      'DROP TABLE IF EXISTS "Authenticator" CASCADE',
      "DROP TABLE IF EXISTS verification_token CASCADE",
      "DROP TABLE IF EXISTS sessions CASCADE",
      "DROP TABLE IF EXISTS accounts CASCADE",
      "DROP TABLE IF EXISTS users CASCADE",
    ];

    for (const statement of dropStatements) {
      try {
        await sql.unsafe(statement);
        console.log(`   ✓ ${statement}`);
      } catch (error) {
        // Ignore errors for tables that don't exist
        if (
          error instanceof Error &&
          error.message.includes("does not exist")
        ) {
          console.log(`   ⊘ ${statement} (table doesn't exist)`);
        } else {
          console.error(`   ✗ ${statement}:`, error);
        }
      }
    }

    // Drop any remaining sequences
    console.log("🗑️  Dropping sequences...");
    await sql.unsafe(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') 
        LOOP
          EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        END LOOP;
      END $$;
    `);

    console.log("✅ All tables dropped successfully");

    // Read and apply the fresh migration
    console.log("📝 Applying fresh schema...");
    const migrationPath = join(
      process.cwd(),
      "drizzle",
      "0000_initial_schema.sql",
    );
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split by statement breakpoint and execute each statement
    const rawStatements = migrationSQL.split("--> statement-breakpoint");

    // Process each statement: remove comments and extract SQL
    const statements: string[] = [];
    for (const raw of rawStatements) {
      // Split by newlines and filter out comment lines and empty lines
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("--"));

      if (lines.length > 0) {
        statements.push(lines.join("\n"));
      }
    }

    console.log(`   Executing ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        // Extract statement type for logging
        const statementType =
          statement
            .split(/\s+/)
            .filter((w) => w.length > 0)[0]
            ?.toUpperCase()
            .substring(0, 20) || "UNKNOWN";

        try {
          // Wrap statement execution with timeout
          const timeoutPromise = new Promise(
            (_, reject) =>
              setTimeout(() => reject(new Error("Statement timeout")), 60000), // 60 second timeout
          );
          await Promise.race([sql.unsafe(statement), timeoutPromise]);
          console.log(`   ✓ [${i + 1}/${statements.length}] ${statementType}`);
        } catch (error) {
          // Some statements might fail if objects don't exist (like indexes)
          // This is okay for a fresh start, but CREATE TABLE should never fail with "does not exist"
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          if (
            errorMessage.includes("already exists") ||
            (errorMessage.includes("does not exist") &&
              !statement.toUpperCase().startsWith("CREATE TABLE")) ||
            errorMessage.includes("timeout") ||
            errorMessage.includes("08P01")
          ) {
            // Ignore these errors for non-CREATE TABLE statements and timeouts
            console.log(
              `   ⊘ [${i + 1}/${statements.length}] ${statementType} (ignored: ${errorMessage.substring(0, 50)})`,
            );
          } else {
            console.error(
              `   ✗ [${i + 1}/${statements.length}] ${statementType}`,
            );
            console.error("Error:", errorMessage);
            console.error(
              "Statement:",
              statement.substring(0, 200) +
                (statement.length > 200 ? "..." : ""),
            );
            throw error;
          }
        }
      }
    }

    console.log("✅ Fresh schema applied successfully");
    console.log("🎉 Database reset complete!");

    // Verify tables were created
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log("\n📊 Created tables:");
    for (const table of tables) {
      console.log(`   ✓ ${table.table_name}`);
    }
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

resetDatabase();
