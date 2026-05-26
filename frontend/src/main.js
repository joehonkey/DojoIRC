import './style.css';
import './app.css';

import { EventsOn, ClipboardSetText, OnFileDrop } from '../wailsjs/runtime/runtime.js';
import {
  SendMessage, SendAction, SendCTCP, SendNick, SendWhois, SendRaw,
  GetServers, GetNick, GetNickList, PartChannel, JoinChannel,
  FetchURLPreview, BrowserOpen, GetThemeByName, GetThemeNames,
  OpenConfig, AppQuit, RestartApp, SendTyping, ReadClipboard,
  ReloadConfig, SaveTheme, ConnectServer, DisconnectServer, GetSysInfo,
  NeedsNickSetup, SetNick, ListChannels, GetScrollback, GetAppIcon,
  GetVersion, MaybeShowKeyboard, DCCAccept, DCCSend,
  DCCChatAccept, DCCChatSend, DCCChatInitiate,
} from '../wailsjs/go/main/App.js';

let DOJOIRC_ICON = 'data:image/png;base64,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';

// ── State ──────────────────────────────────────────────────
const state = {
  nick: '',    // kept for legacy fallback; prefer nicks[server]
  nicks: {},   // per-server nick map
  servers: [],
  activeServer: '',
  activeChannel: '',
  currentTheme: 'default',
  topicVisible: true,
  sidebarWidth:  parseInt(localStorage.getItem('sidebarWidth'))  || 220,
  nicklistWidth: parseInt(localStorage.getItem('nicklistWidth')) || 150,
  awayServer: '',      // server name when client is marked away
  listEntries: [],     // accumulated /LIST results
  listLoading: false,  // true while LIST is running
  searchOpen: false,
  searchQuery: '',
  searchMatchIdx: 0,
  scrollback: 200,
  nicklistHidden: localStorage.getItem('nicklistHidden') === 'true',
  nickHidden: localStorage.getItem('nickHidden') === 'true',
  dccChats: {},
};

function myNick(server) {
  return state.nicks[server] || state.nick || '';
}

// ── Emoji data ──────────────────────────────────────────────
const EMOJI_CATS = [
  { icon: '😀', name: 'Smileys',  emoji: [['😀','grinning'],['😁','beaming'],['😂','joy'],['🤣','rofl'],['😃','smiley'],['😄','smile'],['😅','sweat_smile'],['😆','laughing'],['😊','blush'],['😇','innocent'],['🙂','slightly_smiling'],['🙃','upside_down'],['😉','wink'],['😋','yum'],['😎','sunglasses'],['😍','heart_eyes'],['🥰','smiling_hearts'],['😘','kissing_heart'],['🤗','hugging'],['🤔','thinking'],['😤','triumph'],['😭','sob'],['😢','cry'],['😱','scream'],['😠','angry'],['😡','rage'],['🤬','swearing'],['😴','sleeping'],['🤢','nauseated'],['🥺','pleading']] },
  { icon: '👋', name: 'Gestures', emoji: [['👋','wave'],['🤚','raised_back_hand'],['✋','raised_hand'],['👌','ok_hand'],['✌️','peace'],['🤞','crossed_fingers'],['🤟','love_you'],['🤘','horns'],['👍','thumbsup'],['👎','thumbsdown'],['👊','fist'],['👏','clap'],['🙌','raised_hands'],['🙏','pray'],['💪','muscle'],['🤝','handshake'],['👀','eyes'],['👂','ear'],['👃','nose'],['✍️','writing'],['🤜','right_fist'],['🤛','left_fist'],['☝️','point_up'],['👆','point_up2'],['👇','point_down']] },
  { icon: '❤️', name: 'Hearts',   emoji: [['❤️','heart'],['🧡','orange_heart'],['💛','yellow_heart'],['💚','green_heart'],['💙','blue_heart'],['💜','purple_heart'],['🖤','black_heart'],['🤍','white_heart'],['🤎','brown_heart'],['💔','broken_heart'],['💕','two_hearts'],['💖','sparkling_heart'],['💘','cupid'],['💗','growing_heart'],['🔥','fire'],['✨','sparkles'],['💥','boom'],['⭐','star'],['🌟','star2'],['💯','100'],['🌈','rainbow'],['❄️','snowflake'],['☀️','sun'],['🌙','moon'],['⚡','zap']] },
  { icon: '🐶', name: 'Animals',  emoji: [['🐶','dog'],['🐱','cat'],['🐭','mouse'],['🐹','hamster'],['🐰','rabbit'],['🦊','fox'],['🐻','bear'],['🐼','panda'],['🐨','koala'],['🐯','tiger'],['🦁','lion'],['🐮','cow'],['🐷','pig'],['🐸','frog'],['🐵','monkey'],['🦄','unicorn'],['🐝','bee'],['🦋','butterfly'],['🐢','turtle'],['🦈','shark'],['🐬','dolphin'],['🦀','crab'],['🐙','octopus'],['🦉','owl'],['🦊','fox2']] },
  { icon: '🍕', name: 'Food',     emoji: [['🍕','pizza'],['🍔','hamburger'],['🌮','taco'],['🍟','fries'],['🍿','popcorn'],['🍞','bread'],['🥚','egg'],['🍳','fried_egg'],['🧀','cheese'],['🌭','hotdog'],['🥪','sandwich'],['🍜','ramen'],['🍣','sushi'],['🍦','icecream'],['🍩','doughnut'],['🍪','cookie'],['🎂','birthday'],['🍰','cake'],['🧁','cupcake'],['☕','coffee'],['🍵','tea'],['🍺','beer'],['🍷','wine'],['🍸','cocktail'],['🥤','cup']] },
  { icon: '💡', name: 'Objects',  emoji: [['💡','bulb'],['📱','phone'],['💻','laptop'],['🖥️','desktop'],['⌨️','keyboard'],['📷','camera'],['📺','tv'],['🎵','music'],['🎶','notes'],['🎮','video_game'],['🎲','game_die'],['🏆','trophy'],['🥇','first_place'],['🎯','dart'],['🔑','key'],['🔒','lock'],['⚙️','gear'],['🔧','wrench'],['🔬','microscope'],['🚀','rocket'],['💰','moneybag'],['📚','books'],['📝','memo'],['🎨','art'],['🎸','guitar']] },
  { icon: '🎉', name: 'Symbols',  emoji: [['🎉','tada'],['🎊','confetti'],['🎈','balloon'],['✅','check'],['❌','x'],['❓','question'],['❗','exclamation'],['💬','speech'],['🔔','bell'],['⚠️','warning'],['🚫','no_entry'],['🚧','construction'],['♻️','recycle'],['🆕','new'],['🆗','ok'],['🆘','sos'],['💤','zzz'],['🌀','cyclone'],['🔎','search'],['📌','pushpin'],['🏳️','white_flag'],['🏴','black_flag'],['🎀','ribbon'],['🏅','medal'],['🎗️','reminder_ribbon']] },
];

const SHORTCODES = {
  ':smile:':'😊', ':grinning:':'😀', ':joy:':'😂', ':rofl:':'🤣', ':smiley:':'😃',
  ':laughing:':'😆', ':blush:':'😊', ':innocent:':'😇', ':wink:':'😉', ':yum:':'😋',
  ':sunglasses:':'😎', ':heart_eyes:':'😍', ':smiling_hearts:':'🥰', ':kissing_heart:':'😘',
  ':hugging:':'🤗', ':thinking:':'🤔', ':triumph:':'😤', ':sob:':'😭', ':cry:':'😢',
  ':scream:':'😱', ':angry:':'😠', ':rage:':'😡', ':sleeping:':'😴',
  ':wave:':'👋', ':ok_hand:':'👌', ':peace:':'✌️', ':thumbsup:':'👍', ':thumbsdown:':'👎',
  ':clap:':'👏', ':pray:':'🙏', ':muscle:':'💪', ':eyes:':'👀', ':handshake:':'🤝',
  ':heart:':'❤️', ':orange_heart:':'🧡', ':yellow_heart:':'💛', ':green_heart:':'💚',
  ':blue_heart:':'💙', ':purple_heart:':'💜', ':broken_heart:':'💔', ':two_hearts:':'💕',
  ':sparkling_heart:':'💖', ':fire:':'🔥', ':sparkles:':'✨', ':100:':'💯', ':boom:':'💥',
  ':star:':'⭐', ':star2:':'🌟', ':rainbow:':'🌈', ':snowflake:':'❄️', ':sun:':'☀️',
  ':moon:':'🌙', ':zap:':'⚡', ':dog:':'🐶', ':cat:':'🐱', ':panda:':'🐼',
  ':unicorn:':'🦄', ':bee:':'🐝', ':butterfly:':'🦋', ':pizza:':'🍕', ':hamburger:':'🍔',
  ':taco:':'🌮', ':coffee:':'☕', ':beer:':'🍺', ':cake:':'🎂', ':bulb:':'💡',
  ':computer:':'💻', ':phone:':'📱', ':music:':'🎵', ':game:':'🎮', ':trophy:':'🏆',
  ':rocket:':'🚀', ':tada:':'🎉', ':balloon:':'🎈', ':check:':'✅', ':x:':'❌',
  ':warning:':'⚠️', ':recycle:':'♻️', ':bell:':'🔔',
};

// ── Font size manager zones ───────────────────────────────────
const FONT_ZONES = [
  { label: 'Sidebar Header (DOJOIRC)', prop: '--font-size-sidebar-hdr',  def: 11 },
  { label: 'Hamburger Button (☰)',     prop: '--font-size-hamburger',    def: 14 },
  { label: 'Server Names',             prop: '--font-size-server',       def: 11 },
  { label: 'Channel Names',            prop: '--font-size-channel',      def: 13 },
  { label: 'Buffer Title (#channel)',  prop: '--font-size-buffer-title', def: 14 },
  { label: 'Channel Modes (+nt)',      prop: '--font-size-modes',        def: 11 },
  { label: 'Topic Button',             prop: '--font-size-topic-btn',    def: 10 },
  { label: 'Topic Text',               prop: '--font-size-topic',        def: 12 },
  { label: 'Chat Messages',            prop: '--font-size',              def: 13 },
  { label: 'Timestamps',               prop: '--font-size-timestamp',    def: 13 },
  { label: 'Nick List',                prop: '--font-size-nicklist',     def: 12 },
  { label: 'Typing Indicator',         prop: '--font-size-typing',       def: 13 },
  { label: 'Input Nick Prefix',        prop: '--font-size-input-nick',   def: 12 },
  { label: 'Input Field',              prop: '--font-size-input',        def: 13 },
];

function applyShortcodes(text) {
  return text.replace(/:([a-z0-9_]+):/g, m => SHORTCODES[m] || m);
}

// ── Input history ────────────────────────────────────────────
const inputHistory = [];
let historyIdx = -1;
let inputDraft  = '';

// ── Emoji button toggle ───────────────────────────────────────
let emojiBtnEnabled = localStorage.getItem('emojiBtnEnabled') !== 'false';

// ── Emoji picker ─────────────────────────────────────────────
function showEmojiPicker(anchorEl) {
  document.getElementById('emoji-picker')?.remove();
  let catIdx = 0;

  function emojiList(q) {
    if (q) {
      const r = [];
      EMOJI_CATS.forEach(cat => cat.emoji.forEach(([e, n]) => { if (n.includes(q)) r.push([e, n]); }));
      return r;
    }
    return EMOJI_CATS[catIdx].emoji;
  }

  function renderGrid(q) {
    const grid = document.getElementById('emoji-grid');
    if (!grid) return;
    grid.innerHTML = emojiList(q.toLowerCase()).map(([e, n]) =>
      `<button class="emoji-item" title="${escapeAttr(n)}" data-emoji="${escapeAttr(e)}">${e}</button>`
    ).join('');
    grid.querySelectorAll('.emoji-item').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.stopPropagation();
        const inp = document.getElementById('message-input');
        if (inp) {
          const s = inp.selectionStart, end = inp.selectionEnd;
          inp.value = inp.value.slice(0, s) + btn.dataset.emoji + inp.value.slice(end);
          const p = s + btn.dataset.emoji.length;
          inp.setSelectionRange(p, p);
          inp.focus();
        }
        document.getElementById('emoji-picker')?.remove();
      });
    });
  }

  const picker = document.createElement('div');
  picker.id = 'emoji-picker';
  const rect = anchorEl.getBoundingClientRect();
  picker.style.left   = Math.max(0, rect.left) + 'px';
  picker.style.bottom = (window.innerHeight - rect.top + 8) + 'px';

  const tabsHtml = EMOJI_CATS.map((cat, i) =>
    `<button class="emoji-tab${i === 0 ? ' active' : ''}" data-cat="${i}" title="${cat.name}">${cat.icon}</button>`
  ).join('');

  picker.innerHTML = `
    <div id="emoji-search-wrap"><input id="emoji-search" type="text" placeholder="Search emoji…" autocomplete="off"></div>
    <div id="emoji-tabs">${tabsHtml}</div>
    <div id="emoji-grid"></div>
  `;
  document.body.appendChild(picker);

  const r = picker.getBoundingClientRect();
  if (r.right > window.innerWidth) picker.style.left = Math.max(0, window.innerWidth - r.width - 8) + 'px';

  renderGrid('');

  document.getElementById('emoji-search').addEventListener('input', e => renderGrid(e.target.value.trim()));

  picker.querySelectorAll('.emoji-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      catIdx = parseInt(btn.dataset.cat);
      picker.querySelectorAll('.emoji-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('emoji-search').value = '';
      renderGrid('');
    });
  });

  setTimeout(() => {
    const closer = ev => {
      const p = document.getElementById('emoji-picker');
      if (p && !p.contains(ev.target) && ev.target !== anchorEl) {
        p.remove();
        document.removeEventListener('click', closer);
      }
    };
    document.addEventListener('click', closer);
  }, 0);
}

// Typing indicator state (not part of render state)
const typingNicks = {};       // "server\0channel" → Set<nick>
const typingClearTimers = {}; // "server\0channel\0nick" → timerId
let outgoingTypingTimer = null;
let outgoingTypingActiveTimer = null; // rate-limits the 'active' send to once per 3s

// Bot nick tracking — populated when MODE <nick> +B is seen
const botNicks = {}; // "server\0nick" → true
const pingTimes = {}; // nick → Date.now() when /ping was sent

function botIcon(nick) {
  const icons = ['🤖', '👾'];
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) & 0xffff;
  return icons[h % icons.length];
}

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
    ch = { name: channelName, server: serverName, active: false, unread: 0, mentions: 0, messages: loadMessages(serverName, channelName) };
    srv.channels.push(ch);
  }
  return ch;
}

// ── Message persistence ────────────────────────────────────
function loadMessages(server, channel) {
  try {
    const raw = localStorage.getItem(`dojoirc:msgs:${server}:${channel}`);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function saveMessages(server, channel, messages) {
  try {
    const toSave = messages
      .filter(m => m.type !== 'dcc_offer' && m.type !== 'dcc_chat_offer' && m.type !== 'dcc_progress')
      .slice(-200);
    localStorage.setItem(`dojoirc:msgs:${server}:${channel}`, JSON.stringify(toSave));
  } catch(e) {}
}

const _savePending = {};
function scheduleSave(server, channel, messages) {
  const key = `${server}\0${channel}`;
  clearTimeout(_savePending[key]);
  _savePending[key] = setTimeout(() => saveMessages(server, channel, messages), 800);
}

function addMsg(ch, msg) {
  ch.messages.push(msg);
  if (ch.messages.length > 500) ch.messages = ch.messages.slice(-500);
  scheduleSave(ch.server, ch.name, ch.messages);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isDm(name) {
  return name !== 'server' && !/^[#&!+]/.test(name);
}

function openQuery(server, nick) {
  if (!server || !nick || nick === myNick(server)) return;
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

// ── Channel mode tracking ──────────────────────────────────
const MODE_TAKES_PARAM = new Set(['o','v','h','a','q','b','e','I','k']);
function applyModes(modeSet, modeStr) {
  const parts = modeStr.trim().split(/\s+/);
  const flags = parts[0] || '';
  let adding = true;
  let paramIdx = 1;
  for (const c of flags) {
    if (c === '+') { adding = true; continue; }
    if (c === '-') { adding = false; continue; }
    const takesParam = MODE_TAKES_PARAM.has(c) || (adding && c === 'l');
    if (takesParam) { paramIdx++; continue; }
    if (adding) modeSet.add(c);
    else modeSet.delete(c);
  }
}

// ── URL preview ────────────────────────────────────────────
const URL_RE = /https?:\/\/[^\s<>"']+[^\s<>"'.,:;!?)]/g;
const previewCache = new Map(); // url → result or null (pending)
const PREVIEW_CACHE_MAX = 500;
function previewCacheSet(url, value) {
  if (!previewCache.has(url) && previewCache.size >= PREVIEW_CACHE_MAX) {
    previewCache.delete(previewCache.keys().next().value);
  }
  previewCache.set(url, value);
}

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
  // Wire click handlers on inline preview cards (rendered directly into HTML)
  document.querySelectorAll('.url-preview[data-preview-url]').forEach(card => {
    if (card._clickBound) return;
    card._clickBound = true;
    const url = card.dataset.previewUrl;
    card.addEventListener('click', () => BrowserOpen(url).catch(() => {}));
  });

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

    previewCacheSet(url, null); // mark pending
    FetchURLPreview(url).then(p => {
      previewCacheSet(url, p);
      // The message row might have been replaced by a re-render; find it again
      document.querySelectorAll(`a.msg-link[data-url="${escapeAttr(url)}"]`).forEach(link => {
        const row = link.closest('.message');
        if (row) injectPreview(row, url, p);
      });
    }).catch(() => {});
  });
}

function previewCardHTML(url, p) {
  if (!p || (!p.title && !p.image)) return '';
  if (p.isImage || (p.image && !p.title)) {
    return `<div class="url-preview" data-preview-url="${escapeAttr(url)}"><img class="preview-img-only" src="${escapeAttr(p.isImage ? url : p.image)}" alt="" loading="lazy"></div>`;
  }
  const thumb = p.image ? `<img class="preview-thumb" src="${escapeAttr(p.image)}" alt="" loading="lazy">` : '';
  return `<div class="url-preview" data-preview-url="${escapeAttr(url)}">${thumb}<div class="preview-body"><div class="preview-domain">${escapeHtml(p.domain || '')}</div>${p.title ? `<div class="preview-title">${escapeHtml(p.title)}</div>` : ''}${p.description ? `<div class="preview-desc">${escapeHtml(p.description)}</div>` : ''}</div></div>`;
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
      state.nicks[ev.server] = ev.nick;
      state.nick = ev.nick; // legacy fallback
      const csrv = ensureChannel(ev.server, 'server');
      const cparent = state.servers.find(s => s.name === ev.server);
      if (cparent) cparent.connected = true;
      render();
      break;
    }
    case 'server':
    case 'whois': {
      const ch = ensureChannel(ev.server, 'server');
      addMsg(ch,{ time: ev.time, nick: '', text: ev.text, type: 'server' });
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
      let isMention = false;
      const myN = myNick(ev.server);
      if (myN && ev.nick && ev.nick !== myN) {
        const re = new RegExp(`(?:^|\\W)${escapeRegex(myN)}(?:\\W|$)`, 'i');
        isMention = re.test(ev.text);
      }
      addMsg(ch,{ time: ev.time, nick: ev.nick, text: ev.text, type: ev.type, mention: isMention });
      if (ev.server !== state.activeServer || ev.channel !== state.activeChannel) {
        ch.unread++;
        if (isMention) ch.mentions++;
      }
      if (isMention) fireNotification(ev.server, ev.channel, ev.nick, ev.text);
      setTyping(ev.server, ev.channel, ev.nick, 'done');
      render();
      break;
    }
    case 'join': {
      const ch = ensureChannel(ev.server, ev.channel);
      addMsg(ch,{ time: ev.time, nick: '', text: `${ev.nick} joined`, type: 'server' });
      if (!state.activeChannel || state.activeChannel === 'server') {
        state.activeServer  = ev.server;
        state.activeChannel = ev.channel;
        ch.active = true;
      }
      if (!ch.nicks) ch.nicks = [];
      if (!ch.nicks.some(n => n.replace(/^[@+~&]/, '') === ev.nick)) {
        ch.nicks.push(ev.nick);
        sortNicks(ch.nicks);
      }
      render();
      break;
    }
    case 'part': {
      const ch = findChannel(ev.server, ev.channel);
      if (ch) {
        addMsg(ch,{ time: ev.time, nick: '', text: `${ev.nick} left${ev.text ? ': ' + ev.text : ''}`, type: 'server' });
        if (ch.nicks) ch.nicks = ch.nicks.filter(n => n.replace(/^[@+~&]/, '') !== ev.nick);
      }
      render();
      break;
    }
    case 'quit': {
      const qsrv = state.servers.find(s => s.name === ev.server);
      if (qsrv) qsrv.channels.forEach(ch => {
        if (!ch.nicks || !ch.nicks.some(n => n.replace(/^[@+~&]/, '') === ev.nick)) return;
        addMsg(ch,{ time: ev.time, nick: '', text: `${ev.nick} quit${ev.text ? ': ' + ev.text : ''}`, type: 'server' });
        ch.nicks = ch.nicks.filter(n => n.replace(/^[@+~&]/, '') !== ev.nick);
      });
      render();
      break;
    }
    case 'kick': {
      const ch = findChannel(ev.server, ev.channel);
      if (ch) {
        addMsg(ch,{ time: ev.time, nick: '', text: `${ev.nick} was kicked${ev.text ? ': ' + ev.text : ''}`, type: 'server' });
        if (ch.nicks) ch.nicks = ch.nicks.filter(n => n.replace(/^[@+~&]/, '') !== ev.nick);
      }
      render();
      break;
    }
    case 'nick': {
      if (ev.nick === myNick(ev.server)) {
        state.nicks[ev.server] = ev.text;
        if (ev.server === state.activeServer) state.nick = ev.text;
      }
      const nsrv = state.servers.find(s => s.name === ev.server);
      if (nsrv) nsrv.channels.forEach(ch => {
        if (!ch.nicks) return;
        const idx = ch.nicks.findIndex(n => n.replace(/^[@+~&]/, '') === ev.nick);
        if (idx === -1) return;
        addMsg(ch,{ time: ev.time, nick: '', text: `${ev.nick} is now known as ${ev.text}`, type: 'server' });
        const prefix = ch.nicks[idx].match(/^[@+~&]/)?.[0] || '';
        ch.nicks[idx] = prefix + ev.text;
        sortNicks(ch.nicks);
      });
      render();
      break;
    }
    case 'mode': {
      const isChannelTarget = ev.channel.startsWith('#') || ev.channel.startsWith('&');
      if (!isChannelTarget) {
        const key = ev.server + '\0' + ev.channel;
        if (/\+[^-]*B/.test(ev.text)) botNicks[key] = true;
        if (/-[^+]*B/.test(ev.text)) delete botNicks[key];
      }
      const ch = isChannelTarget ? findChannel(ev.server, ev.channel) : null;
      if (ch) {
        if (!ch.modeSet) ch.modeSet = new Set();
        applyModes(ch.modeSet, ev.text);
        ch.modes = ch.modeSet.size ? '+' + [...ch.modeSet].sort().join('') : '';
      }
      const displayCh = ch || findChannel(ev.server, 'server');
      if (displayCh) addMsg(displayCh, { time: ev.time, nick: '', text: `${ev.nick || 'server'} sets mode ${ev.text}`, type: 'server' });
      render();
      break;
    }
    case 'notice': {
      const ch = ensureChannel(ev.server, ev.channel.startsWith('#') ? ev.channel : 'server');
      addMsg(ch,{ time: ev.time, nick: ev.nick, text: ev.text, type: 'notice' });
      render();
      break;
    }
    case 'ctcp': {
      const ch = ensureChannel(ev.server, 'server');
      addMsg(ch,{ time: ev.time, nick: '', text: `[CTCP] ${ev.text}`, type: 'server' });
      render();
      break;
    }
    case 'ctcp_reply': {
      const ch = ensureChannel(ev.server, 'server');
      let displayText = `[CTCP] ${ev.text}`;
      if (ev.text.startsWith('PING ')) {
        const sentAt = pingTimes[ev.nick];
        if (sentAt) {
          const rtt = Date.now() - sentAt;
          delete pingTimes[ev.nick];
          displayText = `[CTCP] PING reply from ${ev.nick}: ${rtt}ms`;
        }
      }
      addMsg(ch,{ time: ev.time, nick: ev.nick, text: displayText, type: 'notice' });
      render();
      break;
    }
    case 'topic': {
      const ch = findChannel(ev.server, ev.channel);
      if (ch) {
        ch.topic = ev.text;
        addMsg(ch,{ time: ev.time, nick: '', text: `Topic: ${ev.text}`, type: 'server' });
      }
      render();
      break;
    }
    case 'names': {
      refreshNickList(ev.server, ev.channel);
      break;
    }
    case 'disconnected': {
      const dsrv = state.servers.find(s => s.name === ev.server);
      if (dsrv) {
        dsrv.connected = false;
        dsrv.channels.forEach(ch => {
          ch.nicks = [];
          addMsg(ch,{ time: ev.time, nick: '', text: 'Disconnected from server', type: 'server' });
        });
      }
      render();
      break;
    }
    case 'away_on': {
      state.awayServer = ev.server;
      const ch = ensureChannel(ev.server, 'server');
      addMsg(ch,{ time: ev.time, nick: '', text: ev.text, type: 'server' });
      render();
      break;
    }
    case 'away_off': {
      if (state.awayServer === ev.server) state.awayServer = '';
      const ch = ensureChannel(ev.server, 'server');
      addMsg(ch,{ time: ev.time, nick: '', text: ev.text, type: 'server' });
      render();
      break;
    }
    case 'away': {
      // away-notify: another user's status changed
      const asrv = state.servers.find(s => s.name === ev.server);
      if (asrv) {
        const text = ev.text ? `${ev.nick} is away: ${ev.text}` : `${ev.nick} is back`;
        asrv.channels.forEach(ch => {
          if (ch.nicks && ch.nicks.some(n => n.replace(/^[@+~&]/, '') === ev.nick)) {
            addMsg(ch,{ time: ev.time, nick: '', text, type: 'server' });
          }
        });
      }
      render();
      break;
    }
    case 'list_entry': {
      // ev.channel = channel name, ev.nick = user count, ev.text = topic
      if (!state.listEntries) state.listEntries = [];
      state.listEntries.push({ channel: ev.channel, users: parseInt(ev.nick) || 0, topic: ev.text });
      renderChannelList();
      break;
    }
    case 'list_end': {
      state.listLoading = false;
      renderChannelList();
      break;
    }
    case 'dcc_offer': {
      const ch = ensureChannel(ev.server, ev.nick);
      const key = ev.nick + ':' + ev.dcc_file;
      addMsg(ch,{
        time: ev.time,
        nick: ev.nick,
        text: `wants to send "${ev.dcc_file}" (${formatBytes(ev.dcc_size)})`,
        type: 'dcc_offer',
        dccServer: ev.server,
        dccNick: ev.nick,
        dccFile: ev.dcc_file,
        dccIP: ev.dcc_ip,
        dccPort: ev.dcc_port,
        dccSize: ev.dcc_size,
        dccState: 'pending',
        dccKey: key,
      });
      if (ev.server !== state.activeServer || ev.nick !== state.activeChannel) ch.unread++;
      render();
      break;
    }
    case 'dcc_chat_offer': {
      const ch = ensureChannel(ev.server, ev.nick);
      addMsg(ch,{
        time: ev.time,
        nick: ev.nick,
        text: 'wants to open a DCC Chat',
        type: 'dcc_chat_offer',
        dccServer: ev.server,
        dccNick: ev.nick,
        dccIP: ev.dcc_ip,
        dccPort: ev.dcc_port,
        dccState: 'pending',
        dccKey: ev.nick + ':dcc_chat',
      });
      if (ev.server !== state.activeServer || ev.nick !== state.activeChannel) ch.unread++;
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
    case 'j':
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
        if (ch) addMsg(ch,{ time: timestamp(), nick: myNick(state.activeServer), text: meText, type: 'action' });
        render();
      }
      break;
    case 'msg':
      if (args.length >= 2) {
        const target = args[0];
        const msgText = args.slice(1).join(' ');
        SendMessage(state.activeServer, target, msgText).catch(console.error);
        addMsg(ensureChannel(state.activeServer, target), { time: timestamp(), nick: myNick(state.activeServer), text: msgText, type: 'message' });
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
    case 'topic': {
      if (args.length) {
        const isChannel = /^[#&!+]/.test(args[0]);
        const topicChannel = isChannel ? args[0] : (state.activeChannel || '');
        const topicText = isChannel ? args.slice(1).join(' ') : args.join(' ');
        if (topicChannel && topicText)
          SendRaw(state.activeServer, `TOPIC ${topicChannel} :${topicText}`).catch(console.error);
      }
      break;
    }
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
    case 'ctcp': {
      // /ctcp <nick> <command> [param]
      if (args.length >= 2) {
        const ctcpTarget = args[0];
        const ctcpCmd = args[1].toUpperCase();
        const ctcpParam = args.slice(2).join(' ');
        SendCTCP(state.activeServer, ctcpTarget, ctcpCmd, ctcpParam).catch(console.error);
      }
      break;
    }
    case 'version':
      if (args[0]) SendCTCP(state.activeServer, args[0], 'VERSION', '').catch(console.error);
      break;
    case 'ping': {
      if (args[0]) {
        pingTimes[args[0]] = Date.now();
        SendCTCP(state.activeServer, args[0], 'PING', String(Date.now())).catch(console.error);
      }
      break;
    }
    case 'time':
      if (args[0]) SendCTCP(state.activeServer, args[0], 'TIME', '').catch(console.error);
      break;
    case 'finger':
      if (args[0]) SendCTCP(state.activeServer, args[0], 'FINGER', '').catch(console.error);
      break;
    case 'clientinfo':
      if (args[0]) SendCTCP(state.activeServer, args[0], 'CLIENTINFO', '').catch(console.error);
      break;
    case 'dcc':
      if (args[0]?.toLowerCase() === 'chat' && args[1]) {
        DCCChatInitiate(state.activeServer, args[1]).catch(console.error);
        openQuery(state.activeServer, args[1]);
      }
      break;
    case 'raw':
    case 'quote':
      if (args.length) SendRaw(state.activeServer, args.join(' ')).catch(console.error);
      break;
    case 'clear': {
      const clrCh = activeChannel();
      if (clrCh) { clrCh.messages = []; try { localStorage.removeItem(`dojoirc:msgs:${clrCh.server}:${clrCh.name}`); } catch(e) {} render(); }
      break;
    }
    case 'sysinfo':
      GetSysInfo().then(info => {
        if (!info || !state.activeServer || !state.activeChannel || state.activeChannel === 'server') return;
        SendMessage(state.activeServer, state.activeChannel, info).catch(console.error);
        const ch = activeChannel();
        if (ch) { addMsg(ch,{ time: timestamp(), nick: myNick(state.activeServer), text: info, type: 'message' }); render(); }
      }).catch(console.error);
      break;
    case 'list':
      if (state.activeServer) {
        state.listEntries = [];
        state.listLoading = true;
        showChannelListPanel();
        ListChannels(state.activeServer).catch(console.error);
      }
      break;
    case 'quit':
      SendRaw(state.activeServer, `QUIT :${args.join(' ') || 'DojoIRC'}`).catch(console.error);
      break;
    case 'oper':
      if (args.length >= 2)
        SendRaw(state.activeServer, `OPER ${args[0]} ${args[1]}`).catch(console.error);
      break;
    case 'kill':
      if (args.length >= 2)
        SendRaw(state.activeServer, `KILL ${args[0]} :${args.slice(1).join(' ')}`).catch(console.error);
      break;
    case 'kline':
      if (args.length >= 3)
        SendRaw(state.activeServer, `KLINE ${args[0]} ${args[1]} :${args.slice(2).join(' ')}`).catch(console.error);
      break;
    case 'unkline':
      if (args[0])
        SendRaw(state.activeServer, `UNKLINE ${args[0]}`).catch(console.error);
      break;
    case 'dline':
      if (args.length >= 3)
        SendRaw(state.activeServer, `DLINE ${args[0]} ${args[1]} :${args.slice(2).join(' ')}`).catch(console.error);
      break;
    case 'undline':
      if (args[0])
        SendRaw(state.activeServer, `UNDLINE ${args[0]}`).catch(console.error);
      break;
    case 'rehash':
      SendRaw(state.activeServer, 'REHASH').catch(console.error);
      break;
    case 'wallops':
      if (args.length)
        SendRaw(state.activeServer, `WALLOPS :${args.join(' ')}`).catch(console.error);
      break;
    case 'help': {
      const helpCh = activeChannel();
      if (helpCh) {
        [
          '/nick <name>              — change your nick',
          '/whois <nick>             — show info about a user',
          '/join <#channel>          — join a channel',
          '/part [#channel]          — leave a channel',
          '/me <text>                — send an action',
          '/msg <nick> <text>        — send a private message',
          '/query <nick>             — open a DM buffer',
          '/away [message]           — set away status',
          '/back                     — clear away status',
          '/topic <text>             — set channel topic',
          '/kick <nick>              — kick from channel',
          '/mode <args>              — set mode',
          '/invite <nick>            — invite to channel',
          '/list                     — browse channels on this server',
          '/raw <line>               — send raw IRC line',
          '/quit [message]           — disconnect',
          '/version <nick>           — query CTCP VERSION',
          '/ping <nick>              — CTCP PING (shows RTT)',
          '/time <nick>              — query CTCP TIME',
          '/finger <nick>            — query CTCP FINGER',
          '/clientinfo <nick>        — query CTCP CLIENTINFO',
          '/ctcp <nick> <cmd> [p]    — send arbitrary CTCP request',
          '/oper <user> <pass>       — authenticate as IRC operator',
          '/kill <nick> <reason>     — disconnect a user from the server',
          '/kline <dur> <mask> <rsn> — ban a mask from the server',
          '/unkline <mask>           — remove a K-line',
          '/dline <dur> <ip> <rsn>   — ban an IP from the server',
          '/undline <ip>             — remove a D-line',
          '/rehash                   — reload server config (opers)',
          '/wallops <text>           — send a message to all opers',
        ].forEach(line => addMsg(helpCh, { time: timestamp(), nick: '', text: line, type: 'server' }));
        render();
      }
      break;
    }
    default: {
      const ch = activeChannel();
      if (ch) addMsg(ch,{ time: timestamp(), nick: '', text: `Unknown command: /${cmd}`, type: 'server' });
      render();
    }
  }
}

// ── Tab completion ──────────────────────────────────────────
const SLASH_COMMANDS = [
  'away','back','clear','clientinfo','ctcp','dline','finger','help','invite','j','join','kick',
  'kill','kline','list','me','mode','msg','nick','oper','part','ping','query','quit','raw',
  'rehash','time','topic','undline','unkline','version','wallops','whois',
];

let tabComp = null;

function handleTab(input) {
  const val = input.value;
  const pos  = input.selectionStart;

  if (tabComp) {
    tabComp.idx = (tabComp.idx + 1) % tabComp.matches.length;
  } else {
    const before  = val.slice(0, pos);
    const wordMatch = before.match(/(\S+)$/);
    if (!wordMatch) return;
    const partial = wordMatch[1];
    const prefix  = before.slice(0, before.length - partial.length);
    const after   = val.slice(pos);

    let matches = [];
    let isShortcode = false;
    if (partial.startsWith('/') && prefix === '') {
      matches = SLASH_COMMANDS
        .filter(c => ('/' + c).startsWith(partial.toLowerCase()))
        .map(c => '/' + c);
    } else if (partial.startsWith(':') && partial.length > 1) {
      const lp = partial.toLowerCase();
      matches = Object.entries(SHORTCODES)
        .filter(([k]) => k.startsWith(lp))
        .map(([, v]) => v);
      isShortcode = true;
    } else {
      const srv = state.servers.find(s => s.name === state.activeServer);
      const ch  = srv?.channels.find(c => c.name === state.activeChannel);
      const nicks = (ch?.nicks || []).map(n => n.replace(/^[@+%~&]/, ''));
      const lp = partial.toLowerCase();
      matches = nicks.filter(n => n.toLowerCase().startsWith(lp));
    }
    if (!matches.length) return;
    tabComp = { matches, idx: 0, prefix, after, atStart: prefix.trim() === '', isShortcode };
  }

  const match  = tabComp.matches[tabComp.idx];
  const isCmd  = match.startsWith('/');
  const suffix = (tabComp.isShortcode || isCmd) ? ' ' : (tabComp.atStart ? ': ' : ' ');
  const newVal = tabComp.prefix + match + suffix + tabComp.after.trimStart();
  input.value  = newVal;
  const newPos = tabComp.prefix.length + match.length + suffix.length;
  input.setSelectionRange(newPos, newPos);
}

// ── Render ─────────────────────────────────────────────────
let _renderPending = false;
let _forceScrollBottom = false;
function render() {
  if (_renderPending) return;
  _renderPending = true;
  requestAnimationFrame(doRender);
  // Fallback for WebKit builds where rAF callbacks may not fire (e.g. FreeBSD)
  setTimeout(() => { if (_renderPending) doRender(); }, 50);
}

function doRender() {
  _renderPending = false;
  const prevMsgs = document.getElementById('messages');
  const prevKey = prevMsgs?.dataset.channel;
  const curKey  = state.activeServer + '/' + state.activeChannel;
  // Scroll to bottom if: no previous buffer, channel switched, or user was already at the bottom
  const atBottom = _forceScrollBottom || !prevMsgs || prevKey !== curKey ||
    prevMsgs.scrollTop + prevMsgs.clientHeight >= prevMsgs.scrollHeight - 60;
  _forceScrollBottom = false;

  const prevInput = document.getElementById('message-input');
  const savedInput = prevInput ? prevInput.value : '';
  const savedSel   = prevInput ? [prevInput.selectionStart, prevInput.selectionEnd] : [0, 0];

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
        ${ch?.modes ? `<span id="buffer-modes">${escapeHtml(ch.modes)}</span>` : ''}
        ${ch?.topic ? `<button id="topic-toggle" class="${state.topicVisible ? 'active' : ''}" title="${state.topicVisible ? 'Hide topic' : 'Show topic'}">topic</button>` : ''}
        ${state.searchOpen ? `<div id="search-bar"><input id="search-input" type="text" placeholder="Search…" value="${escapeAttr(state.searchQuery)}" autocomplete="off"><span id="search-count"></span><button id="search-prev" title="Previous match (Shift+Enter)">↑</button><button id="search-next" title="Next match (Enter)">↓</button><button id="search-close" title="Close search (Esc)">✕</button></div>` : `<button id="search-open" title="Search (Ctrl+F)">⌕</button>`}
        ${!isServerBuf ? `<button id="nicklist-toggle" title="${state.nicklistHidden ? 'Show user list' : 'Hide user list'}">${state.nicklistHidden ? '◂' : '▸'}</button>` : ''}
      </div>
      ${ch?.topic && state.topicVisible ? `<div id="buffer-topic">${renderText(ch.topic)}</div>` : ''}
      <div id="content">
        <div id="messages" data-channel="${state.activeServer}/${state.activeChannel}">${renderMessages()}</div>
        <button id="scroll-btn" title="Scroll to bottom" style="display:none"><span class="chv"></span><span class="chv"></span><span class="chv"></span></button>
      </div>
      <div id="typing-bar"></div>
      <div id="input-bar">
        <button id="nick-toggle" title="${state.nickHidden ? 'Show nick' : 'Hide nick'}">${state.nickHidden ? '›' : '‹'}</button>
        ${state.nickHidden ? '' : `<span id="input-nick">${myNick(state.activeServer)}${state.awayServer === state.activeServer ? '<span class="away-badge">away</span>' : ''}</span>`}
        <input id="message-input" type="text" placeholder="${state.activeChannel ? 'Message ' + state.activeChannel : 'Not connected'}" autocomplete="off" />
        <button id="emoji-btn" title="Emoji">😊</button>
      </div>
    </div>
    ${isServerBuf ? '' : `<div id="nicklist-handle" title="Drag to resize"${state.nicklistHidden ? ' style="display:none"' : ''}></div><div id="nicklist" style="width:${state.nicklistWidth}px${state.nicklistHidden ? ';display:none' : ''}">${renderNicklist()}</div>`}
  `;
  bindEvents();
  if (savedInput) {
    const inp = document.getElementById('message-input');
    if (inp) { inp.value = savedInput; inp.setSelectionRange(savedSel[0], savedSel[1]); }
  }
  if (atBottom) { scrollToBottom(); setTimeout(scrollToBottom, 0); }
  bindLinkPreviews();
  document.querySelectorAll('#buffer-topic a.msg-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); BrowserOpen(a.dataset.url).catch(() => {}); });
  });
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
  const msgs = ch.messages.slice(-state.scrollback);
  const query = state.searchOpen && state.searchQuery ? state.searchQuery.toLowerCase() : '';
  return msgs.map(m => {
    if (m.type === 'dcc_offer') {
      const searchCls = query
        ? ((m.dccFile.toLowerCase().includes(query) || m.nick.toLowerCase().includes(query)) ? ' search-match' : ' search-miss')
        : '';
      const btns = m.dccState === 'pending'
        ? `<button class="dcc-accept" data-dcc-key="${escapeAttr(m.dccKey)}" data-dcc-server="${escapeAttr(m.dccServer)}" data-dcc-nick="${escapeAttr(m.dccNick)}" data-dcc-file="${escapeAttr(m.dccFile)}" data-dcc-ip="${escapeAttr(m.dccIP)}" data-dcc-port="${m.dccPort}" data-dcc-size="${m.dccSize}">Accept</button> <button class="dcc-decline" data-dcc-key="${escapeAttr(m.dccKey)}">Decline</button>`
        : m.dccState === 'accepted' ? '<span class="dcc-accepted">✓ Accepted</span>'
        : '<span class="dcc-declined">✗ Declined</span>';
      return `<div class="message dcc_offer${searchCls}">
        <span class="msg-time">${m.time}</span>
        <span class="msg-nick clickable" data-nick="${escapeAttr(m.nick)}" data-server="${escapeAttr(state.activeServer)}" style="color:${nickColor(m.nick)}">${escapeHtml(m.nick)}</span>
        <span class="msg-text">📎 ${escapeHtml(m.text)} ${btns}</span>
      </div>`;
    }
    if (m.type === 'dcc_chat_offer') {
      const searchCls = query
        ? (m.nick.toLowerCase().includes(query) ? ' search-match' : ' search-miss')
        : '';
      const btns = m.dccState === 'pending'
        ? `<button class="dcc-chat-accept" data-dcc-key="${escapeAttr(m.dccKey)}" data-dcc-server="${escapeAttr(m.dccServer)}" data-dcc-nick="${escapeAttr(m.dccNick)}" data-dcc-ip="${escapeAttr(m.dccIP)}" data-dcc-port="${m.dccPort}">Accept</button> <button class="dcc-chat-decline" data-dcc-key="${escapeAttr(m.dccKey)}">Decline</button>`
        : m.dccState === 'accepted' ? '<span class="dcc-accepted">✓ Chat open</span>'
        : '<span class="dcc-declined">✗ Declined</span>';
      return `<div class="message dcc_offer${searchCls}">
        <span class="msg-time">${m.time}</span>
        <span class="msg-nick clickable" data-nick="${escapeAttr(m.nick)}" data-server="${escapeAttr(state.activeServer)}" style="color:${nickColor(m.nick)}">${escapeHtml(m.nick)}</span>
        <span class="msg-text">💬 ${escapeHtml(m.text)} ${btns}</span>
      </div>`;
    }
    const color = m.nick ? `style="color:${nickColor(m.nick)}"` : '';
    const clickable = m.nick && m.type !== 'server';
    const nickAttrs = clickable ? ` data-nick="${escapeAttr(m.nick)}" data-server="${escapeAttr(state.activeServer)}"` : '';
    const nickDisplay = m.type === 'action'
      ? `<span class="msg-nick action-nick${clickable ? ' clickable' : ''}"${nickAttrs} ${color}>* ${escapeHtml(m.nick)}</span>`
      : `<span class="msg-nick${clickable ? ' clickable' : ''}"${nickAttrs} ${color}>${m.nick ? escapeHtml(m.nick) : ''}</span>`;
    const textClass = m.type === 'action' ? 'msg-text action-text' : 'msg-text';
    const searchCls = query
      ? ((m.text.toLowerCase().includes(query) || (m.nick && m.nick.toLowerCase().includes(query))) ? ' search-match' : ' search-miss')
      : '';
    // Inline cached preview cards so images survive re-renders without flicker
    const urls = extractURLs(m.text || '');
    const inlinePreviews = urls.map(url => {
      if (!previewCache.has(url)) return '';
      return previewCardHTML(url, previewCache.get(url));
    }).join('');
    const previewAttr = inlinePreviews ? ` data-preview-done="${escapeAttr(urls[0])}"` : '';
    return `
    <div class="message ${m.type || ''}${m.mention ? ' mention' : ''}${searchCls}"${previewAttr}>
      <span class="msg-time">${m.time}</span>
      ${nickDisplay}
      <span class="${textClass}">${renderText(m.text)}</span>
    </div>${inlinePreviews}`;
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
    const isBot = !!botNicks[state.activeServer + '\0' + bare];
    const botBadge = isBot ? `<span class="bot-icon" title="Bot">${botIcon(bare)}</span>` : '';
    return `<div class="nick-item ${cls}" data-nick="${escapeAttr(bare)}" data-server="${escapeAttr(state.activeServer)}" style="color:${color}"><span class="nick-text">${prefix ? `<span class="nick-prefix">${prefix}</span>` : ''}${escapeHtml(bare)}</span>${botBadge}</div>`;
  }).join('');
}

// ── Typing indicators ──────────────────────────────────────
function typingKey(server, channel) { return `${server}\0${channel}`; }

function fireNotification(server, channel, nick, text) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const isActiveChannel = server === state.activeServer && channel === state.activeChannel;
  if (isActiveChannel && document.hasFocus()) return;
  const body = text.length > 120 ? text.slice(0, 117) + '…' : text;
  new Notification(`${nick} in ${channel}`, { body, silent: false });
}

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
function nickCtxItems(server, nick) {
  const ch = activeChannel();
  const inChannel = ch && ch.name.startsWith('#');
  const items = [
    { label: 'Message',     action: () => openQuery(server, nick) },
    { label: 'Whois',       action: () => SendWhois(server, nick).catch(console.error) },
    { label: 'Version',     action: () => SendCTCP(server, nick, 'VERSION', '').catch(console.error) },
    { label: 'Ping',        action: () => { pingTimes[nick] = Date.now(); SendCTCP(server, nick, 'PING', String(Date.now())).catch(console.error); } },
  ];
  if (inChannel) {
    const alreadyHere = ch.nicks && ch.nicks.some(n => n.replace(/^[@+~&]/, '') === nick);
    if (!alreadyHere)
      items.push({ label: 'Invite to ' + ch.name, action: () => SendRaw(server, `INVITE ${nick} ${ch.name}`).catch(console.error) });
  }
  return items;
}

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

function updateSearchCurrent() {
  const msgs = document.getElementById('messages');
  const count = document.getElementById('search-count');
  if (!msgs) return;
  const matches = Array.from(msgs.querySelectorAll('.message.search-match'));
  if (!matches.length) {
    if (count) count.textContent = state.searchQuery ? '0 of 0' : '';
    return;
  }
  if (state.searchMatchIdx >= matches.length) state.searchMatchIdx = 0;
  if (state.searchMatchIdx < 0) state.searchMatchIdx = matches.length - 1;
  matches.forEach((m, i) => m.classList.toggle('search-current', i === state.searchMatchIdx));
  matches[state.searchMatchIdx].scrollIntoView({ block: 'nearest' });
  if (count) count.textContent = `${state.searchMatchIdx + 1} of ${matches.length}`;
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

    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      const name = el.dataset.server;
      const srv  = state.servers.find(s => s.name === name);
      const isConnected = srv?.connected ?? true;
      showCtxMenu(e.clientX, e.clientY, isConnected ? [
        { label: 'Disconnect', cls: 'danger', action: () => DisconnectServer(name).catch(console.error) },
      ] : [
        { label: 'Connect', action: () => ConnectServer(name).catch(console.error) },
      ]);
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
    input.addEventListener('pointerdown', () => MaybeShowKeyboard().catch(() => {}));
    input.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        handleTab(input);
        return;
      }
      tabComp = null; // any other key resets tab completion

      if (e.key === 'ArrowUp' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (!inputHistory.length) return;
        e.preventDefault();
        if (historyIdx === -1) { inputDraft = input.value; historyIdx = inputHistory.length - 1; }
        else if (historyIdx > 0) { historyIdx--; }
        input.value = inputHistory[historyIdx];
        input.setSelectionRange(input.value.length, input.value.length);
        return;
      }
      if (e.key === 'ArrowDown' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (historyIdx === -1) return;
        e.preventDefault();
        if (historyIdx < inputHistory.length - 1) {
          historyIdx++;
          input.value = inputHistory[historyIdx];
        } else {
          historyIdx = -1;
          input.value = inputDraft;
        }
        input.setSelectionRange(input.value.length, input.value.length);
        return;
      }

      if (e.key === 'Enter') {
        const val = input.value.trim();
        input.value = '';
        clearTimeout(outgoingTypingTimer);
        clearTimeout(outgoingTypingActiveTimer);
        outgoingTypingActiveTimer = null;
        if (val && state.activeChannel && state.activeChannel !== 'server') {
          SendTyping(state.activeServer, state.activeChannel, 'done').catch(() => {});
        }
        sendMessage(val);
        return;
      }
      // Send typing indicator (debounced, channels and DMs only)
      if (state.activeChannel && state.activeChannel !== 'server' && !e.ctrlKey && !e.metaKey) {
        clearTimeout(outgoingTypingTimer);
        // 'active' is rate-limited to one send per 3s to avoid flooding
        if (!outgoingTypingActiveTimer) {
          SendTyping(state.activeServer, state.activeChannel, 'active').catch(() => {});
          outgoingTypingActiveTimer = setTimeout(() => { outgoingTypingActiveTimer = null; }, 3000);
        }
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
      showCtxMenu(e.clientX, e.clientY, nickCtxItems(server, nick));
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
      showCtxMenu(e.clientX, e.clientY, nickCtxItems(server, nick));
    });
  });

  // DCC accept/decline button delegation
  document.getElementById('messages')?.addEventListener('click', e => {
    const acceptBtn = e.target.closest('.dcc-accept');
    if (acceptBtn) {
      const key    = acceptBtn.dataset.dccKey;
      const server = acceptBtn.dataset.dccServer;
      const nick   = acceptBtn.dataset.dccNick;
      const file   = acceptBtn.dataset.dccFile;
      const ip     = acceptBtn.dataset.dccIp;
      const port   = parseInt(acceptBtn.dataset.dccPort);
      const size   = parseInt(acceptBtn.dataset.dccSize);
      const srv = state.servers.find(s => s.name === server);
      const ch  = srv?.channels.find(c => c.name === nick);
      if (ch) {
        const msg = ch.messages.find(m => m.dccKey === key && m.dccState === 'pending');
        if (msg) msg.dccState = 'accepted';
      }
      DCCAccept(server, nick, file, ip, port, size).catch(console.error);
      render();
      return;
    }
    const declineBtn = e.target.closest('.dcc-decline');
    if (declineBtn) {
      const key = declineBtn.dataset.dccKey;
      state.servers.forEach(srv => srv.channels.forEach(ch => {
        const msg = ch.messages.find(m => m.dccKey === key && m.dccState === 'pending');
        if (msg) msg.dccState = 'declined';
      }));
      render();
    }
    const chatAcceptBtn = e.target.closest('.dcc-chat-accept');
    if (chatAcceptBtn) {
      const key    = chatAcceptBtn.dataset.dccKey;
      const server = chatAcceptBtn.dataset.dccServer;
      const nick   = chatAcceptBtn.dataset.dccNick;
      const ip     = chatAcceptBtn.dataset.dccIp;
      const port   = parseInt(chatAcceptBtn.dataset.dccPort);
      state.servers.forEach(srv => srv.channels.forEach(ch => {
        const msg = ch.messages.find(m => m.dccKey === key && m.dccState === 'pending');
        if (msg) msg.dccState = 'accepted';
      }));
      DCCChatAccept(server, nick, ip, port).catch(console.error);
      render();
      return;
    }
    const chatDeclineBtn = e.target.closest('.dcc-chat-decline');
    if (chatDeclineBtn) {
      const key = chatDeclineBtn.dataset.dccKey;
      state.servers.forEach(srv => srv.channels.forEach(ch => {
        const msg = ch.messages.find(m => m.dccKey === key && m.dccState === 'pending');
        if (msg) msg.dccState = 'declined';
      }));
      render();
    }
  });

  // Scroll-to-bottom button visibility
  const scrollBtn = document.getElementById('scroll-btn');
  const msgsEl = document.getElementById('messages');
  function updateScrollBtn() {
    if (!scrollBtn || !msgsEl) return;
    const nearBottom = msgsEl.scrollTop + msgsEl.clientHeight >= msgsEl.scrollHeight - 60;
    scrollBtn.style.display = nearBottom ? 'none' : 'flex';
  }
  msgsEl?.addEventListener('scroll', updateScrollBtn, { passive: true });
  scrollBtn?.addEventListener('click', () => { scrollToBottom(); scrollBtn.style.display = 'none'; });
  updateScrollBtn();

  // Right-click selected text in message area → copy
  document.getElementById('messages')?.addEventListener('contextmenu', e => {
    if (e.target.closest('[data-nick]')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    e.preventDefault();
    const text = sel.toString();
    showCtxMenu(e.clientX, e.clientY, [
      { label: 'Copy', action: () => ClipboardSetText(text).catch(() => {}) },
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
      { label: 'About DojoIRC',  action: () => showAbout() },
      { label: `Theme: ${state.currentTheme}`, action: () => showThemePicker(mx, my) },
      { label: 'Documentation', action: () => showDocs() },
      { label: 'Font Sizes',    action: () => showFontManager() },
      { label: emojiBtnEnabled ? 'Emoji Button: On ✓' : 'Emoji Button: Off', action: () => {
          emojiBtnEnabled = !emojiBtnEnabled;
          localStorage.setItem('emojiBtnEnabled', emojiBtnEnabled);
          const btn = document.getElementById('emoji-btn');
          if (btn) btn.style.display = emojiBtnEnabled ? '' : 'none';
      }},
      { label: 'Open Config',   action: () => OpenConfig().catch(console.error) },
      { label: 'Reload Config', action: () =>
        ReloadConfig()
          .then(applyUIConfig)
          .then(() => GetServers())
          .then(servers => {
            if (!servers) return;
            servers.forEach(srv => {
              ensureChannel(srv.Name || srv.name, 'server');
              (srv.Channels || srv.channels || []).forEach(ch => ensureChannel(srv.Name || srv.name, ch));
            });
            render();
          })
          .catch(console.error) },
      { separator: true },
      { label: 'Restart', action: () => RestartApp().catch(console.error) },
      { label: 'Quit', cls: 'danger', action: () => AppQuit().catch(console.error) },
    ]);
  });

  // Topic toggle
  document.getElementById('topic-toggle')?.addEventListener('click', () => {
    state.topicVisible = !state.topicVisible;
    render();
  });

  // Nicklist toggle
  document.getElementById('nicklist-toggle')?.addEventListener('click', () => {
    state.nicklistHidden = !state.nicklistHidden;
    localStorage.setItem('nicklistHidden', state.nicklistHidden);
    render();
  });

  // Nick hide toggle
  document.getElementById('nick-toggle')?.addEventListener('click', () => {
    state.nickHidden = !state.nickHidden;
    localStorage.setItem('nickHidden', state.nickHidden);
    render();
  });

  // Search open button
  document.getElementById('search-open')?.addEventListener('click', () => {
    state.searchOpen = true;
    render();
    const si = document.getElementById('search-input');
    if (si) { si.focus(); si.select(); }
  });

  // Search input — update messages in-place to keep focus
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.focus();
    if (state.searchQuery) searchInput.setSelectionRange(state.searchQuery.length, state.searchQuery.length);
    searchInput.addEventListener('input', () => {
      state.searchQuery = searchInput.value;
      state.searchMatchIdx = 0;
      const msgs = document.getElementById('messages');
      if (msgs) {
        msgs.innerHTML = renderMessages();
        rebindMessageNicks();
        bindLinkPreviews();
        updateSearchCurrent();
      }
    });
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) state.searchMatchIdx--;
        else state.searchMatchIdx++;
        updateSearchCurrent();
      }
    });
  }

  document.getElementById('search-prev')?.addEventListener('click', () => {
    state.searchMatchIdx--;
    updateSearchCurrent();
  });
  document.getElementById('search-next')?.addEventListener('click', () => {
    state.searchMatchIdx++;
    updateSearchCurrent();
  });

  // Search close button
  document.getElementById('search-close')?.addEventListener('click', () => {
    state.searchOpen = false;
    state.searchQuery = '';
    render();
    document.getElementById('message-input')?.focus();
  });

  // Emoji picker button
  const emojiBtn = document.getElementById('emoji-btn');
  if (emojiBtn) {
    emojiBtn.style.display = emojiBtnEnabled ? '' : 'none';
    emojiBtn.addEventListener('click', e => {
      e.stopPropagation();
      showEmojiPicker(e.currentTarget);
    });
  }
}

function sendMessage(text) {
  if (!text) return;

  if (text.trim()) {
    inputHistory.push(text);
    if (inputHistory.length > 100) inputHistory.shift();
  }
  historyIdx = -1;
  inputDraft  = '';

  if (!state.activeChannel) return;

  if (text.startsWith('/')) {
    handleSlash(text);
    return;
  }

  if (state.activeChannel === 'server') return;

  const ch = activeChannel();
  if (!ch) return;

  const converted = applyShortcodes(text);
  const dccChatKey = state.activeServer + '\0' + state.activeChannel;
  if (state.dccChats[dccChatKey]) {
    DCCChatSend(state.activeServer, state.activeChannel, converted).catch(err => console.error('dcc chat send failed:', err));
  } else {
    SendMessage(state.activeServer, state.activeChannel, converted)
      .catch(err => console.error('send failed:', err));
  }

  addMsg(ch,{ time: timestamp(), nick: myNick(state.activeServer), text: converted, type: 'message' });
  _forceScrollBottom = true;
  render();
}

// ── Nick list ───────────────────────────────────────────────
function sortNicks(nicks) {
  const rank = n => n.startsWith('@') || n.startsWith('~') || n.startsWith('&') ? 0 : n.startsWith('+') ? 1 : 2;
  nicks.sort((a, b) => rank(a) - rank(b) || a.replace(/^[@+~&]/, '').localeCompare(b.replace(/^[@+~&]/, ''), undefined, { sensitivity: 'base' }));
}

function refreshNickList(server, channel) {
  GetNickList(server, channel).then(nicks => {
    const ch = findChannel(server, channel);
    if (ch && nicks) {
      sortNicks(nicks);
      ch.nicks = nicks;
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

function formatBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
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
  r.setProperty('--nick-op',     t.nicklist.op);
  r.setProperty('--nick-halfop', t.nicklist.halfop);
  r.setProperty('--nick-voice',  t.nicklist.voice);
  r.setProperty('--nick-away',   t.nicklist.away);
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
  applyStoredFontSizes();
}

// ── About overlay ───────────────────────────────────────────
function showAbout() {
  const overlay = document.createElement('div');
  overlay.className = 'docs-overlay';
  overlay.innerHTML = `
    <div class="docs-panel" style="max-width:420px">
      <div class="docs-header">
        About DojoIRC
        <button class="docs-close" id="about-close">✕</button>
      </div>
      <div class="docs-body">
        <div style="text-align:center;padding:16px 0 24px">
          <img src="${DOJOIRC_ICON}" alt="DojoIRC" style="width:80px;height:80px;border-radius:16px;display:block;margin:0 auto 10px">
          <div style="font-size:12px;color:var(--text-dim)">DojoIRC is an IRCv3-capable, cross-platform IRC client</div>
          <div id="about-version" style="margin-top:16px;display:inline-block;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:4px;padding:6px 18px;font-size:13px">
            Version <strong>…</strong>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <tr><td style="color:var(--text-dim);padding:4px 0;width:120px">Platform</td><td>Linux / macOS / Windows / FreeBSD</td></tr>
          <tr><td style="color:var(--text-dim);padding:4px 0">Stack</td><td>Go + Wails v2 + WebKit</td></tr>
          <tr><td style="color:var(--text-dim);padding:4px 0">IRC</td><td>IRCv3 — message-tags, server-time, SASL, typing</td></tr>
          <tr><td style="color:var(--text-dim);padding:4px 0">License</td><td>MIT</td></tr>
          <tr><td style="color:var(--text-dim);padding:4px 0">Author</td><td>joehonkey</td></tr>
          <tr><td style="color:var(--text-dim);padding:4px 0">Source</td><td><a href="#" id="about-gh-link" style="color:var(--accent)">github.com/joehonkey/DojoIRC</a></td></tr>
        </table>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('about-close').addEventListener('click', () => overlay.remove());
  GetVersion().then(v => {
    const el = document.getElementById('about-version');
    if (el) el.innerHTML = `Version <strong>${v}</strong>`;
  }).catch(() => {});
  document.getElementById('about-gh-link').addEventListener('click', e => {
    e.preventDefault();
    BrowserOpen('https://github.com/joehonkey/DojoIRC').catch(console.error);
  });
}

// ── Font size manager ────────────────────────────────────────
function applyStoredFontSizes() {
  const r = document.documentElement.style;
  FONT_ZONES.forEach(z => {
    const v = localStorage.getItem('fs' + z.prop);
    if (v) r.setProperty(z.prop, v + 'px');
  });
}

function getFontSize(prop) {
  const v = localStorage.getItem('fs' + prop);
  if (v) return parseInt(v);
  const computed = getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
  return parseInt(computed) || FONT_ZONES.find(z => z.prop === prop)?.def || 13;
}

function setFontSize(prop, val) {
  const clamped = Math.max(8, Math.min(24, val));
  document.documentElement.style.setProperty(prop, clamped + 'px');
  localStorage.setItem('fs' + prop, clamped);
  return clamped;
}

function showFontManager() {
  const overlay = document.createElement('div');
  overlay.className = 'docs-overlay';
  overlay.innerHTML = `
    <div class="docs-panel" style="max-width:460px">
      <div class="docs-header">
        Font Sizes
        <button class="docs-close" id="fmgr-close">✕</button>
      </div>
      <div class="docs-body" style="padding:12px 20px">
        <table style="width:100%;border-collapse:collapse">
          ${FONT_ZONES.map(z => {
            const cur = getFontSize(z.prop);
            return `<tr class="fmgr-row" data-prop="${z.prop}" data-def="${z.def}">
              <td style="padding:7px 0;color:var(--text);font-size:12px;width:62%">${z.label}</td>
              <td style="text-align:right;padding:7px 0;white-space:nowrap">
                <button class="fmgr-btn fmgr-dec">−</button>
                <span class="fmgr-val" style="display:inline-block;min-width:38px;text-align:center;font-size:12px">${cur}px</span>
                <button class="fmgr-btn fmgr-inc">+</button>
              </td>
            </tr>`;
          }).join('')}
        </table>
        <div style="margin-top:16px;display:flex;justify-content:flex-end">
          <button id="fmgr-reset" class="fmgr-btn" style="padding:3px 16px;font-size:12px">Reset to Defaults</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('fmgr-close').addEventListener('click', () => overlay.remove());

  overlay.querySelectorAll('.fmgr-row').forEach(row => {
    const prop = row.dataset.prop;
    const valEl = row.querySelector('.fmgr-val');
    row.querySelector('.fmgr-dec').addEventListener('click', () => {
      valEl.textContent = setFontSize(prop, getFontSize(prop) - 1) + 'px';
    });
    row.querySelector('.fmgr-inc').addEventListener('click', () => {
      valEl.textContent = setFontSize(prop, getFontSize(prop) + 1) + 'px';
    });
  });

  document.getElementById('fmgr-reset').addEventListener('click', () => {
    FONT_ZONES.forEach(z => {
      document.documentElement.style.removeProperty(z.prop);
      localStorage.removeItem('fs' + z.prop);
    });
    overlay.querySelectorAll('.fmgr-row').forEach(row => {
      row.querySelector('.fmgr-val').textContent = row.dataset.def + 'px';
    });
  });
}

// ── Channel list overlay ────────────────────────────────────
function showChannelListPanel() {
  if (document.getElementById('chanlist-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'chanlist-overlay';
  overlay.className = 'docs-overlay';
  overlay.innerHTML = `
    <div class="docs-panel" style="max-width:680px;height:70vh;display:flex;flex-direction:column">
      <div class="docs-header">
        Channel List — ${state.activeServer}
        <button class="docs-close" id="chanlist-close">✕</button>
      </div>
      <div style="padding:8px 16px;border-bottom:1px solid var(--border)">
        <input id="chanlist-filter" type="text" placeholder="Filter channels..." autocomplete="off"
          style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:4px;padding:6px 10px;color:var(--text);font-size:13px;outline:none;box-sizing:border-box">
      </div>
      <div id="chanlist-body" style="flex:1;overflow-y:auto;padding:0"></div>
      <div id="chanlist-status" style="padding:6px 16px;font-size:11px;color:var(--text-dim);border-top:1px solid var(--border)">Loading...</div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('chanlist-close').addEventListener('click', () => overlay.remove());
  document.getElementById('chanlist-filter').addEventListener('input', renderChannelList);
  renderChannelList();
}

function renderChannelList() {
  const body = document.getElementById('chanlist-body');
  const status = document.getElementById('chanlist-status');
  if (!body) return;
  const filter = (document.getElementById('chanlist-filter')?.value || '').toLowerCase();
  const entries = (state.listEntries || [])
    .filter(e => !filter || e.channel.toLowerCase().includes(filter) || e.topic.toLowerCase().includes(filter))
    .sort((a, b) => b.users - a.users);

  body.innerHTML = entries.map(e => `
    <div class="chanlist-row" data-channel="${escapeAttr(e.channel)}">
      <span class="chanlist-name">${escapeHtml(e.channel)}</span>
      <span class="chanlist-users">${e.users}</span>
      <span class="chanlist-topic">${escapeHtml(e.topic)}</span>
    </div>
  `).join('');

  body.querySelectorAll('.chanlist-row').forEach(row => {
    row.addEventListener('click', () => {
      JoinChannel(state.activeServer, row.dataset.channel).catch(console.error);
      document.getElementById('chanlist-overlay')?.remove();
    });
  });

  if (status) {
    const total = (state.listEntries || []).length;
    status.textContent = state.listLoading
      ? `Loading… ${total} channels so far`
      : `${total} channels${filter ? ` (${entries.length} matching)` : ''}`;
  }
}

// ── Documentation overlay ───────────────────────────────────
function showDocs() {
  const overlay = document.createElement('div');
  overlay.className = 'docs-overlay';
  overlay.innerHTML = `
    <div class="docs-panel">
      <div class="docs-header">
        <span style="white-space:nowrap">DojoIRC — Documentation</span>
        <input id="docs-search" type="text" placeholder="Search docs…" autocomplete="off">
        <button class="docs-close" id="docs-close">✕</button>
      </div>
      <div class="docs-body">

        <h2>Config File</h2>
        <p>Location: <code>~/.config/dojoirc/config.toml</code> (Linux/macOS) or <code>%APPDATA%\dojoirc\config.toml</code> (Windows) — use <b>Hamburger → Open Config</b> to open it in your system editor, then <b>Hamburger → Reload Config</b> to apply changes without restarting.</p>
        <pre><code>theme     = "default"   # theme name (see Themes)
font      = "IBM Plex Mono"
font_size = 13          # main chat font size in px

[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#dojoirc", "#linuxdojo"]</code></pre>

        <h2>Multiple Servers</h2>
        <p>Add as many <code>[[server]]</code> blocks as you need. Each gets its own entry in the sidebar. Reload Config connects any new servers without dropping existing ones.</p>
        <pre><code>[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "joe"
channels = ["#dojoirc"]

[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "joe"
channels = ["#linux", "#archlinux"]</code></pre>
        <p>Right-click any server name in the sidebar to manually connect or disconnect it.</p>

        <h2>SASL Authentication</h2>
        <p>Add a <code>[server.sasl]</code> block immediately after the <code>[[server]]</code> it belongs to. Only PLAIN is supported currently.</p>
        <pre><code>[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#linux"]

[server.sasl]
mechanism = "PLAIN"
username  = "youraccountname"
password  = "yourpassword"</code></pre>
        <p>SASL negotiation happens during the CAP handshake. A success or failure message appears in the server buffer.</p>

        <h2>Bouncer Support (ZNC / soju)</h2>
        <p>Set <code>password</code> in the server block. DojoIRC sends <code>PASS</code> before <code>NICK</code>/<code>USER</code> during the connection handshake — which is what bouncers require.</p>
        <p><b>ZNC</b> — use <code>user/network:password</code>:</p>
        <pre><code>[[server]]
name     = "ZNC"
host     = "znc.example.com"
port     = 6697
tls      = true
nick     = "yournick"
password = "joe/libera:mysecretpassword"
channels = ["#linux"]</code></pre>
        <p><b>soju</b> — use <code>user:password</code> (or SASL PLAIN, which also works):</p>
        <pre><code>[[server]]
name     = "soju"
host     = "soju.example.com"
port     = 6697
tls      = true
nick     = "yournick"
password = "joe:mysecretpassword"
channels = ["#linux"]</code></pre>

        <h2>Themes</h2>
        <p>Switch themes via <b>Hamburger → Theme picker</b>. The active theme is highlighted. Selection persists across restarts.</p>
        <p>Bundled themes: <code>default</code> (Catppuccin Mocha), <code>dark</code>, <code>light</code>, <code>BreezeDarkPlus</code>.</p>
        <p>To add a custom theme, drop a <code>.toml</code> file in <code>~/.config/dojoirc/themes/</code> and use Reload Config — it will appear in the picker immediately.</p>

        <h2>Mentions &amp; Highlights</h2>
        <p>Any message containing your current nick (case-insensitive, whole-word match) is a <b>mention</b>. Mentions are highlighted with a red tint on the message row. The channel in the sidebar shows a yellow dot instead of the normal blue unread dot.</p>
        <p><b>Desktop notifications:</b> DojoIRC uses your OS notification system. On first launch you will be asked to allow notifications. Once granted, a notification fires whenever your nick is mentioned — even if DojoIRC is in the background or you are in a different channel. If you are actively viewing the channel the mention arrived in and the window is focused, no popup is shown since you are already looking at it.</p>
        <p>Notification permission can be re-granted from your browser/OS settings if you accidentally denied it.</p>

        <h2>Typing Indicators</h2>
        <p>DojoIRC supports IRCv3 <code>draft/typing</code>. While you are typing, an <code>active</code> indicator is sent to the channel automatically (debounced). When you stop typing it sends <code>paused</code>, and when you send or clear the input it sends <code>done</code>. Other users running clients that support typing indicators will appear above your input bar, e.g. <i>joe is typing…</i></p>

        <h2>Auto-reconnect</h2>
        <p>If a server drops unexpectedly, DojoIRC retries the connection every 10 seconds and shows reconnect attempts in the server buffer. To cancel reconnection, right-click the server and choose Disconnect. Connecting again after a manual disconnect works the same way — right-click → Connect.</p>

        <h2>URL Previews</h2>
        <p>URLs in chat are clickable and open in your default browser. DojoIRC also fetches Open Graph metadata for links and shows a preview card below the message — title, description, and thumbnail when available. Plain image links (jpg, png, gif, webp) show inline. Previews are cached for the session so the same URL is only fetched once.</p>

        <h2>DM Windows</h2>
        <p>Open a private conversation with any user by:</p>
        <ul style="margin:4px 0 8px 20px;color:var(--text-dim)">
          <li>Left-clicking their nick in the nick list or in chat</li>
          <li>Using <code>/query &lt;nick&gt;</code> or <code>/msg &lt;nick&gt; &lt;text&gt;</code></li>
        </ul>
        <p>DM buffers appear in the sidebar under the server. Right-click a DM in the sidebar to close it.</p>

        <h2>Nick Context Menu</h2>
        <p>Right-click any nick — in the nick list or in a message — to get a context menu:</p>
        <table class="docs-table">
          <tr><th>Item</th><th>What it does</th></tr>
          <tr><td>Message</td><td>Open a DM buffer with this user</td></tr>
          <tr><td>Whois</td><td>Look up their info — shown in the server buffer</td></tr>
          <tr><td>Version</td><td>Send a CTCP VERSION request — reply shows their client</td></tr>
          <tr><td>Ping</td><td>Send a CTCP PING — reply shows round-trip time in ms</td></tr>
          <tr><td>Invite to #channel</td><td>Invite them to your current channel (only shown when they are not already in it)</td></tr>
        </table>
        <p>Example: right-click <b>alice</b> in #linux → <b>Ping</b> → server buffer shows <code>[CTCP] PING reply from alice: 42ms</code></p>

        <h2>DCC File Transfer</h2>
        <p>DojoIRC supports peer-to-peer file transfers via DCC SEND. No server relay — files go directly between clients.</p>
        <p><b>Receiving a file:</b> when someone sends you a file, an inline prompt appears in your DM buffer:</p>
        <pre><code>[DCC] alice wants to send photo.jpg (2.4 MB)   [Accept] [Decline]</code></pre>
        <p>Click <b>Accept</b> — the file downloads to <code>~/Downloads</code>. Progress updates inline and a completion message appears when done.</p>
        <p><b>Sending a file:</b> drag a file from your file manager and drop it onto an open DM or query window. The transfer starts automatically and the recipient gets the accept/decline prompt.</p>
        <p><b>Note:</b> outgoing DCC requires the recipient to connect directly to your IP. If you are behind NAT without port forwarding, the recipient will not be able to connect. Receiving always works since you connect outward.</p>

        <h2>DCC Chat</h2>
        <p>DCC Chat opens a direct TCP chat session with another user, bypassing the IRC server entirely.</p>
        <p><b>Initiating:</b> open a DM with the user, then type:</p>
        <pre><code>/dcc chat &lt;nick&gt;</code></pre>
        <p>DojoIRC sends them a DCC CHAT offer and waits up to 30 seconds for them to accept.</p>
        <p><b>Receiving:</b> incoming DCC CHAT offers appear as an inline prompt in your DM buffer:</p>
        <pre><code>💬 alice wants to open a DCC Chat   [Accept] [Decline]</code></pre>
        <p>Click <b>Accept</b> — the session connects and a status line confirms it. From that point, messages you type in the DM window go directly over the TCP connection, not through the IRC server. Incoming messages appear as normal chat lines.</p>
        <p>When either side closes the connection a "DCC Chat closed" line appears in the buffer.</p>

        <h2>CTCP Commands</h2>
        <p>CTCP (Client-To-Client Protocol) lets you query another user's client information directly. All replies appear in the server buffer.</p>
        <table class="docs-table">
          <tr><th>Command</th><th>What it does</th></tr>
          <tr><td>/version &lt;nick&gt;</td><td>Ask what IRC client and version they are running</td></tr>
          <tr><td>/ping &lt;nick&gt;</td><td>Measure round-trip time to their client in milliseconds</td></tr>
          <tr><td>/time &lt;nick&gt;</td><td>Ask their client's local date and time</td></tr>
          <tr><td>/finger &lt;nick&gt;</td><td>Request basic client identity info</td></tr>
          <tr><td>/clientinfo &lt;nick&gt;</td><td>Ask which CTCP commands their client supports</td></tr>
          <tr><td>/ctcp &lt;nick&gt; &lt;cmd&gt; [param]</td><td>Send any arbitrary CTCP request</td></tr>
        </table>
        <p>Examples:</p>
        <pre><code>/version alice
/ping bob
/time charlie
/clientinfo alice
/ctcp alice ACTION</code></pre>
        <p>DojoIRC auto-replies to inbound VERSION, PING, TIME, FINGER, and CLIENTINFO requests from other users.</p>

        <h2>IRC Operator Commands</h2>
        <p>Use <code>/oper &lt;user&gt; &lt;pass&gt;</code> to authenticate as an IRC operator first. All responses appear in the server buffer.</p>
        <table class="docs-table">
          <tr><th>Command</th><th>What it does</th></tr>
          <tr><td>/oper &lt;user&gt; &lt;pass&gt;</td><td>Authenticate as an IRC operator</td></tr>
          <tr><td>/kill &lt;nick&gt; &lt;reason&gt;</td><td>Disconnect a user from the server</td></tr>
          <tr><td>/kline &lt;duration&gt; &lt;mask&gt; &lt;reason&gt;</td><td>Ban a user mask from the server (e.g. 1h *!*@bad.host spamming)</td></tr>
          <tr><td>/unkline &lt;mask&gt;</td><td>Remove a K-line</td></tr>
          <tr><td>/dline &lt;duration&gt; &lt;ip&gt; &lt;reason&gt;</td><td>Ban an IP address from the server</td></tr>
          <tr><td>/undline &lt;ip&gt;</td><td>Remove a D-line</td></tr>
          <tr><td>/rehash</td><td>Reload the server config (opers only)</td></tr>
          <tr><td>/wallops &lt;text&gt;</td><td>Send a message to all connected IRC operators</td></tr>
        </table>

        <h2>Keyboard Shortcuts</h2>
        <table class="docs-table">
          <tr><th>Shortcut</th><th>Action</th></tr>
          <tr><td>Ctrl+F</td><td>Open / close message search</td></tr>
          <tr><td>Enter / Shift+Enter</td><td>Next / previous search match</td></tr>
          <tr><td>Escape</td><td>Close search</td></tr>
          <tr><td>Alt+↑ / Alt+↓</td><td>Navigate to previous / next channel or buffer</td></tr>
          <tr><td>Alt+← / Alt+→</td><td>Jump to previous / next server</td></tr>
          <tr><td>Tab</td><td>Complete nick, slash command, or :emoji shortcode</td></tr>
          <tr><td>↑ / ↓</td><td>Cycle through previously sent messages (input history)</td></tr>
          <tr><td>Enter</td><td>Send message</td></tr>
        </table>

        <h2>Message Search</h2>
        <p>Press <b>Ctrl+F</b> to open the search bar in the buffer header. As you type, matching messages stay at full opacity — non-matching messages dim. A <b>N of M</b> counter shows your position. Use <b>↑ ↓</b> buttons or <b>Enter / Shift+Enter</b> to step through matches — wraps around at both ends. The active match is highlighted with an accent outline. Press <b>Escape</b> or click <b>✕</b> to close and restore all messages.</p>

        <h2>Emoji</h2>
        <p><b>Picker:</b> Click the <b>😊</b> button to the right of the input to open the emoji picker. Browse by category or search by name. Click any emoji to insert it at the cursor.</p>
        <p>The emoji button can be shown or hidden via <b>Hamburger → Emoji Button: On/Off</b>. The setting persists across restarts.</p>
        <p><b>Shortcodes:</b> Type a <code>:shortcode:</code> directly in your message — it converts to the emoji automatically when you send:</p>
        <pre><code>:fire:       → 🔥    :thumbsup:   → 👍    :heart:      → ❤️
:joy:        → 😂    :sob:        → 😭    :thinking:   → 🤔
:rocket:     → 🚀    :sparkles:   → ✨    :100:        → 💯
:tada:       → 🎉    :check:      → ✅    :warning:    → ⚠️
:smile:      → 😄    :wave:       → 👋    :clap:       → 👏
:eyes:       → 👀    :pray:       → 🙏    :muscle:     → 💪
:pizza:      → 🍕    :beer:       → 🍺    :coffee:     → ☕
:star:       → ⭐    :zap:        → ⚡    :rainbow:    → 🌈</code></pre>
        <p>67 shortcodes total. Tab-complete shortcodes: type <code>:fir</code> and press Tab → 🔥. Press Tab again to cycle matches.</p>

        <h2>Input History</h2>
        <p>Press <b>↑</b> in the message input to recall the previous sent message. Keep pressing to go further back. Press <b>↓</b> to move forward — reaching the end restores whatever you were drafting before you started scrolling.</p>

        <h2>Tab Completion</h2>
        <p>Press <b>Tab</b> in the input box to complete:</p>
        <ul style="margin:4px 0 8px 20px;color:var(--text-dim)">
          <li><b>Nicks</b> — matches nicks in the current channel. At the start of the line, adds <code>: </code> after the nick. Press Tab again to cycle through all matches.</li>
          <li><b>Slash commands</b> — type <code>/</code> and press Tab to complete or cycle through commands.</li>
          <li><b>Emoji shortcodes</b> — type <code>:word</code> and press Tab to insert the matching emoji character.</li>
        </ul>
        <p>Any key other than Tab resets the completion cycle.</p>

        <h2>Slash Commands</h2>
        <table class="docs-table">
          <tr><th>Command</th><th>Description</th></tr>
          <tr><td>/j #channel</td><td>Join a channel (short alias for /join)</td></tr>
          <tr><td>/join #channel</td><td>Join a channel</td></tr>
          <tr><td>/part [#channel]</td><td>Leave a channel (defaults to current)</td></tr>
          <tr><td>/nick &lt;name&gt;</td><td>Change your nick</td></tr>
          <tr><td>/me &lt;text&gt;</td><td>Send a /me action message</td></tr>
          <tr><td>/msg &lt;nick&gt; &lt;text&gt;</td><td>Send a private message and open a DM buffer</td></tr>
          <tr><td>/query &lt;nick&gt;</td><td>Open a DM buffer without sending a message</td></tr>
          <tr><td>/whois &lt;nick&gt;</td><td>Show info about a user in the server buffer</td></tr>
          <tr><td>/away [message]</td><td>Set yourself as away with an optional message</td></tr>
          <tr><td>/back</td><td>Clear away status</td></tr>
          <tr><td>/topic &lt;text&gt;</td><td>Set the channel topic (ops only)</td></tr>
          <tr><td>/kick &lt;nick&gt; [reason]</td><td>Kick a user from the channel (ops only)</td></tr>
          <tr><td>/mode &lt;args&gt;</td><td>Set channel or user modes</td></tr>
          <tr><td>/invite &lt;nick&gt;</td><td>Invite a user to the current channel</td></tr>
          <tr><td>/list</td><td>Open the channel browser — streams channels, filter and click to join</td></tr>
          <tr><td>/raw &lt;line&gt;</td><td>Send a raw IRC protocol line</td></tr>
          <tr><td>/clear</td><td>Clear all messages from the current buffer</td></tr>
          <tr><td>/sysinfo</td><td>Post your OS, kernel, CPU and RAM info to the channel</td></tr>
          <tr><td>/quit [message]</td><td>Disconnect from the current server</td></tr>
          <tr><td>/help</td><td>Print the command list into the current buffer</td></tr>
          <tr><td>/version &lt;nick&gt;</td><td>Send a CTCP VERSION request — reply appears in server buffer</td></tr>
          <tr><td>/ping &lt;nick&gt;</td><td>Send a CTCP PING — reply shows round-trip time in ms</td></tr>
          <tr><td>/time &lt;nick&gt;</td><td>Send a CTCP TIME request — reply shows remote client's local time</td></tr>
          <tr><td>/finger &lt;nick&gt;</td><td>Send a CTCP FINGER request</td></tr>
          <tr><td>/clientinfo &lt;nick&gt;</td><td>Ask which CTCP commands a client supports</td></tr>
          <tr><td>/ctcp &lt;nick&gt; &lt;cmd&gt; [param]</td><td>Send an arbitrary CTCP request</td></tr>
          <tr><td>/oper &lt;user&gt; &lt;pass&gt;</td><td>Authenticate as an IRC operator</td></tr>
          <tr><td>/kill &lt;nick&gt; &lt;reason&gt;</td><td>Disconnect a user from the server (opers only)</td></tr>
          <tr><td>/kline &lt;duration&gt; &lt;mask&gt; &lt;reason&gt;</td><td>Ban a mask from the server (opers only)</td></tr>
          <tr><td>/unkline &lt;mask&gt;</td><td>Remove a K-line (opers only)</td></tr>
          <tr><td>/dline &lt;duration&gt; &lt;ip&gt; &lt;reason&gt;</td><td>Ban an IP from the server (opers only)</td></tr>
          <tr><td>/undline &lt;ip&gt;</td><td>Remove a D-line (opers only)</td></tr>
          <tr><td>/rehash</td><td>Reload server config (opers only)</td></tr>
          <tr><td>/wallops &lt;text&gt;</td><td>Message to all connected IRC operators</td></tr>
        </table>

        <h2>Font Sizes</h2>
        <p>Open <b>Hamburger → Font Sizes</b> to adjust every UI zone live — changes apply instantly and are remembered across restarts. No editing files required.</p>
        <table class="docs-table">
          <tr><th>Zone</th><th>Controls</th><th>Default</th></tr>
          <tr><td>Sidebar Header (DOJOIRC)</td><td>"DOJOIRC" title and hamburger row at top of sidebar</td><td>11px</td></tr>
          <tr><td>Hamburger Button (☰)</td><td>The ☰ hamburger button symbol</td><td>14px</td></tr>
          <tr><td>Server Names</td><td>Server names in the sidebar (e.g. "LINUXDOJO")</td><td>11px</td></tr>
          <tr><td>Channel Names</td><td>Channel and DM names in the sidebar</td><td>13px</td></tr>
          <tr><td>Buffer Title (#channel)</td><td>Channel or DM name in the buffer header</td><td>14px</td></tr>
          <tr><td>Channel Modes (+nt)</td><td>Mode string shown in the buffer header</td><td>11px</td></tr>
          <tr><td>Topic Button</td><td>"topic" pill button in the buffer header</td><td>10px</td></tr>
          <tr><td>Topic Text</td><td>Topic content shown below the header</td><td>12px</td></tr>
          <tr><td>Chat Messages</td><td>Main chat message text</td><td>13px</td></tr>
          <tr><td>Timestamps</td><td>HH:MM timestamp column left of each message</td><td>13px</td></tr>
          <tr><td>Nick List</td><td>Nicks in the nick list panel on the right</td><td>12px</td></tr>
          <tr><td>Typing Indicator</td><td>Typing indicator shown above the input bar</td><td>13px</td></tr>
          <tr><td>Input Nick Prefix</td><td>Your nick displayed left of the message input box</td><td>12px</td></tr>
          <tr><td>Input Field</td><td>Text you type in the message input box</td><td>13px</td></tr>
        </table>
        <p>Use <b>Reset to Defaults</b> in the Font Sizes panel to restore all zones at once. The main chat font size also responds to <code>font_size</code> in <code>config.toml</code>, but the Font Sizes panel always takes precedence.</p>

        <h2>Message History</h2>
        <p>DojoIRC saves the last 200 messages per channel to local storage and restores them on next launch — open the app and you're right back where you left off. Use <b>/clear</b> to wipe a channel's stored history.</p>
        <p>Up to 500 messages are kept in memory during a session; only the most recent 200 are rendered at a time for smooth channel switching.</p>

        <h2>Sidebar &amp; Panels</h2>
        <p>Drag the handle between the sidebar and chat area to resize the sidebar. Drag the handle between chat and the nick list to resize the nick list. Both widths are remembered across restarts.</p>
        <p>Click a server name to view the server buffer (MOTD and connection messages). Click a channel name to switch to it. The topic bar under the channel name can be toggled with the <b>Topic</b> pill button.</p>
        <p><b>Hide nick:</b> click the <b>‹</b> pill button to the left of your nick in the input bar to collapse it. Click <b>›</b> to restore it. Setting persists across restarts.</p>
        <p><b>Hide userlist:</b> click the <b>◂</b> pill button in the buffer header (next to the channel modes) to hide the nick list. Click <b>▸</b> to show it again. Setting persists across restarts.</p>

        <h2>Windows Notes</h2>
        <p><b>Open Config</b> opens the config in Notepad. To use a different editor, set the <code>EDITOR</code> or <code>VISUAL</code> environment variable before launching DojoIRC (e.g. <code>set EDITOR=code</code> for VS Code).</p>
        <p><b>Tablet / touch mode</b> — when Windows tablet mode is active, tapping the message input automatically raises the touch keyboard (<code>TabTip.exe</code>). If that is not present on your system, the on-screen keyboard (<code>osk.exe</code>) is used instead.</p>
        <p><b>Config location</b> — <code>%APPDATA%\dojoirc\config.toml</code>. You can paste that path directly into Explorer's address bar.</p>

        <h2>System Tray</h2>
        <p>Closing the window hides DojoIRC to the system tray — it stays connected. Left-click the tray icon to show or hide the window. Right-click for Show / Quit.</p>
        <p>Use <b>Hamburger → Restart</b> to relaunch the app in place (useful after config or theme changes that need a full restart).</p>

      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Group body children into per-h2 sections for search filtering
  const docsBody = overlay.querySelector('.docs-body');
  const sections = [];
  let sec = null;
  Array.from(docsBody.children).forEach(el => {
    if (el.tagName === 'H2') {
      sec = document.createElement('div');
      sec.className = 'docs-section';
      sections.push(sec);
      docsBody.appendChild(sec);
    }
    (sec || docsBody).appendChild(el);
  });

  document.getElementById('docs-search').addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    sections.forEach(s => {
      s.style.display = (!q || s.textContent.toLowerCase().includes(q)) ? '' : 'none';
    });
    if (q) {
      const first = sections.find(s => s.style.display !== 'none');
      if (first) first.scrollIntoView({ block: 'nearest' });
    }
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.getElementById('docs-close').addEventListener('click', () => overlay.remove());
}

// ── Channel/server navigation ───────────────────────────────
function allBuffers() {
  const result = [];
  state.servers.forEach(srv => {
    result.push({ server: srv.name, channel: 'server' });
    srv.channels.filter(c => c.name !== 'server').forEach(ch => {
      result.push({ server: srv.name, channel: ch.name });
    });
  });
  return result;
}

function switchToBuffer(serverName, channelName) {
  const srv = state.servers.find(s => s.name === serverName);
  if (!srv) return;
  srv.channels.forEach(c => { c.active = false; });
  const ch = ensureChannel(serverName, channelName);
  ch.active = true;
  ch.unread = 0;
  ch.mentions = 0;
  state.activeServer = serverName;
  state.activeChannel = channelName;
  render();
  if (channelName !== 'server') refreshNickList(serverName, channelName);
}

function navigateChannel(delta) {
  const all = allBuffers();
  if (all.length < 2) return;
  const idx = all.findIndex(x => x.server === state.activeServer && x.channel === state.activeChannel);
  const next = all[(idx + delta + all.length) % all.length];
  switchToBuffer(next.server, next.channel);
}

function navigateServer(delta) {
  if (!state.servers.length) return;
  const srvIdx = state.servers.findIndex(s => s.name === state.activeServer);
  const nextSrv = state.servers[(srvIdx + delta + state.servers.length) % state.servers.length];
  const firstCh = nextSrv.channels.find(c => c.name !== 'server');
  switchToBuffer(nextSrv.name, firstCh?.name || 'server');
}

// Re-bind nick click/contextmenu after partial messages update (used by search)
function rebindMessageNicks() {
  document.querySelectorAll('#messages .msg-nick[data-nick]').forEach(el => {
    const nick = el.dataset.nick;
    const server = el.dataset.server;
    el.addEventListener('click', () => openQuery(server, nick));
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      showCtxMenu(e.clientX, e.clientY, nickCtxItems(server, nick));
    });
  });
}

// ── Boot ────────────────────────────────────────────────────
render(); // show connecting state immediately

function showNickSetup(onDone) {
  const overlay = document.createElement('div');
  overlay.id = 'nick-setup-overlay';
  overlay.innerHTML = `
    <div id="nick-setup-modal">
      <div id="nick-setup-logo">DojoIRC</div>
      <p id="nick-setup-subtitle">Choose your IRC nickname to get started</p>
      <input id="nick-setup-input" type="text" maxlength="16" placeholder="yournick" autocomplete="off" spellcheck="false">
      <p id="nick-setup-hint">Letters, numbers, _ and - only. Max 16 characters.</p>
      <button id="nick-setup-btn">Connect</button>
    </div>`;
  document.body.appendChild(overlay);

  const input = document.getElementById('nick-setup-input');
  const btn   = document.getElementById('nick-setup-btn');
  const hint  = document.getElementById('nick-setup-hint');
  input.focus();

  function trySubmit() {
    const nick = input.value.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9_\-]{0,15}$/.test(nick)) {
      hint.textContent = 'Invalid nick — must start with a letter, 1–16 chars.';
      hint.style.color = 'var(--mention, #f38ba8)';
      input.focus();
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Connecting…';
    SetNick(nick).then(() => {
      overlay.remove();
      onDone();
    }).catch(() => {
      btn.disabled = false;
      btn.textContent = 'Connect';
    });
  }

  btn.addEventListener('click', trySubmit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') trySubmit(); });
}

function boot() {
  try { EventsOn('irc:event', handleEvent); } catch (_) {}

  // After a long hide (e.g. overnight in the system tray), WebKit may suspend
  // the web process. This event fires when the tray restores the window so we
  // can kick the renderer back to life even if the process was throttled.
  try {
    EventsOn('window:shown', () => {
      document.body.getBoundingClientRect(); // flush layout
      render();
    });
  } catch (_) {}

  // DCC progress/done/error events from Go backend
  try {
    EventsOn('dcc:progress', d => {
      const ch = ensureChannel(d.server, d.nick);
      const key = d.nick + ':' + d.file;
      const pct = d.total > 0 ? Math.round(d.bytes * 100 / d.total) : 0;
      const text = `${d.file}: ${pct}% (${formatBytes(d.bytes)} / ${formatBytes(d.total)})`;
      const existing = ch.messages.find(m => m.dccKey === key && m.type === 'dcc_progress');
      if (existing) {
        existing.text = text;
      } else {
        addMsg(ch,{ time: timestamp(), nick: '', text, type: 'dcc_progress', dccKey: key });
      }
      if (d.server === state.activeServer && d.nick === state.activeChannel) render();
    });
    EventsOn('dcc:done', d => {
      const ch = ensureChannel(d.server, d.nick);
      const key = d.nick + ':' + d.file;
      ch.messages = ch.messages.filter(m => !(m.dccKey === key && m.type === 'dcc_progress'));
      addMsg(ch,{ time: timestamp(), nick: '', text: `✓ Downloaded "${d.file}" → ${d.path}`, type: 'server' });
      render();
    });
    EventsOn('dcc:error', d => {
      const ch = ensureChannel(d.server, d.nick || 'server');
      const key = (d.nick || '') + ':' + d.file;
      ch.messages = ch.messages.filter(m => !(m.dccKey === key && m.type === 'dcc_progress'));
      addMsg(ch,{ time: timestamp(), nick: '', text: `✗ DCC failed: ${d.error}`, type: 'server' });
      render();
    });
    EventsOn('dcc:sending', d => {
      const ch = ensureChannel(d.server, d.nick);
      const key = d.nick + ':' + d.file;
      addMsg(ch,{ time: timestamp(), nick: '', text: `📤 Sending "${d.file}" to ${d.nick}…`, type: 'dcc_progress', dccKey: key });
      render();
    });
    EventsOn('dcc:sent', d => {
      const ch = findChannel(d.server, d.nick);
      if (ch) {
        const key = d.nick + ':' + d.file;
        ch.messages = ch.messages.filter(m => !(m.dccKey === key && m.type === 'dcc_progress'));
        addMsg(ch,{ time: timestamp(), nick: '', text: `✓ Sent "${d.file}" to ${d.nick}`, type: 'server' });
      }
      render();
    });
    EventsOn('dcc_chat:connected', d => {
      state.dccChats[d.server + '\0' + d.nick] = true;
      const ch = ensureChannel(d.server, d.nick);
      addMsg(ch,{ time: timestamp(), nick: '', text: `DCC Chat with ${d.nick} established`, type: 'server' });
      render();
    });
    EventsOn('dcc_chat:message', d => {
      const ch = ensureChannel(d.server, d.nick);
      addMsg(ch,{ time: timestamp(), nick: d.nick, text: d.text, type: 'message' });
      if (d.server !== state.activeServer || d.nick !== state.activeChannel) ch.unread++;
      fireNotification(d.server, d.nick, d.nick, d.text);
      render();
    });
    EventsOn('dcc_chat:closed', d => {
      delete state.dccChats[d.server + '\0' + d.nick];
      const ch = findChannel(d.server, d.nick);
      if (ch) addMsg(ch,{ time: timestamp(), nick: '', text: `DCC Chat with ${d.nick} closed`, type: 'server' });
      render();
    });
    EventsOn('dcc_chat:error', d => {
      const ch = ensureChannel(d.server, d.nick || 'server');
      addMsg(ch,{ time: timestamp(), nick: '', text: `✗ DCC Chat error: ${d.error}`, type: 'server' });
      render();
    });
  } catch (_) {}

  // Native file drop — file paths arrive directly via Wails DragAndDrop
  try {
    OnFileDrop((x, y, paths) => {
      if (!paths || !paths.length) return;
      if (!state.activeChannel || !state.activeServer || !isDm(state.activeChannel)) {
        const ch = activeChannel();
        if (ch) { addMsg(ch,{ time: timestamp(), nick: '', text: 'DCC SEND only works in DM windows — open a query with the recipient first (/query <nick>)', type: 'server' }); render(); }
        return;
      }
      DCCSend(state.activeServer, state.activeChannel, paths[0]).catch(console.error);
    }, false);
  } catch (_) {}
  applyStoredFontSizes();
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Global keyboard shortcuts (registered once)
  document.addEventListener('keydown', e => {
    // Ctrl+F — toggle search
    if (e.ctrlKey && !e.altKey && !e.metaKey && e.key === 'f') {
      e.preventDefault();
      state.searchOpen = !state.searchOpen;
      if (!state.searchOpen) { state.searchQuery = ''; state.searchMatchIdx = 0; }
      render();
      if (state.searchOpen) {
        const si = document.getElementById('search-input');
        if (si) { si.focus(); si.select(); }
      } else {
        document.getElementById('message-input')?.focus();
      }
      return;
    }
    // Escape — close search
    if (e.key === 'Escape' && state.searchOpen) {
      state.searchOpen = false;
      state.searchQuery = '';
      state.searchMatchIdx = 0;
      render();
      document.getElementById('message-input')?.focus();
      return;
    }
    // Alt+arrows — channel / server navigation
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      if (e.key === 'ArrowUp')    { e.preventDefault(); navigateChannel(-1); return; }
      if (e.key === 'ArrowDown')  { e.preventDefault(); navigateChannel(1);  return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); navigateServer(-1);  return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); navigateServer(1);   return; }
    }
  });

  Promise.resolve()
    .then(() => GetScrollback())
    .then(n => { if (n > 0) state.scrollback = n; })
    .catch(() => {});

  GetAppIcon().then(icon => { DOJOIRC_ICON = icon; }).catch(() => {});

  Promise.resolve()
    .then(() => ReloadConfig())
    .then(applyUIConfig)
    .catch(() => {});

  Promise.resolve()
    .then(() => NeedsNickSetup())
    .then(needs => {
      if (needs) {
        showNickSetup(() => boot());
        return;
      }
    })
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

// Prevent WebKit from navigating to dropped files. File paths are passed to
// the Go backend via Wails OnFileDrop, which emits the 'filedrop' event handled in boot().
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop',     e => e.preventDefault());

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
