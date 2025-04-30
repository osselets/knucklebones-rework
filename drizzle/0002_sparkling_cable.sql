-- CREATE TYPE "public"."bo_type" AS ENUM('free_play', '1', '3', '5');--> statement-breakpoint
-- CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
-- CREATE TYPE "public"."game_status" AS ENUM('waiting', 'playing', 'finished');--> statement-breakpoint
CREATE TABLE "kb_game" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bo_type" "bo_type" NOT NULL,
	"status" "game_status" DEFAULT 'waiting' NOT NULL,
	"previous_game" uuid,
	"difficulty" "difficulty",
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kb_game_player" (
	"user_id" text NOT NULL,
	"game_id" uuid NOT NULL,
	"board" text DEFAULT '' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"rematch" boolean,
	"dice_to_play" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "kb_game_player_user_id_game_id_pk" PRIMARY KEY("user_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "kb_game" ADD CONSTRAINT "kb_game_previous_game_kb_game_id_fk" FOREIGN KEY ("previous_game") REFERENCES "public"."kb_game"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_game_player" ADD CONSTRAINT "kb_game_player_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_game_player" ADD CONSTRAINT "kb_game_player_game_id_kb_game_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."kb_game"("id") ON DELETE cascade ON UPDATE no action;
