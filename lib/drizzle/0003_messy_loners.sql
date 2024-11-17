CREATE TABLE IF NOT EXISTS "Citation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"messageId" uuid NOT NULL,
	"appMessageId" varchar NOT NULL,
	"subject" varchar NOT NULL,
	"createdAt" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "registererdOn" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "isGmailConnected" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "gmailToken" json;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "gmailConnectedOn" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "gmailTokenExpiry" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Citation" ADD CONSTRAINT "Citation_messageId_Message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
