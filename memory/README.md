# memory — sport-manager

> Per-projekt **working memory** pro Claude Code session. Vzor: `hermes/memory/`.

## Struktura

| Soubor / složka | Účel | Kdy číst |
|---|---|---|
| `soul.md` | Identita projektu (kdo jsme, mantinely) | Před první akcí |
| `user.md` | Profil uživatele (Tomáš) v kontextu projektu | Před první akcí |
| `agents.md` | SOPs — jak se v projektu dělají věci | Před první akcí |
| `memory.md` | Index čerstvé paměti | Před první akcí |
| `daily/` | Daily log (append-only, jedno entry per topic) | Když potřebuješ aktualní WIP |
| `decisions/` | Klíčová rozhodnutí (ADR mirror) | Při změně architektury |
| `people/` | Důležité osoby/kontakty | Když přijde komunikace mimo Tomáše |
| `projects/` | Cross-link na ostatní workspace projekty | Před inter-project akcí |

## Rozdíl proti `second-brain/` a `wiki/`

- **`memory/`** = **working memory** Claude session. Krátká, čerstvá, append-only.
- **`second-brain/`** = **LLM-synthesized knowledge base**. Drop raw, LLM synthesuje wiki pages.
- **`wiki/`** = **manuálně kurátorovaná dokumentace**. Stable, evergreen.

## Slash commands

- `/start` — load všeho výše + status report
- `/memory` — append do dnešní daily entry
