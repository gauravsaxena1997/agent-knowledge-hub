import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { GraphStore, KnowledgeRetriever } from "@agent-knowledge-hub/core";

export { McpServer };

export const KnowledgeMcpAccessLevel = {
  READ: "read",
  WRITE: "write",
} as const;
export type KnowledgeMcpAccessLevel =
  (typeof KnowledgeMcpAccessLevel)[keyof typeof KnowledgeMcpAccessLevel];

export const KnowledgeMcpStability = {
  STABLE: "stable",
  BETA: "beta",
  EXPERIMENTAL: "experimental",
} as const;
export type KnowledgeMcpStability =
  (typeof KnowledgeMcpStability)[keyof typeof KnowledgeMcpStability];

export const KnowledgeMcpCategory = {
  RETRIEVAL: "Retrieval",
  GRAPH: "Graph",
  ASSETS: "Assets",
  INGESTION: "Ingestion",
  ENTRIES: "Entries",
  RELATIONSHIPS: "Relationships",
  ADMINISTRATION: "Administration",
} as const;
export type KnowledgeMcpCategory =
  (typeof KnowledgeMcpCategory)[keyof typeof KnowledgeMcpCategory];

export type KnowledgeMcpJsonSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, KnowledgeMcpJsonSchema>;
  required?: string[];
  items?: KnowledgeMcpJsonSchema;
  enum?: unknown[];
  additionalProperties?: boolean | KnowledgeMcpJsonSchema;
  anyOf?: KnowledgeMcpJsonSchema[];
  oneOf?: KnowledgeMcpJsonSchema[];
  allOf?: KnowledgeMcpJsonSchema[];
  default?: unknown;
  examples?: unknown[];
  [key: string]: unknown;
};

export type KnowledgeMcpDocumentedError = {
  code: string;
  description: string;
};

export type KnowledgeMcpToolAnnotations = {
  destructive?: boolean;
  idempotent?: boolean;
  openWorld?: boolean;
};

export type KnowledgeMcpToolDescriptor = {
  name: string;
  summary: string;
  usage: string;
  category: KnowledgeMcpCategory;
  stability: KnowledgeMcpStability;
  accessLevel: KnowledgeMcpAccessLevel;
  annotations: KnowledgeMcpToolAnnotations;
  inputSchema: KnowledgeMcpJsonSchema;
  outputSchema: KnowledgeMcpJsonSchema;
  requestExample: Record<string, unknown>;
  responseExample: unknown;
  errors: KnowledgeMcpDocumentedError[];
};

export interface RegisterKnowledgeMcpToolsOptions {
  server: McpServer;
  retriever: KnowledgeRetriever;
  graphStore: GraphStore;
  toolPrefix?: string;
}

export type KnowledgeMcpCatalogOptions = {
  toolPrefix?: string;
  extensions?: KnowledgeMcpToolDescriptor[];
  includePortable?: boolean;
};

const JSON_OBJECT_OUTPUT: KnowledgeMcpJsonSchema = {
  type: "object",
  additionalProperties: true,
};

function jsonText(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function defaultErrors(): KnowledgeMcpDocumentedError[] {
  return [
    { code: "VALIDATION_ERROR", description: "The request does not match the declared input schema." },
    { code: "MCP_ERROR", description: "The host runtime could not complete the operation." },
  ];
}

function portableCatalog(prefix: string): KnowledgeMcpToolDescriptor[] {
  return [
    {
      name: `${prefix}_retrieve`,
      summary: "Retrieve cited knowledge context.",
      usage: "Use for grounded semantic retrieval with optional graph expansion. The calling agent synthesizes the final answer.",
      category: KnowledgeMcpCategory.RETRIEVAL,
      stability: KnowledgeMcpStability.STABLE,
      accessLevel: KnowledgeMcpAccessLevel.READ,
      annotations: { destructive: false, idempotent: true, openWorld: false },
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural-language retrieval query." },
          limit: { type: "number", default: 10 },
          tags: { type: "array", items: { type: "string" } },
          expandDepth: { type: "number", default: 1 },
        },
        required: ["query"],
        additionalProperties: false,
      },
      outputSchema: { type: "array", items: JSON_OBJECT_OUTPUT },
      requestExample: { query: "What did the customer report about onboarding?", limit: 5, expandDepth: 1 },
      responseExample: [{ id: "knowledge-1", score: 0.92, citations: [{ sourceId: "source-1" }] }],
      errors: defaultErrors(),
    },
    {
      name: `${prefix}_graph_neighborhood`,
      summary: "Return the graph neighborhood around a node.",
      usage: "Use after identifying a relevant node to inspect its directly connected context.",
      category: KnowledgeMcpCategory.GRAPH,
      stability: KnowledgeMcpStability.STABLE,
      accessLevel: KnowledgeMcpAccessLevel.READ,
      annotations: { destructive: false, idempotent: true, openWorld: false },
      inputSchema: {
        type: "object",
        properties: {
          nodeId: { type: "string" },
          depth: { type: "number", default: 1 },
        },
        required: ["nodeId"],
        additionalProperties: false,
      },
      outputSchema: JSON_OBJECT_OUTPUT,
      requestExample: { nodeId: "knowledge-1", depth: 1 },
      responseExample: { nodes: [{ id: "knowledge-1" }], edges: [] },
      errors: defaultErrors(),
    },
    {
      name: `${prefix}_list_nodes`,
      summary: "List knowledge graph nodes.",
      usage: "Use for bounded graph discovery before requesting a specific node or neighborhood.",
      category: KnowledgeMcpCategory.GRAPH,
      stability: KnowledgeMcpStability.STABLE,
      accessLevel: KnowledgeMcpAccessLevel.READ,
      annotations: { destructive: false, idempotent: true, openWorld: false },
      inputSchema: {
        type: "object",
        properties: { limit: { type: "number", default: 50 } },
        additionalProperties: false,
      },
      outputSchema: { type: "array", items: JSON_OBJECT_OUTPUT },
      requestExample: { limit: 25 },
      responseExample: [{ id: "knowledge-1", label: "Onboarding feedback", kind: "knowledge_item" }],
      errors: defaultErrors(),
    },
  ];
}

export function getKnowledgeMcpCatalog(options: KnowledgeMcpCatalogOptions = {}): KnowledgeMcpToolDescriptor[] {
  const catalog = [
    ...(options.includePortable === false ? [] : portableCatalog(options.toolPrefix ?? "knowledge")),
    ...(options.extensions ?? []),
  ];
  const names = new Set<string>();
  for (const descriptor of catalog) {
    if (names.has(descriptor.name)) throw new Error(`Duplicate Knowledge MCP tool descriptor: ${descriptor.name}`);
    names.add(descriptor.name);
  }
  return catalog;
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
    { limit: z.number().int().positive().optional().default(50) },
    async ({ limit }) => {
      const nodes = await options.graphStore.listNodes();
      return jsonText(nodes.slice(0, limit));
    },
  );
}
