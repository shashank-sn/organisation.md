---
title: plan: DX and infrastructure improvements
type: chore
date: 2026-06-27
---

# plan: DX and infrastructure improvements

## Summary

Clean up the template, add `.env.example`, introduce session-level file caching to reduce GitHub API calls, fix dead code and inconsistent patterns, and add SSE transport support for remote agent connections.

---

## Problem Frame

The project works — two plans shipped, the server runs, the memory layer is in production — but four friction points are starting to show:

1. **First-fork confusion.** The template `organisation.md` ships with personal ClickUp Brain research notes in the Feedback section. Anyone who forks will see that and wonder if it's part of the template.
2. **Every tool call hits the GitHub API.** An agent calling `read_org` → `read_section("Team")` → `read_section("Projects")` → `search_context` makes 4 API calls to fetch files it already has. At scale, this burns rate limit budget and adds latency.
3. **Code hygiene gaps.** `createGitHubClient()` is dead code (ignores owner/repo). Dynamic `await import()` for files already statically imported. `orgFileSha` is assigned but never used. These are small but they accumulate.
4. **Stdio-only transport.** Every MCP host must run the server locally. No remote agents, no cloud MCP hosts. This is the biggest adoption ceiling.

---

## Requirements

R1. The template `organisation.md` MUST ship clean — no personal research notes, no placeholder content that looks like real data.
R2. A `.env.example` file MUST exist with all required and optional env vars documented.
R3. File reads from the GitHub API MUST be cached within an MCP session to avoid redundant calls. Cache MUST auto-expire when the session ends (process exits). Cache MUST be invalidateable per-file.
R4. Cached files MUST support a `ref` parameter — reads from different git refs (branches, commits) MUST NOT share a cache entry with the same path on the default branch.
R5. Dead code MUST be removed: `createGitHubClient()` in `client.ts`, unused `orgFileSha` in `import.ts`, and unused `import`s across the codebase.
R6. Inconsistent dynamic `import()` patterns that duplicate static imports MUST be replaced with static imports.
R7. The server MUST support SSE transport (via `SSEServerTransport` from `@modelcontextprotocol/sdk`) as an alternative to stdio.
R8. SSE mode MUST be opt-in via an environment variable (`TRANSPORT=sse` or omission defaults to stdio).
R9. Tests MUST cover the new caching module, the SSE transport path, and the cleaned-up `client.ts`. Existing tests MUST remain green.

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| **In-memory LRU cache (Map-based)** for file caching | Matches the session-scoped lifecycle — no persistence needed. TTL optional but not required: the cache lives as long as the process, which is one MCP session. Simple `Map<string, { content, sha, path, ref }>` is sufficient at this scale. |
| **Cache key = `path:ref`** | Supports reading from different branches without cross-contamination. Defaults to `path:HEAD` when no ref is specified. |
| **SSE transport only (not HTTP+SSE)** | SSE is the standard MCP remote transport. The MCP SDK v1.18 `SSEServerTransport` is stable and well-documented. HTTP transport support is experimental in MCP SDK and adds unnecessary surface area. |
| **`TRANSPORT=sse` env var** | Minimal opt-in. stdio (default) is untouched. SSE mode also requires `PORT` (defaults to 3000) and automatically adds CORS headers via the SDK. |
| **Static imports for all tool modules** | Every tool file is imported at the top of `server.ts`. The dynamic `import()` in `propose.ts`, `roles.ts`, `import.ts`, `manage.ts` for sibling modules is replaced with static imports. |
| **Test the new modules only** (caching, SSE transport, cleaned client) | Backfilling tests for every existing uncovered module (search.ts, graph.ts, sessions.ts, etc.) is out of scope. Test coverage for new code and the changed code is sufficient. |

---

## Scope Boundaries

### In scope
- Clean the `organisation.md` template: remove ClickUp Brain research notes from Feedback section, replace with clean template content
- Add `.env.example` at repo root
- Add `src/cache/index.ts` with an in-memory file cache
- Add a `getCachedFile()` wrapper in `src/github/files.ts` that tools call instead of `readFile()` directly
- Wire cache into the existing tools: `read_org`, `read_section`, `search_context`
- Remove dead code: `createGitHubClient()` in `client.ts`, unused `orgFileSha` in `import.ts`
- Replace dynamic imports with static imports across the codebase
- Add SSE transport: `SSEServerTransport` with `TRANSPORT=sse` / `PORT` env vars
- Refactor `server.ts` to support both transport modes
- Tests for cache, SSE transport, cleaned client

### Deferred to follow-up
- Persistent caching across MCP sessions (local file-based cache)
- HTTP transport support
- Full test coverage backfill for all existing modules
- Caching for the memory graph and search operations (higher effort, lower traffic)
- Rate limit awareness and proactive warnings

---

## Implementation Units

### U1. Template cleanup and .env.example

**Goal:** Clean the `organisation.md` template so first-time fork users get a clean starting point. Add `.env.example` for zero-friction setup.

**Files:**
- `organisation.md` (modify)
- `.env.example` (create)

**Requirements:** R1, R2

**Approach:**
- Remove the entire Feedback & Insights section from `organisation.md` — it contains personal ClickUp Brain research notes that don't belong in a template. Replace with a clean, empty placeholder section if any section is expected by the tools (check if `read_section("Feedback & Insights")` is used anywhere — it's not in `SECTION_NAMES` in `resources/index.ts`, so safe to remove entirely).
- Clean the placeholder content in Identity, Team, and other sections — replace "Name 1", "Role 1", "Value 1" with more obvious placeholder markers or empty fields.
- Create `.env.example` with:
  ```
  # Required
  GITHUB_TOKEN=ghp_your_token_here
  GITHUB_OWNER=your-github-username-or-org
  GITHUB_REPO=organisation.md

  # Optional
  # TRANSPORT=sse              # Set to "sse" for remote MCP transport (default: stdio)
  # PORT=3000                  # Port for SSE transport (default: 3000)
  ```
- Update `docs/quickstart.md` to reference `.env.example` in the setup instructions.

**Patterns to follow:** The existing env var documentation in README.md for consistency.

**Test expectation:** none — pure content changes.

---

### U2. File caching module

**Goal:** An in-memory cache for GitHub API file reads that prevents redundant API calls within a session.

**Files:**
- `src/cache/index.ts` (create)
- `src/cache/types.ts` (create)
- `src/cache/index.test.ts` (create)

**Requirements:** R3, R4

**Approach:**
- `types.ts`: Export `CacheEntry = { content: string; sha: string; path: string; ref: string | null; cachedAt: number }` and `FileCache` class interface.
- `index.ts`: A simple `Map<string, CacheEntry>`-based cache class. Methods:
  - `get(path, ref?)` — returns `CacheEntry | undefined`. Cache key is `path:ref` (or `path:HEAD` when ref is null).
  - `set(path, ref?, entry)` — stores entry with the composite key.
  - `invalidate(path, ref?)` — removes a specific path/ref combo.
  - `invalidateAll()` — clears the entire cache (for tests).
  - `has(path, ref?)` — boolean check.
- The cache is a singleton module-level instance (not a class instance passed around) so it lives for the process lifetime. Each tool module imports it directly.
- No TTL — the cache lives as long as the process. This is fine for single-session usage. If the process is long-lived (unusual for stdio MCP), explicit invalidation handles staleness.

**Test scenarios:**
- `cache.get(path)` returns undefined when empty
- `cache.set(path, entry)` followed by `cache.get(path)` returns the entry
- Cache key includes `ref` — same path, different refs return correct entries
- `cache.invalidate(path)` removes the entry
- `cache.invalidateAll()` clears all entries
- Same path with `ref` vs without are stored separately
- `cache.has(path)` returns true after set, false after invalidate

**Verification:** `npx vitest run src/cache/index.test.ts` passes.

---

### U3. Wire cache into file reads

**Goal:** Tools transparently use the cache when reading files from GitHub.

**Files:**
- `src/github/files.ts` (modify)
- `src/server.ts` (modify — wire cache invalidation)
- `src/tools/read.ts` (modify — use cached reads)
- `src/tools/search.ts` (modify — use cached reads)
- `src/tools/list.ts` (modify — use cached reads)

**Requirements:** R3, R4

**Approach:**
- Add a `readCachedFile(octokit, owner, repo, path, ref?)` wrapper in `files.ts` that checks the cache first, calls `readFile` on miss, stores the result, and returns it.
- Modify `readFile` to accept an optional `useCache` param (default `true`) so callers that need fresh data (write tools, status checks) can opt out.
- In `read.ts`: `read_org` and `read_section` call `readCachedFile` instead of `readFile`.
- In `search.ts`: `search_context` calls `readCachedFile` for org file and CONTEXT/ file reads.
- In `list.ts`: `list_context_files` calls `readCachedFile` — this is lower impact but consistent.
- Write tools (`write.ts`, `propose.ts`, `import.ts`, `manage.ts`, `roles.ts`) continue using `readFile` without caching — they need fresh SHAs for conflict detection.
- Add a new tool `invalidate_cache` (or wire it into `update_section` / `propose_change` post-write) that invalidates the cached file after a write. Actually, simpler: after any successful write to a file, invalidate that file's cache entry. This happens inside the tool handlers that already know which file was written.

**Test scenarios:**
- Read a file twice — first call hits the API, second call hits the cache
- Read with `useCache: false` always hits the API
- After a write to `organisation.md`, the cached version of `organisation.md` is invalidated
- Read with different `ref` values are cached separately
- Cache miss on first read stores the result correctly

**Patterns to follow:** The existing `readFile` function signature and error handling in `files.ts`.

---

### U4. Code quality pass

**Goal:** Remove dead code, fix inconsistent import patterns, clean up unused variables.

**Files:**
- `src/github/client.ts` (modify — remove dead `createGitHubClient` and `getConfig` functions, keep only `handleGitHubError`)
- `src/tools/propose.ts` (modify — replace dynamic `import()` with static imports)
- `src/tools/roles.ts` (modify — replace dynamic `import()` with static imports)
- `src/tools/import.ts` (modify — replace dynamic `import()` with static imports, remove unused `orgFileSha`)
- `src/tools/manage.ts` (modify — replace dynamic `import()` with static imports)
- `src/github/client.ts` test add

**Requirements:** R5, R6

**Approach:**
- In `client.ts`: Remove `createGitHubClient` and `getConfig` — they're never called. The Octokit instance is created directly in `server.ts`. Add tests for `handleGitHubError` (the only function that remains).
- In `propose.ts`: Replace the inline `await import("../github/files.js").then(m => m.writeFile)` pattern with a static import at the top of the file. `writeFile`, `readFile`, and `createFile` are already used directly in the same file via static import at the top — just use the existing import.
- In `roles.ts`: Replace dynamic `await import("../github/files.js")` and `await import("../github/git.js")` with static imports at the top.
- In `import.ts`: Remove the unused `orgFileSha` variable. Replace dynamic `import()` calls with static imports.
- In `manage.ts`: Replace dynamic `import()` calls with static imports. Both `readFile` and the git helpers are already available via properly imported modules elsewhere.

**Test scenarios:**
- `handleGitHubError` still passes through existing GitHubErrors (`src/__tests__/github.test.ts` already covers this — verify it still passes)
- All tool modules compile without type errors after import changes
- `import.ts` has no unused variable warnings

**Verification:** `npx vitest run` passes. `npx tsc --noEmit` passes.

---

### U5. SSE transport support

**Goal:** The MCP server can run in SSE mode for remote connections.

**Files:**
- `src/server.ts` (modify — transport selection logic)
- `src/transport/sse.ts` (create — SSE server setup)
- `src/transport/types.ts` (create — transport type enum)
- `src/server.test.ts` (create)

**Requirements:** R7, R8

**Approach:**
- `transport/types.ts`: Export `TransportMode` union type and a `parseTransportMode(env?: string): TransportMode` helper that reads `process.env.TRANSPORT` and defaults to `"stdio"`.
- `transport/sse.ts`: Export `startSseServer(server)` that creates an Express-compatible HTTP server with `SSEServerTransport` from the MCP SDK. The SDK's `SSEServerTransport` constructor takes a URL path (e.g., `/sse`) and a response object. A simple Node.js `http.createServer` handles the lifecycle.
  - Endpoint `GET /sse` — `SSEServerTransport` for the SSE stream.
  - Endpoint `POST /messages` — receives client messages.
  - The transport handler creates a new `SSEServerTransport` per connection and calls `server.connect(transport)`.
- `server.ts`: After creating the `McpServer` and registering all tools, check `parseTransportMode()`. If `"sse"`, call `startSseServer(server, { port: parseInt(process.env.PORT || "3000") })`. If `"stdio"` (default), use the existing `StdioServerTransport`.
- The SSE server logs the URL on startup: `console.error("MCP server listening on http://localhost:" + port + "/sse")`. Stderr output is fine since MCP stdio only reads from stdout.
- For SSE mode, tools remain the same. The transport layer handles the protocol difference transparently.

**Test scenarios:**
- `parseTransportMode("sse")` returns `"sse"`
- `parseTransportMode("stdio")` returns `"stdio"`
- `parseTransportMode(undefined)` returns `"stdio"` (default)
- `parseTransportMode("invalid")` returns `"stdio"` (graceful fallback)
- SSE server starts and accepts connections (integration test with a simple fetch to `GET /sse`)
- SSE server responds to `POST /messages` with appropriate headers

**Patterns to follow:** MCP SDK documentation for SSEServerTransport — the SDK exports it from `@modelcontextprotocol/sdk/server/sse.js`.

---

### U6. Integration and docs update

**Goal:** Update docs to reflect new capabilities, verify the plan's changes work together.

**Files:**
- `README.md` (modify — mention `.env.example`, caching, SSE transport)
- `docs/quickstart.md` (modify — add SSE setup section)
- `docs/agent-prompt.md` (modify — mention SSE connection as an alternative to stdio)

**Requirements:** R1, R2, R7, R8

**Approach:**
- README: Add a "Configuration" section that points to `.env.example`. Add an "SSE Transport" subsection under "Connecting" that shows the env var and a curl test.
- Quickstart: Add a bullet for SSE transport setup alongside the existing stdio setup.
- Agent prompt: Add a note that the server supports both stdio (local MCP hosts) and SSE (remote MCP hosts).

**Test expectation:** none — pure documentation changes.

---

## Open Questions

- **Cache invalidation for `search_context`**: The search tool reads multiple files (org, context/ files, decisions, etc.). A write to one file should invalidate only that file's cache entry, not the entire cache. This is the default behavior with per-path invalidation — no special handling needed.
- **SSE server graceful shutdown**: The current implementation starts an HTTP server that runs until the process is killed. For a v1 SSE implementation, a simple `process.on('SIGTERM', ...)` handler that closes the server is sufficient but not critical — the process manager handles cleanup.

---

## Risks & Dependencies

- **MCP SDK SSE transport API stability**: `SSEServerTransport` has been stable since SDK v1.0 and is the recommended approach for remote MCP. No risk here.
- **Cache coherence during agent sessions**: If an agent calls `read_org` (cached) then another agent process modifies the repo, the first agent has stale data. This is acceptable — the cache is per-process. The `invalidate` path handles manual refresh via writes.
- **SSE mode and concurrent connections**: A single SSE server can handle multiple agent connections. The MCP SDK handles this correctly — each connection gets its own transport instance.

---

## Sources / Research

- Existing patterns in `src/github/files.ts` for the `readFile` function signature and error handling — the cache wrapper follows the same pattern.
- Existing patterns in `src/github/remote.ts` for singleton cache state — the `let cached: boolean | null = null` pattern is the same approach the file cache should use.
- `@modelcontextprotocol/sdk` v1.18 exports `SSEServerTransport` from `@modelcontextprotocol/sdk/server/sse.js` — documented in the MCP SDK TypeScript source.
- The `src/server.ts` startup flow for where the transport selection logic sits.
