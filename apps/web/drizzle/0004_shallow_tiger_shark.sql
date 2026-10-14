CREATE TABLE "course_days" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	CONSTRAINT "course_days_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "course_progress" (
	"user_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"stars" integer DEFAULT 0 NOT NULL,
	"best_accuracy" integer DEFAULT 0 NOT NULL,
	"best_wpm" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_progress_user_id_lesson_id_pk" PRIMARY KEY("user_id","lesson_id")
);
--> statement-breakpoint
CREATE TABLE "course_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"level" text,
	"start_lesson" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_days" ADD CONSTRAINT "course_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_progress" ADD CONSTRAINT "course_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_state" ADD CONSTRAINT "course_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;