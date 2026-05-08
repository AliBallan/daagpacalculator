// ── Constants ─────────────────────────────────────────────

const GRADES = ['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F'];

const GRADE_LABELS = {
  'A+':'A+ (4.0)','A':'A (4.0)','A-':'A- (3.7)',
  'B+':'B+ (3.3)','B':'B (3.0)','B-':'B- (2.7)',
  'C+':'C+ (2.3)','C':'C (2.0)','C-':'C- (1.7)',
  'D+':'D+ (1.3)','D':'D (1.0)','D-':'D- (0.7)',
  'F':'F (0.0)'
};

const GP = {
  'A+':4.0,'A':4.0,'A-':3.7,
  'B+':3.3,'B':3.0,'B-':2.7,
  'C+':2.3,'C':2.0,'C-':1.7,
  'D+':1.3,'D':1.0,'D-':0.7,
  'F': 0.0
};

const TYPES   = ['Regular','Honors','AP','IB SL','IB HL'];
const WEIGHTS = { Regular:0, Honors:0, AP:.25, 'IB SL':.25, 'IB HL':.25 };
const GL      = ['Grade 9','Grade 10','Grade 11','Grade 12'];
const SEMS    = ['Semester 1','Semester 2'];

// Gauge arc: r=62 → circ=389.56 | 270° → 292.17 | GPA max 4.5
const GAUGE_ARC = 292.17;
const GPA_MAX   = 4.0;

let rowId  = 0;
let semId  = 0;
let gaugeDisplayed = null; // for count-up animation

// ── Helpers ───────────────────────────────────────────────

const esc = s => String(s)
  .replace(/&/g,'&amp;').replace(/"/g,'&quot;')
  .replace(/</g,'&lt;').replace(/>/g,'&gt;');

// Generic custom select builder
function buildCustomSelect(opts, sel, hiddenClass, placeholder = null) {
  const isPlaceholder = placeholder && !sel;
  const label = isPlaceholder ? placeholder : (opts.find(o => o.val === sel)?.label || opts[0].label);
  const items = opts.map(o =>
    `<li class="cs-item${o.val===sel?' cs-item--selected':''}" data-val="${o.val}">${o.label}</li>`
  ).join('');
  return `
    <div class="cs-wrap${isPlaceholder?' cs-placeholder':''}" data-hidden="${hiddenClass}">
      <button type="button" class="cs-trigger">
        <span class="cs-label">${esc(label)}</span>
        <svg class="cs-chevron" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="#12b886" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <ul class="cs-list">${items}</ul>
      <input type="hidden" class="${hiddenClass}" value="${esc(sel || '')}">
    </div>`;
}

function buildCustomGrade(sel = '') {
  const opts = GRADES.map(g => ({ val: g, label: GRADE_LABELS[g] }));
  return buildCustomSelect(opts, sel, 'sel-grade', 'Grade');
}

function buildCustomType(sel = '') {
  const opts = TYPES.map(t => ({ val: t, label: t }));
  return buildCustomSelect(opts, sel, 'sel-type', 'Type');
}

function buildCustomDur(sel = '') {
  const opts = [{ val:'1.0', label:'Year (1.0)' }, { val:'0.5', label:'Sem (0.5)' }];
  return buildCustomSelect(opts, sel, 'sel-dur', 'Credits');
}

// ── Rows ──────────────────────────────────────────────────

function buildRow(containerId, data = {}) {
  const id  = `r${rowId++}`;
  const div = document.createElement('div');
  div.className = 'course-row row-grid';
  div.id = id;
  div.innerHTML = `
    <input class="input-name" type="text" placeholder="Course name" value="${esc(data.name||'')}">
    ${buildCustomGrade(data.grade||'')}
    ${buildCustomType(data.type||'')}
    ${buildCustomDur(data.dur||'')}
    <button class="btn-remove" title="Remove" onclick="removeRow('${id}','${containerId}')">×</button>
  `;
  return div;
}

function addRow(containerId, data = {}) {
  document.getElementById(`${containerId}-rows`).appendChild(buildRow(containerId, data));
  recalc(containerId);
}

function removeRow(rId, containerId) {
  const el = document.getElementById(rId);
  if (!el) return;
  el.classList.add('removing');
  el.addEventListener('animationend', () => { el.remove(); recalc(containerId); }, { once:true });
}

function clearRows(containerId) {
  document.getElementById(`${containerId}-rows`).innerHTML = '';
  addRow(containerId);
}

// ── GPA Calculation ───────────────────────────────────────

function calcRows(containerId) {
  let wPts=0, uPts=0, cr=0, n=0;
  document.querySelectorAll(`#${containerId}-rows .course-row`).forEach(row => {
    const g = row.querySelector('.sel-grade').value;
    if (!g) return;
    const t = row.querySelector('.sel-type').value  || 'Regular';
    const c = parseFloat(row.querySelector('.sel-dur').value || '1.0');
    wPts += (GP[g] + WEIGHTS[t]) * c;
    uPts +=  GP[g] * c;
    cr   += c;  n++;
  });
  return cr > 0 ? { w: wPts/cr, u: uPts/cr, cr, n } : null;
}

function recalc(changedId) {
  if (changedId === 'current') {
    const res = calcRows('current');

    const wEl = document.getElementById('current-gpa-w');
    wEl.textContent = res ? res.w.toFixed(2) : '—';
    wEl.className   = 'sem-gpa-num' + (res ? ' ' + colorClass(res.w) : '');
    document.getElementById('current-gpa-u').textContent = res ? res.u.toFixed(2) : '—';

    if (document.getElementById('cumulative-section').classList.contains('hidden')) {
      updateGauge(res ? res.w : null, res ? res.u : null, 'Semester GPA');
    } else {
      refreshCumulative();
    }
  } else {
    const res = calcRows(changedId);
    const wEl = document.getElementById(`${changedId}-gpa-w`);
    const uEl = document.getElementById(`${changedId}-gpa-u`);
    if (wEl) {
      wEl.textContent = res ? res.w.toFixed(2) : '—';
      wEl.className   = 'sem-gpa-num' + (res ? ' ' + colorClass(res.w) : '');
    }
    if (uEl) uEl.textContent = res ? res.u.toFixed(2) : '—';
    if (!document.getElementById('cumulative-section').classList.contains('hidden')) {
      refreshCumulative();
    }
  }
}

function refreshCumulative() {
  const semIds = ['current'];
  document.querySelectorAll('.past-sem-card').forEach(c => semIds.push(c.dataset.semId));
  let wPts=0, uPts=0, cr=0;
  semIds.forEach(id => {
    document.querySelectorAll(`#${id}-rows .course-row`).forEach(row => {
      const g = row.querySelector('.sel-grade').value;
      if (!g) return;
      const t = row.querySelector('.sel-type').value  || 'Regular';
      const c = parseFloat(row.querySelector('.sel-dur').value || '1.0');
      wPts += (GP[g] + WEIGHTS[t]) * c;
      uPts +=  GP[g] * c;
      cr   += c;
    });
  });
  updateGauge(cr > 0 ? wPts/cr : null, cr > 0 ? uPts/cr : null, 'Cumulative GPA');
}

// ── Gauge ─────────────────────────────────────────────────

function updateGauge(gpa, ugpa, label) {
  const fillEl  = document.getElementById('g-fill');
  const valEl   = document.getElementById('gauge-val');
  const subEl   = document.getElementById('gauge-sub');
  const lblEl   = document.getElementById('gauge-lbl');
  const floatEl = document.getElementById('gauge-float');

  lblEl.textContent = label;

  if (gpa === null) {
    fillEl.style.strokeDashoffset = 310;
    valEl.textContent = '—';
    valEl.className   = 'gauge-val';
    subEl.textContent = '';
    gaugeDisplayed    = null;
    return;
  }

  const offset = GAUGE_ARC * (1 - Math.min(gpa, GPA_MAX) / GPA_MAX);
  fillEl.style.strokeDashoffset = offset;

  const from = gaugeDisplayed ?? gpa;
  gaugeDisplayed = gpa;
  countUp(from, gpa, 700, v => { valEl.textContent = v.toFixed(2); });
  valEl.className = 'gauge-val ' + colorClass(gpa);

  subEl.textContent = ugpa !== null ? `UW ${ugpa.toFixed(2)}` : '';

  floatEl.classList.remove('pulse');
  requestAnimationFrame(() => {
    floatEl.classList.add('pulse');
    floatEl.addEventListener('animationend', () =>
      floatEl.classList.remove('pulse'), { once:true });
  });
}

function colorClass(gpa) {
  if (gpa >= 3.7) return 'c-green';
  if (gpa >= 3.0) return 'c-yellow';
  return 'c-red';
}

// ── Cumulative toggle ─────────────────────────────────────

function toggleCumulative() {
  const section = document.getElementById('cumulative-section');
  const btn     = document.getElementById('toggle-btn');
  const text    = document.getElementById('toggle-text');
  const open    = section.classList.contains('hidden');

  if (open) {
    section.classList.remove('hidden');
    btn.classList.add('open');
    text.textContent = 'Hide Semesters';
    if (!document.querySelector('.past-sem-card')) addPastSemester();
    refreshCumulative();
    // Reveal new cards
    section.querySelectorAll('.semester-card').forEach(c => c.classList.add('visible'));
  } else {
    section.classList.add('hidden');
    btn.classList.remove('open');
    text.textContent = 'Add Semester';
    const res = calcRows('current');
    updateGauge(res ? res.w : null, res ? res.u : null, 'Semester GPA');
  }
}

// ── Past Semesters ────────────────────────────────────────

function addPastSemester(data = {}) {
  const sid   = `s${semId++}`;
  const card  = document.createElement('div');
  card.className     = 'past-sem-card';
  card.dataset.semId = sid;

  const gl  = data.gradeLevel || 'Grade 9';
  const sem = data.semester   || 'Semester 1';

  card.innerHTML = `
    <div class="sem-card-head">
      <div class="sem-label">
        <select class="sel-gl"  onchange="refreshCumulative()">
          ${GL.map(g=>`<option${g===gl?' selected':''}>${g}</option>`).join('')}
        </select>
        <select class="sel-sem" onchange="refreshCumulative()">
          ${SEMS.map(s=>`<option${s===sem?' selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="sem-right">
        <div class="sem-gpa-badge">
          <div class="sem-gpa-num" id="${sid}-gpa-w">—</div>
          <div class="sem-gpa-sub">Weighted</div>
          <div class="sem-gpa-uw-row">UW: <span id="${sid}-gpa-u">—</span></div>
        </div>
        <button class="btn-remove-sem" onclick="removeSemester(this)">Remove</button>
      </div>
    </div>
    <div class="table-head row-grid">
      <span>Course Name</span><span>Grade</span><span>Type</span><span>Credits</span><span></span>
    </div>
    <div id="${sid}-rows"></div>
    <div class="sem-card-foot">
      <button class="btn btn-add" onclick="addRow('${sid}')">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Course
      </button>
      <button class="btn ghost-sm" onclick="clearRows('${sid}')">Clear</button>
    </div>
  `;

  document.getElementById('past-semesters').appendChild(card);
  data.courses?.length ? data.courses.forEach(c => addRow(sid, c)) : addRow(sid);
  refreshCumulative();
}

function removeSemester(btn) {
  const card = btn.closest('.past-sem-card');
  card.style.transition = 'opacity .2s, transform .2s';
  card.style.opacity    = '0';
  card.style.transform  = 'translateY(-8px)';
  setTimeout(() => { card.remove(); refreshCumulative(); }, 210);
}

// ── Save / Load ───────────────────────────────────────────

function getRows(containerId) {
  return [...document.querySelectorAll(`#${containerId}-rows .course-row`)].map(row => ({
    name:  row.querySelector('.input-name').value,
    grade: row.querySelector('.sel-grade').value,
    type:  row.querySelector('.sel-type').value,
    dur:   row.querySelector('.sel-dur').value
  }));
}

function saveData() {
  const past = [...document.querySelectorAll('.past-sem-card')].map(card => ({
    gradeLevel: card.querySelector('.sel-gl').value,
    semester:   card.querySelector('.sel-sem').value,
    courses:    getRows(card.dataset.semId)
  }));
  localStorage.setItem('daagpa_v2', JSON.stringify({
    current: getRows('current'),
    past,
    cumOpen: !document.getElementById('cumulative-section').classList.contains('hidden')
  }));
  showToast('Saved ✓');
}

function loadData() {
  const raw = localStorage.getItem('daagpa_v2');
  if (!raw) { showToast('No saved data found.'); return; }
  try {
    const d = JSON.parse(raw);

    document.getElementById('current-rows').innerHTML = '';
    (d.current?.length ? d.current : [{}]).forEach(c => addRow('current', c));

    document.getElementById('past-semesters').innerHTML = '';
    semId = 0;
    d.past?.forEach(s => addPastSemester(s));

    const section = document.getElementById('cumulative-section');
    const btn     = document.getElementById('toggle-btn');
    const text    = document.getElementById('toggle-text');

    if (d.cumOpen) {
      section.classList.remove('hidden');
      btn.classList.add('open');
      text.textContent = 'Hide Semesters';
      refreshCumulative();
    } else {
      section.classList.add('hidden');
      btn.classList.remove('open');
      text.textContent = 'Add Semester';
      const res = calcRows('current');
      updateGauge(res ? res.w : null, res ? res.u : null, 'Semester GPA');
    }

    recalc('current');
    showToast('Loaded ✓');
  } catch { showToast('Error loading data.'); }
}

// ── Utilities ─────────────────────────────────────────────

function countUp(from, to, ms, onTick) {
  const t0   = performance.now();
  const tick = now => {
    const p    = Math.min((now - t0) / ms, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    onTick(from + (to - from) * ease);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Scroll reveal ─────────────────────────────────────────

function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.semester-card').forEach(el => obs.observe(el));
}

// ── Disclaimer ────────────────────────────────────────────

function closeDisclaimer() {
  const overlay = document.getElementById('disclaimer');
  if (!overlay) return;
  overlay.classList.add('hiding');
  setTimeout(() => overlay.remove(), 320);
}

// ── Scroll Story ──────────────────────────────────────────

function initScrollStory() {
  const section = document.querySelector('.story-section');
  if (!section) return;

  const isMobile = () => window.innerWidth <= 640;

  // ── Mobile: IntersectionObserver reveal ──
  function initMobile() {
    const steps = section.querySelectorAll('.story-step');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.25 });
    steps.forEach(el => obs.observe(el));
  }

  // ── Desktop: scroll-pinned cycling ──
  function initDesktop() {
    const steps   = section.querySelectorAll('.story-step');
    const visuals = section.querySelectorAll('.svis');
    const dots    = section.querySelectorAll('.sdot');
    const N       = steps.length;
    let current   = -1;

    function activate(i) {
      if (i === current) return;
      current = i;
      steps.forEach((el, idx) => {
        el.classList.toggle('active', idx === i);
        el.classList.toggle('past',   idx < i);
      });
      visuals.forEach((el, idx) => {
        el.classList.toggle('active', idx === i);
        el.classList.toggle('past',   idx < i);
        // Re-trigger gauge fill animation when step 3 activates
        if (idx === 3 && idx === i) {
          const fill = el.querySelector('.vis-g-fill');
          if (fill) { fill.style.strokeDashoffset = '310'; requestAnimationFrame(() => { fill.style.strokeDashoffset = ''; }); }
        }
      });
      dots.forEach((el, idx) => el.classList.toggle('active', idx === i));
    }

    function onScroll() {
      const rect  = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const prog    = Math.max(0, Math.min(1, -rect.top / total));
      const stepIdx = Math.min(Math.floor(prog * N), N - 1);
      activate(stepIdx);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Dot clicks → smooth scroll to that step's position
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const total  = section.offsetHeight - window.innerHeight;
        const target = section.offsetTop + (i / N) * total;
        window.scrollTo({ top: target, behavior: 'smooth' });
      });
    });
  }

  if (isMobile()) { initMobile(); } else { initDesktop(); }
  window.addEventListener('resize', () => {
    if (isMobile()) initMobile(); else initDesktop();
  }, { once: true });
}

// ── Init ──────────────────────────────────────────────────

// ── Custom grade dropdown (portal) ───────────────────────

let _csPortal   = null;   // the floating <ul> appended to body
let _csActiveWrap = null; // the .cs-wrap currently open

function _getPortal() {
  if (!_csPortal) {
    _csPortal = document.createElement('ul');
    _csPortal.className = 'cs-list cs-portal-open';
    document.body.appendChild(_csPortal);
  }
  return _csPortal;
}

function _closePortal() {
  if (_csPortal) _csPortal.style.display = 'none';
  if (_csActiveWrap) _csActiveWrap.classList.remove('open');
  _csActiveWrap = null;
}

function _openPortal(wrap) {
  _closePortal();
  const trigger = wrap.querySelector('.cs-trigger');
  const rect    = trigger.getBoundingClientRect();
  const hidden  = wrap.querySelector('input[type="hidden"]');
  const val     = hidden ? hidden.value : '';

  // Clone items from the hidden .cs-list inside the wrap
  const portal  = _getPortal();
  const srcItems = wrap.querySelectorAll('.cs-list .cs-item');
  portal.innerHTML = Array.from(srcItems).map(item => {
    const v = item.dataset.val;
    return `<li class="cs-item${v===val?' cs-item--selected':''}" data-val="${v}">${item.textContent.trim()}</li>`;
  }).join('');

  // position: fixed uses viewport coords — no scrollY needed
  // flip upward if not enough space below
  const spaceBelow = window.innerHeight - rect.bottom;
  const listH = Math.min(280, GRADES.length * 38 + 12);
  const goUp  = spaceBelow < listH + 10 && rect.top > listH;

  portal.style.display = 'block';
  portal.style.left    = rect.left + 'px';
  portal.style.width   = Math.max(rect.width, 160) + 'px';
  portal.style.top     = goUp ? (rect.top - listH - 6) + 'px' : (rect.bottom + 6) + 'px';

  // Re-trigger animation
  portal.classList.remove('cs-anim');
  requestAnimationFrame(() => portal.classList.add('cs-anim'));

  wrap.classList.add('open');
  _csActiveWrap = wrap;
}

document.addEventListener('click', e => {
  const trigger = e.target.closest('.cs-trigger');
  if (trigger) {
    const wrap    = trigger.closest('.cs-wrap');
    const wasOpen = wrap === _csActiveWrap;
    _closePortal();
    if (!wasOpen) _openPortal(wrap);
    return;
  }

  const item = e.target.closest('.cs-item');
  if (item && _csActiveWrap) {
    const wrap = _csActiveWrap;
    const val  = item.dataset.val;
    const text = item.textContent.trim();
    // Update hidden input
    const hidden = wrap.querySelector('input[type="hidden"]');
    if (hidden) hidden.value = val;
    // Update trigger label
    wrap.querySelector('.cs-label').textContent = text;
    wrap.classList.remove('cs-placeholder');
    // Update selected state in source list
    wrap.querySelectorAll('.cs-item').forEach(i =>
      i.classList.toggle('cs-item--selected', i.dataset.val === val));
    _closePortal();
    const rowsEl      = wrap.closest('[id$="-rows"]');
    const containerId = rowsEl ? rowsEl.id.replace('-rows', '') : 'current';
    recalc(containerId);
    return;
  }

  if (!e.target.closest('.cs-wrap')) _closePortal();
});

// Close on scroll so the fixed dropdown doesn't float away
window.addEventListener('scroll', _closePortal, { passive: true });

// ── Loader ────────────────────────────────────────────────

function runLoader() {
  const loaderEl = document.getElementById('loader');
  const fillEl   = document.getElementById('ld-fill');
  const numEl    = document.getElementById('ld-num');
  if (!loaderEl || !fillEl || !numEl) return;

  const ARC = 292.17;
  const DUR = 1350;
  let start = null;

  function frame(ts) {
    if (!start) start = ts;
    const raw = Math.min((ts - start) / DUR, 1);
    // ease in-out cubic
    const p   = raw < 0.5 ? 4*raw*raw*raw : 1 - Math.pow(-2*raw+2, 3)/2;

    numEl.textContent = (p * 4.0).toFixed(2);
    fillEl.style.strokeDashoffset = ARC * (1 - p);

    if (raw < 1) {
      requestAnimationFrame(frame);
    } else {
      setTimeout(() => {
        loaderEl.classList.add('ld-out');
        loaderEl.addEventListener('transitionend', () => loaderEl.remove(), { once: true });
      }, 220);
    }
  }
  requestAnimationFrame(frame);
}

// ── Init ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  runLoader();
  addRow('current');
  initScrollReveal();
  initScrollStory();
});
