import { describe, it, expect } from "vitest";
import { parseTransportMode, parsePort } from "./types.js";

describe("parseTransportMode", () => {
  it('returns "stdio" when env is undefined', () => {
    expect(parseTransportMode(undefined)).toBe("stdio");
  });

  it('returns "stdio" when env is unset', () => {
    expect(parseTransportMode()).toBe("stdio");
  });

  it('returns "sse" when env is "sse"', () => {
    expect(parseTransportMode("sse")).toBe("sse");
  });

  it('returns "stdio" when env is "stdio"', () => {
    expect(parseTransportMode("stdio")).toBe("stdio");
  });

  it('returns "stdio" for invalid values', () => {
    expect(parseTransportMode("invalid")).toBe("stdio");
    expect(parseTransportMode("")).toBe("stdio");
    expect(parseTransportMode("http")).toBe("stdio");
  });
});

describe("parsePort", () => {
  it("returns 3000 when env is undefined", () => {
    expect(parsePort(undefined)).toBe(3000);
  });

  it("parses a valid port number", () => {
    expect(parsePort("8080")).toBe(8080);
  });

  it("returns 3000 for invalid port strings", () => {
    expect(parsePort("not-a-number")).toBe(3000);
    expect(parsePort("")).toBe(3000);
  });

  it("rejects out-of-range ports", () => {
    expect(parsePort("0")).toBe(3000);
    expect(parsePort("70000")).toBe(3000);
  });

  it("accepts port 1", () => {
    expect(parsePort("1")).toBe(1);
  });

  it("accepts port 65535", () => {
    expect(parsePort("65535")).toBe(65535);
  });
});
