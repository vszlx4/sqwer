CREATE TABLE "analytics_daily" (
	"day" date NOT NULL,
	"metric" text NOT NULL,
	"value" integer NOT NULL,
	CONSTRAINT "analytics_daily_day_metric_pk" PRIMARY KEY("day","metric")
);
--> statement-breakpoint
ALTER TABLE "analytics_daily" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" text PRIMARY KEY NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"name" text NOT NULL,
	"path" text,
	"route" text,
	"referrer_host" text,
	"channel" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"visitor_id" text,
	"session_id" text,
	"user_id" text,
	"authenticated" boolean DEFAULT false NOT NULL,
	"device" text,
	"browser" text,
	"os" text,
	"duration_ms" integer,
	"props" jsonb
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_time_idx" ON "analytics_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_name_time_idx" ON "analytics_events" USING btree ("name","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_route_time_idx" ON "analytics_events" USING btree ("route","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_session_idx" ON "analytics_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analytics_user_idx" ON "analytics_events" USING btree ("user_id");