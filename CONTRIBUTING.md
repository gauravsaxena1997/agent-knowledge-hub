# Contributing

## Setup

```sh
pnpm install
pnpm build
pnpm test
```

## Pull Requests

- Keep changes scoped.
- Add or update docs when public APIs change.
- Add focused tests for behavior changes.
- Do not commit private application data, secrets, or host-app-specific content.

## Release Readiness

Before publishing a package:

- verify `README.md` is current
- verify package `name` and `version`
- verify `files` and `exports`
- run `pnpm build` and `pnpm test`
