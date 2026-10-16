CREATE TABLE "data_resets" (
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"cleared_at" timestamp with time zone NOT NULL,
	CONSTRAINT "data_resets_user_id_category_pk" PRIMARY KEY("user_id","category")
);
--> statement-breakpoint
ALTER TABLE "data_resets" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "data_resets" ADD CONSTRAINT "data_resets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;