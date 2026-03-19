import MockAdapter from "axios-mock-adapter";
import { beforeEach, describe, expect, it } from "vitest";
import { HttpClient } from "../../src/http/HttpClient";

class TestApi extends HttpClient {
  constructor() {
    super("http://test.loc");
  }

  public getClient() {
    return this.client;
  }
}

describe("HttpClient", () => {
  let api: TestApi;
  let mock: MockAdapter;

  beforeEach(() => {
    api = new TestApi();
    mock = new MockAdapter(api.getClient());
  });

  it("get() renvoie data", async () => {
    mock.onGet("/abc").reply(200, { v: 1 });
    const r = await api.get("/abc");
    expect(r).toEqual({ v: 1 });
  });

  it("post() renvoie data", async () => {
    mock.onPost("/abc").reply(201, { v: 1 });
    const r = await api.post("/abc", { payload: 2 });
    expect(r).toEqual({ v: 1 });
  });

  it("put() renvoie data", async () => {
    mock.onPut("/abc").reply(200, { v: 1 });
    const r = await api.put("/abc", { payload: 2 });
    expect(r).toEqual({ v: 1 });
  });

  it("delete() renvoie data", async () => {
    mock.onDelete("/abc").reply(204, { v: 1 });
    const r = await api.delete("/abc");
    expect(r).toEqual({ v: 1 });
  });

  it("error interceptor catch http error status", async () => {
    mock.onGet("/error").reply(404, { e: 1 });
    await expect(api.get("/error")).rejects.toThrow();
  });

  it("error interceptor handle non-response crash", async () => {
    mock.onGet("/crash").networkError();
    await expect(api.get("/crash")).rejects.toThrow();
  });

  it("error interceptor handles error without config", async () => {
    const client = (api as any).client;
    const errorInterceptor = client.interceptors.response.handlers[0].rejected;
    await expect(
      errorInterceptor({ response: { status: 500 }, message: "test" }),
    ).rejects.toThrow();
  });
});
