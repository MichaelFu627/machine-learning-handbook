# Project working agreement

Read [GOAL.md](GOAL.md) before planning or changing this project. It defines the audience, current scope, ordered milestones and definition of done. Follow the latest user instructions first; otherwise continue the earliest unfinished task whose dependencies are met. Inspect existing work before editing, deliver a working increment, and update GOAL.md with verified completion, remaining limits and the next task. Keep English and Chinese content aligned and preserve numerical correctness. Do not claim planned or locally verified features are deployed.

See [README.md](README.md) for commands and [docs/migration.md](docs/migration.md) for implementation boundaries. Do not commit local environments, generated build outputs, credentials or unrelated files. Public source publication and public website deployment are separate actions.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
