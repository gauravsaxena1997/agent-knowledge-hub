import neo4j, { type Driver, type Session } from "neo4j-driver";
import {
  graphSnapshotZ,
  knowledgeEdgeZ,
  knowledgeNodeZ,
  sourceRefZ,
  type GraphSnapshot,
  type GraphStore,
  type KnowledgeEdge,
  type KnowledgeNode,
  type SourceRef,
} from "@agent-knowledge-hub/core";

export interface Neo4jGraphStoreOptions {
  uri: string;
  username: string;
  password: string;
  database?: string;
  driver?: Driver;
}

function safeJson(input: unknown): string {
  return JSON.stringify(input ?? {});
}

function parseJsonRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== "string") return {};
  try {
    const parsed: unknown = JSON.parse(input);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function toStringArray(input: unknown): string[] {
  return Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
}

function nodeFromProperties(properties: Record<string, unknown>): KnowledgeNode {
  return knowledgeNodeZ.parse({
    id: String(properties.id),
    kind: String(properties.kind),
    label: String(properties.label),
    body: typeof properties.body === "string" ? properties.body : undefined,
    tags: toStringArray(properties.tags),
    metadata: parseJsonRecord(properties.metadataJson),
    sourceIds: toStringArray(properties.sourceIds),
    confidence: String(properties.confidence),
    freshness: String(properties.freshness),
    embeddingState: String(properties.embeddingState),
    createdAt: typeof properties.createdAt === "string" ? properties.createdAt : undefined,
    updatedAt: typeof properties.updatedAt === "string" ? properties.updatedAt : undefined,
  });
}

function edgeFromProperties(properties: Record<string, unknown>): KnowledgeEdge {
  return knowledgeEdgeZ.parse({
    id: String(properties.id),
    fromId: String(properties.fromId),
    toId: String(properties.toId),
    kind: String(properties.kind),
    label: typeof properties.label === "string" ? properties.label : undefined,
    metadata: parseJsonRecord(properties.metadataJson),
    sourceIds: toStringArray(properties.sourceIds),
    confidence: String(properties.confidence),
    createdAt: typeof properties.createdAt === "string" ? properties.createdAt : undefined,
    updatedAt: typeof properties.updatedAt === "string" ? properties.updatedAt : undefined,
  });
}

function sourceFromProperties(properties: Record<string, unknown>): SourceRef {
  return sourceRefZ.parse({
    id: String(properties.id),
    type: String(properties.type),
    label: String(properties.label),
    uri: typeof properties.uri === "string" ? properties.uri : undefined,
    capturedAt: typeof properties.capturedAt === "string" ? properties.capturedAt : undefined,
  });
}

export class Neo4jGraphStore implements GraphStore {
  private readonly driver: Driver;
  private readonly database: string | undefined;

  constructor(options: Neo4jGraphStoreOptions) {
    this.driver = options.driver ?? neo4j.driver(options.uri, neo4j.auth.basic(options.username, options.password));
    this.database = options.database;
  }

  private session(): Session {
    return this.driver.session(this.database ? { database: this.database } : {});
  }

  async close(): Promise<void> {
    await this.driver.close();
  }

  async upsertNode(node: KnowledgeNode): Promise<KnowledgeNode> {
    const parsed = knowledgeNodeZ.parse(node);
    const session = this.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (n:KnowledgeNode {id: $id})
          SET n.kind = $kind,
              n.label = $label,
              n.body = $body,
              n.tags = $tags,
              n.metadataJson = $metadataJson,
              n.sourceIds = $sourceIds,
              n.confidence = $confidence,
              n.freshness = $freshness,
              n.embeddingState = $embeddingState,
              n.updatedAt = $updatedAt,
              n.createdAt = coalesce(n.createdAt, $createdAt)
          `,
          {
            ...parsed,
            metadataJson: safeJson(parsed.metadata),
            createdAt: parsed.createdAt ?? new Date().toISOString(),
            updatedAt: parsed.updatedAt ?? new Date().toISOString(),
          },
        ),
      );
      return parsed;
    } finally {
      await session.close();
    }
  }

  async upsertEdge(edge: KnowledgeEdge): Promise<KnowledgeEdge> {
    const parsed = knowledgeEdgeZ.parse(edge);
    const session = this.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (from:KnowledgeNode {id: $fromId})
          MATCH (to:KnowledgeNode {id: $toId})
          MERGE (from)-[e:KNOWLEDGE_EDGE {id: $id}]->(to)
          SET e.kind = $kind,
              e.label = $label,
              e.fromId = $fromId,
              e.toId = $toId,
              e.metadataJson = $metadataJson,
              e.sourceIds = $sourceIds,
              e.confidence = $confidence,
              e.updatedAt = $updatedAt,
              e.createdAt = coalesce(e.createdAt, $createdAt)
          `,
          {
            ...parsed,
            metadataJson: safeJson(parsed.metadata),
            createdAt: parsed.createdAt ?? new Date().toISOString(),
            updatedAt: parsed.updatedAt ?? new Date().toISOString(),
          },
        ),
      );
      return parsed;
    } finally {
      await session.close();
    }
  }

  async upsertSource(source: SourceRef): Promise<SourceRef> {
    const parsed = sourceRefZ.parse(source);
    const session = this.session();
    try {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MERGE (s:KnowledgeSource {id: $id})
          SET s.type = $type,
              s.label = $label,
              s.uri = $uri,
              s.capturedAt = $capturedAt
          `,
          parsed,
        ),
      );
      return parsed;
    } finally {
      await session.close();
    }
  }

  async getNode(id: string): Promise<KnowledgeNode | null> {
    const session = this.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run("MATCH (n:KnowledgeNode {id: $id}) RETURN properties(n) AS props", { id }),
      );
      const props = result.records[0]?.get("props") as Record<string, unknown> | undefined;
      return props ? nodeFromProperties(props) : null;
    } finally {
      await session.close();
    }
  }

  async listNodes(): Promise<KnowledgeNode[]> {
    const session = this.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run("MATCH (n:KnowledgeNode) RETURN properties(n) AS props ORDER BY n.updatedAt DESC"),
      );
      return result.records.map((record) => nodeFromProperties(record.get("props") as Record<string, unknown>));
    } finally {
      await session.close();
    }
  }

  async listEdges(): Promise<KnowledgeEdge[]> {
    const session = this.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run("MATCH ()-[e:KNOWLEDGE_EDGE]->() RETURN properties(e) AS props ORDER BY e.updatedAt DESC"),
      );
      return result.records.map((record) => edgeFromProperties(record.get("props") as Record<string, unknown>));
    } finally {
      await session.close();
    }
  }

  async listSources(): Promise<SourceRef[]> {
    const session = this.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run("MATCH (s:KnowledgeSource) RETURN properties(s) AS props ORDER BY s.capturedAt DESC, s.label ASC"),
      );
      return result.records.map((record) => sourceFromProperties(record.get("props") as Record<string, unknown>));
    } finally {
      await session.close();
    }
  }

  async neighborhood(nodeId: string, depth: number): Promise<GraphSnapshot> {
    const session = this.session();
    try {
      const result = await session.executeRead((tx) =>
        tx.run(
          `
          MATCH p = (start:KnowledgeNode {id: $nodeId})-[*0..${Math.max(0, depth)}]-(n:KnowledgeNode)
          WITH collect(nodes(p)) AS nodeGroups, collect(relationships(p)) AS edgeGroups
          UNWIND nodeGroups AS nodes
          UNWIND nodes AS node
          WITH collect(DISTINCT node) AS distinctNodes, edgeGroups
          UNWIND edgeGroups AS edges
          UNWIND edges AS edge
          RETURN [node IN distinctNodes | properties(node)] AS nodes,
                 collect(DISTINCT properties(edge)) AS edges
          `,
          { nodeId },
        ),
      );
      const record = result.records[0];
      if (!record) return graphSnapshotZ.parse({ nodes: [], edges: [], sources: [] });
      const nodes = (record.get("nodes") as Record<string, unknown>[]).map(nodeFromProperties);
      const edges = (record.get("edges") as Record<string, unknown>[]).map(edgeFromProperties);
      return graphSnapshotZ.parse({ nodes, edges, sources: [] });
    } finally {
      await session.close();
    }
  }

  async deleteNode(id: string): Promise<void> {
    const session = this.session();
    try {
      await session.executeWrite((tx) => tx.run("MATCH (n:KnowledgeNode {id: $id}) DETACH DELETE n", { id }));
    } finally {
      await session.close();
    }
  }
}
