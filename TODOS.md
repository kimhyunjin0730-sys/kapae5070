# TODOS

## P2 — Before Purplenet Launch

### Uptime monitoring
**What:** Set up UptimeRobot (free) to ping `GET /api/notices` every 5 min, email alert on failure.
**Why:** If the VM crashes, inquiry form and waitlist fail silently — no visibility.
**Effort:** XS (human: ~5 min / CC: <5 min)
**How:** Create account at uptimerobot.com → New monitor → HTTP → `http://kapae5070.org/api/notices`

### GA4 property setup
**What:** Create GA4 property in Google Analytics console, get measurement ID.
**Why:** Implementation needs the ID before gtag code can be written.
**Effort:** XS (human: ~10 min)
**How:** analytics.google.com → Create property → Web → kapae5070.org

## P3 — Post-Launch Cleanup

### Dual-DB consolidation
**What:** Decide single source of truth for notice_board. Currently Supabase AND MySQL have separate notice_board tables.
**Why:** They can drift. Post-Purplenet, one authoritative DB is cleaner.
**Effort:** M (human: ~1 day / CC: ~30 min)
**Depends on:** Purplenet DB decision (which DB does Purplenet use?)

### Monolith refactor
**What:** Split index.html (96KB), app.js (138KB), journey_section_v2.js (42KB) into components.
**Why:** Any edit requires touching the full file. Maintenance pain post-launch.
**Effort:** L (human: ~3 days / CC: ~2 hrs)
**When:** After Purplenet validates demand — don't refactor before you know what to keep.

### CI/CD pipeline
**What:** GitHub Actions to auto-deploy to VM on push to main.
**Why:** Currently deployments are manual (git pull on server).
**Effort:** M (human: ~1 day / CC: ~30 min)
