# LinkPulse — Personal Bookmark Intelligence App

**Project Spec for Junior Engineer Onboarding**

| Field | Detail |
|-------|--------|
| Timeline | 10 working days (2 weeks) |
| Difficulty | Junior-friendly |
| Build with | Claude Code |
| Project management | Linear |
| Source control | GitHub (feature branches + PRs) |
| Code review | Greptile AI review on every PR |
| Testing | Playwright E2E + Vitest unit + pytest backend |

---

## 1. Overview

A personal bookmark manager where users save links, auto-extract metadata (title, description, image), tag and search their collection, and view a dashboard of browsing patterns. This project teaches the same stack and patterns used in our production codebase without the domain complexity.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4, TanStack Query, React Router 7 |
| Backend | Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2 (async), PostgreSQL, Alembic |
| Testing | Playwright (E2E), Vitest (frontend unit), pytest (backend unit) |
| Infra | Docker Compose (Postgres + API + Frontend) |
| CI/CD | GitHub Actions |
| Code Review | Greptile (auto-review on PRs) |
| Project Mgmt | Linear |

---

## 3. Workflow & Process

### 3.1 Linear Setup

Create a Linear project called **LinkPulse** with these issue labels:

- `setup` — project scaffolding and infra
- `backend` — API and database work
- `frontend` — UI components and pages
- `testing` — test writing and coverage
- `polish` — styling, UX, docs

Create one Linear issue per task in the sprint plan (Section 5). Each issue should have:

- Clear acceptance criteria
- Estimated points (1 = half day, 2 = full day, 3 = day and a half)
- The appropriate label

### 3.2 GitHub Workflow

**Branch strategy**: `main` (protected) + feature branches

1. For each Linear issue, create a branch: `feat/LP-{number}-short-description`
2. Commit frequently with clear messages referencing the Linear issue: `LP-123: add bookmark CRUD endpoints`
3. When the feature is complete, open a Pull Request against `main`
4. PR title format: `LP-123: Short description of change`
5. PR description must include:
   - **What**: one-sentence summary
   - **Why**: link to Linear issue
   - **How**: brief technical approach
   - **Testing**: what was tested (unit + E2E if applicable)
   - **Screenshots**: for any UI changes
6. Wait for Greptile review + CI (lint, tests, E2E) to pass before merging
7. Squash-merge to keep `main` history clean

### 3.3 Greptile Code Review

Greptile is installed on the GitHub repo and will auto-review every PR. The junior engineer should:

1. Read every Greptile comment carefully
2. Address or respond to each finding before merging
3. Use Greptile feedback as a learning tool — if it flags something you don't understand, ask Claude Code to explain it
4. Common things Greptile will catch: missing error handling, type safety gaps, security concerns, code style issues

### 3.4 E2E Testing with Playwright

Every user-facing feature must have at least one Playwright E2E test covering the happy path. Tests run automatically on every PR via GitHub Actions.

**E2E test structure**:

```
e2e/
  bookmarks.spec.ts      # CRUD operations
  tags.spec.ts           # Tag management
  search.spec.ts         # Search and filter
  dashboard.spec.ts      # Dashboard rendering
```

**Test expectations per feature**:

| Feature | Minimum E2E Coverage |
|---------|---------------------|
| Add bookmark | Submit URL, verify card appears in list with correct title |
| Edit bookmark | Change tags/notes, verify changes persist after reload |
| Delete bookmark | Delete, verify removed from list |
| Search | Type query, verify filtered results |
| Tag filter | Click tag, verify only tagged bookmarks shown |
| Dashboard | Verify charts render with data |

---

## 4. Database Schema

```sql
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL UNIQUE,
    title TEXT,
    description TEXT,
    favicon_url TEXT,
    og_image_url TEXT,
    domain TEXT,
    notes TEXT,
    is_starred BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookmark_tags (
    bookmark_id UUID REFERENCES bookmarks(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (bookmark_id, tag_id)
);

CREATE INDEX idx_bookmarks_domain ON bookmarks(domain);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at);
CREATE INDEX idx_bookmarks_is_deleted ON bookmarks(is_deleted) WHERE is_deleted = FALSE;
```

---

## 5. Sprint Plan

### Days 1-2: Project Setup + Data Model

**Linear issues**:

- **LP-1: Scaffold frontend** (2 pts, `setup`)
  - Vite + React 19 + TypeScript + TailwindCSS 4
  - React Router 7 with layout route
  - TanStack Query provider
  - Acceptance: `npm run dev` serves empty app at localhost:5173

- **LP-2: Scaffold backend** (2 pts, `setup`)
  - FastAPI app with health check endpoint
  - SQLAlchemy 2 async engine + session
  - Alembic configured with first migration (bookmarks, tags, bookmark_tags)
  - Pydantic settings for config
  - Acceptance: `GET /api/health` returns `{"status": "ok"}`

- **LP-3: Docker Compose** (1 pt, `setup`)
  - Postgres 16 container
  - Backend container with hot-reload
  - Frontend container with Vite dev server
  - Acceptance: `docker compose up` starts all services

- **LP-4: GitHub Actions CI** (1 pt, `setup`)
  - Lint + type-check frontend (`tsc --noEmit` + `eslint`)
  - Lint + type-check backend (`ruff` + `mypy`)
  - Run pytest and vitest
  - Run Playwright E2E (initially just a smoke test)
  - Greptile integration enabled on the repo
  - Acceptance: CI runs on every PR, blocks merge on failure

### Days 3-4: Core CRUD API

**Linear issues**:

- **LP-5: POST /api/bookmarks** (2 pts, `backend`)
  - Accept URL, fetch metadata with `beautifulsoup4` + `httpx`
  - Extract: title, meta description, og:image, favicon, domain
  - Save to Postgres, return bookmark object
  - Handle duplicate URL (409 Conflict)
  - Handle unreachable URL gracefully (save with URL only)
  - Acceptance: curl POST with URL returns bookmark with extracted metadata

- **LP-6: GET /api/bookmarks** (2 pts, `backend`)
  - Paginated list (limit/offset)
  - Filter by: tag, starred, search query (title/description ILIKE)
  - Sort by: created_at desc (default), title asc
  - Exclude soft-deleted
  - Acceptance: returns paginated results with total count

- **LP-7: GET/PATCH/DELETE single bookmark** (2 pts, `backend`)
  - GET: return bookmark with tags
  - PATCH: update notes, is_starred, tags (replace strategy)
  - DELETE: soft-delete (set is_deleted = true)
  - Acceptance: full CRUD lifecycle works via curl

- **LP-8: Backend unit tests** (1 pt, `testing`)
  - pytest fixtures for async DB session
  - Tests for each endpoint (happy path + edge cases)
  - Acceptance: `pytest` passes with >80% coverage on routes

### Days 5-7: Frontend — List + Add + Detail

**Linear issues**:

- **LP-9: Layout shell** (1 pt, `frontend`)
  - Sidebar: nav links (Bookmarks, Tags, Dashboard)
  - Top bar: search input + "Add Bookmark" button
  - Responsive: sidebar collapses on mobile
  - Acceptance: navigation between routes works

- **LP-10: Bookmark list view** (2 pts, `frontend`)
  - Card grid layout: og:image thumbnail, title, domain, tags, star icon
  - Loading skeleton, empty state, error state
  - TanStack Query for data fetching with stale-while-revalidate
  - Acceptance: bookmarks display as cards, loading states render

- **LP-11: Add Bookmark modal** (2 pts, `frontend`)
  - Paste URL, click "Fetch" to preview metadata before saving
  - Add/select tags inline
  - Submit calls API, invalidates bookmark list cache
  - Acceptance: add a bookmark via UI, see it appear in list

- **LP-12: Bookmark detail/edit drawer** (2 pts, `frontend`)
  - Click card to open side drawer with full details
  - Edit notes (textarea), toggle starred, manage tags
  - Delete with confirmation dialog
  - Acceptance: edit + delete work, changes reflect immediately

- **LP-13: Search and filter** (1 pt, `frontend`)
  - Debounced search input (300ms) filters via API query param
  - Tag chip filter (click tag to filter)
  - Starred filter toggle
  - Acceptance: search narrows results, filters combine correctly

- **LP-14: E2E tests — core flows** (2 pts, `testing`)
  - Playwright tests for: add bookmark, edit bookmark, delete bookmark, search
  - Use Playwright fixtures to seed test data via API before each test
  - Acceptance: `npx playwright test` passes for all core flows

### Days 8-9: Dashboard + Tags

**Linear issues**:

- **LP-15: Tag management page** (2 pts, `frontend`)
  - List all tags with bookmark count
  - Create tag (name + color picker)
  - Rename and delete tag (with confirmation)
  - API endpoints: `GET/POST /api/tags`, `PATCH/DELETE /api/tags/{id}`
  - Acceptance: full tag CRUD works in UI

- **LP-16: Dashboard page** (2 pts, `frontend`)
  - Total bookmarks count, total tags, bookmarks this week
  - Top 10 domains bar chart (recharts)
  - Bookmarks over time line chart (last 30 days)
  - Tag distribution pie chart
  - API endpoint: `GET /api/stats`
  - Acceptance: dashboard renders with live data from API

- **LP-17: E2E tests — tags + dashboard** (1 pt, `testing`)
  - Tag CRUD E2E test
  - Dashboard renders charts with seeded data
  - Acceptance: `npx playwright test` passes for tags and dashboard

### Day 10: Polish + Deploy

**Linear issues**:

- **LP-18: UX polish** (2 pts, `polish`)
  - Keyboard shortcut: Cmd/Ctrl+K opens search
  - Toast notifications for actions (saved, deleted, error)
  - Smooth transitions between views
  - Favicon in browser tab
  - Acceptance: app feels responsive and polished

- **LP-19: README + docs** (1 pt, `polish`)
  - Setup instructions (Docker Compose + manual)
  - Architecture overview (frontend/backend/db diagram)
  - API documentation (endpoint list with request/response examples)
  - Acceptance: a new developer can set up the project from README alone

- **LP-20: Final E2E pass + deployment** (1 pt, `polish`)
  - All Playwright tests green
  - Docker Compose production build works
  - Optional: deploy to Railway
  - Acceptance: full test suite passes, app runs in production mode

---

## 6. GitHub Actions CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: linkpulse_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -e ".[dev]"
        working-directory: backend
      - run: ruff check .
        working-directory: backend
      - run: pytest --cov=app --cov-report=term
        working-directory: backend
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/linkpulse_test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm ci
        working-directory: frontend
      - run: npx tsc --noEmit
        working-directory: frontend
      - run: npx eslint .
        working-directory: frontend
      - run: npx vitest run
        working-directory: frontend

  e2e:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    steps:
      - uses: actions/checkout@v4
      - run: docker compose -f docker-compose.test.yml up -d --wait
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
        working-directory: e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

---

## 7. Greptile Setup

1. Install Greptile on the GitHub repo (greptile.com — connect repo)
2. Greptile will automatically review every PR with AI-powered code review
3. Configure Greptile to check for:
   - Type safety and missing error handling
   - SQL injection and security concerns
   - Missing tests for new endpoints or components
   - Code style consistency

**Expected workflow per PR**:

```
Developer opens PR
  -> GitHub Actions runs (lint, unit tests, E2E tests)
  -> Greptile posts AI review comments
  -> Developer addresses all findings
  -> Tests pass + Greptile findings resolved
  -> Squash-merge to main
```

---

## 8. Claude Code Development Workflow

For each Linear issue, follow this loop:

1. **Start**: move the Linear issue to "In Progress"
2. **Branch**: `git checkout -b feat/LP-{n}-description`
3. **Implement with Claude**: describe the feature in plain English
4. **Review Claude's output**: read every line, ask Claude to explain anything unclear
5. **Write tests**: ask Claude to write pytest/vitest/playwright tests for the feature
6. **Run locally**: verify it works end-to-end in the browser
7. **Open PR**: push branch, open PR with the required format (Section 3.2)
8. **Address feedback**: fix any Greptile findings and CI failures
9. **Merge**: squash-merge after green CI + resolved reviews
10. **Close**: move Linear issue to "Done"

### Useful Claude Code prompts

```
# Scaffolding
"scaffold a FastAPI backend with async SQLAlchemy 2, Alembic, and Pydantic v2 settings"
"scaffold a React 19 + TypeScript + Vite + TailwindCSS 4 frontend with TanStack Query and React Router 7"

# Implementation
"implement the bookmark list API endpoint with pagination, tag filtering, and search"
"create a BookmarkCard component that shows the og:image, title, domain, and tags"

# Testing
"write Playwright E2E tests for the add-bookmark flow: paste URL, fetch preview, save, verify it appears in the list"
"write pytest tests for the bookmark CRUD endpoints using an async test database"

# Learning
"explain how TanStack Query cache invalidation works in this component"
"explain the SQLAlchemy async session pattern used in this endpoint"

# Debugging
"the Playwright test for add-bookmark is failing — the card doesn't appear after submit. Help me debug"
```

---

## 9. Learning Objectives

By completing this project, the junior engineer will have practiced:

| Skill | Where in Project |
|-------|-----------------|
| FastAPI async endpoints + Pydantic schemas | Backend CRUD (LP-5 through LP-7) |
| SQLAlchemy 2 async + Alembic migrations | Database layer (LP-2, LP-5) |
| React 19 + TypeScript component patterns | All frontend views (LP-9 through LP-13) |
| TanStack Query (queries, mutations, cache) | All data fetching (LP-10 through LP-13) |
| TailwindCSS 4 responsive design | All UI (LP-9, LP-18) |
| Playwright E2E test writing | Test suite (LP-14, LP-17, LP-20) |
| pytest async testing | Backend tests (LP-8) |
| Docker Compose multi-service dev | Infrastructure (LP-3) |
| GitHub Actions CI/CD pipelines | CI setup (LP-4) |
| GitHub PR workflow with CI gates | Every feature branch |
| AI code review with Greptile | Every PR |
| Claude Code as development accelerator | Every task |
| Linear project management | Full sprint |

---

## 10. Stretch Goals (if finished early)

- JWT authentication with `python-jose` + login/register pages
- Browser extension (Chrome) to save current tab with one click
- Import/export bookmarks as JSON
- Full-text search using PostgreSQL `tsvector`
- Reading list mode with "mark as read" functionality
- Share a bookmark collection via public link
