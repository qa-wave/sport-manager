# Team — sport-manager

> Project-specific agents, tooling and operational guides for **sport-manager**
> (group: `web-app-saas`).

## Co tu najdeš

| Soubor | Obsah |
|---|---|
| [`PROJECT-ROLES.md`](PROJECT-ROLES.md) | Mapování úkol → agent (které agenty volat na co) |
| [`MCP-USAGE.md`](MCP-USAGE.md) | MCP servery používané v tomto projektu + inter-project comms |
| [`agents/`](agents/) | Definice agentů (.md s frontmatter) — používané přes `Agent` tool |
| [`ctx2skill/`](ctx2skill/) | Wrapper pro `/Users/tm/tools/ctx2skill/` (self-evolving skill discovery) |
| [`REPORTS/`](REPORTS/) | Generované reporty (knip, depcheck, audit) — gitignored kromě README |

## Jak používat

### Pustit agenta
Z hlavní Claude Code session — volej `Agent` tool se `subagent_type` z [`agents/`](agents/).
Příklad: úkol „přidej landing page" → `subagent_type: frontend-vyvojar`.

### ctx2skill
```bash
bash Team/ctx2skill/run.sh --help
```
Vytahuje natural-language skills z kontextu projektu. Viz [`ctx2skill/README.md`](ctx2skill/README.md).

### Reports
```bash
# unused code (Next.js/TS projekty)
npx knip --reporter markdown > Team/REPORTS/unused-code.md

# unused deps
npx depcheck > Team/REPORTS/unused-deps.md
```

## Inter-project komunikace
Tento projekt komunikuje s ostatními přes MCP — viz [`MCP-USAGE.md`](MCP-USAGE.md)
a workspace-level [`../../INTER-PROJECT-COMMS.md`](../../../INTER-PROJECT-COMMS.md).
