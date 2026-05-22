import './style.css';
import './app.css';

import { EventsOn } from '../wailsjs/runtime/runtime.js';
import { SendMessage, GetServers, GetNick } from '../wailsjs/go/main/App.js';

// ── State ──────────────────────────────────────────────────
const state = {
  nick: '',
  servers: [],
  activeServer: '',
  activeChannel: '',
};

function findChannel(serverName, channelName) {
  return state.servers
    .find(s => s.name === serverName)
    ?.channels.find(c => c.name === channelName);
}

function activeChannel() {
  return findChannel(state.activeServer, state.activeChannel);
}

function ensureChannel(serverName, channelName) {
  let srv = state.servers.find(s => s.name === serverName);
  if (!srv) {
    srv = { name: serverName, channels: [] };
    state.servers.push(srv);
  }
  let ch = srv.channels.find(c => c.name === channelName);
  if (!ch) {
    ch = { name: channelName, active: false, unread: 0, messages: [] };
    srv.channels.push(ch);
  }
  return ch;
}

// ── IRC event handlers ─────────────────────────────────────
function handleEvent(ev) {
  switch (ev.type) {
    case 'connected': {
      state.nick = ev.nick;
      render();
      break;
    }
    case 'message':
    case 'action': {
      const ch = ensureChannel(ev.server, ev.channel);
      ch.messages.push({ time: ev.time, nick: ev.nick, text: ev.text, type: ev.type });
      if (ev.server !== state.activeServer || ev.channel !== state.activeChannel) {
        ch.unread++;
      }
      render();
      break;
    }
    case 'join': {
      const ch = ensureChannel(ev.server, ev.channel);
      ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} joined`, type: 'server' });
      if (!state.activeChannel) {
        state.activeServer  = ev.server;
        state.activeChannel = ev.channel;
        ch.active = true;
      }
      render();
      break;
    }
    case 'part': {
      const ch = findChannel(ev.server, ev.channel);
      if (ch) ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} left${ev.text ? ': ' + ev.text : ''}`, type: 'server' });
      render();
      break;
    }
    case 'quit': {
      state.servers.forEach(srv => srv.channels.forEach(ch => {
        ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} quit${ev.text ? ': ' + ev.text : ''}`, type: 'server' });
      }));
      render();
      break;
    }
    case 'nick': {
      state.servers.forEach(srv => srv.channels.forEach(ch => {
        ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} is now known as ${ev.text}`, type: 'server' });
      }));
      render();
      break;
    }
    case 'notice': {
      const ch = ensureChannel(ev.server, ev.channel.startsWith('#') ? ev.channel : 'server');
      ch.messages.push({ time: ev.time, nick: ev.nick, text: ev.text, type: 'notice' });
      render();
      break;
    }
    case 'topic': {
      const ch = findChannel(ev.server, ev.channel);
      if (ch) {
        ch.topic = ev.text;
        ch.messages.push({ time: ev.time, nick: '', text: `Topic: ${ev.text}`, type: 'server' });
      }
      render();
      break;
    }
    case 'names': {
      const ch = ensureChannel(ev.server, ev.channel);
      const incoming = ev.text.trim().split(' ').filter(Boolean);
      ch.nicks = [...new Set([...(ch.nicks || []), ...incoming])].sort();
      render();
      break;
    }
    case 'disconnected': {
      const srv = state.servers.find(s => s.name === ev.server);
      if (srv) srv.channels.forEach(ch => {
        ch.messages.push({ time: ev.time, nick: '', text: 'Disconnected from server', type: 'server' });
      });
      render();
      break;
    }
  }
}

// ── Render ─────────────────────────────────────────────────
function render() {
  const ch = activeChannel();
  document.querySelector('#app').innerHTML = `
    <div id="sidebar">
      <div id="sidebar-header">DojoIRC</div>
      <div id="server-list">${renderSidebar()}</div>
    </div>
    <div id="main">
      <div id="buffer-header">
        <span id="buffer-title">${state.activeChannel || 'DojoIRC'}</span>
        <span id="buffer-topic">${ch?.topic || ''}</span>
      </div>
      <div id="content">
        <div id="messages">${renderMessages()}</div>
        <div id="nicklist">${renderNicklist()}</div>
      </div>
      <div id="input-bar">
        <span id="input-nick">${state.nick}</span>
        <input id="message-input" type="text" placeholder="${state.activeChannel ? 'Message ' + state.activeChannel : 'Not connected'}" autocomplete="off" />
      </div>
    </div>
  `;
  bindEvents();
  scrollToBottom();
}

function renderSidebar() {
  if (!state.servers.length) {
    return '<div class="server-name" style="opacity:0.4">Connecting...</div>';
  }
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
  if (!ch?.messages.length) return '<div class="message server"><span class="msg-time"></span><span class="msg-nick"></span><span class="msg-text" style="opacity:0.4">No messages yet</span></div>';
  return ch.messages.map(m => `
    <div class="message ${m.type || ''}">
      <span class="msg-time">${m.time}</span>
      <span class="msg-nick">${m.nick ? escapeHtml(m.nick) : ''}</span>
      <span class="msg-text">${escapeHtml(m.text)}</span>
    </div>
  `).join('');
}

function renderNicklist() {
  const ch = activeChannel();
  const nicks = ch?.nicks || [];
  if (!nicks.length) return '';
  return nicks.map(n => {
    const cls = n.startsWith('@') ? 'op' : n.startsWith('+') ? 'voice' : '';
    return `<div class="nick-item ${cls}">${escapeHtml(n)}</div>`;
  }).join('');
}

// ── Events ─────────────────────────────────────────────────
function bindEvents() {
  document.querySelectorAll('.channel-item').forEach(el => {
    el.addEventListener('click', () => {
      const srv = state.servers.find(s => s.name === el.dataset.server);
      srv.channels.forEach(c => { c.active = false; });
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
  if (!text || !state.activeChannel) return;
  const ch = activeChannel();
  if (!ch) return;

  SendMessage(state.activeServer, state.activeChannel, text)
    .catch(err => console.error('send failed:', err));

  ch.messages.push({ time: timestamp(), nick: state.nick, text, type: 'message' });
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
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Boot ────────────────────────────────────────────────────
EventsOn('irc:event', handleEvent);
render();
