import { stableHash } from "./hash.js";
import type { KnowledgeChunk, KnowledgeNode } from "./schema.js";

export interface ChunkTextOptions {
  maxChars?: number;
  overlapChars?: number;
}

export function chunkText(text: string, options: ChunkTextOptions = {}): string[] {
  const maxChars = options.maxChars ?? 900;
  const overlapChars = options.overlapChars ?? 120;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let start = 0;
  while (start < normalized.length) {
    const hardEnd = Math.min(start + maxChars, normalized.length);
    const slice = normalized.slice(start, hardEnd);
    const boundary = hardEnd < normalized.length ? slice.lastIndexOf(". ") : -1;
    const end = boundary > maxChars * 0.55 ? start + boundary + 1 : hardEnd;
    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlapChars);
  }
  return chunks.filter(Boolean);
}

export function chunksForNode(node: KnowledgeNode, options: ChunkTextOptions = {}): KnowledgeChunk[] {
  const text = [node.label, node.body ?? ""].filter(Boolean).join("\n\n");
  return chunkText(text, options).map((chunk, order) => {
    const contentHash = stableHash(`${node.id}:${order}:${chunk}`);
    return {
      id: `${node.id}:chunk:${order}:${contentHash}`,
      nodeId: node.id,
      text: chunk,
      order,
      contentHash,
      tags: node.tags,
      metadata: node.metadata,
    };
  });
}
