---
description: Spusť test stack pro sport-manager
---

# /test — sport-manager

\`\`\`bash
cd /Users/tm/workspaces/projects/sport-manager
npm run typecheck    # TypeScript check
npm test             # Vitest unit
npm run test:e2e     # Playwright E2E (pokud existuje)
\`\`\`

Všechny tři musí projít.

### Po úpravě kódu

Vždy pusť tento blok před commitem. Pokud něco padne, nevracej se zpět — oprav a re-test.
