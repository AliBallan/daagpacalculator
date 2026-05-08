// ── AceBot — AI assistant for DAA GPA Calculator ──────────
// Backend: Vercel serverless function at /api/chat (OpenAI GPT-4o-mini)
// No API key needed by users — key lives securely on the server.

let abHistory = [];
let abTyping  = false;
let abOpen    = false;

// ── Build UI ───────────────────────────────────────────────
function buildAceBot() {
  const style = document.createElement('style');
  style.textContent = `
    /* ── AceBot ── */
    #ab-btn {
      position: fixed;
      bottom: 28px; left: 28px;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #12b886 0%, #0aa572 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(18,184,134,.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 8000;
      transition: transform .22s cubic-bezier(.2,.8,.4,1), box-shadow .22s;
    }
    #ab-btn:hover  { transform: scale(1.1);  box-shadow: 0 6px 32px rgba(18,184,134,.6); }
    #ab-btn.ab-open { transform: scale(.92); }

    #ab-badge {
      position: absolute; top: -2px; right: -2px;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #f87171;
      border: 2.5px solid #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 8px; font-weight: 800; color: #fff; font-family: 'Inter', sans-serif;
      animation: abPulse 2.2s infinite;
    }
    @keyframes abPulse {
      0%,100% { box-shadow: 0 0 0 0 rgba(248,113,113,.55); }
      50%      { box-shadow: 0 0 0 6px rgba(248,113,113,0); }
    }

    #ab-window {
      position: fixed;
      bottom: 96px; left: 28px;
      width: 348px; height: 510px;
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 12px 56px rgba(0,0,0,.2), 0 2px 8px rgba(0,0,0,.07);
      z-index: 8001;
      display: flex; flex-direction: column;
      overflow: hidden;
      transform-origin: bottom left;
      transform: scale(.82) translateY(16px);
      opacity: 0;
      pointer-events: none;
      transition: transform .28s cubic-bezier(.2,.8,.4,1), opacity .24s ease;
    }
    #ab-window.ab-visible {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    /* Header */
    .ab-head {
      background: #0a1a10;
      padding: 16px 18px 14px;
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
      border-bottom: 1px solid rgba(18,184,134,.15);
    }
    .ab-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #12b886 0%, #38bdf8 100%);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 12px rgba(18,184,134,.4);
    }
    .ab-head-info { flex: 1; }
    .ab-name {
      font-family: 'Inter', sans-serif;
      font-size: .95rem; font-weight: 700; color: #fff; letter-spacing: -.01em;
    }
    .ab-status {
      font-family: 'Inter', sans-serif;
      font-size: .67rem; color: rgba(255,255,255,.45);
      display: flex; align-items: center; gap: 5px; margin-top: 2px;
    }
    .ab-online {
      width: 6px; height: 6px; border-radius: 50%; background: #12b886;
    }
    .ab-close {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,.07); border: none;
      color: rgba(255,255,255,.55); font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s; line-height: 1;
    }
    .ab-close:hover { background: rgba(255,255,255,.15); color: #fff; }

    /* Messages */
    .ab-msgs {
      flex: 1; overflow-y: auto;
      padding: 14px 14px 8px;
      display: flex; flex-direction: column; gap: 10px;
      background: #f6fbf8;
      scroll-behavior: smooth;
    }
    .ab-msgs::-webkit-scrollbar { width: 4px; }
    .ab-msgs::-webkit-scrollbar-track { background: transparent; }
    .ab-msgs::-webkit-scrollbar-thumb { background: #c0e0d5; border-radius: 4px; }

    .ab-msg {
      display: flex; flex-direction: column;
      max-width: 88%;
      animation: abIn .18s ease-out;
    }
    @keyframes abIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ab-msg.ab-user { align-self: flex-end; align-items: flex-end; }
    .ab-msg.ab-bot  { align-self: flex-start; align-items: flex-start; }

    .ab-bubble {
      padding: 9px 13px;
      border-radius: 18px;
      font-family: 'Inter', sans-serif;
      font-size: .855rem; line-height: 1.56;
    }
    .ab-user .ab-bubble {
      background: #12b886; color: #fff;
      border-bottom-right-radius: 5px;
    }
    .ab-bot .ab-bubble {
      background: #fff; color: #0f2535;
      border: 1px solid #dff0e8;
      border-bottom-left-radius: 5px;
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .ab-time {
      font-family: 'Inter', sans-serif;
      font-size: .6rem; color: #9ab8c4;
      margin-top: 3px; padding: 0 4px;
    }

    /* Typing */
    .ab-typing .ab-bubble {
      display: flex; align-items: center; gap: 5px;
      padding: 12px 16px;
    }
    .ab-dot-t {
      width: 7px; height: 7px; border-radius: 50%; background: #b0d0c8;
      animation: abDot 1.1s ease-in-out infinite;
    }
    .ab-dot-t:nth-child(2) { animation-delay: .18s; }
    .ab-dot-t:nth-child(3) { animation-delay: .36s; }
    @keyframes abDot {
      0%,80%,100% { transform: scale(1); opacity: .45; }
      40%          { transform: scale(1.45); opacity: 1; }
    }

    /* Input */
    .ab-foot {
      flex-shrink: 0;
      padding: 10px 12px 12px;
      border-top: 1px solid #e6f2ec;
      background: #fff;
    }
    .ab-input-row {
      display: flex; align-items: flex-end; gap: 8px;
    }
    #ab-input {
      flex: 1;
      min-height: 38px; max-height: 96px;
      padding: 9px 12px;
      border: 1.5px solid #d4ece4;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: .855rem; color: #0f2535;
      resize: none; outline: none;
      background: #f6fbf8; line-height: 1.45;
      transition: border-color .15s, box-shadow .15s, background .15s;
    }
    #ab-input:focus {
      border-color: #12b886;
      box-shadow: 0 0 0 3px rgba(18,184,134,.12);
      background: #fff;
    }
    #ab-input::placeholder { color: #98bcc8; }
    #ab-send {
      width: 38px; height: 38px;
      border-radius: 11px;
      background: #12b886; border: none; color: #fff;
      cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, transform .15s, opacity .15s;
    }
    #ab-send:hover:not(:disabled) { background: #0aa572; transform: scale(1.07); }
    #ab-send:disabled { opacity: .45; cursor: not-allowed; transform: none; }

    .ab-powered {
      font-family: 'Inter', sans-serif;
      font-size: .59rem; color: #b0ccd6;
      text-align: center; margin-top: 7px;
      letter-spacing: .04em;
    }

    /* Error banner */
    .ab-err {
      background: #fff5f5; border-top: 1px solid #fed7d7;
      padding: 8px 14px;
      font-family: 'Inter', sans-serif;
      font-size: .78rem; color: #c53030;
      text-align: center;
    }

    @media (max-width: 400px) {
      #ab-window { left: 10px; right: 10px; width: auto; }
    }
  `;
  document.head.appendChild(style);

  // Toggle button
  const btn = document.createElement('button');
  btn.id    = 'ab-btn';
  btn.title = 'Chat with AceBot';
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
    <div id="ab-badge">AI</div>
  `;
  document.body.appendChild(btn);

  // Chat window
  const win = document.createElement('div');
  win.id = 'ab-window';
  win.innerHTML = `
    <div class="ab-head">
      <div class="ab-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      <div class="ab-head-info">
        <div class="ab-name">AceBot</div>
        <div class="ab-status">
          <span class="ab-online"></span> DAA GPA Assistant · Always on
        </div>
      </div>
      <button class="ab-close" id="ab-close">✕</button>
    </div>
    <div class="ab-msgs" id="ab-msgs"></div>
    <div class="ab-foot">
      <div class="ab-input-row">
        <textarea id="ab-input" placeholder="Ask AceBot anything about your GPA…" rows="1"></textarea>
        <button id="ab-send">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
      <div class="ab-powered">AceBot · Powered by Llama 3 · Free for all DAA students</div>
    </div>
  `;
  document.body.appendChild(win);

  // Events
  btn.addEventListener('click', toggleAceBot);
  document.getElementById('ab-close').addEventListener('click', toggleAceBot);
  document.getElementById('ab-send').addEventListener('click', abSend);
  document.getElementById('ab-input').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); abSend(); }
  });
  document.getElementById('ab-input').addEventListener('input', abGrow);

  // Welcome message
  abAppendBot("Hey! I'm **AceBot** 🎓 — your free DAA GPA assistant.\n\nAsk me to calculate your GPA, explain course weights, or just help you figure out what grade you need to hit your target. What's up?");
}

// ── Toggle ─────────────────────────────────────────────────
function toggleAceBot() {
  abOpen = !abOpen;
  document.getElementById('ab-window').classList.toggle('ab-visible', abOpen);
  document.getElementById('ab-btn').classList.toggle('ab-open', abOpen);
  if (abOpen) {
    const badge = document.getElementById('ab-badge');
    if (badge) badge.style.display = 'none';
    setTimeout(() => document.getElementById('ab-input')?.focus(), 250);
  }
}

// ── Input auto-grow ────────────────────────────────────────
function abGrow() {
  const el = document.getElementById('ab-input');
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 96) + 'px';
}

// ── Render simple markdown ─────────────────────────────────
function abMd(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/`(.+?)`/g,'<code style="background:#f0f9f5;padding:1px 5px;border-radius:4px;font-size:.82em">$1</code>')
    .replace(/\n/g,'<br>');
}

// ── Append messages ────────────────────────────────────────
function abAppend(role, text) {
  const msgs = document.getElementById('ab-msgs');
  const wrap = document.createElement('div');
  wrap.className = `ab-msg ab-${role}`;
  const t = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  wrap.innerHTML = `<div class="ab-bubble">${abMd(text)}</div><div class="ab-time">${t}</div>`;
  msgs.appendChild(wrap);
  msgs.scrollTop = msgs.scrollHeight;
}
function abAppendBot(t)  { abAppend('bot',  t); }
function abAppendUser(t) { abAppend('user', t); }

function abShowTyping() {
  const msgs = document.getElementById('ab-msgs');
  const el   = document.createElement('div');
  el.className = 'ab-msg ab-bot ab-typing';
  el.id = 'ab-typing';
  el.innerHTML = `<div class="ab-bubble"><div class="ab-dot-t"></div><div class="ab-dot-t"></div><div class="ab-dot-t"></div></div>`;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}
function abHideTyping() { document.getElementById('ab-typing')?.remove(); }

// ── Send ───────────────────────────────────────────────────
async function abSend() {
  if (abTyping) return;
  const input = document.getElementById('ab-input');
  const text  = input?.value.trim();
  if (!text) return;

  input.value = '';
  input.style.height = 'auto';
  document.getElementById('ab-send').disabled = true;
  document.querySelector('.ab-err')?.remove();

  abAppendUser(text);
  abHistory.push({ role: 'user', content: text });

  abTyping = true;
  abShowTyping();

  try {
    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: abHistory })
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || `Server error ${res.status}`);
    }

    abHideTyping();
    abAppendBot(data.reply);
    abHistory.push({ role: 'assistant', content: data.reply });

  } catch (err) {
    abHideTyping();
    // Show error banner instead of message
    const foot = document.querySelector('.ab-foot');
    const errEl = document.createElement('div');
    errEl.className = 'ab-err';
    errEl.textContent = `⚠ ${err.message || 'Something went wrong — try again.'}`;
    foot.before(errEl);
    // Remove from history so it doesn't corrupt context
    abHistory.pop();
  } finally {
    abTyping = false;
    document.getElementById('ab-send').disabled = false;
    document.getElementById('ab-input')?.focus();
  }
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', buildAceBot);
