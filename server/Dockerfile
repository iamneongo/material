FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY tsconfig.json ./
COPY src ./src

EXPOSE 4000

CMD ["pnpm", "start"]
