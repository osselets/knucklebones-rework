CREATE TABLE "data" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL
);
