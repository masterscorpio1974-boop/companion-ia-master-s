let personajes=JSON.parse(localStorage.getItem('companions')||'[]'); let actual=null;
const $=s=>document.getElementById(s);
function render(){const l=$('lista');l.innerHTML='';if(!personajes.length){l.innerHTML='<p style="opacity:.6;padding:20px">Aún no tienes personajes. Dale a + Crear</p>';return}personajes.forEach((p,i)=>{const d=document.createElement('div');d.className='card';d.innerHTML=`<b>${p.nombre}</b><p>${p.desc.slice(0,80)}</p>`;d.onclick=()=>abrirChat(i);l.appendChild(d)})}
function abrirModal(){ $('modal').classList.remove('hidden') } }
function cerrarModal(){ $('modal').classList.add('hidden'); $('cNombre').value='';$('cDesc').value='';$('cSaludo').value='' } }
$('btnCrear').onclick=abrirModal; $('cCancel').onclick=cerrarModal;
$('cSave').onclick=()=>{const n=$('cNombre').value.trim();const d=$('cDesc').value.trim();const s=$('cSaludo').value.trim();if(!n)return alert('Pon nombre');personajes.push({nombre:n,desc:d||'Amigable',saludo:s||`Hola, soy ${n}`,chats:[]});localStorage.setItem('companions',JSON.stringify(personajes));cerrarModal();render()};
function abrirChat(i){actual=i;const p=personajes[i];$('chatNombre').innerText=p.nombre;$('chat').classList.remove('hidden');const m=$('msgs');m.innerHTML='';(p.chats||[]).forEach(x=>{const b=document.createElement('div');b.className='msg '+(x.rol=='user'?'u':'b');b.innerText=x.text;m.appendChild(b)});if(!p.chats.length&&p.saludo){addMsg('bot',p.saludo)}}
$('bVolver').onclick=()=>{ $('chat').classList.add('hidden');render()} }
function addMsg(rol,text){const m=$('msgs');const b=document.createElement('div');b.className='msg '+(rol=='user'?'u':'b');b.innerText=text;m.appendChild(b);m.scrollTop=m.scrollHeight;personajes[actual].chats=personajes[actual].chats||[];personajes[actual].chats.push({rol,text});localStorage.setItem('companions',JSON.stringify(personajes))}
$('btnSend').onclick=()=>{const t=$('inp').value.trim();if(!t)return;const p=personajes[actual];$('inp').value='';addMsg('user',t);setTimeout(()=>{let r=`[${p.nombre} responde]`;if(p.desc.toLowerCase().includes('miedosa'))r=`*se esconde* ${t}? yo... yo soy ${p.nombre}...`;else if(p.desc.toLowerCase().includes('ruda'))r=`Tch... ${t}? Como quieras.`;else r=`${p.nombre}: Jaja ${t}, me gusta hablar contigo. ${p.desc.slice(0,40)}`;addMsg('bot',r)},600)}
render();
