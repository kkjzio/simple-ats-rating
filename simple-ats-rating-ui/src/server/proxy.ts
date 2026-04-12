const PROXY_TARGET_ENV_KEY = "API_PROXY_TARGET";

export const getApiProxyTarget = (): string => {
  const proxyTarget = process.env[PROXY_TARGET_ENV_KEY]?.trim();

  if (!proxyTarget) {
    throw new Error(`Missing ${PROXY_TARGET_ENV_KEY} env variable`);
  }

  return proxyTarget.endsWith("/") ? proxyTarget.slice(0, -1) : proxyTarget;
};

export const buildProxyUrl = (target: string, requestUrl: URL): string => {
  return `${target}${requestUrl.pathname}${requestUrl.search}`;
};

export const proxyApiRequest = async (request: Request, target: string): Promise<Response> => {
  const upstreamUrl = buildProxyUrl(target, new URL(request.url));
  const headers = new Headers(request.headers);
  headers.delete("host");

  try {
    return await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
      redirect: "manual",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    return Response.json(
      {
        message: "Proxy request failed",
        detail: message,
      },
      { status: 502 }
    );
  }
};
