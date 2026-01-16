#!/bin/sh
set -e

echo "== ENV CHECK =="
echo "PORT=$PORT"
echo "DATABASE_URL=$DATABASE_URL"

echo "== PRISMA DB PUSH =="
npx prisma db push

echo "== START APP =="
node dist/main.js
