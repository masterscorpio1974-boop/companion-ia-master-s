// ===== ESTADO GLOBAL =====
const state = {
  personajes: [],
  chats: {},
  config: {
    serverUrl: 'http://192.168.1.17:8080',
    userName: 'Master S',
    maxHistory: 20
  },
  currentPage: 'home',
  currentChatId: null,
  isGenerating: false,
  useCapacitorHttp: false
};

// ===== COLORES PARA AVATARES =====
const AVATAR_COLORS = [
  { bg: '#7C3AED', glow: 'rgba(124,58,237,0.4)' },
  { bg: '#EC4899', glow: 'rgba(236,72,153,0.4)' },
  { bg: '#06B6D4', glow: 'rgba(6,182,212,0.4)' },
  { bg: '#F59E0B', glow: 'rgba(245,158,11,0.4)' },
  { bg: '#10B981', glow: 'rgba(16,185,129,0.4)' },
  { bg: '#EF4444', glow: 'rgba(239,68,68,0.4)' },
  { bg: '#8B5CF6', glow: 'rgba(139,92,246,0.4)' },
  { bg: '#F97316', glow: 'rgba(249,115,22,0.4)' }
];

// ===== LOCALSTORAGE =====
function loadData() {
  try {
    const p = localStorage.getItem('ci_personajes');
    const c = localStorage.getItem('ci_chats');
    const cfg = localStorage.getItem('ci_config');
    if (p) state.personajes = JSON.parse(p);
    if (c) state.chats = JSON.parse(c);
    if (cfg) state.config = Object.assign({}, state.config, JSON.parse(cfg));
  } catch(e) { console.error('Error cargando datos:', e); }
}
function saveData() {
  localStorage.setItem('ci_personajes', JSON.stringify(state.personajes));
  localStorage.setItem('ci_chats', JSON.stringify(state.chats));
  localStorage.setItem('ci_config', JSON.stringify(state.config));
}

// ===== UTILS =====
const $ = id => document.getElementById(id);
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}
function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'ahora';
  if (s < 3600) return Math.floor(s/60) + 'm';
  if (s < 86400) return Math.floor(s/3600) + 'h';
  return Math.floor(s/86400) + 'd';
}
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function avatarHtml(p) {
  if (p.avatarImg) {
    return '<img src="' + p.avatarImg + '" class="avatar-img" alt="' + escapeHtml(p.name) + '">';
  }
  const text = p.avatar || p.name.substring(0,2).toUpperCase();
  return '<span class="avatar-text">' + text + '</span>';
}

// ===== DETECTAR CAPACITOR =====
function detectCapacitor() {
  try {
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp) {
      state.useCapacitorHttp = true;
      console.log('CapacitorHttp detectado');
      return true;
    }
  } catch(e) {}
  console.log('Usando fetch nativo');
  return false;
}

// ===== LLAMA.CPP CLIENT =====
async function llamaRequest(prompt, options) {
  options = options || {};
  const url = state.config.serverUrl + '/completion';
  const body = {
    prompt: prompt,
    n_predict: options.maxTokens || 512,
    temperature: options.temp || 0.7,
    top_p: 0.9,
    stop: ["</s>", "<|im_start|>", "user:", "assistant:"],
    stream: false
  };
  if (options.extra) Object.assign(body, options.extra);

  if (state.useCapacitorHttp) {
    const res = await window.Capacitor.Plugins.CapacitorHttp.post({
      url: url,
      headers: { 'Content-Type': 'application/json' },
      data: body
    });
    if (res.status < 200 || res.status >= 300) throw new Error('HTTP ' + res.status);
    return res.data;
  } else {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }
}

async function testConnection() {
  try {
    const testPrompt = '<|im_start|>user\nHi</s>\n<|im_start|>assistant\n';
    await llamaRequest(testPrompt, { maxTokens: 3, temp: 0 });
    return true;
  } catch(e) { return false; }
}

function buildPrompt(personaje, historyMessages, userMessage) {
  let prompt = '<|im_start|>system\n' + (personaje.systemPrompt || 'Eres un asistente util.') + '</s>\n';
  const msgs = historyMessages.slice(-state.config.maxHistory);
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i];
    if (m.role === 'user') prompt += '<|im_start|>user\n' + m.text + '</s>\n';
    else prompt += '<|im_start|>assistant\n' + m.text + '</s>\n';
  }
  prompt += '<|im_start|>user\n' + userMessage + '</s>\n<|im_start|>assistant\n';
  return prompt;
}

// ===== ROUTER =====
function navigate(page, params) {
  params = params || {};
  state.currentPage = page;
  if (params.chatId) state.currentChatId = params.chatId;
  document.querySelectorAll('.nav-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.page === page);
  });
  const header = $('mainHeader');
  if (header) header.style.display = page === 'chat' ? 'none' : 'block';
  const c = $('pageContent');
  if (c) { c.innerHTML = ''; c.scrollTop = 0; }
  switch(page) {
    case 'home': renderHome(c); break;
    case 'buscar': renderBuscar(c); break;
    case 'crear': renderCrear(c); break;
    case 'chats': renderChats(c); break;
    case 'yo': renderYo(c); break;
    case 'chat': renderChat(c, params.chatId); break;
    default: renderHome(c);
  }
}

// ===== RENDER: HOME =====
function renderHome(c) {
  if (!c) return;
  if (state.personajes.length === 0) {
    c.innerHTML = '<div class="empty-state" style="margin-top:40px;"><div class="big-icon">&#128100;</div><p>Sin personajes</p><p class="small mt-1">Toca <b>+ Crear</b> abajo para empezar</p></div>';
  } else {
    c.innerHTML = '<div class="search-bar"><span class="icon">&#128269;</span><input type="text" id="homeSearch" placeholder="Buscar personaje..." oninput="filterHome(this.value)"></div><div class="section-title">Tus Personajes</div><div class="char-grid" id="homeGrid">' + state.personajes.map(function(p){return charCard(p);}).join('') + '</div>';
  }
}

function charCard(p) {
  const col = AVATAR_COLORS[p.colorIdx || 0];
  return '<div class="char-card" onclick="startChat(\'' + p.id + '\')" style="--glow:' + col.glow + '"><div class="char-avatar" style="background:' + col.bg + '">' + avatarHtml(p) + '</div><div class="char-name">' + escapeHtml(p.name) + '</div><div class="char-desc">' + escapeHtml(p.desc || 'Sin descripcion') + '</div></div>';
}

function filterHome(q) {
  const g = $('homeGrid'); if(!g) return;
  const f = state.personajes.filter(function(p){
    return p.name.toLowerCase().includes(q.toLowerCase()) || (p.desc && p.desc.toLowerCase().includes(q.toLowerCase()));
  });
  g.innerHTML = f.length ? f.map(function(p){return charCard(p);}).join('') : '<div class="empty-state" style="grid-column:1/-1"><p>No se encontraron personajes</p></div>';
}

function startChat(pid) {
  if (!state.chats[pid]) { state.chats[pid] = []; saveData(); }
  navigate('chat', { chatId: pid });
}

// ===== RENDER: BUSCAR =====
function renderBuscar(c) {
  if (!c) return;
  c.innerHTML = '<div class="search-bar mt-1"><span class="icon">&#128269;</span><input type="text" id="buscarInput" placeholder="Buscar personaje..." oninput="doBuscar(this.value)"></div><div id="buscarResults" class="mt-2"><div class="empty-state"><p>Escribe para buscar personajes</p></div></div>';
  setTimeout(function(){const el=$('buscarInput');if(el)el.focus();},100);
}

function doBuscar(q) {
  const r=$('buscarResults');if(!r)return;
  if(!q.trim()){r.innerHTML='<div class="empty-state"><p>Escribe para buscar personajes</p></div>';return;}
  const f=state.personajes.filter(function(p){return p.name.toLowerCase().includes(q.toLowerCase())||(p.desc&&p.desc.toLowerCase().includes(q.toLowerCase()));});
  r.innerHTML=f.length?'<div class="char-grid">'+f.map(function(p){return charCard(p);}).join('')+'</div>':'<div class="empty-state"><p>No se encontraron personajes</p></div>';
}

// ===== RENDER: CREAR =====
function renderCrear(c) {
  if (!c) return;
  window._tempAvatar = null;
  c.innerHTML = '<div class="section-title">Crear Personaje</div>'+
    '<div class="form-group"><label>Nombre</label><input type="text" id="cNombre" placeholder="Ej: ALMMA" maxlength="30"></div>'+
    '<div class="form-group"><label>Descripcion corta</label><input type="text" id="cDesc" placeholder="Ej: IA companera amigable" maxlength="60"></div>'+
    '<div class="form-group"><label>Personalidad (System Prompt)</label><textarea id="cPrompt" placeholder="Eres ALMMA, una IA companera creativa y amigable...">Eres un asistente IA amigable, creativo y util. Responde de forma natural y concisa en espanol.</textarea></div>'+
    '<div class="form-group"><label>Color</label><div class="color-picker" id="colorPicker">'+
    AVATAR_COLORS.map(function(c,i){return '<div class="color-option '+(i===0?'selected':'')+'" data-idx="'+i+'" style="background:'+c.bg+'" onclick="selectColor(this,'+i+')"></div>';}).join('')+
    '</div></div>'+
    '<div class="form-group"><label>Avatar</label><div class="avatar-preview" id="avatarPreview"><img id="previewImg" style="display:none;" alt="Preview"><span id="previewText">&#129302;</span></div><input type="file" id="avatarInput" accept="image/*" style="display:none;"><button type="button" class="btn-secondary" onclick="document.getElementById(\'avatarInput\').click()">&#128193; Elegir imagen</button><p class="small mt-1">O deja vacio para usar emoji por defecto</p></div>'+
    '<div class="form-group"><label>Emoji (si no usas imagen)</label><input type="text" id="cEmoji" value="&#129302;" maxlength="2" style="text-align:center; font-size:24px; width:80px;"></div>'+
    '<button class="btn-primary" onclick="guardarPersonaje()">&#10024; Crear Personaje</button>'+
    '<button class="btn-secondary" onclick="navigate(\'home\')">Cancelar</button>';
  window._selectedColor = 0;
  const fileInput = $('avatarInput');
  if (fileInput) {
    fileInput.addEventListener('change', function(e){
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev){
        window._tempAvatar = ev.target.result;
        const img = $('previewImg');
        const txt = $('previewText');
        if (img) { img.src = ev.target.result; img.style.display = 'block'; }
        if (txt) txt.style.display = 'none';
      };
      reader.readAsDataURL(file);
    });
  }
}

function selectColor(el, idx) {
  document.querySelectorAll('.color-option').forEach(function(e){e.classList.remove('selected');});
  el.classList.add('selected');
  window._selectedColor = idx;
}

function guardarPersonaje() {
  const name = $('cNombre').value.trim();
  const desc = $('cDesc').value.trim();
  const prompt = $('cPrompt').value.trim();
  const emoji = $('cEmoji').value.trim() || '&#129302;';
  if (!name) { alert('Ingresa un nombre'); return; }
  state.personajes.push({
    id: genId(), name: name, desc: desc, systemPrompt: prompt,
    colorIdx: window._selectedColor || 0, avatar: emoji,
    avatarImg: window._tempAvatar || null, creadoEn: Date.now()
  });
  saveData();
  navigate('home');
}

// ===== RENDER: CHATS (lista) =====
function renderChats(c) {
  if (!c) return;
  const chatIds = Object.keys(state.chats).filter(function(id){return state.chats[id].length>0;});
  const items = chatIds.map(function(id){
    const p = state.personajes.find(function(x){return x.id===id;});
    const msgs = state.chats[id];
    return {id:id, personaje:p, last:msgs[msgs.length-1], count:msgs.length};
  }).filter(function(x){return x.personaje;});
  items.sort(function(a,b){return (b.last?.ts||0)-(a.last?.ts||0);});
  if (!items.length) {
    c.innerHTML = '<div class="section-title">Conversaciones</div><div class="empty-state"><div class="big-icon">&#128172;</div><p>Sin conversaciones aun</p><p class="small mt-1">Crea un personaje y empieza a chatear</p></div><button class="btn-primary" onclick="navigate(\'home\')">Ir a Home</button>';
    return;
  }
  c.innerHTML = '<div class="section-title">Conversaciones</div>' + items.map(function(i){return chatListItem(i);}).join('');
}

function chatListItem(item) {
  const p = item.personaje;
  const col = AVATAR_COLORS[p.colorIdx || 0];
  const preview = item.last ? (item.last.role==='user'?'Tu: ':'')+item.last.text.slice(0,40) : 'Sin mensajes';
  return '<div class="chat-list-item" onclick="startChat(\''+item.id+'\')"><div class="cl-avatar" style="background:'+col.bg+'; box-shadow:0 0 10px '+col.glow+'">'+avatarHtml(p)+'</div><div class="cl-info"><div class="cl-name">'+escapeHtml(p.name)+'</div><div class="cl-preview">'+escapeHtml(preview)+'</div></div><div class="cl-meta"><div class="cl-time">'+(item.last?timeAgo(item.last.ts):'')+'</div><div class="cl-badge">'+item.count+'</div></div></div>';
}

// ===== RENDER: CHAT (individual) =====
function renderChat(c, personajeId) {
  if (!c) return;
  const p = state.personajes.find(function(x){return x.id===personajeId;});
  if (!p) { navigate('home'); return; }
  const msgs = state.chats[personajeId] || [];
  const col = AVATAR_COLORS[p.colorIdx || 0];
  c.innerHTML = '<div class="chat-header"><button class="back-btn" onclick="navigate(\'chats\')">&#9664;</button><div class="chat-avatar" style="background:'+col.bg+'; box-shadow:0 0 10px '+col.glow+'">'+avatarHtml(p)+'</div><div class="chat-info"><div class="name">'+escapeHtml(p.name)+'</div><div class="status" id="chatStatus">&#128994; En linea</div></div></div><div class="chat-messages" id="chatMessages">'+msgs.map(function(m){return msgBubble(m,p);}).join('')+'</div><div class="chat-input-area"><input type="text" id="chatInput" placeholder="Escribe un mensaje..." onkeypress="if(event.key===\'Enter\') sendChatMsg()"><button id="chatSendBtn" onclick="sendChatMsg()">&#9654;</button></div>';
  setTimeout(function(){const cm=$('chatMessages');if(cm)cm.scrollTop=cm.scrollHeight;const inp=$('chatInput');if(inp)inp.focus();},50);
}

function msgBubble(m, personaje) {
  if (m.role === 'user') return '<div class="msg-bubble user">'+escapeHtml(m.text)+'</div>';
  const col = AVATAR_COLORS[personaje.colorIdx || 0];
  return '<div class="msg-bubble ia"><span class="sender" style="color:'+col.bg+'">'+escapeHtml(personaje.name)+'</span>'+escapeHtml(m.text)+'</div>';
}

async function sendChatMsg() {
  const input = $('chatInput');
  const text = input.value.trim();
  if (!text || state.isGenerating) return;
  const p = state.personajes.find(function(x){return x.id===state.currentChatId;});
  if (!p) return;
  const userMsg = {role:'user',text:text,ts:Date.now()};
  if (!state.chats[state.currentChatId]) state.chats[state.currentChatId]=[];
  state.chats[state.currentChatId].push(userMsg);
  saveData();
  const cm = $('chatMessages');
  cm.insertAdjacentHTML('beforeend', msgBubble(userMsg,p));
  cm.scrollTop = cm.scrollHeight;
  input.value = '';
  state.isGenerating = true;
  $('chatSendBtn').disabled = true;
  const loadingId = 'loading-'+Date.now();
  cm.insertAdjacentHTML('beforeend','<div class="msg-bubble ia loading" id="'+loadingId+'"><span class="sender" style="color:'+AVATAR_COLORS[p.colorIdx||0].bg+'">'+escapeHtml(p.name)+'</span>Pensando...</div>');
  cm.scrollTop = cm.scrollHeight;
  try {
    const prompt = buildPrompt(p, state.chats[state.currentChatId], text);
    const data = await llamaRequest(prompt, {maxTokens:512,temp:0.7});
    let response = '';
    if (data.content !== undefined) response = data.content;
    else if (data.completion !== undefined) response = data.completion;
    else response = JSON.stringify(data);
    response = response.replace(/<\|.*?\|>/g,'').replace(/<\/s>/g,'').trim();
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) loadingEl.remove();
    const iaMsg = {role:'assistant',text:response,ts:Date.now()};
    state.chats[state.currentChatId].push(iaMsg);
    saveData();
    cm.insertAdjacentHTML('beforeend', msgBubble(iaMsg,p));
    cm.scrollTop = cm.scrollHeight;
  } catch(err) {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) { loadingEl.classList.remove('loading'); loadingEl.innerHTML = '<span class="sender" style="color:#ef4444">Error</span>'+escapeHtml(err.message); }
  } finally {
    state.isGenerating = false;
    $('chatSendBtn').disabled = false;
    input.focus();
  }
}

// ===== RENDER: YO =====
function renderYo(c) {
  if (!c) return;
  c.innerHTML = '<div class="section-title">Configuracion</div>'+
    '<div class="settings-card"><h3>&#128421; Servidor LLM</h3><div class="form-group"><label>URL del servidor llama.cpp</label><input type="text" id="cfgUrl" value="'+state.config.serverUrl+'"></div><div class="setting-row"><span class="s-label">Estado</span><span class="s-value" id="connStatus"><span class="status-dot offline"></span>Desconocido</span></div><button class="btn-primary" onclick="testConn()">&#128260; Probar Conexion</button></div>'+
    '<div class="settings-card"><h3>&#128100; Perfil</h3><div class="form-group"><label>Tu nombre</label><input type="text" id="cfgName" value="'+escapeHtml(state.config.userName)+'"></div><button class="btn-secondary" onclick="saveConfig()">&#128190; Guardar Cambios</button></div>'+
    '<div class="settings-card"><h3>&#128202; Datos</h3><div class="setting-row"><span class="s-label">Personajes creados</span><span class="s-value">'+state.personajes.length+'</span></div><div class="setting-row"><span class="s-label">Conversaciones</span><span class="s-value">'+Object.keys(state.chats).length+'</span></div><button class="btn-secondary btn-danger mt-1" onclick="resetData()">&#128465; Borrar todos los datos</button></div>'+
    '<div class="settings-card"><h3>&#8505; Acerca de</h3><div class="setting-row"><span class="s-label">Companion IA</span><span class="s-value">v1.0</span></div><div class="setting-row"><span class="s-label">by</span><span class="s-value">MASTER S</span></div><p class="small mt-1">Conecta con llama.cpp server para chat local offline.</p></div>';
  testConn(true);
}

async function testConn(silent) {
  const statusEl = $('connStatus');
  if (statusEl) statusEl.innerHTML = '<span class="status-dot" style="background:#fbbf24"></span>Probando...';
  const ok = await testConnection();
  if (statusEl) {
    if (ok) statusEl.innerHTML = '<span class="status-dot online"></span>Conectado';
    else statusEl.innerHTML = '<span class="status-dot offline"></span>Desconectado';
  }
  const chatStatus = $('chatStatus');
  if (chatStatus) {
    chatStatus.textContent = ok ? 'En linea' : 'Desconectado';
    chatStatus.className = ok ? 'status' : 'status offline';
  }
  if (!silent && !ok) alert('No se pudo conectar al servidor. Verifica que llama.cpp este corriendo en:\n'+state.config.serverUrl);
}

function saveConfig() {
  const url = $('cfgUrl').value.trim();
  const name = $('cfgName').value.trim();
  if (url) state.config.serverUrl = url;
  if (name) state.config.userName = name;
  saveData();
  alert('Configuracion guardada');
}

function resetData() {
  if (confirm('Borrar TODOS los personajes y chats? Esto no se puede deshacer.')) {
    state.personajes = [];
    state.chats = {};
    saveData();
    navigate('home');
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function(){
  loadData();
  detectCapacitor();
  document.querySelectorAll('.nav-btn').forEach(function(b){
    b.addEventListener('click', function(){ navigate(b.dataset.page); });
  });
  navigate('home');
});
