import { describe, expect, test } from "bun:test";
import { buildProxyUrl, getApiProxyTarget } from "./proxy";

describe("proxy helpers", () => {
  test("getApiProxyTarget 要求配置 API_PROXY_TARGET", () => {
    const prev = process.env.API_PROXY_TARGET;
    process.env.API_PROXY_TARGET = "";

    expect(() => getApiProxyTarget()).toThrow("Missing API_PROXY_TARGET");

    if (prev === undefined) {
      delete process.env.API_PROXY_TARGET;
    } else {
      process.env.API_PROXY_TARGET = prev;
    }
  });

  test("buildProxyUrl 拼接目标地址并保留查询参数", () => {
    const target = "http://127.0.0.1:8000";
    const reqUrl = new URL("http://localhost:3000/api/v1/auth/login?next=%2Fhome");

    expect(buildProxyUrl(target, reqUrl)).toBe(
      "http://127.0.0.1:8000/api/v1/auth/login?next=%2Fhome"
    );
  });
});
