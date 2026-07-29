# Release Process

Agent Knowledge Hub currently releases from reviewed Git source. npm publishing is intentionally out of scope until package APIs and distribution are stable.

## Source release checklist

1. Run `pnpm release:check` on a clean checkout.
2. Confirm `pnpm audit --prod` reports no high or critical advisories.
3. Confirm public-data and history scans report no secrets or application data.
4. Run the synthetic demo and adapter integration tests.
5. Run downstream consumer smoke checks without changing consumer source.
6. Create an annotated Git tag only after CI passes on protected `main`.

## Compatibility policy

The `core` contracts are the compatibility boundary. Reference adapters, MCP, and UI packages must remain compatible with the declared `core` peer range. Breaking public API changes require a documented major-version decision.
