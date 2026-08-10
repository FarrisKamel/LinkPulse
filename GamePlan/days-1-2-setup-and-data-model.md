# Days 1–2 — Project Setup + Data Model

Game plan for the first sprint block: **LP-1 through LP-4**.
Scope is the walking skeleton and the gates around it. No product features.

---

## 1. Already done (groundwork, pre-LP-1)

| Item | State |
|------|-------|
| Local git repo, `main` branch | Done — baseline commit `78a3370` |
| `.gitignore` (Python, Node, Playwright, env, macOS) | Done — written before first commit, so nothing junk is in history |
| GitHub repo `FarrisKamel/LinkPulse` | Done — public |
| `main` branch protection | Done — ruleset `protect-main`, verified by a rejected push (`GH013`) |

**Why the repo is public:** branch protection and rulesets are not available on
private repos for free GitHub accounts. Public was chosen over paying for Pro.
Nothing in this project is sensitive.

---

## 2. Environment prerequisites

Checked on this machine:

| Tool | Found | Needed | Note |
|------|-------|--------|------|
| git | 2.50.1 | any | OK |
| `gh` | authed as `FarrisKamel` | `repo` + `workflow` scopes | Both present. `workflow` is required to push `.github/workflows/` — without it LP-4 fails at `git push` |
| Python | 3.12.2 | 3.12+ | OK |
| Node | v23.6.1 | 22 in CI | **Mismatch.** See risk R-2 |
| Docker | **NOT INSTALLED** | required | **Blocker.** See risk R-1 |

**Action before LP-2:** install Docker Desktop.

---

## 3. The four tickets

### LP-1 — Scaffold frontend · 2 pts · `setup`
- Vite + React 19 + TypeScript + TailwindCSS 4
- React Router 7 with a layout route
- TanStack Query provider
- **Acceptance:** `npm run dev` serves an empty app at `localhost:5173`
- **Depends on:** nothing. Can start immediately.

### LP-2 — Scaffold backend · 2 pts · `setup`
- FastAPI app with health check endpoint
- SQLAlchemy 2 async engine + session
- Alembic configured, first migration (`bookmarks`, `tags`, `bookmark_tags`)
- Pydantic settings for config
- **Acceptance:** `GET /api/health` returns `{"status": "ok"}`
- **Depends on:** a running Postgres — see §4.

### LP-3 — Docker Compose · 1 pt · `setup`
- Postgres 16 container
- Backend container with hot-reload
- Frontend container with Vite dev server
- **Acceptance:** `docker compose up` starts all services
- **Depends on:** LP-1 and LP-2 existing (it containerises them).

### LP-4 — GitHub Actions CI · 1 pt · `setup`
- Frontend: `tsc --noEmit` + `eslint`
- Backend: `ruff` + `mypy`
- `pytest` + `vitest`
- Playwright E2E (smoke test only at this stage)
- Greptile enabled on the repo
- **Acceptance:** CI runs on every PR and blocks merge on failure
- **Depends on:** everything above.

---

## 4. Execution order — and one deviation from the spec

The spec lists these LP-1 → LP-2 → LP-3 → LP-4. That order has a
**circular dependency** in the middle:

- LP-2 requires a first Alembic migration to be applied. Applying a migration
  requires a live Postgres.
- Postgres is delivered by LP-3.
- But LP-3 also containerises the backend, which doesn't exist until LP-2.

So LP-3 cannot come strictly before *or* strictly after LP-2. **Split it:**

| Step | Ticket | What |
|------|--------|------|
| 1 | LP-1 | Frontend scaffold. Fully independent — do it first while Docker downloads. |
| 2 | LP-3a | `docker-compose.yml` with **Postgres only**. Unblocks LP-2. |
| 3 | LP-2 | Backend scaffold + Alembic migration, run against the LP-3a Postgres. |
| 4 | LP-3b | Add backend + frontend services to compose. Completes LP-3. |
| 5 | LP-4 | CI. Last, because it runs everything above. |

LP-3 stays one Linear issue; it just lands in two commits on one branch.

---

## 5. Decisions log

**Branch protection: `required_approving_review_count: 0`.**
GitHub does not permit approving your own PR. Requiring 1 approval on a
solo repo is an unbreakable deadlock. Zero still forces a PR through.

**Branch protection: no required status checks yet.**
Required checks match by *name*, and GitHub waits indefinitely for a check
that never reports. Naming `backend` / `frontend` / `e2e` before LP-4 exists
would hang every PR — including the PR that adds them.
→ **Add required status checks immediately after LP-4 merges.** Do not skip.

**Branch protection: `required_review_thread_resolution: true`.**
This is what makes spec §3.3 binding — Greptile findings must be *resolved*,
not merely read, before merge is possible.

**Commit prefix.** Baseline commit used `chore:` because it predates every
ticket. From LP-1 onward: `LP-n: description`, per spec §3.2.

---

## 6. Risks and open questions

| ID | Risk | Impact | Action |
|----|------|--------|--------|
| R-1 | Docker not installed | Blocks LP-2 and LP-3 | Install Docker Desktop before LP-2 |
| R-2 | Local Node v23 vs CI Node 22 | Code that runs locally can fail in CI | Pin via `.nvmrc` at LP-1; match CI to it |
| R-3 | No Linear tooling connected | §3.1 issues can't be auto-filed; ticket discipline is a §9 learning objective | Decide: manual UI, drafted text/CSV import, or drop Linear |
| R-4 | Greptile not yet installed on repo | LP-4 acceptance includes it; PR review gate is inert without it | Install at greptile.com during LP-4 |

**Forward risks — decide now, cheap; retrofit later, expensive:**

| ID | Issue | Why it matters here |
|----|-------|---------------------|
| F-1 | Metadata scraper makes real outbound HTTP | LP-14 seeds test data via the API, so E2E tests would depend on third-party sites being up → flaky CI. The scraper must be **injectable/stubbable**. Design that seam in LP-2, not LP-5. |
| F-2 | Schema has no `user_id` | Fine for single-user scope, but the §10 JWT stretch goal then requires migrating every table and query. Decide at LP-2 whether to leave a seam. |
| F-3 | `recharts` drives LP-16 but is absent from the §2 stack table | Spec inconsistency, harmless — note it |

---

## 7. Definition of done — Days 1–2

- [ ] `npm run dev` serves the frontend at `localhost:5173`
- [ ] `GET /api/health` returns `{"status": "ok"}`
- [ ] `docker compose up` brings up Postgres + backend + frontend
- [ ] Alembic migration creates all three tables
- [ ] CI runs on every PR: lint, type-check, unit tests, E2E smoke
- [ ] Required status checks enabled on `main` **after** LP-4 merges
- [ ] Greptile installed and reviewing PRs
- [ ] Four PRs merged to `main`, one per ticket, each squash-merged
