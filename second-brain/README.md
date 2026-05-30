# Second Brain — sport-manager

> LLM-maintained personal knowledge base na principu
> [Karpathyho LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

## Jak to funguje

1. **`raw/`** — inbox. Sem dropuj surové zdroje: articles, transkripty,
   poznámky z meetů, screenshots, libovolné markdown soubory.
2. **`wiki/`** — evergreen pages. LLM (Claude) čte `raw/`, syntetizuje
   strukturované wiki stránky s cross-references.
3. **`daily/`** — daily notes. Volitelné — pokud chceš journal.
4. **`INDEX.md`** — auto-managed index všech wiki stránek.

## Workflow

```
# 1. Drop article do raw/
echo "..." > second-brain/raw/2026-05-25-llm-architecture.md

# 2. Z Claude Code session:
#    "ingestni new files v second-brain/raw/ a updatuj wiki + INDEX"

# 3. Browse v Obsidian:
#    Open this folder as vault: projects/sport-manager/second-brain/
```

## Reference template

Plný template: `/Users/tm/tools/subagents/karpathy-second-brain/`
(skills: `/second-brain`, `/second-brain-ingest`, `/second-brain-query`, `/second-brain-lint`).
Instalace skills: `npx skills add NicholasSpisak/second-brain` (volitelné).

## Cross-project propojení

Per-projekt `second-brain/` je primárně privátní. Pro cross-project insighty:
- **Obsidian multi-vault** — `File → Open another vault` přidá další projekt.
- **`bridgememory` MCP** — sdílený memory hub viditelný napříč sessions.

## Princip

> LLM je knihovník. Ty jsi kurátor.
