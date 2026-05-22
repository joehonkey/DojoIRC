import './style.css';
import './app.css';

// ── State ──────────────────────────────────────────────────
const state = {
  nick: 'joe',
  servers: [
    {
      name: 'linuxdojo',
      channels: [
        { name: '#general', active: true, unread: 0, messages: [
          { time: '12:00', nick: 'server', text: 'Welcome to DojoIRC', type: 'server' },
        ]},
        { name: '#dev',     active: false, unread: 3, messages: [] },
        { name: '#offtopic',active: false, unread: 0, messages: [] },
      ],
    },
  ],
  activeServer: 'linuxdojo',
  activeChannel: '#general',
};

function activeChannel() {
  const srv = state.servers.find(s => s.name === state.activeServer);
  return srv?.channels.find(c => c.name === state.activeChannel);
}

// ── Render ─────────────────────────────────────────────────
function render() {
  document.querySelector('#app').innerHTML = `
    <div id="sidebar">
      <div id="sidebar-header">DojoIRC</div>
      <div id="server-list">${renderSidebar()}</div>
    </div>
    <div id="main">
      <div id="buffer-header">
        <span id="buffer-title">${state.activeChannel}</span>
        <span id="buffer-topic">No topic set</span>
      </div>
      <div id="content">
        <div id="messages">${renderMessages()}</div>
        <div id="nicklist">${renderNicklist()}</div>
      </div>
      <div id="input-bar">
        <span id="input-nick">${state.nick}</span>
        <input id="message-input" type="text" placeholder="Message ${state.activeChannel}" autocomplete="off" />
      </div>
    </div>
  `;

  bindEvents();
  scrollToBottom();
}

function renderSidebar() {
  return state.servers.map(srv => `
    <div class="server-group">
      <div class="server-name">${srv.name}</div>
      ${srv.channels.map(ch => `
        <div class="channel-item ${ch.active ? 'active' : ''} ${ch.unread > 0 ? 'unread' : ''}"
             data-server="${srv.name}" data-channel="${ch.name}">
          <span>${ch.name}</span>
          ${ch.unread > 0 ? `<span class="unread-badge">${ch.unread}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

function renderMessages() {
  const ch = activeChannel();
  if (!ch) return '';
  return ch.messages.map(m => `
    <div class="message ${m.type || ''}">
      <span class="msg-time">${m.time}</span>
      <span class="msg-nick">${m.nick}</span>
      <span class="msg-text">${escapeHtml(m.text)}</span>
    </div>
  `).join('');
}

function renderNicklist() {
  return ['@joe', 'alice', 'bob', 'carol'].map(n => {
    const cls = n.startsWith('@') ? 'op' : '';
    return `<div class="nick-item ${cls}">${n}</div>`;
  }).join('');
}

// ── Events ─────────────────────────────────────────────────
function bindEvents() {
  document.querySelectorAll('.channel-item').forEach(el => {
    el.addEventListener('click', () => {
      const srv = state.servers.find(s => s.name === el.dataset.server);
      srv.channels.forEach(c => c.active = false);
      const ch = srv.channels.find(c => c.name === el.dataset.channel);
      ch.active = true;
      ch.unread = 0;
      state.activeServer  = el.dataset.server;
      state.activeChannel = el.dataset.channel;
      render();
    });
  });

  const input = document.getElementById('message-input');
  if (input) {
    input.focus();
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') sendMessage(input.value.trim());
    });
  }
}

function sendMessage(text) {
  if (!text) return;
  const ch = activeChannel();
  if (!ch) return;

  ch.messages.push({ time: timestamp(), nick: state.nick, text });
  document.getElementById('message-input').value = '';
  render();
}

// ── Helpers ─────────────────────────────────────────────────
function scrollToBottom() {
  const msgs = document.getElementById('messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function timestamp() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Boot ────────────────────────────────────────────────────
render();
