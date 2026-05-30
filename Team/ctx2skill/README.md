# ctx2skill — sport-manager

> Self-evolving framework pro discovery natural-language skills z kontextu projektu.
> Centrální zdroj: `/Users/tm/tools/ctx2skill/` (paper: "From Context to Skills").

## Použití

```bash
# z root projektu
bash Team/ctx2skill/run.sh --help
```

`run.sh` je wrapper — volá `/Users/tm/tools/ctx2skill/run-ctx2skill.sh` s argumenty.
Pokud chceš jinou cestu (např. fork projektu), nastav `CTX2SKILL_HOME` env var:

```bash
CTX2SKILL_HOME=/path/to/your/ctx2skill bash Team/ctx2skill/run.sh ...
```

## Když se hodí v tomto projektu

- Vytvořit skill set z dlouhého technického dokumentu (např. domain spec, API docs)
- Naučit modelu, jak se v tomto projektu dělají věci, bez ručního prompt engineeringu
- Self-play loop pro discovery edge cases v business logice

Plná dokumentace: `/Users/tm/tools/ctx2skill/README.md`.
