# Local run (IMPORTANT)

## Backend
cd apps/lex-back
cp .env.example .env
npm ci
npm run start:dev

## Frontend
cd apps/lexar-chat
cp .env.example .env
npm ci
npm run dev

## Admin
cd apps/lex-admin
cp .env.example .env
npm ci
npm run dev

⚠️ NEVER run anything from lexar-platform root
