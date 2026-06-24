import { describe, it, expect } from "vitest";
import { generateBranchName } from "../github/git.js";
import { GitHubError } from "../github/types.js";
import { handleGitHubError } from "../github/client.js";

describe("generateBranchName", () => {
  it("generates a branch name with proposal prefix", () => {
    const name = generateBranchName();
    expect(name).toMatch(/^proposal\/\d+-[a-z0-9]{4}$/);
  });

  it("generates unique names", () => {
    const names = new Set(Array.from({ length: 10 }, () => generateBranchName()));
    expect(names.size).toBe(10);
  });
});

describe("GitHubError", () => {
  it("creates error with message and status", () => {
    const err = new GitHubError("Not found", 404);
    expect(err.message).toBe("Not found");
    expect(err.status).toBe(404);
    expect(err.name).toBe("GitHubError");
  });

  it("creates error without status", () => {
    const err = new GitHubError("Unknown error");
    expect(err.message).toBe("Unknown error");
    expect(err.status).toBeUndefined();
  });

  it("creates error with response data", () => {
    const err = new GitHubError("Bad request", 400, { errors: ["invalid"] });
    expect(err.response).toEqual({ errors: ["invalid"] });
  });
});

describe("handleGitHubError", () => {
  it("wraps API errors with status", async () => {
    const apiError = { status: 422, message: "Validation failed" };

    await expect(
      handleGitHubError(Promise.reject(apiError))
    ).rejects.toThrow(GitHubError);
  });

  it("passes through existing GitHubErrors", async () => {
    const existing = new GitHubError("already wrapped", 500);

    await expect(
      handleGitHubError(Promise.reject(existing))
    ).rejects.toThrow("already wrapped");
  });

  it("wraps generic errors", async () => {
    await expect(
      handleGitHubError(Promise.reject(new Error("network failure")))
    ).rejects.toThrow(GitHubError);
  });

  it("resolves successful promises", async () => {
    const result = await handleGitHubError(Promise.resolve("ok"));
    expect(result).toBe("ok");
  });
});
