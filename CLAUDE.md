# sunagent — Project Context

> This file exists to give any AI assistant or developer instant context about the sunagent project. Read this before making any suggestions or writing any code.

---

## What is sunagent?

A personal TypeScript agent framework where agents are defined through JSON config files and markdown prompts. The goal is to make creating a new AI agent as simple as writing a config file — no framework code changes required.

Built by a developer breaking out of an established codebase at their current job. The priority is learning by doing — understanding every decision, not just copying patterns.

---

## Core principles

- **Config-driven** — creating a new agent is just writing an `agent.json` and some markdown files
- **Model-agnostic** — swap LLM providers via config (abstraction built in from the start, Anthropic implemented first)
- **Security-first** — every agent declares exactly what tools and files it can access
- **Escape hatch** — complex agents can drop into TypeScript when config isn't enough
- **Minimal** — only build what is needed right now, leave clean extension points for later

---

## Tech stack

| Tool | Purpose |
|---|---|
| TypeScript | Language |
| NodeNext modules | Modern Node.js ES module system |
| pnpm workspaces | Monorepo + dependency management |
| mise | Node version pinning across platforms |
| Node.js v22 | Runtime (pinned via .mise.toml) |
| Anthropic SDK | First LLM provider |
| WSL (Ubuntu) | Development environment (Windows machine, moving to Mac/Linux later) |

---

## Project structure

```
sunagent/
  packages/
    core/                         ← the framework (@sunagent/core)
      src/
        cli/
          index.ts                ← entry point, agent picker
        registry/
          AgentRegistry.ts        ← discovers agents from /agents directory
        agent/
          Agent.ts                ← workflow loop
          ConfigLoader.ts         ← loads + resolves agent.json and prompts
        security/
          Sandbox.ts              ← enforces tool + file permissions
          PermissionSet.ts        ← permission types + validators
        tools/
          ToolExecutor.ts         ← validates permissions, runs tool
          ToolRegistry.ts         ← built-in tools library
        mcp/
          MCPClient.ts            ← stdio transport
          MCPBridge.ts            ← MCP tools → agent tool format
        providers/
          LLMProvider.ts          ← interface all providers implement
          AnthropicProvider.ts    ← first concrete implementation
        types/
          agent.ts                ← AgentConfig, PromptConfig types
          provider.ts             ← LLM provider types (when needed)
        index.ts                  ← public exports
      package.json
      tsconfig.json
  agents/
    stock-bot/                    ← first real agent (post-prototype)
      agent.json
      prompts/
        system.md
        context/
          01-market-hours.md
          02-sectors.md
  package.json                    ← pnpm workspace root
  pnpm-workspace.yaml             ← declares packages/* and agents/*
  .mise.toml                      ← node = "22"
  .editorconfig                   ← lf line endings, 2 space indent
  .gitignore
  tsconfig.json                   ← base tsconfig inherited by packages
  CONTEXT.md                      ← this file
```

---

## agent.json config shape

This is the single source of truth for an agent. Everything is inline — no separate config files.

```json
{
  "name": "stock-bot",
  "description": "Fetches stock data for friends",
  "version": "1.0.0",
  "provider": "anthropic",
  "model": "claude-sonnet-4-20250514",
  "prompts": {
    "system": "./prompts/system.md",
    "context": [
      "./prompts/context/"
    ]
  },
  "mcp": {
    "servers": [
      {
        "name": "finance",
        "transport": "stdio",
        "command": "npx finance-mcp-server",
        "env": {
          "API_KEY": "$FINANCE_API_KEY"
        }
      }
    ]
  },
  "tools": {
    "allowed": ["finance.get_stock_price", "finance.get_earnings"],
    "denied": []
  },
  "permissions": {
    "read": ["./prompts/**"],
    "write": []
  }
}
```

### Prompt rules
- `system` — single markdown file path. This is what the agent *is*.
- `context` — array of file paths or directory paths. This is what the agent *knows*.
- Directories load all `.md` files alphabetically.
- Context files are concatenated with `--- filename ---` dividers between them.
- No shared prompts in prototype scope — all paths are relative to the agent folder.

### Tool naming convention
Tools from MCP servers use dot notation: `server-name.tool-name` (e.g. `finance.get_stock_price`). This makes it clear which MCP server a tool comes from.

### MCP config
Defined per agent inside `agent.json`. Each agent only knows about the MCP servers it needs. MCP server names are scoped to the agent — never global.

### Environment variables
Sensitive values in MCP server config use `$VAR_NAME` syntax. The config loader resolves these from `process.env` at startup and fails loudly if a variable is missing.

---

## TypeScript types (packages/core/src/types/agent.ts)

```typescript
export type AgentConfig = {
  name: string;
  description: string;
  version: string;
  provider: string;
  model: string;
  prompts: PromptConfig;
};

export type PromptConfig = {
  system: string;
  context: string[];
};
```

> Note: The MVP type only includes prompts. Tools, permissions, and MCP fields will be added to the type as those features are built.

---

## Build order

### Prototype (current focus)
| Step | File | Status |
|---|---|---|
| 1 | Project scaffold | ✅ Done |
| 2 | `types/agent.ts` | ✅ Done |
| 3 | `agent/ConfigLoader.ts` | 🔄 In progress |
| 4 | `providers/LLMProvider.ts` | ⬜ Not started |
| 5 | `providers/AnthropicProvider.ts` | ⬜ Not started |
| 6 | `agent/Agent.ts` | ⬜ Not started |
| 7 | `registry/AgentRegistry.ts` | ⬜ Not started |
| 8 | `cli/index.ts` | ⬜ Not started |
| 9 | `agents/stock-bot/` | ⬜ Not started |

### Post-prototype (do not build yet)
- Messaging bridge + platform adapters (Discord, WhatsApp, iMessage)
- Server runtime (long-running process, graceful shutdown)
- Security sandbox + tool executor
- MCP client + bridge
- Additional LLM providers (OpenAI, Google, Ollama)
- npm packaging + publishing
- Shared prompts (`@shared/` alias)

---

## Key decisions log

| Concern | Decision | Reason |
|---|---|---|
| Config format | JSON inline | Easier to validate, familiar to developers |
| System prompt | Single markdown file reference | Prose belongs in a document not JSON |
| Context prompts | Array of file paths or directories | Flexible, supports reuse |
| Prompt separator | `--- filename ---` between files | Helps LLM understand document boundaries |
| Tool permissions | Inline allowlist + denylist | Single source of truth per agent |
| File permissions | Inline read/write glob arrays | Scoped per agent |
| MCP config | Per agent inside agent.json | Agents only know what they need |
| Tool naming | `server.tool` dot notation | Clear which MCP server a tool belongs to |
| Module system | NodeNext ES modules | Modern, correct for Node tooling |
| Import extensions | `.js` required in imports | Required by NodeNext module resolution |
| Types location | `packages/core/src/types/` | Shared across multiple files |
| Monorepo tool | pnpm workspaces | Best-in-class workspace support |
| Build system | pnpm only (no Nx) | Nx unnecessary at this scale |
| Node version | v22 pinned via mise | LTS, stable, cross-platform |
| Package name | `@sunagent/core` | Scoped, clean imports |

---

## ConfigLoader responsibilities

When fully implemented, `ConfigLoader` should:

1. Read `agent.json` from disk given a directory path
2. Parse JSON → validate against `AgentConfig` shape
3. Resolve `prompts.system` file path → read markdown content
4. Resolve each entry in `prompts.context`:
   - If a file path → read that file
   - If a directory path → read all `.md` files alphabetically
5. Concatenate context files with `--- filename ---` dividers
6. Return a fully resolved config object (paths replaced with content)

The output type is a `ResolvedAgentConfig` — distinct from `AgentConfig` because the prompts are content strings, not file paths.

---

## Working style

- Pair programming approach — the developer writes code, Claude reviews and explains
- Explain the *why* before the *how*
- One logical unit at a time (one file, one concept)
- Ask questions before writing code to maximise learning
- Cut scope aggressively — working prototype beats perfect architecture
- Post-prototype features get a `// TODO:` comment, not premature implementation