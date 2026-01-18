-- Add plan field to User
ALTER TABLE "User" ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free';

-- Backfill plan values from existing tariff when possible
UPDATE "User"
SET "plan" = CASE
  WHEN "tariff" IS NULL THEN 'free'
  ELSE lower("tariff")
END;

-- Seed VIP plan for test admin user if present
UPDATE "User"
SET "plan" = 'vip'
WHERE "email" = 'lex@mail.ru';
