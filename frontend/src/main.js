import './style.css';
import './app.css';

import { EventsOn } from '../wailsjs/runtime/runtime.js';
import {
  SendMessage, SendAction, SendNick, SendWhois, SendRaw,
  GetServers, GetNick, GetNickList, PartChannel, JoinChannel,
  FetchURLPreview, BrowserOpen, GetThemeByName, GetThemeNames,
  OpenConfig, AppQuit, SendTyping, ReadClipboard,
  ReloadConfig, SaveTheme,
} from '../wailsjs/go/main/App.js';

// ── State ──────────────────────────────────────────────────
const state = {
  nick: '',
  servers: [],
  activeServer: '',
  activeChannel: '',
  currentTheme: 'default',
  topicVisible: true,
  sidebarWidth:  parseInt(localStorage.getItem('sidebarWidth'))  || 220,
  nicklistWidth: parseInt(localStorage.getItem('nicklistWidth')) || 150,
};

// Typing indicator state (not part of render state)
const typingNicks = {};       // "server\0channel" → Set<nick>
const typingClearTimers = {}; // "server\0channel\0nick" → timerId
let outgoingTypingTimer = null;

function findServer(serverName) {
  return state.servers.find(s => s.name === serverName);
}

function findChannel(serverName, channelName) {
  return findServer(serverName)?.channels.find(c => c.name === channelName);
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
    ch = { name: channelName, active: false, unread: 0, mentions: 0, messages: [] };
    srv.channels.push(ch);
  }
  return ch;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDm(name) {
  return name !== 'server' && !/^[#&!+]/.test(name);
}

function openQuery(server, nick) {
  if (!server || !nick || nick === state.nick) return;
  const srv = state.servers.find(s => s.name === server);
  if (!srv) return;
  srv.channels.forEach(c => { c.active = false; });
  const ch = ensureChannel(server, nick);
  ch.active = true;
  ch.unread = 0;
  ch.mentions = 0;
  state.activeServer = server;
  state.activeChannel = nick;
  render();
}

// ── Nick colorization ──────────────────────────────────────
const NICK_COLORS = [
  '#cba6f7','#f38ba8','#fab387','#f9e2af',
  '#a6e3a1','#94e2d5','#89dceb','#89b4fa',
  '#b4befe','#f5c2e7','#eba0ac','#74c7ec',
];

function nickColor(nick) {
  const base = nick.replace(/^[@+~&]/, '');
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (h * 31 + base.charCodeAt(i)) >>> 0;
  return NICK_COLORS[h % NICK_COLORS.length];
}

// ── URL preview ────────────────────────────────────────────
const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,:;!?)]/g;
const previewCache = new Map(); // url → result or 'pending'

function extractURLs(text) {
  return [...(text.match(URL_RE) || [])];
}

function linkifyText(text) {
  return escapeHtml(text).replace(
    // Work on the escaped string — replace encoded URLs
    // We re-run URL_RE on the original and splice in anchors
    /PLACEHOLDER/g, ''
  );
}

// Replaces plain text with linked version (called before inserting into DOM)
function renderText(rawText) {
  const urls = extractURLs(rawText);
  if (!urls.length) return escapeHtml(rawText);
  let result = '';
  let last = 0;
  const re = new RegExp(URL_RE.source, 'g');
  let m;
  while ((m = re.exec(rawText)) !== null) {
    result += escapeHtml(rawText.slice(last, m.index));
    result += `<a class="msg-link" data-url="${escapeAttr(m[0])}" href="#">${escapeHtml(m[0])}</a>`;
    last = m.index + m[0].length;
  }
  result += escapeHtml(rawText.slice(last));
  return result;
}

function escapeAttr(str) {
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}

// After render(), find all .msg-link elements and wire click + lazy-load previews
function bindLinkPreviews() {
  document.querySelectorAll('a.msg-link').forEach(a => {
    const url = a.dataset.url;
    a.addEventListener('click', e => {
      e.preventDefault();
      BrowserOpen(url).catch(() => {});
    });

    // Find or create the preview slot right after this link's message row
    const msgEl = a.closest('.message');
    if (!msgEl || msgEl.dataset.previewDone === url) return;

    if (previewCache.has(url)) {
      injectPreview(msgEl, url, previewCache.get(url));
      return;
    }

    previewCache.set(url, null); // mark pending
    FetchURLPreview(url).then(p => {
      previewCache.set(url, p);
      // The message row might have been replaced by a re-render; find it again
      document.querySelectorAll(`a.msg-link[data-url="${escapeAttr(url)}"]`).forEach(link => {
        const row = link.closest('.message');
        if (row) injectPreview(row, url, p);
      });
    }).catch(() => {});
  });
}

function injectPreview(msgEl, url, p) {
  if (msgEl.dataset.previewDone === url) return;
  msgEl.dataset.previewDone = url;
  if (!p || (!p.title && !p.image)) return;

  const card = document.createElement('div');
  card.className = 'url-preview';

  if (p.isImage || (p.image && !p.title)) {
    card.innerHTML = `<img class="preview-img-only" src="${escapeAttr(p.isImage ? url : p.image)}" alt="" loading="lazy">`;
  } else {
    const thumb = p.image ? `<img class="preview-thumb" src="${escapeAttr(p.image)}" alt="" loading="lazy">` : '';
    card.innerHTML = `
      ${thumb}
      <div class="preview-body">
        <div class="preview-domain">${escapeHtml(p.domain || '')}</div>
        ${p.title ? `<div class="preview-title">${escapeHtml(p.title)}</div>` : ''}
        ${p.description ? `<div class="preview-desc">${escapeHtml(p.description)}</div>` : ''}
      </div>`;
  }

  card.addEventListener('click', () => BrowserOpen(url).catch(() => {}));
  msgEl.after(card);
}

// ── IRC event handlers ─────────────────────────────────────
function handleEvent(ev) {
  switch (ev.type) {
    case 'connected': {
      state.nick = ev.nick;
      ensureChannel(ev.server, 'server');
      render();
      break;
    }
    case 'server':
    case 'whois': {
      const ch = ensureChannel(ev.server, 'server');
      ch.messages.push({ time: ev.time, nick: '', text: ev.text, type: 'server' });
      if (ev.server !== state.activeServer || state.activeChannel !== 'server') ch.unread++;
      render();
      break;
    }
    case 'typing': {
      setTyping(ev.server, ev.channel, ev.nick, ev.text);
      break;
    }
    case 'message':
    case 'action': {
      const ch = ensureChannel(ev.server, ev.channel);
      ch.messages.push({ time: ev.time, nick: ev.nick, text: ev.text, type: ev.type });
      if (ev.server !== state.activeServer || ev.channel !== state.activeChannel) {
        ch.unread++;
        if (state.nick && ev.nick !== state.nick) {
          const re = new RegExp(`(?:^|\\W)${escapeRegex(state.nick)}(?:\\W|$)`, 'i');
          if (re.test(ev.text)) ch.mentions++;
        }
      }
      setTyping(ev.server, ev.channel, ev.nick, 'done');
      render();
      break;
    }
    case 'join': {
      const ch = ensureChannel(ev.server, ev.channel);
      ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} joined`, type: 'server' });
      if (!state.activeChannel || state.activeChannel === 'server') {
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
    case 'kick': {
      const ch = findChannel(ev.server, ev.channel);
      if (ch) ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} was kicked${ev.text ? ': ' + ev.text : ''}`, type: 'server' });
      render();
      break;
    }
    case 'nick': {
      if (ev.nick === state.nick) state.nick = ev.text;
      state.servers.forEach(srv => srv.channels.forEach(ch => {
        ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick} is now known as ${ev.text}`, type: 'server' });
      }));
      render();
      break;
    }
    case 'mode': {
      const ch = findChannel(ev.server, ev.channel) || findChannel(ev.server, 'server');
      if (ch) ch.messages.push({ time: ev.time, nick: '', text: `${ev.nick || 'server'} sets mode ${ev.text}`, type: 'server' });
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
      refreshNickList(ev.server, ev.channel);
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

// ── Slash command parser ───────────────────────────────────
function handleSlash(text) {
  const parts = text.slice(1).split(' ');
  const cmd   = parts[0].toLowerCase();
  const args  = parts.slice(1);

  switch (cmd) {
    case 'nick':
      if (args[0]) SendNick(state.activeServer, args[0]).catch(console.error);
      break;
    case 'whois':
      if (args[0]) SendWhois(state.activeServer, args[0]).catch(console.error);
      break;
    case 'join':
      if (args[0]) JoinChannel(state.activeServer, args[0]).catch(console.error);
      break;
    case 'part':
    case 'leave': {
      const target = args[0] || state.activeChannel;
      if (target) PartChannel(state.activeServer, target).catch(console.error);
      break;
    }
    case 'me':
      if (args.length && state.activeChannel) {
        const meText = args.join(' ');
        SendAction(state.activeServer, state.activeChannel, meText).catch(console.error);
        const ch = activeChannel();
        if (ch) ch.messages.push({ time: timestamp(), nick: state.nick, text: meText, type: 'action' });
        render();
      }
      break;
    case 'msg':
      if (args.length >= 2) {
        const target = args[0];
        const msgText = args.slice(1).join(' ');
        SendMessage(state.activeServer, target, msgText).catch(console.error);
        ensureChannel(state.activeServer, target).messages.push({ time: timestamp(), nick: state.nick, text: msgText, type: 'message' });
        render();
      }
      break;
    case 'query':
      if (args[0]) {
        ensureChannel(state.activeServer, args[0]);
        state.activeChannel = args[0];
        render();
      }
      break;
    case 'away':
      SendRaw(state.activeServer, args.length ? `AWAY :${args.join(' ')}` : 'AWAY').catch(console.error);
      break;
    case 'back':
      SendRaw(state.activeServer, 'AWAY').catch(console.error);
      break;
    case 'topic':
      if (args.length && state.activeChannel)
        SendRaw(state.activeServer, `TOPIC ${state.activeChannel} :${args.join(' ')}`).catch(console.error);
      break;
    case 'kick':
      if (args[0] && state.activeChannel)
        SendRaw(state.activeServer, `KICK ${state.activeChannel} ${args[0]}${args[1] ? ' :' + args.slice(1).join(' ') : ''}`).catch(console.error);
      break;
    case 'mode':
      if (args[0])
        SendRaw(state.activeServer, `MODE ${args.join(' ')}`).catch(console.error);
      break;
    case 'invite':
      if (args[0] && state.activeChannel)
        SendRaw(state.activeServer, `INVITE ${args[0]} ${state.activeChannel}`).catch(console.error);
      break;
    case 'raw':
    case 'quote':
      if (args.length) SendRaw(state.activeServer, args.join(' ')).catch(console.error);
      break;
    case 'quit':
      SendRaw(state.activeServer, `QUIT :${args.join(' ') || 'DojoIRC'}`).catch(console.error);
      break;
    case 'help': {
      const helpCh = activeChannel();
      if (helpCh) {
        [
          '/nick <name>       — change your nick',
          '/whois <nick>      — show info about a user',
          '/join <#channel>   — join a channel',
          '/part [#channel]   — leave a channel',
          '/me <text>         — send an action',
          '/msg <nick> <text> — send a private message',
          '/query <nick>      — open a DM buffer',
          '/away [message]    — set away status',
          '/back              — clear away status',
          '/topic <text>      — set channel topic',
          '/kick <nick>       — kick from channel',
          '/mode <args>       — set mode',
          '/invite <nick>     — invite to channel',
          '/raw <line>        — send raw IRC line',
          '/quit [message]    — disconnect',
        ].forEach(line => helpCh.messages.push({ time: timestamp(), nick: '', text: line, type: 'server' }));
        render();
      }
      break;
    }
    default: {
      const ch = activeChannel();
      if (ch) ch.messages.push({ time: timestamp(), nick: '', text: `Unknown command: /${cmd}`, type: 'server' });
      render();
    }
  }
}

// ── Render ─────────────────────────────────────────────────
function render() {
  const ch = activeChannel();
  const isServerBuf = state.activeChannel === 'server';
  document.querySelector('#app').innerHTML = `
    <div id="sidebar" style="width:${state.sidebarWidth}px">
      <div id="sidebar-header">
        <button id="hamburger" title="Menu">☰</button>
        DojoIRC
      </div>
      <div id="server-list">${renderSidebar()}</div>
    </div>
    <div id="sidebar-handle" title="Drag to resize"></div>
    <div id="main">
      <div id="buffer-header">
        <span id="buffer-title">${state.activeChannel || 'DojoIRC'}</span>
        ${ch?.topic ? `<button id="topic-toggle" class="${state.topicVisible ? 'active' : ''}" title="${state.topicVisible ? 'Hide topic' : 'Show topic'}">topic</button>` : ''}
        ${ch?.topic && state.topicVisible ? `<span id="buffer-topic">${escapeHtml(ch.topic)}</span>` : ''}
      </div>
      <div id="content">
        <div id="messages">${renderMessages()}</div>
        ${isServerBuf ? '' : `<div id="nicklist-handle" title="Drag to resize"></div><div id="nicklist" style="width:${state.nicklistWidth}px">${renderNicklist()}</div>`}
      </div>
      <div id="typing-bar"></div>
      <div id="input-bar">
        <span id="input-nick">${state.nick}</span>
        <input id="message-input" type="text" placeholder="${state.activeChannel ? 'Message ' + state.activeChannel : 'Not connected'}" autocomplete="off" />
      </div>
    </div>
  `;
  bindEvents();
  scrollToBottom();
  bindLinkPreviews();
  renderTypingBar();
}

function renderSidebar() {
  if (!state.servers.length) {
    return '<div class="server-name" style="opacity:0.4">Connecting...</div>';
  }
  return state.servers.map(srv => {
    const serverActive = state.activeServer === srv.name && state.activeChannel === 'server';
    return `
    <div class="server-group">
      <div class="server-name ${serverActive ? 'active' : ''}"
           data-server="${srv.name}" data-channel="server">
        ${srv.name}
      </div>
      ${srv.channels.filter(c => c.name !== 'server').map(ch => {
        const cls = ch.active ? 'active' : ch.mentions > 0 ? 'mention' : ch.unread > 0 ? 'unread' : '';
        const dot = ch.mentions > 0
          ? '<span class="ch-dot mention-dot"></span>'
          : ch.unread > 0
            ? '<span class="ch-dot unread-dot"></span>'
            : '<span class="ch-dot"></span>';
        return `
        <div class="channel-item ${cls}" data-server="${srv.name}" data-channel="${ch.name}">
          ${dot}<span>${escapeHtml(ch.name)}</span>
        </div>`;
      }).join('')}
    </div>
  `}).join('');
}

function renderMessages() {
  const ch = activeChannel();
  if (!ch?.messages.length) return '<div class="message server"><span class="msg-time"></span><span class="msg-nick"></span><span class="msg-text" style="opacity:0.4">No messages yet</span></div>';
  return ch.messages.map(m => {
    const color = m.nick ? `style="color:${nickColor(m.nick)}"` : '';
    const clickable = m.nick && m.type !== 'server';
    const nickAttrs = clickable ? ` data-nick="${escapeAttr(m.nick)}" data-server="${escapeAttr(state.activeServer)}"` : '';
    const nickDisplay = m.type === 'action'
      ? `<span class="msg-nick action-nick${clickable ? ' clickable' : ''}"${nickAttrs} ${color}>* ${escapeHtml(m.nick)}</span>`
      : `<span class="msg-nick${clickable ? ' clickable' : ''}"${nickAttrs} ${color}>${m.nick ? escapeHtml(m.nick) : ''}</span>`;
    const textClass = m.type === 'action' ? 'msg-text action-text' : 'msg-text';
    return `
    <div class="message ${m.type || ''}">
      <span class="msg-time">${m.time}</span>
      ${nickDisplay}
      <span class="${textClass}">${renderText(m.text)}</span>
    </div>`;
  }).join('');
}

function renderNicklist() {
  const ch = activeChannel();
  const nicks = ch?.nicks || [];
  if (!nicks.length) return '';
  return nicks.map(n => {
    const bare = n.replace(/^[@+~&]/, '');
    const prefix = n.match(/^[@+~&]/)?.[0] || '';
    const cls = n.startsWith('@') || n.startsWith('~') || n.startsWith('&') ? 'op' : n.startsWith('+') ? 'voice' : '';
    const color = nickColor(n);
    return `<div class="nick-item ${cls}" data-nick="${escapeAttr(bare)}" data-server="${escapeAttr(state.activeServer)}" style="color:${color}">${prefix ? `<span class="nick-prefix">${prefix}</span>` : ''}${escapeHtml(bare)}</div>`;
  }).join('');
}

// ── Typing indicators ──────────────────────────────────────
function typingKey(server, channel) { return `${server}\0${channel}`; }

function setTyping(server, channel, nick, status) {
  const key = typingKey(server, channel);
  if (!typingNicks[key]) typingNicks[key] = new Set();
  const nk = `${key}\0${nick}`;
  clearTimeout(typingClearTimers[nk]);
  if (status === 'active' || status === 'paused') {
    typingNicks[key].add(nick);
    typingClearTimers[nk] = setTimeout(() => {
      typingNicks[key]?.delete(nick);
      renderTypingBar();
    }, 10000);
  } else {
    typingNicks[key].delete(nick);
  }
  renderTypingBar();
}

function renderTypingBar() {
  const el = document.getElementById('typing-bar');
  if (!el) return;
  const key = typingKey(state.activeServer, state.activeChannel);
  const nicks = typingNicks[key];
  if (!nicks || nicks.size === 0) { el.textContent = ''; return; }
  const names = [...nicks].join(', ');
  el.textContent = nicks.size === 1 ? `${names} is typing…` : `${names} are typing…`;
}

// ── Context menu ────────────────────────────────────────────
function showCtxMenu(x, y, items) {
  removeCtxMenu();

  // Transparent overlay behind the menu — mousedown outside closes it
  // without racing against the menu item's click handler.
  const overlay = document.createElement('div');
  overlay.id = 'ctx-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999;';
  overlay.addEventListener('mousedown', removeCtxMenu);
  document.body.appendChild(overlay);

  const menu = document.createElement('div');
  menu.id = 'ctx-menu';
  menu.style.left = x + 'px';
  menu.style.top  = y + 'px';
  items.forEach(item => {
    if (item.separator) {
      const sep = document.createElement('div');
      sep.className = 'ctx-sep';
      menu.appendChild(sep);
      return;
    }
    const el = document.createElement('div');
    el.className = 'ctx-item' + (item.cls ? ' ' + item.cls : '');
    el.textContent = item.label;
    el.addEventListener('click', () => { removeCtxMenu(); item.action(); });
    menu.appendChild(el);
  });
  document.body.appendChild(menu);
  // Flip upward/leftward if the menu would overflow the viewport.
  const r = menu.getBoundingClientRect();
  if (r.bottom > window.innerHeight) menu.style.top  = Math.max(0, y - r.height) + 'px';
  if (r.right  > window.innerWidth)  menu.style.left = Math.max(0, x - r.width)  + 'px';
}

function removeCtxMenu() {
  document.getElementById('ctx-menu')?.remove();
  document.getElementById('ctx-overlay')?.remove();
}

// ── Events ─────────────────────────────────────────────────
function bindEvents() {
  // Server name click → server buffer
  document.querySelectorAll('.server-name[data-server]').forEach(el => {
    el.addEventListener('click', () => {
      const srv = state.servers.find(s => s.name === el.dataset.server);
      if (!srv) return;
      srv.channels.forEach(c => { c.active = false; });
      const ch = ensureChannel(el.dataset.server, 'server');
      ch.active = true;
      ch.unread = 0;
      state.activeServer  = el.dataset.server;
      state.activeChannel = 'server';
      render();
    });
  });

  document.querySelectorAll('.channel-item').forEach(el => {
    el.addEventListener('click', () => {
      const srv = state.servers.find(s => s.name === el.dataset.server);
      srv.channels.forEach(c => { c.active = false; });
      const ch = srv.channels.find(c => c.name === el.dataset.channel);
      ch.active = true;
      ch.unread = 0;
      ch.mentions = 0;
      state.activeServer  = el.dataset.server;
      state.activeChannel = el.dataset.channel;
      render();
      refreshNickList(el.dataset.server, el.dataset.channel);
    });

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const server  = el.dataset.server;
      const channel = el.dataset.channel;
      const dm = isDm(channel);
      showCtxMenu(e.clientX, e.clientY, [
        {
          label: dm ? 'Close' : 'Leave ' + channel,
          cls: 'danger',
          action: () => {
            if (!dm) PartChannel(server, channel).catch(console.error);
            const srv = state.servers.find(s => s.name === server);
            if (srv) srv.channels = srv.channels.filter(c => c.name !== channel);
            if (state.activeChannel === channel) {
              const remaining = srv?.channels.filter(c => c.name !== 'server')[0];
              state.activeChannel = remaining?.name || 'server';
              state.activeServer  = remaining ? server : (srv ? server : '');
              srv?.channels.forEach(c => c.active = false);
              if (remaining) remaining.active = true;
            }
            render();
          },
        },
      ]);
    });
  });

  const input = document.getElementById('message-input');
  if (input) {
    input.focus();
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const val = input.value.trim();
        input.value = '';
        clearTimeout(outgoingTypingTimer);
        if (val && state.activeChannel && state.activeChannel !== 'server') {
          SendTyping(state.activeServer, state.activeChannel, 'done').catch(() => {});
        }
        sendMessage(val);
        return;
      }
      // Send typing indicator (debounced, channels and DMs only)
      if (state.activeChannel && state.activeChannel !== 'server' && !e.ctrlKey && !e.metaKey && e.key !== 'Tab') {
        clearTimeout(outgoingTypingTimer);
        SendTyping(state.activeServer, state.activeChannel, 'active').catch(() => {});
        outgoingTypingTimer = setTimeout(() => {
          SendTyping(state.activeServer, state.activeChannel, 'paused').catch(() => {});
        }, 5000);
      }
    });
    input.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const hasSel = input.selectionStart !== input.selectionEnd;
      const items = [];
      if (hasSel) {
        items.push({ label: 'Cut',  action: () => document.execCommand('cut') });
        items.push({ label: 'Copy', action: () => document.execCommand('copy') });
      }
      items.push({ label: 'Paste', action: () => {
        ReadClipboard().then(text => {
          if (!text) return;
          const s = input.selectionStart, e = input.selectionEnd;
          input.value = input.value.slice(0, s) + text + input.value.slice(e);
          input.selectionStart = input.selectionEnd = s + text.length;
          input.focus();
        }).catch(() => {});
      } });
      showCtxMenu(e.clientX, e.clientY, items);
    });
  }

  // Nick list: left-click → query, right-click → ctx menu
  document.querySelectorAll('.nick-item[data-nick]').forEach(el => {
    const nick   = el.dataset.nick;
    const server = el.dataset.server;
    el.addEventListener('click', () => openQuery(server, nick));
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      showCtxMenu(e.clientX, e.clientY, [
        { label: 'Message', action: () => openQuery(server, nick) },
        { label: 'Whois',   action: () => SendWhois(server, nick).catch(console.error) },
      ]);
    });
  });

  // Nicks in messages: left-click → query, right-click → ctx menu
  document.querySelectorAll('.msg-nick[data-nick]').forEach(el => {
    const nick   = el.dataset.nick;
    const server = el.dataset.server;
    el.addEventListener('click', () => openQuery(server, nick));
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      showCtxMenu(e.clientX, e.clientY, [
        { label: 'Message', action: () => openQuery(server, nick) },
        { label: 'Whois',   action: () => SendWhois(server, nick).catch(console.error) },
      ]);
    });
  });

  // Right-click selected text in message area → copy
  document.getElementById('messages')?.addEventListener('contextmenu', e => {
    if (e.target.closest('[data-nick]')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    e.preventDefault();
    showCtxMenu(e.clientX, e.clientY, [
      { label: 'Copy', action: () => document.execCommand('copy') },
    ]);
  });

  // Panel resize handles
  document.getElementById('sidebar-handle')?.addEventListener('mousedown', e => {
    e.preventDefault();
    const startX = e.clientX, startW = state.sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = e => {
      state.sidebarWidth = Math.max(140, Math.min(420, startW + e.clientX - startX));
      const el = document.getElementById('sidebar');
      if (el) el.style.width = state.sidebarWidth + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('sidebarWidth', state.sidebarWidth);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  document.getElementById('nicklist-handle')?.addEventListener('mousedown', e => {
    e.preventDefault();
    const startX = e.clientX, startW = state.nicklistWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const onMove = e => {
      // handle is on the left of nicklist: drag left → wider
      state.nicklistWidth = Math.max(80, Math.min(360, startW - (e.clientX - startX)));
      const el = document.getElementById('nicklist');
      if (el) el.style.width = state.nicklistWidth + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('nicklistWidth', state.nicklistWidth);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // Hamburger menu
  document.getElementById('hamburger')?.addEventListener('click', e => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const mx = rect.left, my = rect.bottom + 4;
    showCtxMenu(mx, my, [
      { label: `Theme: ${state.currentTheme}`, action: () => showThemePicker(mx, my) },
      { label: 'Open Config',   action: () => OpenConfig().catch(console.error) },
      { label: 'Reload Config', action: () => ReloadConfig().then(applyUIConfig).catch(console.error) },
      { separator: true },
      { label: 'Quit', cls: 'danger', action: () => AppQuit().catch(console.error) },
    ]);
  });

  // Topic toggle
  document.getElementById('topic-toggle')?.addEventListener('click', () => {
    state.topicVisible = !state.topicVisible;
    render();
  });
}

function sendMessage(text) {
  if (!text || !state.activeChannel) return;

  if (text.startsWith('/')) {
    handleSlash(text);
    return;
  }

  if (state.activeChannel === 'server') return;

  const ch = activeChannel();
  if (!ch) return;

  SendMessage(state.activeServer, state.activeChannel, text)
    .catch(err => console.error('send failed:', err));

  ch.messages.push({ time: timestamp(), nick: state.nick, text, type: 'message' });
  render();
}

// ── Nick list ───────────────────────────────────────────────
function refreshNickList(server, channel) {
  GetNickList(server, channel).then(nicks => {
    const ch = findChannel(server, channel);
    if (ch && nicks) {
      ch.nicks = nicks.sort((a, b) => {
        const rank = n => n.startsWith('@') || n.startsWith('~') || n.startsWith('&') ? 0 : n.startsWith('+') ? 1 : 2;
        return rank(a) - rank(b) || a.localeCompare(b, undefined, { sensitivity: 'base' });
      });
      renderNicklistOnly();
    }
  }).catch(() => {});
}

function renderNicklistOnly() {
  const el = document.getElementById('nicklist');
  if (el) el.innerHTML = renderNicklist();
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

// ── Theme picker ────────────────────────────────────────────
function showThemePicker(x, y) {
  removeCtxMenu();

  const overlay = document.createElement('div');
  overlay.id = 'ctx-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:999;';
  overlay.addEventListener('mousedown', removeCtxMenu);
  document.body.appendChild(overlay);

  const picker = document.createElement('div');
  picker.id = 'ctx-menu';
  picker.style.left = x + 'px';
  picker.style.top  = y + 'px';

  const heading = document.createElement('div');
  heading.style.cssText = 'padding:6px 14px 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-dim);cursor:default;';
  heading.textContent = 'Select Theme';
  picker.appendChild(heading);

  const sep = document.createElement('div');
  sep.className = 'ctx-sep';
  picker.appendChild(sep);

  const list = document.createElement('div');
  list.style.cssText = 'max-height:220px;overflow-y:auto;';
  picker.appendChild(list);
  document.body.appendChild(picker);

  GetThemeNames().then(names => {
    if (!names || !names.length) return;
    names.forEach(name => {
      const el = document.createElement('div');
      el.className = 'ctx-item';
      el.textContent = name;
      if (name === state.currentTheme) el.style.color = 'var(--accent)';
      el.addEventListener('click', () => {
        removeCtxMenu();
        state.currentTheme = name;
        GetThemeByName(name).then(applyTheme).catch(() => {});
        SaveTheme(name).catch(() => {});
      });
      list.appendChild(el);
    });
    const r = picker.getBoundingClientRect();
    if (r.bottom > window.innerHeight) picker.style.top  = Math.max(0, y - r.height) + 'px';
    if (r.right  > window.innerWidth)  picker.style.left = Math.max(0, x - r.width)  + 'px';
  }).catch(() => {});
}

function applyTheme(t) {
  const r = document.documentElement.style;
  r.setProperty('--bg',          t.general.background);
  r.setProperty('--text',        t.general.text);
  r.setProperty('--border',      t.general.border);
  r.setProperty('--accent',      t.general.accent);
  r.setProperty('--bg-sidebar',  t.sidebar.background);
  r.setProperty('--text-dim',    t.sidebar.text);
  r.setProperty('--unread',      t.sidebar.unread);
  r.setProperty('--mention',     t.sidebar.mention);
  r.setProperty('--text-server', t.sidebar.server);
  r.setProperty('--bg-active',   t.nicklist.background);
  r.setProperty('--bg-hover',    t.nicklist.background);
  r.setProperty('--timestamp',   t.buffer.timestamp);
  r.setProperty('--action',      t.buffer.action);
  r.setProperty('--nick-self',   t.buffer.nick_self);
  r.setProperty('--bg-input',    t.input.background);
  r.setProperty('--mention-bg',  t.highlights.mention_bg);
}

function applyUIConfig(cfg) {
  applyTheme(cfg.theme);
  const r = document.documentElement.style;
  if (cfg.font)      r.setProperty('--font-family', `'${cfg.font}', 'Cascadia Code', monospace`);
  if (cfg.font_size) r.setProperty('--font-size', cfg.font_size + 'px');
  if (cfg.theme_name) state.currentTheme = cfg.theme_name;
}

// ── Boot ────────────────────────────────────────────────────
render(); // show connecting state immediately

function boot() {
  try { EventsOn('irc:event', handleEvent); } catch (_) {}

  Promise.resolve()
    .then(() => ReloadConfig())
    .then(applyUIConfig)
    .catch(() => {});

  Promise.resolve()
    .then(() => GetServers())
    .then(servers => {
      if (!servers) return;
      servers.forEach(srv => {
        ensureChannel(srv.Name || srv.name, 'server');
        (srv.Channels || srv.channels || []).forEach((ch, i) => {
          const channel = ensureChannel(srv.Name || srv.name, ch);
          if (i === 0 && !state.activeChannel) {
            state.activeServer  = srv.Name || srv.name;
            state.activeChannel = ch;
            channel.active = true;
          }
        });
      });
      render();
      if (state.activeServer && state.activeChannel) {
        setTimeout(() => refreshNickList(state.activeServer, state.activeChannel), 3000);
      }
    })
    .catch(() => render());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
