import http from "http";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { SseOptions } from "./types.js";

/**
 * Start an MCP server over SSE transport.
 *
 * - GET /sse — establishes SSE connection (sends session ID via endpoint event)
 * - POST /messages?sessionId=<id> — routes to the correct transport
 * Returns the http.Server so callers can close it (for testing).
 */
export async function startSseServer(
  server: McpServer,
  options: SseOptions,
): Promise<http.Server> {
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${options.port}`);

    if (req.method === "GET" && url.pathname === "/sse") {
      const transport = new SSEServerTransport("/messages", res);
      transports.set(transport.sessionId, transport);

      // Clean up on connection close
      res.on("close", () => {
        transports.delete(transport.sessionId);
      });

      server.connect(transport).catch((err) => {
        console.error("SSE connection error:", err);
        transports.delete(transport.sessionId);
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/messages") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId) {
        res.writeHead(400);
        res.end("Missing sessionId query parameter");
        return;
      }

      const transport = transports.get(sessionId);
      if (!transport) {
        res.writeHead(400);
        res.end("No active SSE connection for this session");
        return;
      }

      transport.handlePostMessage(req, res);
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  return new Promise((resolve) => {
    httpServer.listen(options.port, () => {
      console.error(`MCP SSE server listening on http://localhost:${options.port}/sse`);
      resolve(httpServer);
    });
  });
}
