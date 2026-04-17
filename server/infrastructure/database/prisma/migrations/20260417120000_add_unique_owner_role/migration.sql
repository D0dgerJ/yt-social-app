CREATE UNIQUE INDEX IF NOT EXISTS unique_owner_role
ON "User" ("role")
WHERE "role" = 'OWNER';