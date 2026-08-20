let COMPANION_STORAGE = JSON.parse(localStorage.getItem('COMPANION_DB')) || {
    config: { userName: "Master S", ollamaUrl: "http://10.0.2.2:11434" },
    characters: [],
    history: {}
};
let personajeActivoId = null;
document.addEventListener('DOMContentLoaded', () => { renderizarListaPersonajes(); });
function cambiarPanel(nombreVista) {
    document.getElementById('panel-home').style.display = 'none';
    document.getElementById('panel-crear').style.display = 'none';
    document.getElementById('panel-chat').style.display = 'none';
    document.getElementById('panel-yo').style.display = 'none';
    document.querySelectorAll('.app-nav-bar button').forEach(btn => btn.classList.remove('active'));
    const panel = document.getElementById('panel-' + nombreVista);
    if (panel) panel.style.display = 'block';
    const boton = document.getElementById('nav-' + nombreVista);
    if (boton) boton.classList.add('active');
    if (nombreVista !== 'buscar') document.getElementById('dynamicSearchContainer').classList.remove('active');
}
function alternarBarraBusqueda() {
    const contenedor = document.getElementById('dynamicSearchContainer');
    const input = document.getElementById('searchBarInput');
    if (contenedor.classList.contains('active')) {
        contenedor.classList.remove('active');
        input.value = '';
        filtrarPersonajesLocal();
    } else {
        cambiarPanel('home');
        contenedor.classList.add('active');
        input.focus();
    }
}
function filtrarPersonajesLocal() {
    const query = document.getElementById('searchBarInput').value.toLowerCase().trim();
    document.querySelectorAll('.character-card').forEach(t => {
        const nombre = t.getAttribute('data-name').toLowerCase();
        t.style.display = nombre.includes(query) ? 'flex' : 'none';
    });
}
function guardarNuevoPersonaje() {
    const nameInp = document.getElementById('char-name').value.trim();
    const promptInp = document.getElementById('char-prompt').value.trim();
    const saludoInp = document.getElementById('char-saludo').value.trim();
    if (!nameInp || !promptInp) { alert('Campos obligatorios vacíos.'); return; }
    const nuevo = { id: 'char_' + Date.now(), name: nameInp, prompt: promptInp, saludo: saludoInp || "SAM active." };
    COMPANION_STORAGE.characters.push(nuevo);
    COMPANION_STORAGE.history[nuevo.id] = [{ role: 'model', text: nuevo.saludo }];
    localStorage.setItem('COMPANION_DB', JSON.stringify(COMPANION_STORAGE));
    renderizarListaPersonajes();
    cambiarPanel('home');
}
function renderizarListaPersonajes() {
    const lista = document.getElementById('characters-list');
    if (!lista) return; lista.innerHTML = '';
    document.getElementById('no-characters-fallback').style.display = COMPANION_STORAGE.characters.length === 0 ? 'block' : 'none';
    COMPANION_STORAGE.characters.forEach(char => {
        let card = document.createElement('div');
        card.className = 'character-card';
        card.setAttribute('data-name', char.name);
        card.innerHTML = `<div style="font-size:20px; background:rgba(188,0,221,0.15); width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center;">&#129302;</div><div style="flex:1;"><h4 style="margin:0; color:white; font-size:15px;">${char.name}</h4><small style="color:#a855f7; font-size:11px;">Modo Pentesting</small></div><span style="color:#bc00dd;">&#9654;</span>`;
        card.onclick = () => abrirSalaChat(char.id);
        lista.appendChild(card);
    });
}
function abrirSalaChat(charId) {
    personajeActivoId = charId;
    const char = COMPANION_STORAGE.characters.find(c => c.id === charId);
    document.getElementById('active-chat-name').innerText = char.name;
    cambiarPanel('chat'); refrescarHistorialPantallaChat();
}
function refrescarHistorialPantallaChat() {
    const caja = document.getElementById('chat-messages-box'); caja.innerHTML = '';
    (COMPANION_STORAGE.history[personajeActivoId] || []).forEach(msg => {
        let div = document.createElement('div');
        div.style.cssText = msg.role === 'user' ? 
            "background:#bc00dd; color:white; padding:10px 14px; border-radius:14px 14px 0 14px; margin:6px 0; max-width:80%; margin-left:auto; text-align:right; font-size:14px; word-wrap:break-word;" :
            "background:#1a1636; color:#e2e1e9; padding:10px 14px; border-radius:14px 14px 14px 0; margin:6px 0; max-width:80%; border:1px solid #a855f7; font-size:14px; word-wrap:break-word;";
        div.innerText = msg.text; caja.appendChild(div);
    });
    caja.scrollTop = caja.scrollHeight;
}
async function enviarMensajeAOllama() {
    const input = document.getElementById('chat-user-message'); const txt = input.value.trim(); if (!txt) return;
    COMPANION_STORAGE.history[personajeActivoId].push({ role: 'user', text: txt });
    input.value = ''; refrescarHistorialPantallaChat();
    document.getElementById('active-chat-status').innerText = "Escribiendo...";
    const char = COMPANION_STORAGE.characters.find(c => c.id === personajeActivoId);
    try {
        const res = await fetch(`${COMPANION_STORAGE.config.ollamaUrl}/api/generate`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: "SAM", prompt: `System: ${char.prompt}\nUser: ${txt}\nResponse:`, stream: false })
        });
        const data = await res.json();
        COMPANION_STORAGE.history[personajeActivoId].push({ role: 'model', text: data.response.trim() });
        localStorage.setItem('COMPANION_DB', JSON.stringify(COMPANION_STORAGE));
        refrescarHistorialPantallaChat();
    } catch { alert("Ollama local inalcanzable."); }
    finally { document.getElementById('active-chat-status').innerText = "En línea"; }
}
function formatearBaseDeDatosCompleta() {
    if (confirm('¿Borrar todos los datos?')) {
        COMPANION_STORAGE = { config: { userName: "Master S", ollamaUrl: "http://10.0.2.2:11434" }, characters: [], history: {} };
        localStorage.setItem('COMPANION_DB', JSON.stringify(COMPANION_STORAGE));
        renderizarListaPersonajes(); cambiarPanel('home');
    }
}
