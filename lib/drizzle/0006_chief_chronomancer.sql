CREATE TABLE IF NOT EXISTS "Accounts" (
	"user_id" uuid NOT NULL,
	"app_user_id" varchar,
	"provider" integer,
	"app_user_phone_number" varchar,
	"account_linking_status" integer,
	"created_on" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_id_pk" PRIMARY KEY("user_id","app_user_id","provider")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Contacts" (
	"user_id" uuid NOT NULL,
	"app_user_id" varchar,
	"provider" integer,
	"contact_jid" varchar,
	"contact_name" varchar,
	"contact_phone_no" varchar,
	"other_contact_info" json,
	"created_on" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Tokens" (
	"user_id" uuid NOT NULL,
	"app_user_id" varchar,
	"provider" integer,
	"token" json NOT NULL,
	"keyname" varchar NOT NULL,
	"created_on" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Accounts" ADD CONSTRAINT "Accounts_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Contacts" ADD CONSTRAINT "Contacts_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Tokens" ADD CONSTRAINT "Tokens_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Tokens" ADD CONSTRAINT "account_id_fk" FOREIGN KEY ("user_id","app_user_id","provider") REFERENCES "public"."Accounts"("user_id","app_user_id","provider") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "Accounts" USING btree ("user_id","app_user_id","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_phone_index" ON "Accounts" USING btree ("user_id","app_user_phone_number","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_contact_index" ON "Contacts" USING btree ("user_id","app_user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contact_index" ON "Contacts" USING btree ("user_id","app_user_id","provider","contact_jid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "keyname_index" ON "Tokens" USING btree ("user_id","app_user_id","provider","keyname");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "account_id_index" ON "Tokens" USING btree ("user_id","app_user_id","provider");