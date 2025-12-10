import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { userProfiles, users } from "@/lib/db/schema";

function createVerifier(origin: string) {
  const scope = "world-republic";
  const endpoint = `${origin}/api/self/verify`;
  const mockPassport = false;
  const allowedIds = AllIds;
  const configStore = new DefaultConfigStore({
    ofac: true,
    excludedCountries: [],
  });
  const userIdentifierType = "uuid" as const;
  return new SelfBackendVerifier(
    scope,
    endpoint,
    mockPassport,
    allowedIds,
    configStore,
    userIdentifierType,
  );
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const verifier = createVerifier(origin);

    const { attestationId, proof, publicSignals, userContextData } =
      await req.json();

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason:
            "Proof, publicSignals, attestationId and userContextData are required",
        },
        { status: 200 },
      );
    }

    const result = await verifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData,
    );

    const { isValid } = result.isValidDetails;
    if (!isValid) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Verification failed",
          details: result.isValidDetails,
        },
        { status: 200 },
      );
    }

    const nullifier = result.discloseOutput?.nullifier;
    const userUUID = result.userData?.userIdentifier;

    if (!nullifier || !userUUID) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Missing nullifier or user identifier",
        },
        { status: 200 },
      );
    }

    // Look up user from UUID in users table
    const [user] = await db
      .select({ id: users.id, uuid: users.uuid })
      .from(users)
      .where(eq(users.uuid, userUUID))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "User not found for UUID",
        },
        { status: 200 },
      );
    }

    // Check if nullifier is already bound to a different UUID in PostgreSQL
    const [existingProfile] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.selfNullifier, nullifier),
          sql`${userProfiles.id} != ${userUUID}`,
        ),
      )
      .limit(1);

    if (existingProfile) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Self ID already linked to another account",
        },
        { status: 200 },
      );
    }

    const now = new Date();

    // Update user profile in PostgreSQL with nullifier
    await db
      .update(userProfiles)
      .set({
        selfVerifiedAt: now,
        selfNullifier: nullifier,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, userUUID));

    return NextResponse.json(
      {
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}
