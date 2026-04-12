import { describe, expect, test } from "bun:test";
import { API_BASE_URL } from "./api";

describe("API_BASE_URL", () => {
  test("使用 /api/v1 作为前端反代入口", () => {
    expect(API_BASE_URL).toBe("/api/v1");
  });
});
