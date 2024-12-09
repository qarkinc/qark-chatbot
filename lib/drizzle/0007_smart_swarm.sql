DROP INDEX IF EXISTS "keyname_index";--> statement-breakpoint
ALTER TABLE "Accounts" ALTER COLUMN "app_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Accounts" ALTER COLUMN "provider" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "Accounts" ALTER COLUMN "provider" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Contacts" ALTER COLUMN "app_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Contacts" ALTER COLUMN "provider" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "Contacts" ALTER COLUMN "provider" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Tokens" ALTER COLUMN "app_user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Tokens" ALTER COLUMN "provider" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "Tokens" ALTER COLUMN "provider" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "Tokens" ALTER COLUMN "token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "Tokens" ALTER COLUMN "keyname" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "keyname_index" ON "Tokens" USING btree ("user_id","app_user_id","provider","keyname");