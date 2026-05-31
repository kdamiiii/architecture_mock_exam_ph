# Handoff: Architecture Board Review — Self-Quiz Web App

## Overview
A web app for architecture students to drill themselves with multiple-choice questions
from mock exams while preparing for their board exams. A user builds a **review session**
by choosing a **Source → Category → Mode**, answers a paginated set of questions, and gets a
scored results page. Recent scores, history, and weak-area analysis are tracked locally.

The app has **three primary screens** — Dashboard (home), Quiz, Results — plus three secondary
screens reachable from the sidebar (Score History, Weak Areas, Settings).

## About the Design Files
The files in `app/` are a **complete, working reference prototype** built in plain
**HTML + CSS + vanilla JavaScript** (no framework, no build step, no network calls — it runs by
double-clicking `index.html`). Treat them as **the design + behavior spec**, not necessarily the
final production code.

Your task is to **recreate this design and behavior in the target codebase's environment** (React,
Vue, Svelte, etc.) using its established patterns, component library, and state management. If there
is **no existing codebase yet**, you may either (a) ship this vanilla version as-is — it is
functional and self-contained — or (b) port it to the most appropriate framework for the project.
The prototype is intentionally dependency-free so either path is easy.

Everything persists to **`localStorage`** (no backend). If the target app has a backend/accounts,
the score/session/name storage is the natural seam to swap for API calls (see **State Management**).

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, layout, and interactions are all
specified here and implemented in the prototype. Recreate the UI to match. Exact hex values, fonts,
and measurements are listed under **Design Tokens**.

---

## Screens / Views

### 1. Dashboard (Home) — route `#/dashboard`
- **Purpose:** Build a new review session and review standings.
- **Layout:** Two-column app shell. Fixed **204px navy sidebar** on the left (sticky, full height);
  flexible **main column** on the right. Main column = a 4px navy top accent bar, a white **page
  header** (title + date), then a **page body** with `28px 36px` padding.
  - **Stat strip:** full-width grid of 4 equal cells, 1px hairline gaps (`background:var(--line)`
    behind a 1px gap grid), each cell white with a uppercase micro-label + large serif value.
  - **Dashboard grid:** CSS grid `1.35fr 1fr`, `26px` gap, `align-items:start`.
    - **Left panel "Build a Session":** white card, 1px border. Header row. Body contains three
      build steps (Source / Category / Mode), each with a roman-numeral marker + uppercase label,
      then a full-width navy "Begin Review · 45 items" button.
    - **Right panel "Recent Scores":** white card. Header with "Top 10" micro-label. Body is a list
      of ranked rows (rank numeral, category name + mode tag + source, score `NN / 45` + percent).
  - If a session is **in progress**, a gold-left-border resume banner appears above the stat strip.
- **Components:**
  - **Source tiles** (2-up grid): white tile, 1px border, name (14px/600) + sub ("1,240 items",
    12px slate). Selected state: navy border + inset navy ring + a 7px gold dot top-right.
  - **Category chips** (wrap, 8px gap): pill-ish 2px-radius chips, 1px border. Selected: navy fill,
    white text. Six categories (see data).
  - **Mode tiles** (3-up grid): same tile style as source. Below them a **gold-tinted blurb box**
    (`--gold-soft` bg, 2px gold left border) explains the selected mode.
  - **Begin Review button:** navy, uppercase 13px/600, gold right arrow.
  - **Stat tiles:** "Sessions" (count), "Avg. Score" (avg %), "Best" (max %), "Items Seen" (sum of
    all questions answered across sessions).
  - **Score row:** rank (serif, gold + bold for #1), category name (13.5px/600), mode tag + short
    source under it, right-aligned serif score `NN / 45` with percent beneath.

### 2. Quiz — route `#/quiz`
- **Purpose:** Answer the session's questions, 15 per page.
- **Layout:** Centered column `max-width:840px`. Top **quiz-meta bar** (route name + mode tag +
  source on the left; "Answered N / 45" and, in Timed mode, a "Time left" countdown on the right).
  A **pager bar** above the cards, the 15 **question cards**, a **second identical pager bar** below,
  then a **quiz-actions row** (answered count + "Submit Exam" button).
- **Question card (the "Quiz B" treatment):** white card, 1px border, `display:flex`.
  - A **4px vertical rule** on the far left — **gold** by default, turns **navy** once the question
    is answered.
  - **Body** padded `20px 22px`. Contains:
    - **`?` button** top-right: 30px circle, 1px border, serif "?". Hover → gold. Active/open →
      gold fill, white "?". Toggles the explanation panel.
    - **Head row:** large serif question number (30px/700 navy) + uppercase category micro-label.
    - **Question text:** serif, 18px/500, line-height 1.42, right-padded 36px to clear the `?`.
    - **Options:** vertical stack, 9px gap. Each option is a **fully-rounded pill** (border-radius
      30px), 1px border, with a 25px circular **letter badge** (A–D) + label. Hover → navy border +
      paper bg. Selected → navy border, inset navy ring, navy-filled letter badge. Tapping a selected
      option again **clears** it.
    - **Explanation panel** (only when `?` is toggled on): gold-soft background, dashed gold top
      border. Shows "Answer · B — <correct option>" (uppercase gold-deep label) then the explanation
      paragraph.
- **Pager:** inline bordered control with three segments — **Back** (shows previous range, e.g.
  "1 – 15"), a **middle** segment showing the current range (serif, paper bg), and **Next** (shows
  next range, e.g. "31 – 45"). Back/Next are disabled (32% opacity) at the ends and show "—".
  Each button has a tiny uppercase direction label over a bold range number. **There are two pagers,
  one above and one below the 15 cards**, both functional.
- **Timed mode:** a `M:SS` countdown in the meta bar starting at **45:00**. Turns red under 60s.
  At 0:00 the exam **auto-submits**.

### 3. Results — route `#/results`
- **Purpose:** Show the score and review every question with correct/incorrect marking.
- **Layout:** Same centered 840px column. A **navy results hero** at top, then the same pager +
  15 result cards + pager + actions (Back to Dashboard / Retake Session).
- **Results hero (navy `--navy` block):**
  - **Top region** (`28px 32px`): left = giant serif score `19` with a muted `/45` and a gold
    percent (`42%`). Right = category (serif 18/600), a row with mode tag + source + a **verdict
    pill** ("Passed" green / "Below 70%" red), and — in **Right − Wrong** mode — a "Net (right −
    wrong): +NN" line.
  - **Breakdown strip:** 4 cells separated by hairlines — **Correct** (green value), **Incorrect**
    (red value), **Unanswered**, **Time taken** (`M:SS`).
- **Result card:** identical structure to the quiz card, but **read-only** and color-coded:
  - Card status drives the left rule color: **green** if correct, **red** if the user's pick was
    wrong, **slate** if unanswered. A status badge ("Correct" / "Incorrect" / "Unanswered") sits
    top-right of the head row.
  - **Options:** the correct option is always **green** (green bg + green letter badge + "Correct"
    tag). If the user picked a wrong option, that option is **red** (red bg + red badge + "Your pick"
    tag). Other options stay neutral.
  - The `?` still toggles the explanation panel per card.
- **Pass threshold:** **70% accuracy** (correct / total).

### 4. Score History — route `#/history`
- Full-width white **table** of every completed attempt, most recent first.
- Columns: Category · focus, Source (short), Mode (tag), Score (`NN / 45`, serif), Accuracy (%, plus
  "(net ±N)" for Right − Wrong attempts), Date.
- Empty state when no attempts.

### 5. Weak Areas — route `#/weak`
- One **weak-row** per category, **sorted ascending by average accuracy** (weakest first;
  never-attempted categories sink to the bottom).
- Each row: category name (serif), a thin **progress bar** whose width = avg accuracy and whose
  color is **red < 60%, gold 60–69%, green ≥ 70%**, a sub-line ("N attempts · average accuracy"), a
  right-aligned big serif percent, and a **"Drill →"** button that immediately starts a session
  focused on that category.

### 6. Settings — route `#/settings`
- **Examinee card:** text input for the display name (shown in the sidebar footer) + Save button
  with a transient "Saved ✓" flash.
- **Danger card** (red-accented): "Clear score history" and "Reset everything" buttons, both behind
  a `confirm()`.

### App shell (all screens)
- **Sidebar:** navy `--navy`. Brand block "ABR." (the "." is gold) + "Review Terminal" sub. Nav
  items: **New Session, Score History, Weak Areas, Settings**, each with a simple 16px line icon.
  Active item: gold-tinted bg + 2px gold left border + white text. Footer shows the examinee name +
  "Board Review · 2026". Collapses to a 62px icon rail under 680px.

---

## Interactions & Behavior
- **Routing:** hash-based (`#/dashboard`, `#/quiz`, `#/results`, `#/history`, `#/weak`,
  `#/settings`). `hashchange` re-renders. Guards: `#/quiz` requires an unfinished session; `#/results`
  requires a finished session — otherwise redirect to dashboard.
- **Building a session:** clicking source/category/mode updates `state.build` and re-renders the
  dashboard so selection states reflect immediately. "Begin Review" creates the session and routes
  to the quiz.
- **Session construction:** the question bank (45 items) is shuffled, then stably re-sorted so the
  **selected category's questions lead**, then sliced to `SESSION_LEN = 45`. Result: a comprehensive
  45-item mock with the chosen category up front, which guarantees the 3-page (15×3) pager.
- **Answering:** click an option to select; click the same option again to clear it. Selection is
  saved to the session on every change. Targeted DOM updates (not a full re-render) keep scroll
  position and the running "answered" counters in sync.
- **`?` reveal:** toggles a per-question `revealed` flag and injects/removes the explanation panel
  in place (also persisted, so it survives navigation).
- **Pagination:** `PER_PAGE = 15`. Page index stored on the session (quiz) or in `state.resultsPage`
  (results). Changing page re-renders and scrolls to top.
- **Submit:** `confirm()` (warns about unanswered items if any), then scores and routes to results.
- **Timed auto-submit:** a 1s interval updates the countdown; at 0 it submits automatically and the
  results hero shows a "Time expired" note.
- **Retake / Drill:** start a fresh session with the same (retake) or chosen (drill) category.
- **Animations:** view container has a subtle 0.25s **transform-only** slide-in
  (`@keyframes fade` animates `translateY(5px)→0`; opacity is intentionally *not* animated so content
  is never left invisible if the tab is throttled). Buttons/tiles/options use 0.13–0.18s transitions.
- **Responsive:** dashboard grid and breakdown collapse to single/2-col under 880px; sidebar
  collapses to icons under 680px.

## State Management
All state is plain JS + `localStorage`. Keys:
- **`abr_scores`** — array of attempt records:
  `{ id, source, category, categoryName, mode, modeName, correct, wrong, blank, total, net, pct, date }`.
- **`abr_session`** — the current/last session:
  `{ source:{id,name}, category:{id,name}, mode:{id,name}, qIds:[...], answers:{qId:optIndex},
     revealed:{qId:bool}, page, startTime, durationSec|null, finished, elapsedSec, result:{...} }`.
- **`abr_name`** — examinee display name.
- **`abr_seeded`** — flag so sample scores seed only once on first run.

In-memory `state = { route, build:{source,category,mode}, resultsPage }`.

**Derived data:** `recentScores()` (sort by pct desc, then date desc), `computeStats()`
(sessions / avg pct / best pct / total items), `weakAreas()` (avg pct per category, ascending).

**Backend seam:** if porting to an app with accounts, replace the `load`/`save`/`del` helpers
(scores, session, name) with API calls. Scoring, pagination, and rendering stay unchanged.

## Scoring rules
- **Normal:** +1 per correct, 0 for wrong/blank. Headline score = correct / total.
- **Right − Wrong:** +1 correct, −1 wrong, 0 blank. Headline still correct / total; the **net**
  (correct − wrong) is shown separately on the hero and in history.
- **Timed:** scored like Normal, but the 45:00 clock auto-submits at zero.
- **Pass:** accuracy (correct / total) ≥ **70%**.

## Design Tokens
**Colors**
```
--navy        #0a2540   (sidebar, primary buttons, headings, results hero)
--navy-700    #14324f   (button hover)
--navy-600    #1e3a5f   (secondary navy, borders on hover)
--navy-800    #072037
--gold        #b08d57   (accent: rules, dots, arrows, active states)
--gold-deep   #967340   (gold text on light)
--gold-soft   #faf6ef   (gold-tinted panels)
--gold-line   #e3d6c2   (gold-tinted borders)
--ink         #16202e   (body text)
--slate       #5b6b7e   (secondary text)
--slate-2     #8794a3   (tertiary text)
--line        #e4e7ec   (hairline borders)
--line-2      #eef0f3   (lighter row dividers)
--bg          #ffffff   (cards / panels)
--paper       #f7f6f3   (app background)
--paper-2     #f1efe9
--green       #1f6b4a   --green-bg #eaf3ee   --green-line #cfe3d7   (correct)
--red         #9b2c2c   --red-bg   #f8eded   --red-line   #ecd4d4   (incorrect)
```
**Typography**
- **Headers / numbers / question text:** `Source Serif 4` (Google Fonts), weights 400–700,
  italic used for roman-numeral step markers and section labels.
- **Body / UI:** `Public Sans` (Google Fonts), weights 400–700.
- Base body 15px / line-height 1.5. Micro-labels: 11px, letter-spacing 0.14em, uppercase, 600.
- Notable sizes: page title 23px, panel header 18px (serif), question text 18px (serif),
  question number 30px (serif/700), results score 58px (serif/700).

**Spacing / shape**
- Sidebar width 204px (62px collapsed). Page body padding 28px×36px. Card padding ~20–22px.
- Panel/card border radius **0** (sharp, editorial). Option pills border-radius **30px**. Chips 2px.
- Pager segments separated by 1px borders. Stat strips use 1px hairline grid gaps.
- Section gaps: dashboard grid 26px; cards 14px; option stack 9px.

**Mode tags**
- Neutral (Normal): slate text, hairline border.
- `rw` (Right − Wrong): gold-deep text, gold-line border, gold-soft bg.
- `timed`: navy-600 text, blue-tinted bg `#f2f6fa`.

## Assets
- **Fonts:** Google Fonts — `Source Serif 4` and `Public Sans` (loaded via `<link>` in
  `index.html`). Use the codebase's own font-loading mechanism when porting.
- **Icons:** four tiny inline-SVG line icons (play-in-square, clock, bar chart, sliders) defined in
  `app.js` (`ICONS`). Replace with the codebase's icon set if it has one.
- **No images, no logos** (per the design brief — the "ABR." wordmark is type only).
- **Question content** lives in `app/questions.js` — 45 sample architecture questions with
  explanations (Philippine board context: NBC/PD 1096, RA 9266, BP 344). **This is placeholder
  content meant to be replaced** with the real question bank. Format is documented at the top of the
  file: `{ id, cat, q, options:[A,B,C,D], answer:<0–3>, explain }`. `SOURCES`, `CATEGORIES`, and
  `MODES` metadata are defined there too.

## Files
- `app/index.html` — shell: font links, `#app` mount, loads `questions.js` then `app.js`.
- `app/styles.css` — all styles and design tokens (`:root` variables at top).
- `app/app.js` — state, hash router, all view renderers, event delegation, scoring, timer,
  persistence. ~720 lines, organized by section with banner comments.
- `app/questions.js` — sources, categories, modes, and the 45-question sample bank (replace this).

## Suggested implementation order (for the porting agent)
1. Reproduce the **app shell** (sidebar + main + hash routing).
2. Build the **Dashboard** with the session builder + derived stats + recent scores list.
3. Build the **Quiz** screen (cards, two pagers, answer/clear, `?` reveal, timer).
4. Build the **Results** screen (hero + color-coded cards).
5. Wire **persistence** (or backend) for scores/session/name.
6. Add **History / Weak Areas / Settings**.
7. Swap in the **real question bank**.
