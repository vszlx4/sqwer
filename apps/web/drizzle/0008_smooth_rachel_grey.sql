ALTER TABLE "profiles" ADD COLUMN "show_on_leaderboard" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "wpm" real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "results" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "results_competitive_idx" ON "results" USING btree ("exam","verified","wpm");--> statement-breakpoint
-- Backfill speed and XP for existing results with the formula in lib/progress/xp.ts.
UPDATE "results" SET
	"wpm" = LEAST(COALESCE(("data"->>'wpm')::real, 0), 400),
	"xp" = CASE
		WHEN "data"->>'status' = 'completed' AND ("data"->>'seconds')::real >= 10 AND ("data"->>'accuracy')::real >= 50
		THEN LEAST(300, ROUND((LEAST(("data"->>'seconds')::real, 300) / 60) * (20 + LEAST(("data"->>'wpm')::real, 300) * 0.8) * POWER(("data"->>'accuracy')::real / 100, 2)))::integer
		ELSE 0
	END;
