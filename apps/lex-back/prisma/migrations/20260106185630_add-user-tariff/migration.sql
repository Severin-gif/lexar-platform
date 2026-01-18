-- Add tariff field to User
ALTER TABLE "User" ADD COLUMN "tariff" TEXT NOT NULL DEFAULT 'FREE';
