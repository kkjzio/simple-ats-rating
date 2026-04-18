/**
 * 生产环境服务器
 * 直接服务 dist/ 目录下预构建的静态文件，规避 Bun fullstack bundler 在 NODE_ENV=production
 * 下的 React CJS 模块初始化顺序问题。
 */
import { serve } from "bun";
import { getApiProxyTarget, proxyApiRequest } from "./server/proxy";

const apiProxyTarget = getApiProxyTarget();
const DIST_DIR = "./dist";

const server = serve({
  port: 3000,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // API 反代
    if (url.pathname.startsWith("/api/")) {
      return proxyApiRequest(req, apiProxyTarget);
    }

    // 尝试直接返回静态文件
    const filePath =
      url.pathname === "/" ? `${DIST_DIR}/index.html` : `${DIST_DIR}${url.pathname}`;
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // SPA fallback：所有未匹配路由返回 index.html 交给前端路由处理
    return new Response(Bun.file(`${DIST_DIR}/index.html`));
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`🔁 Proxy /api/* -> ${apiProxyTarget}`);
