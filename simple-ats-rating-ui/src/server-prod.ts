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

    // 静态资源（js/css/图片等）找不到时直接 404，不做 SPA fallback
    // 防止浏览器拿到 text/html 当 JS 模块执行而报错
    if (/\.[^/]+$/.test(url.pathname)) {
      return new Response('Not Found', { status: 404 });
    }

    // SPA fallback：未匹配的页面路由返回 index.html 交给前端路由处理
    return new Response(Bun.file(`${DIST_DIR}/index.html`));
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`🔁 Proxy /api/* -> ${apiProxyTarget}`);
