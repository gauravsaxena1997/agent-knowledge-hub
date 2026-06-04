import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphStore, KnowledgeRetriever } from "@agent-knowledge-hub/core";

export interface RegisterKnowledgeMcpToolsOptions {
  server: McpServer;
  retriever: KnowledgeRetriever;
  graphStore: GraphStore;
  toolPrefix?: string;
}

function jsonText(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

export function registerKnowledgeMcpTools(options: RegisterKnowledgeMcpToolsOptions): void {
  const prefix = options.toolPrefix ?? "knowledge";

  options.server.tool(
    `${prefix}_retrieve`,
    "Retrieve cited knowledge context using semantic search plus graph expansion.",
    {
      query: z.string(),
      limit: z.number().int().positive().optional().default(10),
      tags: z.array(z.string()).optional(),
      expandDepth: z.number().int().nonnegative().optional().default(1),
    },
    async ({ query, limit, tags, expandDepth }) =>
      jsonText(await options.retriever.retrieve({ query, limit, tags, expandDepth })),
  );

  options.server.tool(
    `${prefix}_graph_neighborhood`,
    "Return a local graph around a node id.",
    {
      nodeId: z.string(),
      depth: z.number().int().nonnegative().optional().default(1),
    },
    async ({ nodeId, depth }) => jsonText(await options.graphStore.neighborhood(nodeId, depth)),
  );

  options.server.tool(
    `${prefix}_list_nodes`,
    "List knowledge graph nodes.",
    {
      limit: z.number().int().positive().optional().default(50),
    },
    async ({ limit }) => {
      const nodes = await options.graphStore.listNodes();
      return jsonText(nodes.slice(0, limit));
    },
  );
}
