# ---- Stage 1: 依赖安装 ----
FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# 先复制依赖描述文件，利用 Docker 层缓存
COPY pyproject.toml uv.lock ./

# 安装依赖（不含 dev），严格按 lock 文件
RUN uv sync --frozen --no-dev --no-install-project

# ---- Stage 2: 运行镜像 ----
FROM python:3.13-slim

WORKDIR /app

# 从 builder 复制虚拟环境
COPY --from=builder /app/.venv /app/.venv

# 复制应用代码
COPY main.py ./
COPY app/ ./app/

# 创建 uploads 目录（运行时会被 volume 挂载）
RUN mkdir -p uploads

# 将虚拟环境加入 PATH
ENV PATH="/app/.venv/bin:$PATH"

# 非 root 用户运行
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
