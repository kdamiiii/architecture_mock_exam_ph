/* ============================================================================
   Architecture Board Review — App logic (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------- constants ----------------------------- */
  var PER_PAGE = 15;
  var SESSION_LEN = 45;          // comprehensive mock = 3 pages of 15
  var TIMED_SECONDS = 45 * 60;   // 45:00
  var PASS_PCT = 70;
  var LETTERS = ["A", "B", "C", "D"];

  var K = { scores: "abr_scores", session: "abr_session", name: "abr_name", seeded: "abr_seeded" };

  /* ----------------------------- storage ------------------------------- */
  function load(key, fb) { try { var v = localStorage.getItem(key); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function del(key) { try { localStorage.removeItem(key); } catch (e) {} }

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function catById(id) { for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i]; return { name: id, short: id }; }
  function modeById(id) { for (var i = 0; i < MODES.length; i++) if (MODES[i].id === id) return MODES[i]; return MODES[0]; }
  function qById(id) { for (var i = 0; i < QUESTION_BANK.length; i++) if (QUESTION_BANK[i].id === id) return QUESTION_BANK[i]; return null; }

  /* --------------------------- seed sample data ------------------------ */
  function seedScores() {
    if (load(K.seeded, false)) return;
    var now = Date.now(), DAY = 86400000;
    var seed = [
      { source: "JPT Learning Center", category: "struct", mode: "rw",     correct: 41, wrong: 4, total: 45, days: 1 },
      { source: "JPT Learning Center", category: "hist",   mode: "normal", correct: 40, wrong: 5, total: 45, days: 3 },
      { source: "UC Jaguars Mock Exam", category: "prac",  mode: "timed",  correct: 38, wrong: 7, total: 45, days: 4 },
      { source: "JPT Learning Center", category: "util",   mode: "normal", correct: 37, wrong: 8, total: 45, days: 6 },
      { source: "UC Jaguars Mock Exam", category: "design", mode: "rw",    correct: 35, wrong: 10, total: 45, days: 9 },
      { source: "JPT Learning Center", category: "mats",   mode: "normal", correct: 34, wrong: 11, total: 45, days: 12 },
      { source: "UC Jaguars Mock Exam", category: "struct", mode: "timed", correct: 31, wrong: 14, total: 45, days: 16 }
    ];
    var out = seed.map(function (s, i) {
      var blank = s.total - s.correct - s.wrong;
      return {
        id: "seed-" + i, source: s.source, category: s.category, categoryName: catById(s.category).name,
        mode: s.mode, modeName: modeById(s.mode).name, correct: s.correct, wrong: s.wrong, blank: blank,
        total: s.total, net: s.correct - s.wrong, pct: Math.round((s.correct / s.total) * 100),
        date: now - s.days * DAY
      };
    });
    save(K.scores, out);
    save(K.seeded, true);
  }

  /* ------------------------------ state -------------------------------- */
  var state = {
    route: "dashboard",
    build: { source: "jpt", category: "struct", mode: "normal" },
    resultsPage: 0
  };
  var timerHandle = null;

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ------------------------- session lifecycle ------------------------- */
  function startSession(sourceId, catId, modeId) {
    var ids = shuffle(QUESTION_BANK.map(function (q) { return q.id; }));
    // Put the focus category first so the picked category leads the mock.
    ids.sort(function (a, b) {
      var fa = qById(a).cat === catId ? 0 : 1, fb = qById(b).cat === catId ? 0 : 1;
      return fa - fb;
    });
    ids = ids.slice(0, SESSION_LEN);
    var sess = {
      source: { id: sourceId, name: (function () { for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === sourceId) return SOURCES[i].name; return sourceId; })() },
      category: { id: catId, name: catById(catId).name },
      mode: { id: modeId, name: modeById(modeId).name },
      qIds: ids, answers: {}, revealed: {}, page: 0,
      startTime: Date.now(), durationSec: modeId === "timed" ? TIMED_SECONDS : null,
      finished: false
    };
    save(K.session, sess);
    state.route = "quiz";
    location.hash = "#/quiz";
    render();
  }

  function getSession() { return load(K.session, null); }

  function finishSession(auto) {
    var s = getSession(); if (!s || s.finished) return;
    var correct = 0, wrong = 0, blank = 0;
    s.qIds.forEach(function (id) {
      var q = qById(id), a = s.answers[id];
      if (a == null) blank++;
      else if (a === q.answer) correct++;
      else wrong++;
    });
    s.finished = true;
    s.elapsedSec = Math.round((Date.now() - s.startTime) / 1000);
    s.result = { correct: correct, wrong: wrong, blank: blank, total: s.qIds.length, net: correct - wrong, pct: Math.round((correct / s.qIds.length) * 100), auto: !!auto };
    save(K.session, s);

    var scores = load(K.scores, []);
    scores.push({
      id: "r-" + Date.now(), source: s.source.name, category: s.category.id, categoryName: s.category.name,
      mode: s.mode.id, modeName: s.mode.name, correct: correct, wrong: wrong, blank: blank, total: s.qIds.length,
      net: correct - wrong, pct: Math.round((correct / s.qIds.length) * 100), date: Date.now()
    });
    save(K.scores, scores);
    stopTimer();
    state.resultsPage = 0;
    state.route = "results";
    location.hash = "#/results";
    render();
  }

  /* ------------------------------ stats -------------------------------- */
  function recentScores(limit) {
    var s = load(K.scores, []).slice();
    s.sort(function (a, b) { return b.pct - a.pct || b.date - a.date; });
    return limit ? s.slice(0, limit) : s;
  }
  function computeStats() {
    var s = load(K.scores, []);
    if (!s.length) return { sessions: 0, avg: 0, best: 0, items: 0 };
    var sum = 0, best = 0, items = 0;
    s.forEach(function (r) { sum += r.pct; best = Math.max(best, r.pct); items += r.total; });
    return { sessions: s.length, avg: Math.round(sum / s.length), best: best, items: items };
  }
  function weakAreas() {
    var s = load(K.scores, []), map = {};
    s.forEach(function (r) { if (!map[r.category]) map[r.category] = { sum: 0, n: 0 }; map[r.category].sum += r.pct; map[r.category].n++; });
    return CATEGORIES.map(function (c) {
      var m = map[c.id];
      return { id: c.id, name: c.name, attempts: m ? m.n : 0, avg: m ? Math.round(m.sum / m.n) : null };
    }).sort(function (a, b) {
      if (a.avg == null) return 1; if (b.avg == null) return -1; return a.avg - b.avg;
    });
  }

  /* ============================ ICONS ================================= */
  var ICONS = {
    session: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="2" y="2.5" width="12" height="11" rx="1"/><path d="M6 7l3 1.8L6 10.6z" fill="currentColor" stroke="none"/></svg>',
    history: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="8" cy="8" r="6"/><path d="M8 4.6V8l2.4 1.5" stroke-linecap="round"/></svg>',
    weak: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="2.5" y1="13.5" x2="13.5" y2="13.5"/><rect x="3" y="8" width="2.4" height="4"/><rect x="6.8" y="5" width="2.4" height="7"/><rect x="10.6" y="9.5" width="2.4" height="2.5"/></svg>',
    settings: '<svg class="ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="2.5" y1="5" x2="13.5" y2="5"/><line x1="2.5" y1="11" x2="13.5" y2="11"/><circle cx="6" cy="5" r="1.7" fill="var(--navy)"/><circle cx="10" cy="11" r="1.7" fill="var(--navy)"/></svg>'
  };

  /* ============================ SHELL ================================= */
  var NAV = [
    { id: "dashboard", label: "New Session", icon: "session" },
    { id: "history", label: "Score History", icon: "history" },
    { id: "weak", label: "Weak Areas", icon: "weak" },
    { id: "settings", label: "Settings", icon: "settings" }
  ];

  function shell() {
    var name = load(K.name, "Examinee");
    var navHtml = NAV.map(function (n) {
      return '<div class="sb-item' + (state.route === n.id ? " on" : "") + '" data-action="nav" data-route="' + n.id + '">' +
        ICONS[n.icon] + '<span class="lbl">' + n.label + '</span></div>';
    }).join("");
    return '' +
      '<aside class="sidebar">' +
        '<div class="sb-brand"><div class="mark">ABR<b>.</b></div><div class="sub">Review Terminal</div></div>' +
        '<nav class="sb-nav">' + navHtml + '</nav>' +
        '<div class="sb-foot"><span class="who">' + esc(name) + '</span>Board Review &middot; 2026</div>' +
      '</aside>' +
      '<div class="main"><div class="topbar"></div><div id="view"></div></div>';
  }

  /* ============================ DASHBOARD ============================= */
  function viewDashboard() {
    var st = computeStats();
    var b = state.build, mode = modeById(b.mode);
    var sess = getSession();
    var resumeBanner = (sess && !sess.finished) ?
      '<div class="panel" style="border-left:3px solid var(--gold);margin-bottom:24px;">' +
        '<div class="panel-body" style="display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;padding:18px 22px;">' +
          '<div><div class="klabel gold" style="margin-bottom:4px;">Session in progress</div>' +
          '<div class="serif" style="font-size:17px;font-weight:600;color:var(--navy);">' + esc(sess.category.name) + ' &middot; ' + esc(sess.mode.name) + '</div>' +
          '<div class="muted" style="font-size:12.5px;margin-top:3px;">' + Object.keys(sess.answers).length + ' of ' + sess.qIds.length + ' answered</div></div>' +
          '<button class="btn btn-primary" data-action="resume">Resume <span class="arr">&rarr;</span></button>' +
        '</div></div>' : "";

    var stats = [
      ["Sessions", st.sessions], ["Avg. Score", st.avg + '<small>%</small>'],
      ["Best", st.best + '<small>%</small>'], ["Items Seen", st.items.toLocaleString()]
    ].map(function (s) {
      return '<div class="stat"><div class="klabel s-lab">' + s[0] + '</div><div class="s-val">' + s[1] + '</div></div>';
    }).join("");

    var sources = SOURCES.map(function (s) {
      return '<button class="tile' + (b.source === s.id ? " on" : "") + '" data-action="pick" data-field="source" data-val="' + s.id + '">' +
        '<span class="t-name">' + esc(s.name) + '</span><span class="t-sub">' + s.items.toLocaleString() + ' items</span></button>';
    }).join("");

    var cats = CATEGORIES.map(function (c) {
      return '<button class="chip' + (b.category === c.id ? " on" : "") + '" data-action="pick" data-field="category" data-val="' + c.id + '">' + esc(c.name) + '</button>';
    }).join("");

    var modes = MODES.map(function (m) {
      return '<button class="tile' + (b.mode === m.id ? " on" : "") + '" data-action="pick" data-field="mode" data-val="' + m.id + '">' +
        '<span class="t-name">' + esc(m.name) + '</span><span class="t-sub">' + esc(m.sub) + '</span></button>';
    }).join("");

    var recent = recentScores(10);
    var scoreList = recent.length ? recent.map(function (r, i) {
      return '<div class="sc-row">' +
        '<div class="sc-rank' + (i === 0 ? " top" : "") + '">' + (i + 1) + '</div>' +
        '<div><div class="sc-cat">' + esc(r.categoryName) + '</div>' +
        '<div class="sc-meta"><span class="modetag ' + r.mode + '">' + esc(r.modeName) + '</span><span>' + esc(shortSource(r.source)) + '</span></div></div>' +
        '<div class="sc-score">' + r.correct + ' / ' + r.total + '<span class="sc-pct">' + r.pct + '%</span></div></div>';
    }).join("") : '<div class="empty"><span class="serif">No scores yet</span>Finish a review to populate your standings.</div>';

    return '<div class="view">' +
      '<div class="page-head"><div><div class="ph-title">Dashboard</div><div class="ph-sub">Build a review session and track your standings.</div></div>' +
      '<div class="ph-right">' + dateStr() + '</div></div>' +
      '<div class="page-body">' +
        resumeBanner +
        '<div class="stat-strip">' + stats + '</div>' +
        '<div class="dash-grid">' +
          '<div class="panel"><div class="panel-head"><div class="ph-t">Build a Session</div></div><div class="panel-body">' +
            '<div class="build-step"><div class="step-head"><span class="num">I</span><span class="klabel">Source</span></div><div class="tile-row c2">' + sources + '</div></div>' +
            '<div class="build-step"><div class="step-head"><span class="num">II</span><span class="klabel">Category &middot; focus</span></div><div class="chips">' + cats + '</div></div>' +
            '<div class="build-step"><div class="step-head"><span class="num">III</span><span class="klabel">Mode</span></div><div class="tile-row c3">' + modes + '</div>' +
              '<div class="mode-blurb">' + esc(mode.blurb) + '</div></div>' +
            '<button class="btn btn-primary btn-block" data-action="launch" style="margin-top:22px;">Begin Review &middot; ' + SESSION_LEN + ' items <span class="arr">&rarr;</span></button>' +
          '</div></div>' +
          '<div class="panel"><div class="panel-head"><div class="ph-t">Recent Scores</div><div class="klabel">Top 10</div></div>' +
            '<div class="panel-body sc-list">' + scoreList + '</div></div>' +
        '</div>' +
      '</div></div>';
  }
  function shortSource(name) { return name.indexOf("JPT") === 0 ? "JPT" : (name.indexOf("UC") === 0 ? "UC Jaguars" : name); }

  /* ============================== QUIZ =============================== */
  function viewQuiz() {
    var s = getSession();
    if (!s || s.finished) { state.route = "dashboard"; location.hash = "#/dashboard"; return viewDashboard(); }
    var totalPages = Math.ceil(s.qIds.length / PER_PAGE);
    var page = Math.min(s.page || 0, totalPages - 1);
    var startIdx = page * PER_PAGE;
    var pageIds = s.qIds.slice(startIdx, startIdx + PER_PAGE);
    var answered = Object.keys(s.answers).length;

    var cards = pageIds.map(function (id, k) {
      var q = qById(id), no = startIdx + k + 1, sel = s.answers[id], open = !!s.revealed[id];
      var opts = q.options.map(function (o, oi) {
        return '<button class="opt' + (sel === oi ? " sel" : "") + '" data-action="answer" data-q="' + id + '" data-opt="' + oi + '">' +
          '<span class="ltr">' + LETTERS[oi] + '</span><span>' + esc(o) + '</span></button>';
      }).join("");
      var expl = open ? '<div class="expl"><div class="ans">Answer &middot; ' + LETTERS[q.answer] + ' &mdash; ' + esc(q.options[q.answer]) + '</div><p>' + esc(q.explain) + '</p></div>' : "";
      return '<div class="qcard' + (sel != null ? " answered" : "") + '" id="card-' + id + '"><div class="rule"></div><div class="qbody">' +
        '<button class="qmark' + (open ? " on" : "") + '" data-action="reveal" data-q="' + id + '" title="Show answer &amp; explanation">?</button>' +
        '<div class="q-head"><span class="q-no">' + no + '</span><span class="klabel">' + esc(catById(q.cat).name) + '</span></div>' +
        '<div class="q-text">' + esc(q.q) + '</div><div class="opts">' + opts + '</div>' + expl +
        '</div></div>';
    }).join("");

    var pager = pagerHtml(page, totalPages, s.qIds.length);
    var timerHtml = s.durationSec ?
      '<div class="qstat timer"><div class="v" id="timer">' + fmtTime(remaining(s)) + '</div><div class="l">Time left</div></div>' : "";

    return '<div class="view">' +
      '<div class="page-head"><div><div class="ph-title">Review Session</div><div class="ph-sub">Answer all items, then submit. Tap <b>?</b> on any card to reveal the answer.</div></div>' +
        '<div class="ph-right"><button class="btn btn-ghost" data-action="exit" style="padding:10px 16px;">Exit</button></div></div>' +
      '<div class="page-body"><div class="quiz-wrap">' +
        '<div class="quiz-meta"><div class="qm-left"><div class="qm-route">' + esc(s.category.name) + '</div>' +
          '<div class="qm-sub"><span class="modetag ' + s.mode.id + '">' + esc(s.mode.name) + '</span><span>' + esc(s.source.name) + '</span></div></div>' +
          '<div class="qm-right"><div class="qstat"><div class="v"><span id="answeredN">' + answered + '</span> / ' + s.qIds.length + '</div><div class="l">Answered</div></div>' + timerHtml + '</div>' +
        '</div>' +
        '<div class="pager-bar">' + pager + '</div>' +
        '<div id="cards">' + cards + '</div>' +
        '<div class="pager-bar" style="margin-top:18px;">' + pager + '</div>' +
        '<div class="quiz-actions"><div class="answered-count"><b id="answeredN2">' + answered + '</b> of ' + s.qIds.length + ' answered' +
          (answered < s.qIds.length ? ' &middot; <span class="muted">unanswered items score 0</span>' : '') + '</div>' +
          '<button class="btn btn-primary" data-action="submit">Submit Exam <span class="arr">&rarr;</span></button></div>' +
      '</div></div></div>';
  }

  function pagerHtml(page, totalPages, total) {
    function range(p) { var s = p * PER_PAGE + 1, e = Math.min((p + 1) * PER_PAGE, total); return s + " &ndash; " + e; }
    var prev = page > 0 ?
      '<button data-action="page" data-page="' + (page - 1) + '"><span class="pdir">&lsaquo; Back</span><span class="pnum">' + range(page - 1) + '</span></button>' :
      '<button disabled><span class="pdir">&lsaquo; Back</span><span class="pnum">&mdash;</span></button>';
    var next = page < totalPages - 1 ?
      '<button class="next" data-action="page" data-page="' + (page + 1) + '"><span class="pdir">Next &rsaquo;</span><span class="pnum">' + range(page + 1) + '</span></button>' :
      '<button class="next" disabled><span class="pdir">Next &rsaquo;</span><span class="pnum">&mdash;</span></button>';
    return '<div class="pager">' + prev + '<div class="mid">' + range(page) + '</div>' + next + '</div>';
  }

  /* timer helpers */
  function remaining(s) { return Math.max(0, s.durationSec - Math.floor((Date.now() - s.startTime) / 1000)); }
  function fmtTime(sec) { var m = Math.floor(sec / 60), r = sec % 60; return m + ":" + (r < 10 ? "0" : "") + r; }
  function startTimer() {
    stopTimer();
    var s = getSession();
    if (!s || !s.durationSec || s.finished) return;
    timerHandle = setInterval(function () {
      var sess = getSession(); if (!sess || sess.finished) { stopTimer(); return; }
      var rem = remaining(sess), el = document.getElementById("timer");
      if (el) { el.textContent = fmtTime(rem); if (rem <= 60) el.classList.add("warn"); }
      if (rem <= 0) { stopTimer(); finishSession(true); }
    }, 1000);
  }
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

  /* ============================= RESULTS ============================= */
  function viewResults() {
    var s = getSession();
    if (!s || !s.finished || !s.result) { state.route = "dashboard"; location.hash = "#/dashboard"; return viewDashboard(); }
    var r = s.result;
    var pass = r.pct >= PASS_PCT;
    var totalPages = Math.ceil(s.qIds.length / PER_PAGE);
    var page = Math.min(state.resultsPage || 0, totalPages - 1);
    var startIdx = page * PER_PAGE;
    var pageIds = s.qIds.slice(startIdx, startIdx + PER_PAGE);

    var cards = pageIds.map(function (id, k) {
      var q = qById(id), no = startIdx + k + 1, sel = s.answers[id], open = !!s.revealed[id];
      var status = sel == null ? "blank" : (sel === q.answer ? "correct" : "wrong");
      var badge = status === "correct" ? '<span class="res-badge c">Correct</span>' :
                  status === "wrong" ? '<span class="res-badge w">Incorrect</span>' :
                  '<span class="res-badge b">Unanswered</span>';
      var opts = q.options.map(function (o, oi) {
        var cls = "opt";
        if (oi === q.answer) cls += " correct";
        else if (sel === oi) cls += " wrong";
        var tag = oi === q.answer ? '<span class="tag">Correct</span>' : (sel === oi ? '<span class="tag">Your pick</span>' : '');
        return '<div class="' + cls + '" disabled><span class="ltr">' + LETTERS[oi] + '</span><span>' + esc(o) + '</span>' + tag + '</div>';
      }).join("");
      var expl = '<div class="expl"><div class="ans">Answer &middot; ' + LETTERS[q.answer] + ' &mdash; ' + esc(q.options[q.answer]) + '</div><p>' + esc(q.explain) + '</p></div>';
      return '<div class="qcard res-' + status + '"><div class="rule"></div><div class="qbody">' +
        '<button class="qmark' + (open ? " on" : "") + '" data-action="reveal" data-q="' + id + '">?</button>' +
        '<div class="q-head"><span class="q-no">' + no + '</span><span class="klabel">' + esc(catById(q.cat).name) + '</span>' +
          '<span style="margin-left:auto;padding-right:38px;">' + badge + '</span></div>' +
        '<div class="q-text">' + esc(q.q) + '</div><div class="opts">' + opts + '</div>' + (open ? expl : "") +
        '</div></div>';
    }).join("");

    var pager = pagerResults(page, totalPages, s.qIds.length);
    var netLine = s.mode.id === "rw" ? '<span class="rh-detail" style="display:block;margin-top:4px;">Net (right &minus; wrong): <b style="color:#fff;">' + (r.net >= 0 ? "+" : "") + r.net + '</b></span>' : "";

    return '<div class="view">' +
      '<div class="page-head"><div><div class="ph-title">Results</div><div class="ph-sub">Correct answers in green, your wrong picks in red. Tap <b>?</b> for explanations.</div></div>' +
        '<div class="ph-right">' + dateStr() + '</div></div>' +
      '<div class="page-body"><div class="quiz-wrap">' +
        '<div class="result-hero"><div class="rh-top">' +
          '<div class="rh-score"><div class="big">' + r.correct + '<span class="of">/' + r.total + '</span></div><div class="pct">' + r.pct + '%</div></div>' +
          '<div class="rh-meta"><div class="rh-route">' + esc(s.category.name) + '</div>' +
            '<div class="rh-detail"><span class="modetag ' + s.mode.id + '" style="background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.2);color:#dfe7ef;">' + esc(s.mode.name) + '</span>' +
            '<span>' + esc(s.source.name) + '</span><span class="verdict ' + (pass ? "pass" : "fail") + '">' + (pass ? "Passed" : "Below 70%") + '</span></div>' + netLine + '</div>' +
        '</div>' +
        '<div class="rh-breakdown">' +
          '<div class="rh-bd"><div class="v green">' + r.correct + '</div><div class="l">Correct</div></div>' +
          '<div class="rh-bd"><div class="v red">' + r.wrong + '</div><div class="l">Incorrect</div></div>' +
          '<div class="rh-bd"><div class="v">' + r.blank + '</div><div class="l">Unanswered</div></div>' +
          '<div class="rh-bd"><div class="v">' + fmtClock(s.elapsedSec) + '</div><div class="l">Time taken</div></div>' +
        '</div></div>' +
        (r.auto ? '<div class="mode-blurb" style="margin-bottom:18px;">&#9201; Time expired &mdash; the exam was submitted automatically.</div>' : '') +
        '<div class="pager-bar">' + pager + '</div>' +
        '<div id="cards">' + cards + '</div>' +
        '<div class="pager-bar" style="margin-top:18px;">' + pager + '</div>' +
        '<div class="quiz-actions"><button class="btn btn-ghost" data-action="nav" data-route="dashboard">&lsaquo; Back to Dashboard</button>' +
          '<button class="btn btn-primary" data-action="retake">Retake Session <span class="arr">&rarr;</span></button></div>' +
      '</div></div></div>';
  }
  function pagerResults(page, totalPages, total) {
    // identical look, but uses results paging action
    var h = pagerHtml(page, totalPages, total);
    return h.replace(/data-action="page"/g, 'data-action="rpage"');
  }
  function fmtClock(sec) { if (sec == null) return "\u2014"; var m = Math.floor(sec / 60), r = sec % 60; return m + ":" + (r < 10 ? "0" : "") + r; }

  /* ============================ HISTORY ============================== */
  function viewHistory() {
    var all = load(K.scores, []).slice().sort(function (a, b) { return b.date - a.date; });
    var rows = all.length ? all.map(function (r) {
      return '<tr><td class="cat-name">' + esc(r.categoryName) + '</td><td>' + esc(shortSource(r.source)) +
        '</td><td><span class="modetag ' + r.mode + '">' + esc(r.modeName) + '</span></td>' +
        '<td class="r score-cell">' + r.correct + ' / ' + r.total + '</td>' +
        '<td class="r">' + r.pct + '%' + (r.mode === "rw" ? ' <span class="muted" style="font-size:12px;">(net ' + (r.net >= 0 ? "+" : "") + r.net + ')</span>' : '') + '</td>' +
        '<td class="r muted" style="font-size:13px;">' + fullDate(r.date) + '</td></tr>';
    }).join("") : '<tr><td colspan="6"><div class="empty"><span class="serif">No attempts recorded</span>Your completed sessions will appear here.</div></td></tr>';
    return '<div class="view"><div class="page-head"><div><div class="ph-title">Score History</div><div class="ph-sub">Every completed review session, most recent first.</div></div>' +
      '<div class="ph-right">' + all.length + ' attempt' + (all.length === 1 ? "" : "s") + '</div></div>' +
      '<div class="page-body"><table class="tbl"><thead><tr><th>Category &middot; focus</th><th>Source</th><th>Mode</th><th class="r">Score</th><th class="r">Accuracy</th><th class="r">Date</th></tr></thead>' +
      '<tbody>' + rows + '</tbody></table></div></div>';
  }

  /* =========================== WEAK AREAS =========================== */
  function viewWeak() {
    var w = weakAreas();
    var rows = w.map(function (c) {
      if (c.avg == null) {
        return '<div class="weak-row"><div><div class="wr-cat">' + esc(c.name) + '</div><div class="wr-sub">Not yet attempted</div></div>' +
          '<button class="btn btn-ghost" data-action="drill" data-cat="' + c.id + '" style="padding:11px 16px;">Start &rarr;</button></div>';
      }
      var color = c.avg < 60 ? "var(--red)" : (c.avg < PASS_PCT ? "var(--gold)" : "var(--green)");
      return '<div class="weak-row"><div><div class="wr-cat">' + esc(c.name) + '</div>' +
        '<div class="wr-bartrack"><div class="wr-barfill" style="width:' + c.avg + '%;background:' + color + ';"></div></div>' +
        '<div class="wr-sub">' + c.attempts + ' attempt' + (c.attempts === 1 ? "" : "s") + ' &middot; average accuracy</div></div>' +
        '<div style="display:flex;align-items:center;gap:18px;"><div class="wr-pct" style="color:' + color + ';">' + c.avg + '%</div>' +
        '<button class="btn btn-ghost" data-action="drill" data-cat="' + c.id + '" style="padding:11px 16px;">Drill &rarr;</button></div></div>';
    }).join("");
    return '<div class="view"><div class="page-head"><div><div class="ph-title">Weak Areas</div><div class="ph-sub">Categories ranked weakest-first, by average accuracy across your sessions.</div></div></div>' +
      '<div class="page-body"><p class="section-label">Focus your next session where it counts most.</p>' + rows + '</div></div>';
  }

  /* ============================ SETTINGS ============================ */
  function viewSettings() {
    var name = load(K.name, "Examinee");
    return '<div class="view"><div class="page-head"><div><div class="ph-title">Settings</div><div class="ph-sub">Everything is stored privately in this browser.</div></div></div>' +
      '<div class="page-body">' +
        '<div class="settings-card"><h3>Examinee</h3><p class="desc">Shown in the sidebar. Make it yours.</p>' +
          '<div class="field"><label>Display name</label><input id="nameInput" type="text" value="' + esc(name) + '" maxlength="40" /></div>' +
          '<div style="margin-top:18px;display:flex;align-items:center;"><button class="btn btn-primary" data-action="saveName" style="padding:12px 20px;">Save</button>' +
          '<span class="saved-flash" id="nameFlash">Saved &check;</span></div></div>' +
        '<div class="settings-card danger"><h3>Reset data</h3><p class="desc">Clear your saved scores or wipe everything and start fresh. This cannot be undone.</p>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;"><button class="btn btn-danger" data-action="clearScores" style="padding:12px 18px;">Clear score history</button>' +
          '<button class="btn btn-danger" data-action="clearAll" style="padding:12px 18px;">Reset everything</button></div></div>' +
      '</div></div>';
  }

  /* ============================ helpers ============================= */
  function dateStr() { var d = new Date(); return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); }
  function fullDate(ms) { return new Date(ms).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); }

  /* ============================ RENDER ============================= */
  function render() {
    var app = document.getElementById("app");
    if (!app.dataset.shell) { app.innerHTML = shell(); app.dataset.shell = "1"; }
    else {
      // refresh sidebar active state
      var items = app.querySelectorAll(".sb-item");
      items.forEach(function (el) { el.classList.toggle("on", el.getAttribute("data-route") === state.route); });
      // refresh name in footer
      var who = app.querySelector(".sb-foot .who"); if (who) who.textContent = load(K.name, "Examinee");
    }
    var view = document.getElementById("view");
    var html;
    switch (state.route) {
      case "quiz": html = viewQuiz(); break;
      case "results": html = viewResults(); break;
      case "history": html = viewHistory(); break;
      case "weak": html = viewWeak(); break;
      case "settings": html = viewSettings(); break;
      default: html = viewDashboard();
    }
    view.innerHTML = html;
    window.scrollTo(0, 0);
    if (state.route === "quiz") startTimer(); else stopTimer();
  }

  /* ============================ EVENTS ============================= */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-action]");
    if (!t) return;
    var act = t.getAttribute("data-action");

    if (act === "nav") { go(t.getAttribute("data-route")); return; }
    if (act === "pick") {
      state.build[t.getAttribute("data-field")] = t.getAttribute("data-val");
      render(); return;
    }
    if (act === "launch") { startSession(state.build.source, state.build.category, state.build.mode); return; }
    if (act === "resume") { go("quiz"); return; }
    if (act === "exit") { if (confirm("Exit this session? Your progress is saved and you can resume from the dashboard.")) go("dashboard"); return; }

    if (act === "answer") {
      var s = getSession(); if (!s || s.finished) return;
      var qid = t.getAttribute("data-q"), opt = parseInt(t.getAttribute("data-opt"), 10);
      if (s.answers[qid] === opt) delete s.answers[qid]; else s.answers[qid] = opt; // tap again to clear
      save(K.session, s);
      updateCardSelection(qid, s.answers[qid]);
      updateAnswered(Object.keys(s.answers).length, s.qIds.length);
      return;
    }
    if (act === "reveal") {
      var ss = getSession(); if (!ss) return;
      var id = t.getAttribute("data-q");
      ss.revealed[id] = !ss.revealed[id];
      save(K.session, ss);
      toggleExplain(id, ss.revealed[id], t);
      return;
    }
    if (act === "page") { var sp = getSession(); sp.page = parseInt(t.getAttribute("data-page"), 10); save(K.session, sp); render(); return; }
    if (act === "rpage") { state.resultsPage = parseInt(t.getAttribute("data-page"), 10); render(); return; }
    if (act === "submit") {
      var sub = getSession(); var un = sub.qIds.length - Object.keys(sub.answers).length;
      var msg = un > 0 ? ("You have " + un + " unanswered item" + (un === 1 ? "" : "s") + " (they will score 0). Submit now?") : "Submit your exam for scoring?";
      if (confirm(msg)) finishSession(false);
      return;
    }
    if (act === "retake") {
      var rs = getSession();
      startSession(state.build.source || "jpt", (rs && rs.category.id) || state.build.category, (rs && rs.mode.id) || state.build.mode);
      return;
    }
    if (act === "drill") {
      var cat = t.getAttribute("data-cat");
      state.build.category = cat;
      startSession(state.build.source, cat, state.build.mode);
      return;
    }
    if (act === "saveName") {
      var inp = document.getElementById("nameInput"); var v = (inp.value || "").trim() || "Examinee";
      save(K.name, v); var who = document.querySelector(".sb-foot .who"); if (who) who.textContent = v;
      var f = document.getElementById("nameFlash"); if (f) { f.classList.add("show"); setTimeout(function () { f.classList.remove("show"); }, 1600); }
      return;
    }
    if (act === "clearScores") { if (confirm("Clear all score history? Sample scores will not return.")) { save(K.scores, []); save(K.seeded, true); go("dashboard"); } return; }
    if (act === "clearAll") { if (confirm("Reset everything \u2014 scores, current session, and name?")) { del(K.scores); del(K.session); del(K.name); del(K.seeded); seedScores(); state.build = { source: "jpt", category: "struct", mode: "normal" }; go("dashboard"); } return; }
  });

  function go(route) { state.route = route; location.hash = "#/" + route; render(); }

  /* targeted DOM updates (avoid full quiz re-render) */
  function updateCardSelection(qid, sel) {
    var card = document.getElementById("card-" + qid); if (!card) return;
    card.classList.toggle("answered", sel != null);
    var opts = card.querySelectorAll(".opt");
    opts.forEach(function (o, i) { o.classList.toggle("sel", sel === i); });
  }
  function updateAnswered(n, total) {
    ["answeredN", "answeredN2"].forEach(function (id) { var el = document.getElementById(id); if (el) el.textContent = n; });
  }
  function toggleExplain(id, open, btn) {
    if (btn) btn.classList.toggle("on", open);
    var card = (btn ? btn.closest(".qcard") : document.getElementById("card-" + id));
    if (!card) return;
    var body = card.querySelector(".qbody");
    var existing = body.querySelector(".expl");
    if (open && !existing) {
      var q = qById(id);
      var div = document.createElement("div");
      div.className = "expl";
      div.innerHTML = '<div class="ans">Answer &middot; ' + LETTERS[q.answer] + ' &mdash; ' + esc(q.options[q.answer]) + '</div><p>' + esc(q.explain) + '</p>';
      body.appendChild(div);
    } else if (!open && existing) { existing.remove(); }
  }

  /* ============================ ROUTING ============================ */
  function routeFromHash() {
    var h = (location.hash || "").replace(/^#\/?/, "");
    var valid = { dashboard: 1, quiz: 1, results: 1, history: 1, weak: 1, settings: 1 };
    if (!valid[h]) h = "dashboard";
    // guard: quiz/results need a session
    var s = getSession();
    if (h === "quiz" && (!s || s.finished)) h = s && s.finished ? "results" : "dashboard";
    if (h === "results" && (!s || !s.finished)) h = "dashboard";
    state.route = h;
  }
  window.addEventListener("hashchange", function () { routeFromHash(); render(); });

  /* ============================== INIT ============================= */
  seedScores();
  routeFromHash();
  render();
})();
