# ---- Stage 1: 构建静态资源 ----
FROM oven/bun:1 AS builder

WORKDIR /app

# 先复制依赖描述文件，利用层缓存
COPY simple-ats-rating-ui/package.json simple-ats-rating-ui/bun.lock ./

# 安装全量依赖（构建阶段需要 devDependencies 中的 tailwindcss）
RUN bun install --frozen-lockfile

# 复制完整源码（含 styles/ — src/index.css 通过 @import "../styles/globals.css" 引用）
COPY simple-ats-rating-ui/build.ts ./
COPY simple-ats-rating-ui/tsconfig.json ./
COPY simple-ats-rating-ui/src ./src
COPY simple-ats-rating-ui/styles ./styles
COPY simple-ats-rating-ui/bunfig.toml ./

# 构建浏览器端静态资源到 dist/
RUN bun run build

# ---- Stage 2: 运行（仅静态文件 + 反代，无需 node_modules）----
FROM oven/bun:1-slim

WORKDIR /app

# 从 builder 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制生产服务器入口及代理工具（不依赖任何 npm 包，仅 Bun 内置 API）
COPY simple-ats-rating-ui/src/server-prod.ts ./src/server-prod.ts
COPY simple-ats-rating-ui/src/server ./src/server

ENV NODE_ENV=production

EXPOSE 3000

# API_PROXY_TARGET 由 docker-compose 环境变量注入
CMD ["bun", "src/server-prod.ts"]
