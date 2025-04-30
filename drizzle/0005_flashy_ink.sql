ALTER TABLE "kb_game" RENAME COLUMN "previous_game" TO "previous_game_id";--> statement-breakpoint
ALTER TABLE "kb_game" DROP CONSTRAINT "kb_game_previous_game_kb_game_id_fk";
--> statement-breakpoint
ALTER TABLE "kb_game" ADD CONSTRAINT "kb_game_previous_game_id_kb_game_id_fk" FOREIGN KEY ("previous_game_id") REFERENCES "public"."kb_game"("id") ON DELETE no action ON UPDATE no action;