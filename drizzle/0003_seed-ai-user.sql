-- Register the first AI user to be used during games against AI, and derive players from it.
INSERT INTO "user" (id, name, email, email_verified, image, created_at, updated_at, is_anonymous) VALUES ('ai-1', 'AI', 'ai-1@knucklebones.io', FALSE, NULL, now(), now(), TRUE);
-- Later, when more than 2 players can be in a game, we can add more AI users.
-- idk if id should be obfuscated
