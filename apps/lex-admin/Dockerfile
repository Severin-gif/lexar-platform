FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# ВАЖНО: ставим dev зависимости тоже (Tailwind нужен на build-этапе)
RUN npm ci --include=dev

COPY . .

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
