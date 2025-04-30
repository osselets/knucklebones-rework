ALTER TABLE "data" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "data" CASCADE;--> statement-breakpoint
ALTER TABLE "kb_game_player" ALTER COLUMN "board" SET DEFAULT '[[],[],[]]';--> statement-breakpoint
ALTER TABLE "kb_game_player" ALTER COLUMN "rematch" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "kb_game_player" ALTER COLUMN "rematch" SET NOT NULL;