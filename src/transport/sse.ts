import http from "http";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { SseOptions } from "./types.js";

/**
 * Start an MCP server over SSE transport.
 *
 * - GET /sse — establishes SSE connection
 * - POST /messages — receives client messages
 */
export async function startSseServer(
  server: McpServer,
  options: SseOptions,
): Promise<void> {
  let transport: SSEServerTransport | undefined;

  const httpServer = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${options.port}`);

    if (req.method === "GET" && url.pathname === "/sse") {
      transport = new SSEServerTransport("/messages", res);
      server.connect(transport).catch((err) => {
        console.error("SSE connection error:", err);
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/messages") {
      if (transport) {
        transport.handlePostMessage(req, res);
      } else {
        res.writeHead(400);
        res.end("No active SSE connection");
      }
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  return new Promise((resolve) => {
    httpServer.listen(options.port, () => {
      console.error(`MCP SSE server listening on http://localhost:${options.port}/sse`);
      resolve();
    });
  });
}
