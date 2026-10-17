CREATE TABLE "used_tokens" (
	"key" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "used_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "used_tokens_expiry_idx" ON "used_tokens" USING btree ("expires_at");