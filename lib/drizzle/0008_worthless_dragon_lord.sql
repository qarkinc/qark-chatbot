DROP INDEX IF EXISTS "account_id_index";--> statement-breakpoint
ALTER TABLE "Tokens" ALTER COLUMN "token" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "Tokens" ADD CONSTRAINT "token_table_pk" PRIMARY KEY("user_id","app_user_id","provider","keyname");