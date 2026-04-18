# ---- Stage 1: 构建静态资源 ----
FROM oven/bun:1 AS builder

WORKDIR /app

# 先复制依赖描述文件，利用层缓存
COPY simple-ats-rating-ui/package.json simple-ats-rating-ui/bun.lock ./

# 安装全量依赖（构建阶段需要 devDependencies 中的 tailwindcss）
RUN bun install --frozen-lockfile

# 复制前端源码
COPY simple-ats-rating-ui/ ./

# 构建浏览器端静态资源到 dist/
RUN bun run build

# ---- Stage 2: 运行 ----
FROM oven/bun:1-slim

WORKDIR /app

# 复制依赖描述文件并安装生产依赖
COPY simple-ats-rating-ui/package.json simple-ats-rating-ui/bun.lock ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl

RUN bun install --frozen-lockfile --production

# 从 builder 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制服务端运行所需的源码（index.ts + server/proxy.ts + index.html）
COPY simple-ats-rating-ui/src/index.ts ./src/index.ts
COPY simple-ats-rating-ui/src/index.html ./src/index.html
COPY simple-ats-rating-ui/src/server ./src/server
COPY simple-ats-rating-ui/bunfig.toml ./

ENV NODE_ENV=production

EXPOSE 3000

# API_PROXY_TARGET 由 docker-compose 环境变量注入
CMD ["bun", "src/index.ts"]
