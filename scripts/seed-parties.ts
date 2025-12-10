#!/usr/bin/env tsx
/**
 * Seed parties script - populates the database with sample global political parties
 *
 * Usage: pnpm tsx scripts/seed-parties.ts
 *
 * This will create seed users and parties if they don't exist.
 */

import { config } from "dotenv";
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

// Sample global political parties - these are example parties for demonstration purposes
const PARTIES = [
  {
    name: "Sample: Global Democratic Alliance",
    description:
      "[SAMPLE PARTY] A coalition dedicated to promoting democratic values, human rights, and transparent governance worldwide. We believe in the power of collective action to address global challenges. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: United Progressive Front",
    description:
      "[SAMPLE PARTY] Advocating for progressive policies, social justice, and sustainable development. We work towards creating inclusive societies where everyone has equal opportunities. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Centrist Coalition",
    description:
      "[SAMPLE PARTY] A moderate political movement focused on pragmatic solutions, economic stability, and balanced governance. We seek common ground and practical approaches to complex issues. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Green Future Party",
    description:
      "[SAMPLE PARTY] Committed to environmental protection, climate action, and sustainable living. We believe in building a green economy that works for both people and the planet. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Digital Rights Movement",
    description:
      "[SAMPLE PARTY] Fighting for digital freedom, privacy rights, and open access to information. We advocate for technology that empowers citizens and protects their digital sovereignty. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Economic Justice League",
    description:
      "[SAMPLE PARTY] Working to reduce inequality, ensure fair wages, and create economic opportunities for all. We believe in an economy that serves the many, not just the few. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Cultural Unity Party",
    description:
      "[SAMPLE PARTY] Promoting cultural diversity, intercultural dialogue, and mutual understanding. We celebrate differences while building bridges between communities worldwide. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Innovation & Progress Alliance",
    description:
      "[SAMPLE PARTY] Focused on technological advancement, scientific research, and innovation-driven growth. We support policies that foster creativity and forward-thinking solutions. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Peace & Cooperation Network",
    description:
      "[SAMPLE PARTY] Dedicated to conflict resolution, international cooperation, and building lasting peace. We believe dialogue and diplomacy are the foundations of a better world. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
  {
    name: "Sample: Workers Solidarity Union",
    description:
      "[SAMPLE PARTY] Standing with workers' rights, fair labor practices, and social protection. We fight for dignity, security, and justice in the workplace and beyond. This is an example party for demonstration purposes.",
    websiteUrl: "https://example.org",
  },
];

async function seedParties() {
  const sql = postgres(connectionString as string, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    console.log("🌱 Starting party seeding...");

    // Check if parties already exist
    const existingParties = await sql`
      SELECT COUNT(*) as count FROM parties WHERE dissolved_at IS NULL;
    `;

    if (existingParties[0].count > 0) {
      console.log(
        `⚠️  Found ${existingParties[0].count} existing active parties.`,
      );
      console.log("   Use --force flag to re-seed (not implemented yet).");
      console.log("   Exiting to preserve existing data.");
      return;
    }

    // Get or create seed users with profiles
    console.log("👥 Setting up seed users and profiles...");

    // Check for existing users with profiles
    const existingUsers = await sql`
      SELECT u.uuid, up.username
      FROM users u
      INNER JOIN user_profiles up ON u.uuid = up.id
      ORDER BY u.id
      LIMIT ${PARTIES.length};
    `;

    let userData: Array<{ uuid: string; username: string }> = [];

    if (existingUsers.length >= PARTIES.length) {
      // Use existing users
      console.log(
        `   ✓ Found ${existingUsers.length} existing users with profiles`,
      );
      userData = existingUsers.map((u) => ({
        uuid: u.uuid,
        username: u.username,
      }));
    } else {
      // Create seed users with profiles
      const usersToCreate = PARTIES.length - existingUsers.length;
      console.log(`   Creating ${usersToCreate} seed users with profiles...`);

      const seedUserNames = [
        "Alex Chen",
        "Maria Rodriguez",
        "James Wilson",
        "Sarah Johnson",
        "David Kim",
        "Emma Thompson",
        "Michael Brown",
        "Lisa Anderson",
        "Robert Taylor",
        "Jennifer Martinez",
      ];

      for (let i = 0; i < usersToCreate; i++) {
        const name = seedUserNames[i] || `Seed User ${i + 1}`;
        const email = `seed-user-${i + 1}@example.com`;
        const username = `seed_citizen_${i + 1}`;

        // Create user
        const [newUser] = await sql`
          INSERT INTO users (name, email, uuid)
          VALUES (${name}, ${email}, gen_random_uuid())
          RETURNING uuid, id;
        `;

        // Create user profile with username
        await sql`
          INSERT INTO user_profiles (id, auth_user_id, username, wallet_balance)
          VALUES (${newUser.uuid}, ${newUser.id}, ${username}, 0)
        `;

        userData.push({ uuid: newUser.uuid, username });
        console.log(`   ✓ Created user: ${name} (@${username})`);
      }

      // Add existing users to the list
      userData = [
        ...existingUsers.map((u) => ({ uuid: u.uuid, username: u.username })),
        ...userData,
      ];
    }

    // Create parties
    console.log(`\n🏛️  Creating ${PARTIES.length} parties...`);

    const createdParties = [];

    for (let i = 0; i < PARTIES.length; i++) {
      const party = PARTIES[i];
      const founder = userData[i];
      const now = new Date();

      try {
        const [newParty] = await sql`
          INSERT INTO parties (
            name,
            description,
            website_url,
            founded_by,
            leader_username,
            created_at,
            updated_at,
            dissolved_at
          )
          VALUES (
            ${party.name},
            ${party.description || null},
            ${party.websiteUrl || null},
            ${founder.uuid},
            ${founder.username},
            ${now},
            ${now},
            NULL
          )
          RETURNING id, name;
        `;

        createdParties.push(newParty);
        console.log(
          `   ✓ Created: ${newParty.name} (founded by @${founder.username})`,
        );
      } catch (error) {
        console.error(`   ✗ Failed to create: ${party.name}`);
        console.error(
          "   Error:",
          error instanceof Error ? error.message : error,
        );
      }
    }

    console.log("\n✅ Party seeding complete!");
    console.log(`\n📊 Summary:`);
    console.log(`   - Created ${createdParties.length} parties`);

    // Show final party list
    const finalParties = await sql`
      SELECT name, leader_username
      FROM parties
      WHERE dissolved_at IS NULL
      ORDER BY created_at DESC;
    `;

    console.log(`\n🏛️  Active parties:`);
    for (const party of finalParties) {
      console.log(`   • ${party.name} (leader: @${party.leader_username})`);
    }
  } catch (error) {
    console.error("❌ Error seeding parties:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seedParties();
