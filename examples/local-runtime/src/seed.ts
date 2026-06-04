import {
  DefaultKnowledgeIndexer,
  DefaultKnowledgeRetriever,
  deterministicTestEmbedding,
} from "@agent-knowledge-hub/core";
import { GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH } from "@agent-knowledge-hub/demo-data";
import { Neo4jGraphStore } from "@agent-knowledge-hub/neo4j";
import { QdrantVectorStore } from "@agent-knowledge-hub/qdrant";

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

const retriever = new DefaultKnowledgeRetriever({
  graphStore,
  vectorStore,
  embedText: (text) => deterministicTestEmbedding(text, 32),
});

try {
  for (const source of GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.sources) {
    await graphStore.upsertSource(source);
  }

  for (const node of GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.nodes) {
    await indexer.indexNode(node);
  }

  for (const edge of GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.edges) {
    await graphStore.upsertEdge(edge);
  }

  const nodes = await graphStore.listNodes();
  const edges = await graphStore.listEdges();
  const results = await retriever.retrieve({
    query: "source-backed answer for an agent",
    limit: 3,
    expandDepth: 1,
  });

  console.log(
    JSON.stringify(
      {
        graph: {
          sources: GENERIC_AGENT_KNOWLEDGE_HUB_DEMO_GRAPH.sources.length,
          nodes: nodes.length,
          edges: edges.length,
        },
        qdrant: {
          collection:
            process.env.AI_KNOWLEDGE_QDRANT_COLLECTION ?? process.env.QDRANT_COLLECTION ?? "agent_knowledge_hub_local",
          dimensions: 32,
        },
        retrieval: results.map((result) => ({
          id: result.node.id,
          label: result.node.label,
          score: Number(result.score.toFixed(4)),
          relatedNodes: result.relatedNodes.length,
          relatedEdges: result.relatedEdges.length,
        })),
      },
      null,
      2,
    ),
  );
} finally {
  await graphStore.close();
}
