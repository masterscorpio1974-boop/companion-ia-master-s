const CONFIG = {}
    OLLAMA_URL: 'http://127.0.0.1:11434/api/generate',
    MODELO: 'qwen2.5-coder-abliterated:3b',
    USUARIO: 'Master S',
    DB_CLAVE: 'COMPANIONION_DB'
};

function leerDB() {}
    const guardado = localStorage.getItem(CONFIG.DB_CLAVE);
    return guardado ? JSON.parse(guardado) : { personajes: [], historial: {} }; }
}

function guardarDB(db) {}
    localStorage.setItem(CONFIG.DB_CLAVE, JSON.stringify(db));
}

function construirPromptSistema(personaje) {}
    return ``
PERSONALIDAD DE ${personaje.nombre.toUpperCase()}:
${personaje.personalidad}

INSTRUCCIONES:
- TU ERES: ${personaje.nombre}
- TU USUARIO ES: ${CONFIG.USUARIO}
- Habla como tú mismo. Sé fiel a tu personalidad.
- NO cambies tu nombre ni tu rol.
- Responde en español de forma natural.
- Recuerda lo que hablamos antes.
    `.trim();`
}

function renderizarPersonajes(filtro = '') {}
    const db = leerDB();
    const lista = document.getElementById('listaPersonajes');
    const filtrados = db.personajes.filter(p => )
        p.nombre.toLowerCase().includes(filtro.toLowerCase())
    );
    if (filtrados.length === 0) {}
        lista.innerHTML = `<div class="vacio"><div class="icono">👤</div><p>Sin personajes</p><p>Toca + Crear</p></div>`;
        return;
    }
    lista.innerHTML = filtrados.map(p => {})
        const inicial = p.nombre.charAt(0).toUpperCase();
        return `<div class="tarjeta" onclick="abrirChat('${encodeURIComponent(p.nombre)}')"><div class="circulo">${inicial}</div><h3>${p.nombre}</h3><p>${p.descripcion}</p></div>`;
    }).join('');
}

function cambiarPantalla(pantalla) {}
    if (pantalla === 'crear') { mostrarFormularioCrear(); } }
    else if (pantalla === 'chats') { alert('Próximamente'); } }
    else if (pantalla === 'yo') { alert(`Usuario: ${CONFIG.USUARIO}`); } }
}

function mostrarFormularioCrear() {}
    const lista = document.getElementById('listaPersonajes');
    lista.innerHTML = ``
    <div class="formulario-crear">
        <h3>Crear Personaje</h3>
        <label>Nombre del personaje</label>
        <input type="text" id="inp_nombre" placeholder="Ej: ALMMA">
        <label>Descripción corta</label>
        <input type="text" id="inp_desc" placeholder="Ej: Mi compañera">
        <label>Personalidad y rol</label>
        <textarea id="inp_perso" placeholder="Ej: Eres ALMMA, mi compañera leal..."></textarea>
        <div style="display:flex;gap:10px;margin-top:15px;">
            <button class="btn" onclick="guardarNuevoPersonaje()">GUARDAR</button>
            <button class="btn btn-secundario" onclick="renderizarPersonajes()">Cancelar</button>
        </div>
    </div>`;`
}

function guardarNuevoPersonaje() {}
    const nombre = document.getElementById('inp_nombre').value.trim();
    const descripcion = document.getElementById('inp_desc').value.trim();
    const personalidad = document.getElementById('inp_perso').value.trim();
    if (!nombre || !descripcion || !personalidad) { alert('Llena todos los campos'); return; } }
    const db = leerDB();
    db.personajes.push({nombre, descripcion, personalidad, fecha: Date.now()});
    guardarDB(db);
    alert(`Personaje "${nombre}" creado`);
    renderizarPersonajes();
}

function abrirChat(nombreCodificado) {}
    const nombre = decodeURIComponent(nombreCodificado);
    const db = leerDB();
    const personaje = db.personajes.find(p => p.nombre === nombre);
    if (!personaje) { alert('Personaje no encontrado'); return; } }
    localStorage.setItem('PERSONAJE_ACTUAL', JSON.stringify(personaje));
    mostrarVistaChat(personaje);
}

function mostrarVistaChat(personaje) {}
    document.querySelector('.header').innerHTML = ``
        <a href="#" onclick="renderizarPersonajes(); location.reload(); return false;" style="color:#A855F7;text-decoration:none;">VOLVER</a>
        <h2 style="margin-top:10px;">${personaje.nombre}</h2>
        <p style="color:#9CA3AF;font-size:14px;">${personaje.descripcion}</p>`;`
    document.querySelector('.buscador').innerHTML = '';
    document.getElementById('listaPersonajes').innerHTML = ``
        <div id="cajaMensajes" style="padding:15px;max-height:55vh;overflow-y:auto;"></div>
        <div style="display:flex;gap:10px;padding:15px;">
            <input type="text" id="mensajeEntrada" placeholder="Escribe tu mensaje..." style="flex:1;padding:12px;border-radius:12px;background:#1F2937;border:1px solid #374151;color:white;">
            <button onclick="enviarMensaje('${encodeURIComponent(personaje.nombre)}')" style="padding:12px 18px;background:#A020F0;color:white;border:none;border-radius:12px;font-weight:bold;">ENVIAR</button>
        </div>`;`
}

async function enviarMensaje(nombreCodificado) {}
    const nombre = decodeURIComponent(nombreCodificado);
    const texto = document.getElementById('mensajeEntrada').value.trim();
    if (!texto) return;
    const db = leerDB();
    const personaje = db.personajes.find(p => p.nombre === nombre);
    const caja = document.getElementById('cajaMensajes');
    caja.innerHTML += `<div style="background:#A020F0;padding:10px 14px;border-radius:14px;margin:8px 0 8px 20%;">${CONFIG.USUARIO}: ${texto}</div>`;
    document.getElementById('mensajeEntrada').value = '';
    const idPensando = Date.now();
    caja.innerHTML += `<div id="pensando-${idPensando}" style="background:#374151;padding:10px 14px;border-radius:14px;margin:8px 20px 8px 0;color:#9CA3AF;font-style:italic;">${personaje.nombre}: Pensando...</div>`;
    caja.scrollTop = caja.scrollHeight;

    const historial = db.historial[personaje.nombre] || [];
    let contexto = construirPromptSistema(personaje) + "\n\nCONVERSACION:\n";
    historial.forEach(m => { contexto += `${m.quien}: ${m.texto}\n`; }); })
    contexto += `${CONFIG.USUARIO}: ${texto}\n${personaje.nombre}:`;

    try {}
        const res = await fetch(CONFIG.OLLAMA_URL, {})
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({model:CONFIG.MODELO, prompt:contexto, stream:false, options:{temperature:0.85}})
        });
        const datos = await res.json();
        const resp = datos.response.trim();
        document.getElementById(`pensando-${idPensando}`).remove();
        caja.innerHTML += `<div style="background:#374151;padding:10px 14px;border-radius:14px;margin:8px 20px 8px 0;">${personaje.nombre}: ${resp.replace(/\n/g,'<br>')}</div>`;
        historial.push({quien:CONFIG.USUARIO, texto}, {quien:personaje.nombre, texto:resp});
        db.historial[personaje.nombre] = historial;
        guardarDB(db);
    } catch(err) {}
        document.getElementById(`pensando-${idPensando}`).remove();
        caja.innerHTML += `<div style="background:#7F1D1D;padding:10px 14px;border-radius:14px;margin:8px 20px 8px 0;color:#FCA5A5;">Error: ${err.message}<br>Revisa que Ollama esté corriendo</div>`;
    }
    caja.scrollTop = caja.scrollHeight;
}

async function verificarConexion() {}
    const indicador = document.getElementById('estado');
    try {}
        const res = await fetch('http://127.0.0.1:11434/api/tags');
        if (res.ok) { indicador.textContent='EN LÍNEA'; indicador.style.background='rgba(0,200,80,0.2)'; indicador.style.color='#4ADE80'; } }
    } catch { indicador.textContent='SIN CONEXIÓN'; indicador.style.background='rgba(220,38,38,0.2)'; indicador.style.color='#FCA5A5'; } }
}

document.addEventListener('DOMContentLoaded', () => {})
    renderizarPersonajes();
    verificarConexion();
    document.getElementById('buscar').addEventListener('input', e => renderizarPersonajes(e.target.value));
});
