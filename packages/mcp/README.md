# @agent-knowledge-hub/mcp

MCP tool builders for `@agent-knowledge-hub/core`.

## Install

```sh
pnpm add @agent-knowledge-hub/mcp @agent-knowledge-hub/core
```

Use this package when an application needs retrieval-oriented MCP tools without
embedding application-specific knowledge logic inside the package itself.

## Documentation catalog

`getKnowledgeMcpCatalog()` returns the same portable tool contract in a
documentation-friendly form. Each descriptor includes access and stability
metadata, JSON input and output schemas, request and response examples, and
documented errors. Host applications can append descriptors for their own
taxonomy or persistence adapters through the `extensions` option.

```ts
import { getKnowledgeMcpCatalog, registerKnowledgeMcpTools } from "@agent-knowledge-hub/mcp";

const catalog = getKnowledgeMcpCatalog({ extensions: hostDescriptors });

registerKnowledgeMcpTools({
  server,
  retriever,
  graphStore,
});
```

The package does not own HTTP routes, credentials, databases, or authorization.
The host application binds those runtime concerns and may filter the catalog by
the descriptor access level.
