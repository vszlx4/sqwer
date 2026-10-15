ALTER TABLE "profiles" ADD COLUMN "headline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "pronouns" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "banner" text DEFAULT 'lime' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_rank" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_stats" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "show_streak" boolean DEFAULT true NOT NULL;