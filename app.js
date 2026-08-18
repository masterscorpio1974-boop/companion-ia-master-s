// ==================== ESTADO GLOBAL ====================
let personajes = JSON.parse(localStorage.getItem('personajes') || '[]');
let chatActivo = null;
let mensajes = [];
window._tempAvatar = null; // Para guardar la imagen seleccionada antes de crear

// ==================== NAVEGACIÓN ====================
function mostrarPantalla(id) {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}

// ==================== AVATAR: RENDERIZADO ====================
function avatarHtml(p) {
  if (p.avatarImg) {
    return `<img src="${p.avatarImg}" class="avatar-img" alt="${p.nombre}">`;
  }
  return `<span class="avatar-emoji">${p.avatar || '🤖'}</span>`;
}

// ==================== PANTALLA INICIO ====================
function renderInicio() {
  const contenedor = document.getElementById('lista-personajes');
  if (personajes.length === 0) {
    contenedor.innerHTML = `<p class="vacio">Aún no tienes personajes. Crea el primero ✨</p>`;
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
      document.getElementById('avatar-preview').innerHTML = 
        `<img src="${window._tempAvatar}" class="preview-img">`;
    };
    lector.readAsDataURL(archivo);
  }
});

// Guardar nuevo personaje
document.addEventListener('submit', e => {
  if (e.target.id === 'form-crear') {
    e.preventDefault();

    // ✅ Validación de tamaño: máximo ~500KB en Base64
    if (window._tempAvatar && window._tempAvatar.length > 600000) {
      alert('⚠️ La imagen es muy pesada. Elige una más ligera (menos de 500KB).');
      return;
    }

    const nuevo = {
      id: Date.now().toString(),
      nombre: document.getElementById('nombre').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim(),
      personalidad: document.getElementById('personalidad').value.trim(),
      avatar: document.getElementById('avatar').value.trim() || '🤖',
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

// Enviar mensaje
document.addEventListener('submit', e => {
  if (e.target.id === 'form-enviar') {
    e.preventDefault();
    const entrada = document.getElementById('entrada-mensaje');
    const texto = entrada.value.trim();
    if (!texto) return;
    
    mensajes.push({ tipo: 'usuario', texto, fecha: new Date().toISOString() });
    guardarChat();
    renderMensajes();
    entrada.value = '';
    
// De la línea 124 en adelante (Lógica de Ollama)
const cajaTexto = document.getElementById("globo-almma-text");
cajaTexto.innerHTML = "Pensando... ▎";

try {
    const response = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'almma-companion',
            prompt: texto,
            stream: true
        })
    });
      

        cajaTexto.innerHTML = ""; 

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break; 

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim() !== "") {
                    const parsed = JSON.parse(line);
                    cajaTexto.innerHTML += parsed.response;
                }
            }
        }

    } catch (error) {
        console.error("Error de comunicación local:", error);
        cajaTexto.innerHTML = "Error al conectar con Ollama. Verifica que Termux esté activo.";
    }
// Activar los eventos táctiles para los botones del menú nuevo
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        
        const page = targetBtn.getAttribute('data-page');
        // Usamos tu función original del Build #22 para cambiar de pestaña
        if (typeof mostrarPantallaId === 'function') {
            mostrarPantallaId('pantalla-' + page);
        }
    });
});
// Activar navegación amarrando tus IDs originales de la app
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        
        const page = targetBtn.getAttribute('data-page');
        
        // Traducimos el menú nuevo a tus contenedores exactos del Build #22
        if (typeof mostrarPantalla === 'function') {
            if (page === 'home') mostrarPantalla('inicio');
            else if (page === 'buscar') mostrarPantalla('buscar');
            else if (page === 'crear') mostrarPantalla('crear');
            else if (page === 'chats') mostrarPantalla('chats');
            else if (page === 'yo') mostrarPantalla('configuracion');
        }
    });
});
