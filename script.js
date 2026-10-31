(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const STORAGE = "diegoHubV2";
const GAME_ID = "107778070777162";
const PAGE_LIMIT = 100;
const REQUEST_GAP = 12000;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const safeParse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const state = {
  tab: "inicio", cursor: null, lastRequest: 0, rateLimitUntil: 0, loading: false,
  servers: [], seen: new Set(), favorites: new Set(), history: [],
  goals: [], sightings: [], finderReports: [], checks: {}, settings: { reducedMotion:false, confirmDelete:true }
};
function load() {
  const saved = safeParse(localStorage.getItem(STORAGE), {});
  state.favorites = new Set(saved.favorites || []);
  state.history = Array.isArray(saved.history) ? saved.history : [];
  state.goals = Array.isArray(saved.goals) ? saved.goals : [];
  state.sightings = Array.isArray(saved.sightings) ? saved.sightings : [];
  state.finderReports = Array.isArray(saved.finderReports) ? saved.finderReports : [];
  state.checks = saved.checks || {};
  state.settings = {...state.settings, ...(saved.settings || {})};
}
function persist() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({
      favorites:[...state.favorites], history:state.history.slice(0,10),
      goals:state.goals, sightings:state.sightings, finderReports:state.finderReports, checks:state.checks, settings:state.settings
    }));
  } catch { toast("No se pudieron guardar los datos. Puede que el almacenamiento esté lleno."); }
}
let toastTimer;
function toast(message) {
  const el = $("toast"); if (!el) return;
  el.textContent = message; el.classList.add("show");
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
function confirmAction(message) { return !state.settings.confirmDelete || window.confirm(message); }
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function save() { persist(); updateDashboard(); }

const panels = [...document.querySelectorAll(".panel")];
const navButtons = [...document.querySelectorAll(".nav-btn")];
const titles = {inicio:"Inicio",servidores:"Servidores",finder:"Finder",huevos:"Buscador de huevos",rastreador:"Rastreador",ruta:"Plan de progreso",recompensas:"Eventos y recompensas",ajustes:"Configuración"};
function go(tab) {
  if (!titles[tab]) return;
  state.tab = tab;
  panels.forEach(p => p.classList.toggle("active", p.id === tab));
  navButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  $("pageTitle").textContent = titles[tab];
  $("sidebar").classList.remove("open");
  window.scrollTo({top:0,behavior:state.settings.reducedMotion?"auto":"smooth"});
}
navButtons.forEach(b => b.addEventListener("click", () => go(b.dataset.tab)));
document.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
$("openSidebar").addEventListener("click", () => $("sidebar").classList.add("open"));
$("closeSidebar").addEventListener("click", () => $("sidebar").classList.remove("open"));
$("minimizeHub").addEventListener("click", () => {
  $("appShell").classList.add("hidden"); $("restoreHub").classList.remove("hidden");
});
$("restoreHub").addEventListener("click", () => {
  $("appShell").classList.remove("hidden"); $("restoreHub").classList.add("hidden");
});

const eggs = [
 {name:"Chicken Egg",zone:"Forest",speed:"Sin requisito",guardian:"Chicken",type:"Básico",status:"Comunitario",note:"Entrada de catálogo compartida por jugadores."},
 {name:"Swan Egg",zone:"Lake",speed:"900",guardian:"Swan",type:"Básico",status:"Comunitario",note:"Requisito indicado en el catálogo recibido."},
 {name:"Scorpion Egg",zone:"Desert",speed:"10K",guardian:"Scorpion",type:"Básico",status:"Comunitario",note:"Requisito indicado en el catálogo recibido."},
 {name:"Tiger Egg",zone:"Jungle",speed:"40K",guardian:"Tiger",type:"Básico",status:"Comunitario",note:"Requisito indicado en el catálogo recibido."},
 {name:"Yeti Egg",zone:"Snow",speed:"170K",guardian:"Yeti",type:"Básico",status:"Confirmado",note:"Nombre del huevo identificado en fuentes del juego."},
 {name:"Hellhound Egg",zone:"Volcano",speed:"700K",guardian:"Hellhound",type:"Básico",status:"Comunitario",note:"Entrada conservada del catálogo original."},
 {name:"Moby Egg",zone:"Abyss Ocean",speed:"2.5M",guardian:"Moby",type:"Básico",status:"Comunitario",note:"Nombre y requisito pendientes de revisión en partida."},
 {name:"T-Rex Egg",zone:"Prehistoric",speed:"17M",guardian:"T-Rex",type:"Básico",status:"Confirmado",note:"Nombre presente en medios publicados por el creador; requisito a revisar."},
 {name:"Dragon Egg",zone:"Cosmic",speed:"700M",guardian:"Dragon",type:"Básico",status:"Comunitario",note:"Entrada conservada del catálogo original."},
 {name:"Cherry Blossom Egg",zone:"Cherry Blossom",speed:"Consultar",guardian:"Oni Tiger",type:"Evento",status:"Por verificar",note:"El pet Oni Tiger se ha asociado a esta zona; etiqueta exacta del huevo requiere comprobación."},
 {name:"Eternal Phoenix Egg",zone:"Aparición especial",speed:"—",guardian:"Phoenix",type:"Especial",status:"Por verificar",note:"Existe evidencia archivada del nombre; disponibilidad actual no confirmada."},
 {name:"Brainrot Egg",zone:"Aparición especial",speed:"—",guardian:"—",type:"Especial",status:"Por verificar",note:"Línea retirada o histórica según referencias comunitarias."},
 {name:"Halloween Egg",zone:"Halloween",speed:"—",guardian:"—",type:"Evento",status:"Comunitario",note:"Nombre aportado por el catálogo inicial; comprobar en el evento."},
 {name:"Candy Corn Egg",zone:"Halloween",speed:"—",guardian:"—",type:"Evento",status:"Comunitario",note:"Hay reportes comunitarios de contenido Halloween y Candy Corn."},
 {name:"Extinction Egg",zone:"Tienda / evento",speed:"—",guardian:"—",type:"Especial",status:"Por verificar",note:"Entrada original; no se confirma disponibilidad actual."},
 {name:"Experiment #001 Egg",zone:"Laboratorio",speed:"—",guardian:"—",type:"Especial",status:"Comunitario",note:"Relacionado con reportes comunitarios del laboratorio."},
 {name:"Experiment #013 Egg",zone:"Laboratorio",speed:"—",guardian:"—",type:"Especial",status:"Comunitario",note:"Relacionado con reportes comunitarios del laboratorio."},
 {name:"Luminous Egg",zone:"Tienda / evento",speed:"—",guardian:"—",type:"Especial",status:"Por verificar",note:"Entrada original; falta una comprobación actual."},
 {name:"Headless Horseman Egg",zone:"Halloween",speed:"Objetivo de evento",guardian:"—",type:"Evento",status:"Comunitario",note:"Reporte comunitario del objetivo de Candy Corn con fecha límite anunciada; verificar el panel del juego."},
 {name:"Monster Egg",zone:"Tienda",speed:"Robux",guardian:"—",type:"Especial",status:"Comunitario",note:"Las referencias separan Monster Egg de otros huevos y cofres con nombres parecidos."},
 {name:"Rift Eggs",zone:"Rift",speed:"Evento",guardian:"—",type:"Evento",status:"Por verificar",note:"Hay reportes de varios grupos de huevos de Rift; nombres exactos no cargados."},
 {name:"Titan Temple Egg",zone:"Titan Temple",speed:"Consultar",guardian:"Gorilla King",type:"Especial",status:"Comunitario",note:"La zona Titan Temple aparece en guías comunitarias; confirmar etiqueta y acceso dentro del juego."}
];
const zoneFilter = $("zoneFilter");
[...new Set(eggs.map(e=>e.zone))].sort((a,b)=>a.localeCompare(b)).forEach(zone=>{
 const opt=document.createElement("option"); opt.value=zone; opt.textContent=zone; zoneFilter.append(opt);
});
function eggStatusClass(status){return status==="Confirmado"?"confirmed":status==="Comunitario"?"community":"pending";}
function renderEggs(){
 const query=$("eggSearch").value.trim().toLowerCase(), zone=zoneFilter.value, type=$("typeFilter").value, confidence=$("confidenceFilter").value;
 const found=eggs.filter(e=>(zone==="all"||e.zone===zone)&&(type==="all"||e.type===type)&&(confidence==="all"||e.status===confidence)&&[e.name,e.zone,e.guardian,e.note].join(" ").toLowerCase().includes(query));
 $("eggCount").textContent=`${found.length} de ${eggs.length} entradas`;
 $("eggGrid").replaceChildren();
 if(!found.length){$("eggGrid").innerHTML='<div class="empty-state" style="grid-column:1/-1"><span>🔎</span><b>No hay coincidencias</b><small>Prueba otro nombre o filtro.</small></div>';return;}
 found.forEach(e=>{
  const card=document.createElement("article");card.className="egg-card";
  const top=document.createElement("div");top.className="egg-card-top";
  const emoji=document.createElement("span");emoji.className="egg-emoji";emoji.textContent="🥚";
  const fav=document.createElement("button");fav.className="save-egg"+(state.favorites.has(e.name)?" saved":"");fav.textContent=state.favorites.has(e.name)?"♥":"♡";fav.title="Guardar en favoritos";fav.setAttribute("aria-label","Guardar "+e.name);
  fav.addEventListener("click",()=>{state.favorites.has(e.name)?state.favorites.delete(e.name):state.favorites.add(e.name);save();renderEggs();toast(state.favorites.has(e.name)?"Añadido a favoritos":"Quitado de favoritos");});
  top.append(emoji,fav);
  const title=document.createElement("h3");title.textContent=e.name;
  const meta=document.createElement("div");meta.className="egg-meta";
  [["Zona",e.zone],["Speed",e.speed],["Guardián",e.guardian]].forEach(([k,v])=>{const p=document.createElement("p");p.innerHTML=`${k}: <b>${escapeHTML(v)}</b>`;meta.append(p);});
  const tag=document.createElement("span");tag.className="tag "+eggStatusClass(e.status);tag.textContent=e.status;
  const note=document.createElement("p");note.className="muted";note.style.fontSize="9px";note.textContent=e.note;
  card.append(top,title,meta,tag,note);$("eggGrid").append(card);
 });
}
["eggSearch","zoneFilter","typeFilter","confidenceFilter"].forEach(id=>$(id).addEventListener(id==="eggSearch"?"input":"change",renderEggs));
function fillCompare(){
 ["compareA","compareB"].forEach(id=>{const s=$(id);s.replaceChildren();eggs.forEach(e=>{const o=document.createElement("option");o.value=e.name;o.textContent=e.name;s.append(o);});});
 $("compareB").selectedIndex=Math.min(1,eggs.length-1);
}
$("compareEggs").addEventListener("click",()=>{
 const a=eggs.find(e=>e.name===$("compareA").value),b=eggs.find(e=>e.name===$("compareB").value);
 if(!a||!b)return;
 if(a.name===b.name){$("compareResult").textContent="Elige dos huevos diferentes para compararlos.";return;}
 const rows=[["Zona",a.zone,b.zone],["Speed",a.speed,b.speed],["Guardián",a.guardian,b.guardian],["Tipo",a.type,b.type],["Estado",a.status,b.status]];
 const table=document.createElement("table");table.className="compare-table";
 const head=document.createElement("tr");[ "Dato",a.name,b.name].forEach(t=>{const th=document.createElement("th");th.textContent=t;head.append(th);});table.append(head);
 rows.forEach(row=>{const tr=document.createElement("tr");row.forEach(t=>{const td=document.createElement("td");td.textContent=t;tr.append(td);});table.append(tr);});
 const box=$("compareResult");box.className="compare-result";box.replaceChildren(table);
 const note=document.createElement("p");note.className="muted";note.textContent="Comparación informativa: los requisitos y la disponibilidad pueden cambiar con las actualizaciones.";box.append(note);
});

function updateDashboard(){
 $("statEggs").textContent=eggs.length;$("statServers").textContent=state.servers.length;
 $("statSaved").textContent=state.favorites.size;$("statGoals").textContent=state.goals.filter(g=>g.done).length;
}
function renderHistory(){
 const box=$("serverHistory");box.replaceChildren();
 if(!state.history.length){box.innerHTML='<div class="empty-state"><small>No hay búsquedas guardadas todavía.</small></div>';return;}
 state.history.forEach(h=>{const row=document.createElement("div");row.className="history-item";const info=document.createElement("div");const b=document.createElement("b");b.textContent=`${h.date} · ${h.total} servidores`;const sm=document.createElement("small");sm.textContent=`${h.free} con espacios · ${h.full} llenos`;info.append(b,sm);row.append(info);box.append(row);});
}
function normalizeServer(s){
 const playing=Number(s.playing),max=Number(s.maxPlayers),ping=Number(s.ping);
 const valid=Number.isFinite(playing)&&Number.isFinite(max)&&playing>=0&&max>0&&max>=playing;
 return {id:s.id,playing,max,free:valid?max-playing:-1,ping:Number.isFinite(ping)&&ping>=0?ping:null,valid};
}
function renderServers(){
 const sort=$("serverSort").value,filter=$("serverFilter").value;
 let arr=[...state.servers];
 if(filter==="free")arr=arr.filter(s=>s.valid&&s.free>0);
 if(filter==="notfull")arr=arr.filter(s=>s.valid&&s.free>0);
 arr.sort((a,b)=>sort==="ping"?(a.ping??999999)-(b.ping??999999):sort==="players"?a.playing-b.playing:(b.free-a.free)||((a.ping??999999)-(b.ping??999999)));
 const valid=state.servers.filter(s=>s.valid),free=valid.filter(s=>s.free>0).length,full=valid.filter(s=>s.free===0).length;
 $("serverStats").innerHTML=`<article class="stat-card"><div><small>Analizados</small><strong>${state.servers.length}</strong></div></article><article class="stat-card"><div><small>Con espacios</small><strong>${free}</strong></div></article><article class="stat-card"><div><small>Llenos</small><strong>${full}</strong></div></article><article class="stat-card"><div><small>Datos dudosos</small><strong>${state.servers.length-valid.length}</strong></div></article>`;
 const list=$("serverList");list.replaceChildren();
 if(!arr.length){list.innerHTML='<div class="empty-state"><span>🌐</span><b>No hay resultados con este filtro</b><small>Busca otra tanda o cambia el filtro.</small></div>';return;}
 arr.slice(0,40).forEach((s,i)=>{
  const card=document.createElement("article");card.className="server-card";
  const h=document.createElement("h3");h.textContent=i===0&&s.valid&&s.free>0?"👑 Recomendado por espacios":`Servidor ${i+1}`;
  const p1=document.createElement("p");p1.textContent=`👥 Jugadores: ${s.playing} / ${s.max}`;
  const p2=document.createElement("p");p2.textContent=`🟢 Espacios: ${s.valid?s.free:"Dato no válido"}`;
  const p3=document.createElement("p");p3.textContent=`📶 Ping informado: ${s.ping===null?"No disponible":s.ping+" ms"}`;
  const join=document.createElement("button");join.className="secondary-btn join-btn";join.textContent="Abrir este servidor ↗";
  join.addEventListener("click",()=>{const url=`https://www.roblox.com/games/start?placeId=${GAME_ID}&gameInstanceId=${encodeURIComponent(s.id)}`;window.open(url,"_blank","noopener,noreferrer");});
  card.append(h,p1,p2,p3,join);list.append(card);
 });
 updateDashboard();
}
$("serverSort").addEventListener("change",renderServers);$("serverFilter").addEventListener("change",renderServers);
async function fetchServerPage(){
 const wait=Math.max(0,REQUEST_GAP-(Date.now()-state.lastRequest));
 if(wait){$("serverStatus").textContent=`⏳ Espera ${Math.ceil(wait/1000)} s para respetar el límite de consultas...`;await sleep(wait);}
 let url=`https://games.roblox.com/v1/games/${GAME_ID}/servers/Public?limit=${PAGE_LIMIT}&sortOrder=Asc`;
 if(state.cursor)url+="&cursor="+encodeURIComponent(state.cursor);
 state.lastRequest=Date.now();
 let response;
 try{response=await fetch(url,{headers:{"Accept":"application/json"}});}
 catch(err){throw new Error("El navegador bloqueó la conexión (posible CORS) o no hay internet. Para hacerlo fiable hace falta un pequeño proxy seguro; no es un fallo de tu código.");}
 if(response.status===429)throw new Error("Roblox limitó temporalmente las consultas. Espera un rato antes de volver a intentar.");
 if(response.status===403)throw new Error("Roblox rechazó la consulta (HTTP 403). Intenta más tarde; el panel no inventará resultados.");
 if(!response.ok)throw new Error(`Roblox respondió HTTP ${response.status}.`);
 const data=await response.json();if(!Array.isArray(data.data))throw new Error("Roblox devolvió un formato inesperado.");
 return data;
}
async function searchServerPage(reset){
 if(state.loading)return;
 state.loading=true;$("searchServers").disabled=true;$("nextServers").disabled=true;
 if(reset){state.cursor=null;state.seen.clear();state.servers=[];renderServers();}
 $("serverStatus").textContent="🔎 Consultando servidores públicos...";
 try{
  const data=await fetchServerPage();let added=0;
  for(const s of data.data){if(s.id&&!state.seen.has(s.id)){state.seen.add(s.id);state.servers.push(normalizeServer(s));added++;}}
  state.cursor=data.nextPageCursor||null;
  if(added===0){$("serverStatus").textContent="No llegaron servidores nuevos en esta página.";return;}
  renderServers();
  const valid=state.servers.filter(s=>s.valid);
  state.history.unshift({date:new Date().toLocaleString("es-UY"),total:added,free:valid.filter(s=>s.free>0).length,full:valid.filter(s=>s.free===0).length});
  state.history=state.history.slice(0,10);persist();renderHistory();
  $("serverStatus").textContent=`✅ Se añadieron ${added} servidores. Total acumulado: ${state.servers.length}.`;
 }catch(err){$("serverStatus").textContent="❌ "+err.message;toast("No se pudo completar la búsqueda.");}
 finally{state.loading=false;$("searchServers").disabled=false;$("nextServers").disabled=!state.cursor;}
}
$("searchServers").addEventListener("click",()=>searchServerPage(true));
$("nextServers").addEventListener("click",()=>searchServerPage(false));
$("clearHistory").addEventListener("click",()=>{if(!confirmAction("¿Borrar el historial de búsquedas?"))return;state.history=[];persist();renderHistory();});

function renderGoals(){
 const box=$("goalList");box.replaceChildren();
 if(!state.goals.length){box.innerHTML='<div class="empty-state"><small>Aún no tienes objetivos.</small></div>';return;}
 state.goals.forEach(goal=>{
  const row=document.createElement("div");row.className="goal-row"+(goal.done?" done":"");
  const cb=document.createElement("input");cb.type="checkbox";cb.checked=goal.done;cb.addEventListener("change",()=>{goal.done=cb.checked;save();renderGoals();});
  const label=document.createElement("span");const b=document.createElement("b");b.textContent=goal.text;const sm=document.createElement("small");sm.textContent=goal.done?"Completado":"Pendiente";label.append(b,sm);
  const del=document.createElement("button");del.className="remove-btn";del.textContent="×";del.setAttribute("aria-label","Eliminar objetivo");del.addEventListener("click",()=>{state.goals=state.goals.filter(g=>g.id!==goal.id);save();renderGoals();});
  row.append(cb,label,del);box.append(row);
 });
}
$("goalForm").addEventListener("submit",e=>{e.preventDefault();const text=$("goalInput").value.trim();if(!text)return;state.goals.unshift({id:Date.now(),text,done:false});$("goalInput").value="";save();renderGoals();toast("Objetivo añadido.");});
function renderSightings(){
 const box=$("sightingList");box.replaceChildren();
 if(!state.sightings.length){box.innerHTML='<div class="empty-state"><span>📝</span><b>Tu bitácora está vacía</b><small>Los registros que añadas aparecerán aquí.</small></div>';return;}
 state.sightings.forEach(item=>{
  const row=document.createElement("div");row.className="history-item";
  const info=document.createElement("div");const b=document.createElement("b");b.textContent=item.egg;const sm=document.createElement("small");sm.textContent=`${item.zone||"Ubicación no indicada"} · ${item.date}${item.notes?" · "+item.notes:""}`;info.append(b,sm);
  const del=document.createElement("button");del.className="remove-btn";del.textContent="×";del.addEventListener("click",()=>{state.sightings=state.sightings.filter(x=>x.id!==item.id);save();renderSightings();});
  row.append(info,del);box.append(row);
 });
}
$("sightingForm").addEventListener("submit",e=>{e.preventDefault();state.sightings.unshift({id:Date.now(),egg:$("sightingEgg").value.trim(),zone:$("sightingZone").value.trim(),notes:$("sightingNotes").value.trim(),date:new Date().toLocaleString("es-UY")});$("sightingForm").reset();save();renderSightings();to
ast("Hallazgo guardado.");});
$("clearSightings").addEventListener("click",()=>{if(!confirmAction("¿Borrar todos los hallazgos de la bitácora?"))return;state.sightings=[];save();renderSightings();});

function renderFinder(){
 const box=$("finderFeed"),query=$("finderSearch").value.trim().toLowerCase();
 box.replaceChildren();
 const reports=state.finderReports.filter(r=>[r.egg,r.rarity,r.notes,r.jobId].join(" ").toLowerCase().includes(query));
 if(!reports.length){box.innerHTML='<div class="empty-state"><span>📡</span><b>Sin hallazgos coincidentes</b><small>Registra uno o cambia la búsqueda.</small></div>';return;}
 reports.forEach(report=>{
  const card=document.createElement("article");card.className="finder-report";
  const head=document.createElement("div");head.className="finder-report-head";
  const title=document.createElement("b");title.textContent=report.egg;
  const tag=document.createElement("span");tag.className="tag community";tag.textContent=report.rarity||"Sin confirmar";
  head.append(title,tag);
  const details=document.createElement("small");
  details.textContent=[report.date,report.jobId?"Job ID: "+report.jobId:"Sin Job ID",report.notes].filter(Boolean).join(" · ");
  card.append(head,details);
  if(report.jobId){
   const join=document.createElement("button");join.className="secondary-btn";join.type="button";join.textContent="Intentar abrir servidor ↗";
   join.addEventListener("click",()=>{
    const url="https://www.roblox.com/games/start?placeId="+GAME_ID+"&gameInstanceId="+encodeURIComponent(report.jobId);
    window.open(url,"_blank","noopener,noreferrer");
   });
   card.append(join);
  }
  const del=document.createElement("button");del.className="remove-btn finder-delete";del.type="button";del.textContent="×";del.setAttribute("aria-label","Eliminar hallazgo");
  del.addEventListener("click",()=>{if(!confirmAction("¿Eliminar este hallazgo?"))return;state.finderReports=state.finderReports.filter(x=>x.id!==report.id);save();renderFinder();});
  card.append(del);box.append(card);
 });
}
$("finderForm").addEventListener("submit",e=>{
 e.preventDefault();
 const egg=$("finderEgg").value.trim(),jobId=$("finderJobId").value.trim();
 if(!egg)return;
 state.finderReports.unshift({id:Date.now(),egg,rarity:$("finderRarity").value,jobId,notes:$("finderNotes").value.trim(),date:new Date().toLocaleString("es-UY")});
 state.finderReports=state.finderReports.slice(0,100);
 $("finderForm").reset();save();renderFinder();toast("Hallazgo guardado en este dispositivo.");
});
$("finderSearch").addEventListener("input",renderFinder);
$("clearFinderReports").addEventListener("click",()=>{
 if(!confirmAction("¿Borrar todos tus hallazgos del Finder?"))return;
 state.finderReports=[];save();renderFinder();toast("Tus hallazgos fueron borrados.");
});
$("finderGoServers").addEventListener("click",()=>go("servidores"));

function renderChecklist(){
 const checks=[...document.querySelectorAll("[data-check]")];
 const done=checks.filter(c=>state.checks[c.dataset.check]).length;
 checks.forEach(c=>c.checked=!!state.checks[c.dataset.check]);
 $("progressBar").style.width=(checks.length?done/checks.length*100:0)+"%";
 $("progressCaption").textContent=done+" de "+checks.length+" pasos completados";
}
document.querySelectorAll("[data-check]").forEach(c=>c.addEventListener("change",()=>{
 state.checks[c.dataset.check]=c.checked;save();renderChecklist();
}));
$("resetChecklist").addEventListener("click",()=>{
 if(!confirmAction("¿Reiniciar todos los pasos del checklist?"))return;
 state.checks={};save();renderChecklist();
});
$("calculateSpeed").addEventListener("click",()=>{
 const current=Number($("currentSpeed").value),target=Number($("targetSpeed").value);
 if($("currentSpeed").value.trim()===""||$("targetSpeed").value.trim()===""||!Number.isFinite(current)||!Number.isFinite(target)||current<0||target<0){
  $("speedResult").textContent="Introduce dos valores válidos, iguales o mayores que cero.";return;
 }
 const diff=target-current;
 $("speedResult").textContent=diff>0?"Te faltan "+diff.toLocaleString("es-UY")+" de Speed para llegar al objetivo.":diff===0?"¡Ya alcanzaste tu objetivo!":"Superaste tu objetivo por "+Math.abs(diff).toLocaleString("es-UY")+".";
});

$("reducedMotion").addEventListener("change",e=>{
 state.settings.reducedMotion=e.target.checked;document.body.classList.toggle("reduce-motion",e.target.checked);save();
});
$("confirmDelete").addEventListener("change",e=>{state.settings.confirmDelete=e.target.checked;save();});
$("exportData").addEventListener("click",()=>{
 const data={exportedAt:new Date().toISOString(),favorites:[...state.favorites],history:state.history,goals:state.goals,sightings:state.sightings,finderReports:state.finderReports,checks:state.checks,settings:state.settings};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="diego-hub-backup.json";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast("Copia de seguridad preparada.");
});
$("resetData").addEventListener("click",()=>{
 if(!confirmAction("Esto borrará favoritos, historial y registros guardados en este dispositivo. ¿Continuar?"))return;
 state.favorites.clear();state.history=[];state.goals=[];state.sightings=[];state.finderReports=[];state.checks={};
 state.settings={reducedMotion:false,confirmDelete:true};persist();renderEggs();renderHistory();renderGoals();renderSightings();renderFinder();renderChecklist();
 $("reducedMotion").checked=false;$("confirmDelete").checked=true;document.body.classList.remove("reduce-motion");
 toast("Datos locales restablecidos.");
});

function initialize(){
 load();
 $("reducedMotion").checked=!!state.settings.reducedMotion;
 $("confirmDelete").checked=!!state.settings.confirmDelete;
 document.body.classList.toggle("reduce-motion",!!state.settings.reducedMotion);
 fillCompare();renderEggs();renderHistory();renderGoals();renderSightings();renderFinder();renderChecklist();renderServers();updateDashboard();
}
initialize();
})();