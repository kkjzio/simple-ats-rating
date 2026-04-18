FROM oven/bun:1

WORKDIR /app

# 复制依赖描述文件，利用层缓存
COPY simple-ats-rating-ui/package.json simple-ats-rating-ui/bun.lock ./

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl && rm -rf /var/lib/apt/lists/*

# 安装全量依赖（Bun fullstack 运行时需要 tailwindcss 等 devDependencies）
RUN bun install --frozen-lockfile

# 复制完整前端源码
COPY simple-ats-rating-ui/src ./src
COPY simple-ats-rating-ui/bunfig.toml ./

ENV NODE_ENV=production

EXPOSE 3000

# API_PROXY_TARGET 由 docker-compose 环境变量注入
CMD ["bun", "src/index.ts"]
