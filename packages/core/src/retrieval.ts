import type { EmbedText, GraphStore, KnowledgeRetriever, VectorStore } from "./contracts.js";
import { retrievalRequestZ, type KnowledgeNode, type RetrievalHit, type RetrievalRequest } from "./schema.js";

export interface DefaultKnowledgeRetrieverOptions {
  graphStore: GraphStore;
  vectorStore: VectorStore;
  embedText: EmbedText;
}

function excerpt(text: string, maxLength = 360): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 1).trim()}…`;
}

function matchesNodeKinds(node: KnowledgeNode, nodeKinds?: string[]): boolean {
  return !nodeKinds || nodeKinds.includes(node.kind);
}

export class DefaultKnowledgeRetriever implements KnowledgeRetriever {
  private readonly graphStore: GraphStore;
  private readonly vectorStore: VectorStore;
  private readonly embedText: EmbedText;

  constructor(options: DefaultKnowledgeRetrieverOptions) {
    this.graphStore = options.graphStore;
    this.vectorStore = options.vectorStore;
    this.embedText = options.embedText;
  }

  async retrieve(request: RetrievalRequest): Promise<RetrievalHit[]> {
    const parsed = retrievalRequestZ.parse(request);
    const vector = await this.embedText(parsed.query);
    const filter = {
      ...(parsed.tags ? { tags: parsed.tags } : {}),
      ...(parsed.nodeKinds ? { nodeKinds: parsed.nodeKinds } : {}),
    };
    const vectorHits = await this.vectorStore.search(vector, parsed.limit * 2, filter);

    const hits: RetrievalHit[] = [];
    const seen = new Set<string>();
    for (const hit of vectorHits) {
      if (seen.has(hit.chunk.nodeId)) continue;
      const node = await this.graphStore.getNode(hit.chunk.nodeId);
      if (!node || !matchesNodeKinds(node, parsed.nodeKinds)) continue;
      const neighborhood = await this.graphStore.neighborhood(node.id, parsed.expandDepth);
      hits.push({
        node,
        score: hit.score,
        excerpt: excerpt(hit.chunk.text),
        sourceIds: node.sourceIds,
        relatedNodes: neighborhood.nodes.filter((related) => related.id !== node.id),
        relatedEdges: neighborhood.edges,
      });
      seen.add(node.id);
      if (hits.length >= parsed.limit) break;
    }

    return hits;
  }
}
