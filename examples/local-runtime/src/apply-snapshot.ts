import { readFile } from "fs/promises";
import path from "path";
import {
  DefaultKnowledgeIndexer,
  deterministicTestEmbedding,
  graphSnapshotZ,
} from "@agent-knowledge-hub/core";
import { Neo4jGraphStore } from "@agent-knowledge-hub/neo4j";
import { QdrantVectorStore } from "@agent-knowledge-hub/qdrant";

const graphPath = process.env.AI_KNOWLEDGE_GRAPH_PATH
  ? path.resolve(process.env.AI_KNOWLEDGE_GRAPH_PATH)
  : path.resolve(process.cwd(), "graph.json");

const graphStore = new Neo4jGraphStore({
  uri: process.env.AI_KNOWLEDGE_NEO4J_URI ?? process.env.NEO4J_URI ?? "bolt://127.0.0.1:7687",
  username: process.env.AI_KNOWLEDGE_NEO4J_USERNAME ?? process.env.NEO4J_USERNAME ?? "neo4j",
  password: process.env.AI_KNOWLEDGE_NEO4J_PASSWORD ?? process.env.NEO4J_PASSWORD ?? "agent-knowledge-hub-local",
});

const vectorStore = new QdrantVectorStore({
  url: process.env.AI_KNOWLEDGE_QDRANT_URL ?? process.env.QDRANT_URL ?? "http://127.0.0.1:6333",
  collection:
    process.env.AI_KNOWLEDGE_QDRANT_COLLECTION ?? process.env.QDRANT_COLLECTION ?? "agent_knowledge_hub_local",
  dimensions: 32,
});

const indexer = new DefaultKnowledgeIndexer({
  graphStore,
  vectorStore,
  embedText: (text) => deterministicTestEmbedding(text, 32),
});

try {
  const raw = await readFile(graphPath, "utf8");
  const payload = JSON.parse(raw) as { snapshot?: unknown };
  const snapshot = graphSnapshotZ.parse(payload.snapshot);

  for (const source of snapshot.sources) {
    await graphStore.upsertSource(source);
  }

  for (const node of snapshot.nodes) {
    await indexer.indexNode(node);
  }

  for (const edge of snapshot.edges) {
    await graphStore.upsertEdge(edge);
  }

  const [nodes, edges] = await Promise.all([
    graphStore.listNodes(),
    graphStore.listEdges(),
  ]);

  console.log(
    JSON.stringify(
      {
        graphPath,
        collection:
          process.env.AI_KNOWLEDGE_QDRANT_COLLECTION ?? process.env.QDRANT_COLLECTION ?? "agent_knowledge_hub_local",
        counts: {
          projectedSources: snapshot.sources.length,
          projectedNodes: snapshot.nodes.length,
          projectedEdges: snapshot.edges.length,
          storedNodes: nodes.length,
          storedEdges: edges.length,
        },
      },
      null,
      2,
    ),
  );
} finally {
  await graphStore.close();
}
