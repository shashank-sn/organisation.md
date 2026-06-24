import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Octokit } from "octokit";
import { z } from "zod";
import { handleGitHubError } from "../github/client.js";

const AREAS = ["mcp server", "docs", "templates", "site", "other"] as const;

function detectArea(description: string, steps?: string): string {
  const text = `${description} ${steps || ""}`.toLowerCase();
  if (text.includes("site") || text.includes("page") || text.includes("html") || text.includes("css") || text.includes("ui")) return "site";
  if (text.includes("doc") || text.includes("readme") || text.includes("guide") || text.includes("quickstart")) return "docs";
  if (text.includes("template") || text.includes("organisation.md") || text.includes("context/")) return "templates";
  return "mcp server";
}

function formatBody(
  description: string,
  steps?: string,
  expected?: string,
  context?: string,
  area?: string,
): string {
  const lines: string[] = [];
  lines.push("## description");
  lines.push("");
  lines.push(description);
  lines.push("");

  if (steps) {
    lines.push("## to reproduce");
    lines.push("");
    lines.push(steps);
    lines.push("");
  }

  if (expected) {
    lines.push("## expected behavior");
    lines.push("");
    lines.push(expected);
    lines.push("");
  }

  if (context) {
    lines.push("## additional context");
    lines.push("");
    lines.push(context);
    lines.push("");
  }

  if (area) {
    lines.push(`**area:** ${area}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("_automated report via organisation.md mcp server._");
  return lines.join("\n");
}

export function registerIssueTools(
  server: McpServer,
  octokit: Octokit,
  owner: string,
  repo: string,
) {
  server.tool(
    "report_bug",
    "report a bug or issue. auto-detects the area and creates a github issue.",
    {
      description: z.string().describe("describe what bug or issue you found"),
      steps: z.string().optional().describe("steps to reproduce the issue"),
      expected: z.string().optional().describe("what you expected to happen"),
      context: z.string().optional().describe("any additional context (os, version, mcp host, logs, etc.)"),
      area: z.enum(AREAS).optional().describe("area of the project (auto-detected if omitted)"),
      title: z.string().optional().describe("custom issue title (auto-generated if omitted)"),
    },
    { readOnlyHint: false },
    async ({ description, steps, expected, context, area, title }) => {
      try {
        const detectedArea = area || detectArea(description, steps);
        const issueTitle = title || `autofix: ${description.substring(0, 72)}${description.length > 72 ? "..." : ""}`;
        const body = formatBody(description, steps, expected, context, detectedArea);

        const labels = [detectedArea === "mcp server" ? "bug" : detectedArea];

        const issue = await handleGitHubError(
          octokit.rest.issues.create({
            owner,
            repo,
            title: issueTitle,
            body,
            labels,
          }),
        );

        return {
          content: [{
            type: "text",
            text: `🐛 bug report created: ${issue.data.html_url}\n📝 title: ${issueTitle}\n🏷️  labels: ${labels.join(", ")}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `error creating issue: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "suggest_feature",
    "suggest a feature or improvement. creates a github issue.",
    {
      description: z.string().describe("describe the feature you'd like to see"),
      problem: z.string().optional().describe("what problem would this solve?"),
      alternatives: z.string().optional().describe("any alternative solutions you've considered"),
      area: z.enum(AREAS).optional().describe("area of the project (auto-detected if omitted)"),
    },
    { readOnlyHint: false },
    async ({ description, problem, alternatives, area }) => {
      try {
        const detectedArea = area || detectArea(description);
        const title = `feat: ${description.substring(0, 72)}${description.length > 72 ? "..." : ""}`;

        const lines: string[] = [];
        lines.push("## description");
        lines.push("");
        lines.push(description);
        lines.push("");

        if (problem) {
          lines.push("## problem");
          lines.push("");
          lines.push(problem);
          lines.push("");
        }

        if (alternatives) {
          lines.push("## alternatives considered");
          lines.push("");
          lines.push(alternatives);
          lines.push("");
        }

        lines.push(`**area:** ${detectedArea}`);
        lines.push("");
        lines.push("---");
        lines.push("_automated suggestion via organisation.md mcp server._");

        const issue = await handleGitHubError(
          octokit.rest.issues.create({
            owner,
            repo,
            title,
            body: lines.join("\n"),
            labels: ["enhancement", detectedArea],
          }),
        );

        return {
          content: [{
            type: "text",
            text: `💡 feature suggestion created: ${issue.data.html_url}\n📝 title: ${title}\n🏷️  labels: enhancement, ${detectedArea}`,
          }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `error creating suggestion: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        };
      }
    },
  );
}
