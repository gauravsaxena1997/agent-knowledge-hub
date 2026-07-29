import { describe, expect, it } from "vitest";
import {
  getKnowledgeMcpCatalog,
  KnowledgeMcpAccessLevel,
  KnowledgeMcpCategory,
  KnowledgeMcpStability,
  type KnowledgeMcpToolDescriptor,
} from "../src/index.js";

describe("Knowledge MCP catalog", () => {
  it("provides complete portable descriptors with unique names", () => {
    const catalog = getKnowledgeMcpCatalog();
    expect(new Set(catalog.map((tool) => tool.name)).size).toBe(catalog.length);
    expect(catalog.every((tool) => tool.inputSchema && tool.outputSchema)).toBe(true);
    expect(catalog.every((tool) => tool.requestExample && tool.responseExample)).toBe(true);
    expect(catalog.every((tool) => tool.errors.length > 0)).toBe(true);
  });

  it("accepts host extensions without changing the portable catalog", () => {
    const extension: KnowledgeMcpToolDescriptor = {
      name: "host_taxonomy",
      summary: "Read host taxonomy.",
      usage: "Use to discover host-defined categories.",
      category: KnowledgeMcpCategory.ADMINISTRATION,
      stability: KnowledgeMcpStability.STABLE,
      accessLevel: KnowledgeMcpAccessLevel.READ,
      annotations: { destructive: false, idempotent: true, openWorld: false },
      inputSchema: { type: "object", additionalProperties: false },
      outputSchema: { type: "object", additionalProperties: true },
      requestExample: {},
      responseExample: { categories: ["CUSTOM"] },
      errors: [{ code: "MCP_ERROR", description: "Host adapter failure." }],
    };
    const base = getKnowledgeMcpCatalog();
    const extended = getKnowledgeMcpCatalog({ extensions: [extension] });
    expect(extended).toHaveLength(base.length + 1);
    expect(base.some((tool) => tool.name === extension.name)).toBe(false);
  });

  it("rejects duplicate host descriptors", () => {
    const duplicate = getKnowledgeMcpCatalog()[0];
    expect(() => getKnowledgeMcpCatalog({ extensions: [duplicate] })).toThrow(/Duplicate/);
  });

  it("supports a host-only catalog", () => {
    expect(getKnowledgeMcpCatalog({ includePortable: false })).toEqual([]);
  });
});
