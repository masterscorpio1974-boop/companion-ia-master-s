// ==================== ESTADO GLOBAL ====================
let personajes = JSON.parse(localStorage.getItem('personajes')) || [];
let chatActivo = null;
let mensajes = [];
window._tempAvatar = null;

// ==================== NAVEGACIÓN — BOTONES PRIMERO ====================
function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}

// 🟢 BOTONES DEL MENÚ — REGISTRADOS PRIMERO, SIEMPRE FUNCIONEN
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    const pagina = e.currentTarget.getAttribute('data-pagina');
    if (pagina === 'home') mostrarPantalla('inicio');
    else if (pagina === 'buscar') mostrarPantalla('buscar');
    else if (pagina === 'crear') mostrarPantalla('crear');
    else if (pagina === 'chats') mostrarPantalla('chats');
    else if (pagina === 'yo') mostrarPantalla('configuracion');
  });
});

// ==================== AVATAR ====================
function avatarHtml(p) {
  if (p.avatarImg) {
    return `<img src="${p.avatarImg}" class="avatar-img" alt="${p.nombre}">`;
  }
  return `<span class="avatar-emoji">${p.avatar || '👤'}</span>`;
}

// ==================== PANTALLA INICIO ====================
function renderInicio() {
  const contenedor = document.getElementById('lista-personajes');
  if (personajes.length === 0) {
    contenedor.innerHTML = '<p class="vacio">Aún no tienes personajes. Crea el primero ✨</p>';
    return;
  }
  contenedor.innerHTML = personajes.map(p => `
    <div class="tarjeta-personaje" onclick="abrirChat('${p.id}')">
      ${avatarHtml(p)}
      <div class="info">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion || 'Sin descripción'}</p>
      </div>
    </div>
  `).join('');
}

// ==================== CREAR PERSONAJE ====================
function abrirFormularioCrear() {
  mostrarPantalla('pantalla-crear');
  document.getElementById('form-crear').reset();
  document.getElementById('avatar-preview').innerHTML = '';
  window._tempAvatar = null;
}

// Vista previa de imagen
document.addEventListener('change', e => {
  if (e.target.id === 'avatar-archivo') {
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = evt => {
      window._tempAvatar = evt.target.result;
      document.getElementById('avatar-preview').innerHTML = `<img src="${window._tempAvatar}" class="preview-img">`;
    };
    lector.readAsDataURL(archivo);
  }
});

// Guardar personaje
document.addEventListener('submit', e => {
  if (e.target.id === 'form-crear') {
    e.preventDefault();
    if (window._tempAvatar && window._tempAvatar.length > 600000) {
      alert('⚠️ La imagen es muy pesada. Elige una más ligera (menos de 500KB).');
      return;
    }
    const nuevo = {
      id: Date.now().toString(),
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      personalidad: document.getElementById('personalidad').value.trim(),
      avatar: document.getElementById('avatar').value.trim() || '👤',
      avatarImg: window._tempAvatar || null,
      fechaCreacion: new Date().toISOString()
    };
    personajes.unshift(nuevo);
    guardarPersonajes();
    renderInicio();
    mostrarPantalla('inicio');
    window._tempAvatar = null;
  }
});

// ==================== CHAT ====================
function abrirChat(id) {
  chatActivo = personajes.find(p => p.id === id);
  if (!chatActivo) return;
  mensajes = JSON.parse(localStorage.getItem(`chat-${id}`) || '[]');
  document.getElementById('chat-titulo').textContent = chatActivo.nombre;
  document.getElementById('chat-avatar').innerHTML = avatarHtml(chatActivo);
  renderMensajes();
  mostrarPantalla('pantalla-chat');
}

function renderMensajes() {
  const caja = document.getElementById('caja-mensajes');
  caja.innerHTML = mensajes.map(m => `
    <div class="mensaje ${m.tipo}">
      <div class="contenido">${m.texto}</div>
    </div>
  `).join('');
  caja.scrollTop = caja.scrollHeight;
}

// 🟢 ENVIAR MENSAJE Y CONECTAR CON OLLAMA
document.addEventListener('submit', async e => {
  if (e.target.id === 'form-enviar') {
    e.preventDefault();
    const entrada = document.getElementById('entrada-mensaje');
    const texto = entrada.value.trim();
    if (!texto) return;

    mensajes.push({ tipo: 'usuario', texto, fecha: new Date().toISOString() });
    guardarChat();
    renderMensajes();
    entrada.value = '';

    // === LÓGICA DE OLLAMA ===
    const cajaTexto = document.getElementById('globo-almma-text');
    cajaTexto.innerHTML = "Pensando... ✍️";

    try {
      const respuesta = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'almma-companion',
          prompt: texto,
          stream: true
        })
      });

      cajaTexto.innerHTML = "";
      const lector = respuesta.body.getReader();
      const decodificador = new TextDecoder();

      while (true) {
        const { hecho, valor } = await lector.read();
        if (hecho) break;
        const trozo = decodificador.decode(valor, { stream: true });
        const lineas = trozo.split('\n');
        for (const linea of lineas) {
          if (linea.trim() !== "") {
            const datos = JSON.parse(linea);
            cajaTexto.innerHTML += datos.response;
          }
        }
      }
    } catch (error) {
      console.error("Error de conexión:", error);
      cajaTexto.innerHTML = "❌ Error al conectar. Verifica que Ollama esté encendido.";
    }
  }
});

function guardarChat() {
  if (!chatActivo) return;
  localStorage.setItem(`chat-${chatActivo.id}`, JSON.stringify(mensajes));
}

function guardarPersonajes() {
  localStorage.setItem('personajes', JSON.stringify(personajes));
}
