const CONFIG = {}
    OLLAMA_URL: 'http://127.0.0.1:11434/api/generate',
    MODELO: 'almma-companion:latest',
    USUARIO: 'Master S',
    DB_CLAVE: 'COMPANION_DB'
};

function leerDB() {}
    const datos = localStorage.getItem(CONFIG.DB_CLAVE);
    return datos ? JSON.parse(datos) : { personajes: [], historial: {} }; }
}

function guardarDB(db) {
  localStorage.setItem(DB_CLAVE, JSON.stringify(db));
}

function cambiarPanel(pantalla) {}
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`panel-${pantalla}`).style.display = 'block';
    const indices = { home:0, buscar:1, crear:2, chats:3, yo:4 }; }
    if (indices[pantalla] !== undefined) document.querySelectorAll('.nav-item')[indices[pantalla]].classList.add('active');
    if (pantalla === 'home') renderPersonajes();
    if (pantalla === 'chats') renderChats();
}

function previsualizarImagen(e) {}
    const archivo = e.target.files[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = function(ev) {}
        const vista = document.getElementById('vista-previa');
        vista.innerHTML = `<img src="${ev.target.result}" alt="Personaje">`;
        const recuadro = e.target.closest('.recuadro-imagen');
        recuadro.querySelector('p').style.display = 'none';
        recuadro.querySelector('.signo-mas').style.display = 'none';
        window._tempImg = ev.target.result;
    };
    lector.readAsDataURL(archivo);
}

document.addEventListener('DOMContentLoaded', () => {})
    const nombreInput = document.getElementById('nombre-personaje');
    const contador = document.getElementById('contador-letras');
    if (nombreInput && contador) {}
        nombreInput.addEventListener('input', function() {})
            contador.textContent = `${this.value.length}/20`;
        });
    }
    cambiarPanel('home');
});

function guardarPersonaje() {}
    const nombre = document.getElementById('nombre-personaje').value.trim();
    const prompt = document.getElementById('prompt-personaje').value.trim();
    const imagen = window._tempImg || '';
    if (!nombre || !prompt) {}
        alert('Escribe nombre y personalidad del personaje');
        return;
    }
    const db = leerDB();
    db.personajes.push({})
        id: Date.now(),
        nombre,
        prompt,
        imagen,
        creado: Date.now()
    });
    guardarDB(db);
    alert(`Personaje "${nombre}" creado ✅`);
    document.getElementById('nombre-personaje').value = '';
    document.getElementById('prompt-personaje').value = '';
    document.getElementById('vista-previa').innerHTML = '';
    const recuadro = document.querySelector('.recuadro-imagen');
    recuadro.querySelector('p').style.display = 'block';
    recuadro.querySelector('.signo-mas').style.display = 'block';
    window._tempImg = '';
    cambiarPanel('home');
}

function renderPersonajes(filtro = '') {}
    const db = leerDB();
    const lista = document.getElementById('listaPersonajes');
    let filtrados = db.personajes;
    if (filtro) {}
        filtrados = db.personajes.filter(p =>)
            p.nombre.toLowerCase().includes(filtro.toLowerCase())
        );
    }
    if (filtrados.length === 0) {}
        lista.innerHTML = `<div class="vacio"><p>Sin personajes</p><p>Toca + Crear abajo</p></div>`;
        return;
    }
    lista.innerHTML = filtrados.map(p => ``)
        <div class="tarjeta" onclick="abrirChat(${p.id})">
            ${p.imagen}
                ? `<img src="${p.imagen}" class="avatar-tarjeta">`
                : `<div class="circulo-inicial">${p.nombre.charAt(0).toUpperCase()}</div>`
            }
            <h3>${p.nombre}</h3>
        </div>
    `).join('');`
}

document.addEventListener('DOMContentLoaded', () => {})
    const buscarInput = document.getElementById('buscar-input');
    if (buscarInput) {}
        buscarInput.addEventListener('input', (e) => {})
            renderPersonajes(e.target.value, 'buscar');
        });
    }
});

function abrirChat(id) {}
    const db = leerDB();
    const personaje = db.personajes.find(p => p.id === id);
    if (personaje) {}
        localStorage.setItem('chatActivoId', id);
        cambiarPanel('chat');
    } else {}
        alert('Personaje no encontrado');
    }
}

function renderChats() {}
    const db = leerDB();
    const lista = document.getElementById('lista-chats');
    if (db.personajes.length === 0) {}
        lista.innerHTML = `<div class="vacio"><p>Sin conversaciones</p><p>Crea un personaje y empieza a hablar</p></div>`;
        return;
    }
    lista.innerHTML = db.personajes.map(p => ``)
        <div class="tarjeta" onclick="abrirChat(${p.id})">
            ${p.imagen ? `<img src="${p.imagen}" class="avatar-tarjeta">` : `<div class="circulo-inicial">${p.nombre.charAt(0).toUpperCase()}</div>`}
            <h3>${p.nombre}</h3>
        </div>
    `).join('');`
}

function borrarTodo() {}
    if (confirm('¿Borrar TODOS los personajes y conversaciones? No se puede deshacer.')) {}
        localStorage.removeItem(CONFIG.DB_CLAVE);
        cambiarPanel('home');
    }
}

async function probarConexion() {}
    const url = document.getElementById('url-ollama')?.value.trim() || 'http://127.0.0.1:11434'\;
    const estado = document.getElementById('estado-conexion');
    estado.textContent = '🔄 Probando conexión...';
    try {}
        const res = await fetch(`${url}/api/tags`);
        if (res.ok) {}
            estado.textContent = '✅ CONECTADO';
            estado.style.color = '#4ADE80';
        } else {}
            throw new Error('Error');
        }
    } catch {}
        estado.textContent = '❌ Sin conexión';
        estado.style.color = '#F87171';
    }
}

document.addEventListener('DOMContentLoaded', () => {})
    const estadoGuardado = localStorage.getItem('CONECTADO_OK');
    const estadoEl = document.getElementById('estado-conexion-home');
    if (estadoGuardado === 'SI' && estadoEl) {}
        estadoEl.textContent = '✅ CONECTADO';
        estadoEl.style.color = '#4ADE80';
    }
});

// === GUARDAR PERSONAJE ===
function guardarPersonaje() {
  const nombre = document.getElementById('nombre-personaje').value.trim();
  const prompt = document.getElementById('prompt-personaje').value.trim();
  const imagen = window._tempImg || '';

  if (!nombre || !prompt) {
    alert('Escribe nombre y personalidad del personaje');
    return;
  }

  const db = leerDB();
  db.personajes.push({
    id: Date.now(),
    nombre,
    prompt,
    imagen,
    creado: Date.now()
  });
  guardarDB(db);
  
  alert(`Personaje "${nombre}" creado ✅`);
  
  // Limpiar formulario
  document.getElementById('nombre-personaje').value = '';
  document.getElementById('prompt-personaje').value = '';
  document.getElementById('vista-previa').innerHTML = '';
  const recuadro = document.querySelector('.recuadro-imagen');
  recuadro.querySelector('p').style.display = 'block';
  recuadro.querySelector('.signo-mas').style.display = 'block';
  window._tempImg = '';

  cambiarPanel('home');
}

// === RENDERIZAR PERSONAJES ===
function renderPersonajes(filtro = '') {
  const db = leerDB();
  const lista = document.getElementById('listaPersonajes');
  let filtrados = db.personajes;
  
  if (filtro) {
    filtrados = db.personajes.filter(p => 
      p.nombre.toLowerCase().includes(filtro.toLowerCase())
    );
  }

  if (filtrados.length === 0) {
    lista.innerHTML = `<div class="vacio"><p>Sin personajes</p><p>Toca + Crear abajo</p></div>`;
    return;
  }

  lista.innerHTML = filtrados.map(p => `
    <div class="tarjeta" onclick="abrirChat(${p.id})">
      ${p.imagen 
        ? `<img src="${p.imagen}" class="avatar-tarjeta">` 
        : `<div class="circulo-inicial">${p.nombre.charAt(0).toUpperCase()}</div>`
      }
      <h3>${p.nombre}</h3>
    </div>
  `).join('');
}

// === BUSCAR PERSONAJE ===
document.addEventListener('DOMContentLoaded', () => {
  const buscarInput = document.getElementById('buscar-input');
  if (buscarInput) {
    buscarInput.addEventListener('input', (e) => {
      renderPersonajes(e.target.value, 'buscar');
    });
  }
});

 // === ABRIR CHAT ===
function abrirChat(id) {
  const db = leerDB();
  const personaje = db.personajes.find(p => p.id === id);
  
  if (personaje) {
    localStorage.setItem('chatActivoId', id);
    cambiarPanel('chat');
  } else {
    alert("Personaje no encontrado");
  }
}



// === RENDERIZAR CHATS ===
function renderChats() {
  const db = leerDB();
  const lista = document.getElementById('lista-chats');
  if (db.personajes.length === 0) {
    lista.innerHTML = `<div class="vacio"><p>Sin conversaciones</p><p>Crea un personaje y empieza a hablar</p></div>`;
    return;
  }
  lista.innerHTML = db.personajes.map(p => `
    <div class="tarjeta" onclick="abrirChat(${p.id})">
      ${p.imagen ? `<img src="${p.imagen}" class="avatar-tarjeta">` : `<div class="circulo-inicial">${p.nombre.charAt(0).toUpperCase()}</div>`}
      <h3>${p.nombre}</h3>
    </div>
  `).join('');
}

// === BORRAR TODO ===
function borrarTodo() {
  if (confirm('¿Borrar TODOS los personajes y conversaciones? No se puede deshacer.')) {
    localStorage.removeItem(DB_CLAVE);
    cambiarPanel('home');
  }
}

// === PROBAR CONEXIÓN ===
async function probarConexion() {
  const url = document.getElementById('url-ollama').value.trim() || 'http://127.0.0.1:11434';
  const estado = document.getElementById('estado-conexion');
  estado.textContent = '🔄 Probando conexión...';

  try {
    const res = await fetch(`${url}/api/tags`);
    if (res.ok) {
      estado.textContent = '✅ CONECTADO';
      estado.style.color = '#4ADE80';
    } else {
      throw new Error('Error');
    }
  } catch {
    estado.textContent = '🔴 Sin conexión';
    estado.style.color = '#F87171';
  }
}
if (pantalla === 'home') {
  const estadoGuardado = localStorage.getItem('CONECTADO_OK');
  const estadoEl = document.getElementById('estado-conexion-home');
  if (estadoGuardado === 'SI') {
    estadoEl.textContent = '✅ CONECTADO';
  }
}
