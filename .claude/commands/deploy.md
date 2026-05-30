---
description: Deploy sport-manager (dev / preview / prod)
---

# /deploy — sport-manager

### Lokální dev

\`\`\`bash
cd /Users/tm/workspaces/projects/sport-manager
npm install   # pokud chybí
npm run dev
\`\`\`

### Preview deploy (Vercel)

\`\`\`bash
cd /Users/tm/workspaces/projects/sport-manager
vercel deploy --yes
\`\`\`

### Production deploy

⚠ **Vyžaduje explicitní user souhlas přes \`/deploy prod\` (jinak ASK).**

\`\`\`bash
cd /Users/tm/workspaces/projects/sport-manager
vercel deploy --prod --yes
\`\`\`

Po deployi vrať:
- **Production URL**
- **Aliased URL**
- **Healthcheck**: \`curl -sI https://<url>/api/health\`

### Bezpečnostní pravidla

1. **Nikdy** neudělej `git push --force` proti `main`
2. **Nikdy** `vercel --prod` bez explicitního „nasaď na prod" / „deploy prod"
3. Před deployem ověř, že build projde lokálně
4. Po deployi ohlas user **Production URL + Aliased URL**
