import { describe, it, expect, afterEach } from "vitest";
import http from "http";
import type { Server } from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { startSseServer } from "./sse.js";

const servers: Server[] = [];

afterEach(async () => {
  for (const s of servers) {
    s.closeAllConnections();
    await new Promise<void>((resolve) => s.close(() => resolve()));
  }
  servers.length = 0;
}, 15000);

async function findFreePort(): Promise<number> {
  return new Promise((resolve) => {
    const s = http.createServer();
    s.listen(0, () => {
      const port = (s.address() as import("net").AddressInfo).port;
      s.close(() => resolve(port));
    });
  });
}

/**
 * Connect to the SSE stream and extract the session ID from the endpoint event.
 * Returns both the session ID and a cleanup function to close the connection.
 */
function openSseConnection(url: string): Promise<{ sessionId: string; close: () => void }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { agent: false }, (res) => {
      let buffer = "";
      res.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const match = buffer.match(/\/messages\?sessionId=([a-f0-9-]+)/);
        if (match) {
          resolve({ sessionId: match[1], close: () => { res.destroy(); } });
        }
      });
      res.on("error", reject);
      setTimeout(() => {
        res.destroy();
        reject(new Error("Timeout waiting for SSE endpoint event"));
      }, 5000);
    });
    req.on("error", reject);
  });
}

describe("SSE server integration", () => {
  it("accepts an SSE connection and routes POST messages", { timeout: 15000 }, async () => {
    const port = await findFreePort();
    const server = new McpServer({ name: "test", version: "1.0.0" });

    // Register a simple tool
    let toolCalled = false;
    server.tool(
      "ping",
      "A simple ping tool",
      { message: z.string() },
      async ({ message }) => {
        toolCalled = true;
        return { content: [{ type: "text", text: `pong: ${message}` }] };
      },
    );

    const httpServer = await startSseServer(server, { port });
    servers.push(httpServer);

    // Connect via SSE and get the session ID (keep connection alive for POST)
    const { sessionId, close: closeSse } = await openSseConnection(`http://localhost:${port}/sse`);
    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe("string");
    expect(sessionId.length).toBeGreaterThan(0);

    // Send a POST message to /messages with the sessionId
    const postResult = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request(
        `http://localhost:${port}/messages?sessionId=${sessionId}`,
        { method: "POST", headers: { "Content-Type": "application/json" } },
        (res) => {
          // Drain the response
          res.on("data", () => {});
          res.on("end", () => resolve({ status: res.statusCode ?? 0 }));
        },
      );
      req.on("error", reject);
      req.write(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }));
      req.end();
    });

    expect(postResult.status).toBe(202);

    // Clean up the SSE connection
    closeSse();
  });

  it("returns 400 for POST without sessionId", async () => {
    const port = await findFreePort();
    const server = new McpServer({ name: "test", version: "1.0.0" });
    const httpServer = await startSseServer(server, { port });
    servers.push(httpServer);

    const result = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request(
        `http://localhost:${port}/messages`,
        { method: "POST" },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve({ status: res.statusCode ?? 0 }));
        },
      );
      req.on("error", reject);
      req.end();
    });

    expect(result.status).toBe(400);
  });

  it("returns 400 for POST with unknown sessionId", async () => {
    const port = await findFreePort();
    const server = new McpServer({ name: "test", version: "1.0.0" });
    await startSseServer(server, { port });

    const result = await new Promise<{ status: number }>((resolve, reject) => {
      const req = http.request(
        `http://localhost:${port}/messages?sessionId=nonexistent`,
        { method: "POST" },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve({ status: res.statusCode ?? 0 }));
        },
      );
      req.on("error", reject);
      req.end();
    });

    expect(result.status).toBe(400);
  });

  it("returns 404 for unknown paths", async () => {
    const port = await findFreePort();
    const server = new McpServer({ name: "test", version: "1.0.0" });
    await startSseServer(server, { port });

    const result = await new Promise<{ status: number }>((resolve, reject) => {
      http.get(`http://localhost:${port}/unknown`, (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve({ status: res.statusCode ?? 0 }));
      }).on("error", reject);
    });

    expect(result.status).toBe(404);
  });

  // Note: multiple concurrent SSE connections are not supported by the MCP SDK's
  // McpServer — it only allows one transport connection at a time. A second
  // GET /sse will create an SSEServerTransport (stored in the Map) but
  // server.connect() will throw "Already connected to a transport." The
  // connection is tracked and cleaned up on close.
});
