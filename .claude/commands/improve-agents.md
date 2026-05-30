---
description: Auto-vylepsi .claude/agents/*.md per projekt (regeneruje polish bloky)
---

# /improve-agents — auto-vylepsovani agentu

Spousti centralni polish skript, ktery regeneruje "Specializace v sport-manager",
"Priklady ukolu", "Preferovane MCP" a "Anti-patterns" sekce v kazdem
`.claude/agents/*.md`.

## Run

```bash
python3 /Users/tm/workspaces/bin/polish-agents.py sport-manager
```

## Co se stane

1. Skript precte `.claude/agents/*.md` (jen tento projekt)
2. Pro kazdy agent najde nebo prida marker `<!-- POLISH-V1:START -->` ... `<!-- POLISH-V1:END -->`
3. Mezi markery vlozi cerstve vygenerovany blok ze:
   - **PROJECT_CONTEXT[sport-manager]** v polish-agents.py (domena, stack, pravidla)
   - **AGENT_LIB[<agent-name>]** (priklady ukolu, MCP, anti-patterns)
4. Bezpecne — idempotentni, neprepisuje obsah mimo markery

## Update knihovny

Pokud chces upravit:

- **Per-projekt kontext** (domena, stack, pravidla): edituj `PROJECT_CONTEXT` dict v
  `/Users/tm/workspaces/bin/polish-agents.py`
- **Per-agent-type sablonu** (priklady, MCP, anti-patterns): edituj `AGENT_LIB` dict

Pak spust znovu `/improve-agents` (nebo `python3 polish-agents.py`).

## Ctx2Skill integration

Pro experimentaci s **automatickym discovery** specializaci pres ctx2skill:

```bash
# Vstup: agent definice + wiki/01-DOMAIN.md -> Output: navrzene skill updaty
bash Team/ctx2skill/run.sh selfplay_loop.py \
  --input <(cat .claude/agents/*.md wiki/01-DOMAIN.md) \
  --output Team/REPORTS/skills-discovered.jsonl \
  --num-iterations 3
```

(Vyzaduje OPENAI_API_KEY v env. Vystup nejsou hned aplikovany — review manualne.)

## Aktualne polishuje

Vsechny soubory v `.claude/agents/` krome `README.md` a `INDEX.md`.
