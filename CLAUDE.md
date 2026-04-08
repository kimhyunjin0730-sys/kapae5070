# CLAUDE.md

## gstack

gstack is installed at `~/.claude/skills/gstack`. It provides 36 skills for planning, building, reviewing, testing, and shipping code.

### Available skills

**Planning**
- `/office-hours` — YC Office Hours: startup diagnostic + builder brainstorm
- `/plan-ceo-review` — CEO-level plan review
- `/plan-eng-review` — Engineering plan review
- `/plan-design-review` — Design plan review
- `/plan-devex-review` — Developer experience plan review
- `/autoplan` — Auto-review pipeline: CEO → design → eng

**Building**
- `/design-consultation` — Design system from scratch
- `/design-shotgun` — Visual design exploration
- `/design-html` — HTML design generation
- `/design-review` — Design audit + fix loop
- `/devex-review` — Developer experience review

**Review & QA**
- `/review` — PR review
- `/qa` — QA testing with browser automation
- `/qa-only` — QA report only (no fixes)
- `/investigate` — Systematic root-cause debugging
- `/cso` — OWASP Top 10 + STRIDE security audit

**Shipping**
- `/ship` — Full ship workflow
- `/land-and-deploy` — Merge → deploy → canary verify
- `/canary` — Post-deploy monitoring loop
- `/benchmark` — Performance regression detection
- `/document-release` — Post-ship doc updates

**Utilities**
- `/browse` — Headless browser for QA and dogfooding
- `/open-gstack-browser` — Launch GStack Browser
- `/pair-agent` — Cross-agent coordination
- `/retro` — Retrospective
- `/learn` — Save and recall learnings
- `/careful` — Careful mode for risky operations
- `/checkpoint` — Save a checkpoint
- `/freeze` / `/unfreeze` — Freeze/unfreeze skill updates
- `/guard` — Guard mode
- `/health` — Health dashboard
- `/gstack-upgrade` — Upgrade gstack
- `/setup-deploy` — One-time deploy config
- `/setup-browser-cookies` — Browser cookie setup
- `/codex` — Multi-AI second opinion via OpenAI Codex

### Upgrade

```bash
cd ~/.claude/skills/gstack && git pull
```

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
