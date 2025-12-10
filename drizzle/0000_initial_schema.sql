CREATE TABLE "accounts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" bigint,
	"id_token" text,
	"scope" text,
	"session_state" text,
	"token_type" text
);
--> statement-breakpoint
CREATE TABLE "Authenticator" (
	"credentialID" text NOT NULL,
	"userId" integer NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "Authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID")
);
--> statement-breakpoint
CREATE TABLE "language_requests" (
	"locale" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"website_url" text,
	"founded_by" uuid NOT NULL,
	"leader_username" varchar(30) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"dissolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"sessionToken" varchar(255) NOT NULL,
	CONSTRAINT "sessions_sessionToken_unique" UNIQUE("sessionToken")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" uuid NOT NULL,
	"type" varchar(30) NOT NULL,
	"amount" numeric(36, 18) NOT NULL,
	"wallet_address" text,
	"selected_chain" varchar(10),
	"recipient_user_id" uuid,
	"transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"auth_user_id" integer NOT NULL,
	"wallet_balance" numeric(36, 18) DEFAULT '0' NOT NULL,
	"self_verified_at" timestamp,
	"self_nullifier" text,
	"username" varchar(30) NOT NULL,
	"account_deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"emailVerified" timestamp with time zone,
	"image" text,
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "parties" ADD CONSTRAINT "parties_founded_by_users_uuid_fk" FOREIGN KEY ("founded_by") REFERENCES "public"."users"("uuid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_uuid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_id_users_uuid_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("uuid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_auth_user_id_users_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_provider_providerAccountId_idx" ON "accounts" USING btree ("provider","providerAccountId");--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator" USING btree ("credentialID");--> statement-breakpoint
CREATE INDEX "parties_active_created_idx" ON "parties" USING btree ("dissolved_at","created_at");--> statement-breakpoint
CREATE INDEX "parties_founded_by_idx" ON "parties" USING btree ("founded_by");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "transactions_user_created_idx" ON "transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_recipient_created_idx" ON "transactions" USING btree ("recipient_user_id","created_at");--> statement-breakpoint
CREATE INDEX "transactions_type_created_idx" ON "transactions" USING btree ("type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_self_nullifier_idx" ON "user_profiles" USING btree ("self_nullifier");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_username_idx" ON "user_profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX "user_profiles_account_deleted_at_idx" ON "user_profiles" USING btree ("account_deleted_at");--> statement-breakpoint
CREATE INDEX "user_profiles_created_at_idx" ON "user_profiles" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_profiles_active_verified_idx" ON "user_profiles" USING btree ("account_deleted_at","self_verified_at");