# agents.md — SOPs pro sport-manager

> Jak se v tomto projektu dělají věci. Mirror `Team/PROJECT-ROLES.md` + project-specific operativa.

## Default behavior

**Pravidlo č. 1**: před první akcí přečti `memory/soul.md` + `memory/user.md` + `memory/memory.md`.

**Pravidlo č. 2**: pokud má úkol tvar „udělej X", zeptej se v hlavě: *Můžu udělat alespoň 30 % bez doptávání?*
Pokud ano → dělej. Pokud ne → vrať konkrétní 1–2 otázky (ne 5).

## Delegování na agenty

Plná tabulka v `Team/PROJECT-ROLES.md`. Quick reference:

- **Architektonická rozhodnutí** → `softwarovy-architekt`
- **Frontend implementace** → `frontend-vyvojar`
- **Backend / API / DB** → `backend-vyvojar`
- **QA, testy, regrese** → `qa-tester`
- **Bezpečnost** → `security-specialista`
- **Deploy, CI/CD, infra** → `devops-inzenyr`
- **Kontextový brainstorm bez konkrétního agenta** → `general-purpose`
- **>3 grep/find** → `Explore`

**Paralelizuj** nezávislé úkoly. Jeden message → více `Agent` volání naráz.

## MCP nástroje

Viz `Team/MCP-USAGE.md`. Always-on: `context7`, `sequential_thinking`, `bridgememory`.

## Bezpečnostní allow/ask/deny

Definováno v `.claude/settings.local.json`. Klíčové:

- **Auto-allow**: `ls`, `cat`, `grep`, `git status/diff/log`, `npm run`, `vercel logs`
- **Ask**: `rm`, `git push`, `vercel deploy --prod`, `vercel env add`
- **Deny**: `git push --force`, `rm -rf /`, `sudo`, `dd`, `mkfs`

## Když Tomáš řekne „deploy"

Viz `.claude/commands/deploy.md` (slash `/deploy`).

## Když Tomáš řekne „test"

Viz `.claude/commands/test.md` (slash `/test`).
