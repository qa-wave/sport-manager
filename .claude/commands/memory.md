---
description: Append do dnešní daily memory (memory/daily/YYYY-MM-DD.md)
---

# /memory — append daily entry

Append do `memory/daily/$(date -u +%Y-%m-%d).md`.

Pokud soubor neexistuje, vytvoř ho s header:

```md
# $(date -u +%Y-%m-%d) — sport-manager

```

Pak append jeden entry:

```md
## HH:MM — <topic>

<obsah>
```

Po append updatuj `memory/memory.md` index (přidej řádek pokud daný den ještě není).
