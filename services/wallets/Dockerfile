FROM oven/bun:1-alpine

RUN apk add --no-cache curl

WORKDIR /app

# Copy monorepo workspace root so bun can resolve workspace:* packages
COPY package.json bun.lock* ./
COPY packages/ ./packages/

# Copy service source
COPY services/wallets/ ./services/wallets/

WORKDIR /app/services/wallets

RUN bun install
RUN bunx prisma generate

EXPOSE 4002

CMD ["sh", "-c", "bunx prisma db push && bunx prisma db seed && bun run src/main.ts"]
