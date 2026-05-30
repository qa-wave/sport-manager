# 06 — Inter-project — sport-manager

> Jak tento projekt komunikuje s ostatními ve workspace.
> Workspace-level přehled: [`/Users/tm/workspaces/INTER-PROJECT-COMMS.md`](../../../INTER-PROJECT-COMMS.md).
> Per-projekt MCP detaily: [`../Team/MCP-USAGE.md`](../Team/MCP-USAGE.md).

## Tento projekt volá

| Cíl | Účel | Transport |
|---|---|---|
| _(zatím žádné)_ | | |

## Tento projekt je volán

| Volající | Účel | Transport |
|---|---|---|
| _(zatím žádné)_ | | |

## Sdílené MCP servery

Viz [`../Team/MCP-USAGE.md`](../Team/MCP-USAGE.md).

## Princip izolace

Projekt **nesmí** mít sdílené závislosti (žádný symlink na cizí
`node_modules`, žádný shared module). Komunikace pouze přes definované
transporty výše.
