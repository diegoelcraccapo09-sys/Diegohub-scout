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
  servers: [], seen: new Set(), favorites: new Set(), serverFavorites: new Set(), history: [],
  goals: [], sightings: [], finderReports: [], customEggs: [], checks: {}, settings: { reducedMotion:false, confirmDelete:true, protectionMode:false, protectionChecks:{}, farmSession:null, farmHistory:[], farmIncomeRate:"", farmTargetMinutes:"" }
};
function load() {
  const saved = safeParse(localStorage.getItem(STORAGE), {});
  state.favorites = new Set(Array.isArray(saved.favorites) ? saved.favorites : []);
  state.serverFavorites = new Set(Array.isArray(saved.serverFavorites) ? saved.serverFavorites : []);
  state.history = Array.isArray(saved.history) ? saved.history : [];
  state.goals = Array.isArray(saved.goals) ? saved.goals : [];
  state.sightings = Array.isArray(saved.sightings) ? saved.sightings : [];
  state.finderReports = Array.isArray(saved.finderReports) ? saved.finderReports : [];
  state.customEggs = Array.isArray(saved.customEggs) ? saved.customEggs.filter(e=>e&&typeof e.name==="string"&&typeof e.zone==="string") : [];
  state.checks = saved.checks || {};
  state.settings = {...state.settings, ...(saved.settings || {})};
  state.settings.farmHistory = Array.isArray(state.settings.farmHistory) ? state.settings.farmHistory.slice(0,10) : [];
  state.settings.farmSession = state.settings.farmSession && typeof state.settings.farmSession === "object" ? state.settings.farmSession : null;
}
function persist() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({
      favorites:[...state.favorites], serverFavorites:[...state.serverFavorites], history:state.history.slice(0,10),
      goals:state.goals, sightings:state.sightings, finderReports:state.finderReports, customEggs:state.customEggs, checks:state.checks, settings:state.settings
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
const titles = {inicio:"Inicio",servidores:"Servidores",finder:"Finder",huevos:"Buscador de huevos",mascotas:"Mascotas",laboratorio:"Laboratorio",proteccion:"Protección",rastreador:"Rastreador",ruta:"Plan de progreso",recompensas:"Eventos y recompensas",ajustes:"Configuración"};
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
const pets = [
 {name:"Chicken",rarity:"Common",zone:"Forest",income:1,incomeLabel:"$1/s",status:"Comunitario"},
 {name:"Dog",rarity:"Common",zone:"Forest",income:2,incomeLabel:"$2/s",status:"Comunitario"},
 {name:"Bird",rarity:"Uncommon",zone:"Forest",income:8,incomeLabel:"$8/s",status:"Comunitario"},
 {name:"Burrowing Owl",rarity:"Rare",zone:"Forest",income:35,incomeLabel:"$35/s",status:"Comunitario"},
 {name:"Raccoon",rarity:"Rare",zone:"Forest",income:45,incomeLabel:"$45/s",status:"Comunitario"},
 {name:"Fox",rarity:"Epic",zone:"Forest",income:180,incomeLabel:"$180/s",status:"Comunitario"},
 {name:"Bear",rarity:"Epic",zone:"Forest",income:240,incomeLabel:"$240/s",status:"Comunitario"},
 {name:"Brr Brr Patapim",rarity:"Legendary",zone:"Forest",income:1800,incomeLabel:"$1.8K/s",status:"Comunitario"}
];
function renderPets(){
 const query=$("petSearch").value.trim().toLowerCase(), rarity=$("petRarityFilter").value, sort=$("petSort").value;
 const found=pets.filter(p=>(rarity==="all"||p.rarity===rarity)&&[p.name,p.zone,p.rarity,p.incomeLabel].join(" ").toLowerCase().includes(query));
 if(sort==="income-desc")found.sort((a,b)=>b.income-a.income);
 else if(sort==="income-asc")found.sort((a,b)=>a.income-b.income);
 else found.sort((a,b)=>a.name.localeCompare(b.name));
 $("petCount").textContent=`${found.length} de ${pets.length} mascotas cargadas`;
 $("petGrid").replaceChildren();
 if(!found.length){$("petGrid").innerHTML='<div class="empty-state" style="grid-column:1/-1"><span>🐾</span><b>No hay coincidencias</b><small>Prueba otro nombre o rareza.</small></div>';return;}
 found.forEach(p=>{
  const card=document.createElement("article");card.className="egg-card";
  const top=document.createElement("div");top.className="egg-card-top";
  const emoji=document.createElement("span");emoji.className="egg-emoji";emoji.textContent="🐾";
  top.append(emoji);
  const title=document.createElement("h3");title.textContent=p.name;
  const meta=document.createElement("div");meta.className="egg-meta";
  [["Rareza",p.rarity],["Zona",p.zone],["Ingreso base",p.incomeLabel]].forEach(([k,v])=>{const row=document.createElement("p");row.innerHTML=`${k}: <b>${escapeHTML(v)}</b>`;meta.append(row);});
  const tag=document.createElement("span");tag.className="tag community";tag.textContent=p.status;
  card.append(top,title,meta,tag);$("petGrid").append(card);
 });
}
["petSearch","petRarityFilter","petSort"].forEach(id=>$(id).addEventListener(id==="petSearch"?"input":"change",renderPets));
const zoneFilter = $("zoneFilter");
function allEggs(){return [...eggs,...state.customEggs];}
function refreshZoneOptions(){
 const selected=zoneFilter.value||"all";
 const zones=[...new Set(allEggs().map(e=>e.zone))].sort((a,b)=>a.localeCompare(b));
 zoneFilter.replaceChildren(new Option("Todas las zonas","all"));
 zones.forEach(zone=>zoneFilter.append(new Option(zone,zone)));
 zoneFilter.value=zones.includes(selected)?selected:"all";
}
refreshZoneOptions();
function eggStatusClass(status){return status==="Confirmado"?"confirmed":status==="Comunitario"?"community":"pending";}
function renderEggs(){
 refreshZoneOptions();
 const query=$("eggSearch").value.trim().toLowerCase(), zone=zoneFilter.value, type=$("typeFilter").value, rarity=$("rarityFilter").value, confidence=$("confidenceFilter").value, favoritesOnly=$("favoritesOnly").checked;
 const catalog=allEggs();
 const found=catalog.filter(e=>(zone==="all"||e.zone===zone)&&(type==="all"||e.type===type)&&(rarity==="all"||(e.rarity||"Sin confirmar")===rarity)&&(confidence==="all"||e.status===confidence)&&(!favoritesOnly||state.favorites.has(e.name))&&[e.name,e.zone,e.guardian,e.note,e.rarity||"Sin confirmar"].join(" ").toLowerCase().includes(query));
 $("eggCount").textContent=`${found.length} de ${catalog.length} entradas`;
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
  [["Zona",e.zone],["Rareza",e.rarity||"Sin confirmar"],["Speed",e.speed],["Guardián",e.guardian]].forEach(([k,v])=>{const p=document.createElement("p");p.innerHTML=`${k}: <b>${escapeHTML(v)}</b>`;meta.append(p);});
  const tag=document.createElement("span");tag.className="tag "+eggStatusClass(e.status);tag.textContent=e.status;
  const note=document.createElement("p");note.className="muted";note.style.fontSize="9px";note.textContent=e.note;
  card.append(top,title,meta,tag,note);
  if(e.custom){const remove=document.createElement("button");remove.type="button";remove.className="text-btn custom-egg-remove";remove.textContent="Eliminar mi aporte";remove.addEventListener("click",()=>{if(!confirmAction("¿Eliminar este aporte local?"))return;state.customEggs=state.customEggs.filter(x=>x.id!==e.id);state.favorites.delete(e.name);save();fillCompare();renderEggs();});card.append(remove);}
  $("eggGrid").append(card);
 });
}
["eggSearch","zoneFilter","typeFilter","rarityFilter","confidenceFilter","favoritesOnly"].forEach(id=>$(id).addEventListener(id==="eggSearch"?"input":"change",renderEggs));
function fillCompare(){
 ["compareA","compareB"].forEach(id=>{const s=$(id);s.replaceChildren();allEggs().forEach(e=>{const o=document.createElement("option");o.value=e.name;o.textContent=e.name;s.append(o);});});
 $("compareB").selectedIndex=Math.min(1,allEggs().length-1);
}
$("customEggForm").addEventListener("submit",e=>{
 e.preventDefault();
 const name=$("customEggName").value.trim(),zone=$("customEggZone").value.trim();
 if(!name||!zone)return;
 if(allEggs().some(item=>item.name.toLowerCase()===name.toLowerCase())){
  $("customEggStatus").textContent="Ese nombre ya existe en el catálogo. Revisa la búsqueda antes de agregarlo.";return;
 }
 state.customEggs.unshift({
  id:"local-"+Date.now(),name,zone,guardian:$("customEggGuardian").value.trim()||"—",
  type:$("customEggType").value,rarity:$("customEggRarity").value,speed:$("customEggSpeed").value.trim()||"Sin confirmar",
  status:"Por verificar",note:$("customEggNote").value.trim()||"Aporte local del jugador; pendiente de comprobación.",custom:true
 });
 $("customEggForm").reset();save();fillCompare();renderEggs();
 $("customEggStatus").textContent="Aporte guardado localmente como Por verificar.";
 toast("Aporte añadido al catálogo local.");
});
$("compareEggs").addEventListener("click",()=>{
 const a=allEggs().find(e=>e.name===$("compareA").value),b=allEggs().find(e=>e.name===$("compareB").value);
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
 $("statEggs").textContent=allEggs().length;$("statServers").textContent=state.servers.length;
 $("statSaved").textContent=state.favorites.size;$("statGoals").textContent=state.goals.filter(g=>g.done).length;
 renderHomeActivity();
}
function renderHomeActivity(){
 const box=$("homeActivity");if(!box)return;box.replaceChildren();
 const items=[
  ...state.sightings.map(x=>({id:x.id||0,kind:"Hallazgo",name:x.egg,detail:x.zone||x.notes||"Registro personal",date:x.date||""})),
  ...state.finderReports.map(x=>({id:x.id||0,kind:"Finder",name:x.egg,detail:x.rarity||"Sin confirmar",date:x.date||""}))
 ].sort((a,b)=>b.id-a.id).slice(0,5);
 if(!items.length){box.innerHTML='<div class="empty-state"><small>Tus hallazgos recientes aparecerán aquí cuando los registres.</small></div>';return;}
 items.forEach(item=>{
  const row=document.createElement("div");row.className="home-activity-item";
  const icon=document.createElement("span");icon.className="home-activity-icon";icon.textContent=item.kind==="Finder"?"📡":"🥚";
  const info=document.createElement("div");info.className="home-activity-copy";
  const title=document.createElement("b");title.textContent=item.name;
  const detail=document.createElement("small");detail.textContent=[item.kind,item.detail,item.date].filter(Boolean).join(" · ");
  info.append(title,detail);row.append(icon,info);box.append(row);
 });
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
function isValidJobId(value){
 return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||"").trim());
}
function openRobloxServer(jobId){
 const id=String(jobId||"").trim();
 if(!isValidJobId(id)){toast("El Job ID no tiene un formato válido.");return;}
 const url=`https://www.roblox.com/games/start?placeId=${GAME_ID}&gameInstanceId=${encodeURIComponent(id)}`;
 window.open(url,"_blank","noopener,noreferrer");
}
async function copyText(value){
 try{
  if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(String(value));}
  else{
   const field=document.createElement("textarea");field.value=String(value);field.style.position="fixed";field.style.opacity="0";document.body.append(field);field.select();
   const copied=document.execCommand("copy");field.remove();if(!copied)throw new Error("copy failed");
  }
  toast("Job ID copiado.");
 }catch{toast("No se pudo copiar. Mantén pulsado el Job ID para copiarlo.");}
}
function renderServers(){
 const sort=$("serverSort").value,filter=$("serverFilter").value;
 let arr=[...state.servers];
 if(filter==="free")arr=arr.filter(s=>s.valid&&s.free>0);
 if(filter==="full")arr=arr.filter(s=>s.valid&&s.free===0);
 if(filter==="favorites")arr=arr.filter(s=>state.serverFavorites.has(s.id));
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
  const actions=document.createElement("div");actions.className="server-actions";
  const favorite=document.createElement("button");favorite.className="secondary-btn server-favorite"+(state.serverFavorites.has(s.id)?" is-favorite":"");favorite.type="button";favorite.textContent=state.serverFavorites.has(s.id)?"★ Guardado":"☆ Guardar";favorite.setAttribute("aria-pressed",String(state.serverFavorites.has(s.id)));
  favorite.addEventListener("click",()=>{if(state.serverFavorites.has(s.id)){state.serverFavorites.delete(s.id);}else{state.serverFavorites.add(s.id);}persist();renderServers();toast(state.serverFavorites.has(s.id)?"Servidor guardado en favoritos":"Servidor quitado de favoritos");});
  const join=document.createElement("button");join.className="primary-btn";join.textContent="Abrir servidor ↗";join.type="button";
  join.addEventListener("click",()=>openRobloxServer(s.id));
  const copy=document.createElement("button");copy.className="secondary-btn";copy.textContent="Copiar Job ID";copy.type="button";
  copy.addEventListener("click",()=>copyText(s.id));
  actions.append(favorite,join,copy);
  const idLabel=document.createElement("small");idLabel.className="server-job-id";idLabel.textContent="Job ID: "+s.id;
  card.append(h,p1,p2,p3,idLabel,actions);list.append(card);
 });
 updateDashboard();
}
$("serverSort").addEventListener("change",renderServers);$("serverFilter").addEventListener("change",renderServers);
$("joinJobId").addEventListener("click",()=>openRobloxServer($("jobIdInput").value));
$("jobIdInput").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();openRobloxServer($("jobIdInput").value);}});
async function fetchServerPage(){
 const wait=Math.max(0,REQUEST_GAP-(Date.now()-state.lastRequest));
 const cooldown=Math.max(0,state.rateLimitUntil-Date.now());
 if(cooldown)throw new Error(`Roblox pidió una pausa. Vuelve a intentar en ${Math.ceil(cooldown/1000)} s.`);
 if(wait){$("serverStatus").textContent=`⏳ Espera ${Math.ceil(wait/1000)} s para respetar el límite de consultas...`;await sleep(wait);}
 let url=`https://games.roblox.com/v1/games/${GAME_ID}/servers/Public?limit=${PAGE_LIMIT}&sortOrder=Asc`;
 if(state.cursor)url+="&cursor="+encodeURIComponent(state.cursor);
 state.lastRequest=Date.now();
 let response;
 try{response=await fetch(url,{headers:{"Accept":"application/json"}});}
 catch(err){throw new Error("El navegador bloqueó la conexión (posible CORS) o no hay internet. Para hacerlo fiable hace falta un pequeño proxy seguro; no es un fallo de tu código.");}
 if(response.status===429){
  const retryAfter=Number(response.headers.get("Retry-After"));
  const pause=Number.isFinite(retryAfter)&&retryAfter>0?retryAfter*1000:60000;
  state.rateLimitUntil=Date.now()+Math.max(60000,pause);
  throw new Error(`Roblox limitó temporalmente las consultas. Espera ${Math.ceil(Math.max(60000,pause)/1000)} s antes de volver a intentar.`);
 }
 if(response.status===403)throw new Error("Roblox rechazó la consulta (HTTP 403). Intenta más tarde; el panel no inventará resultados.");
 if(!response.ok)throw new Error(`Roblox respondió HTTP ${response.status}.`);
 const data=await response.json();if(!Array.isArray(data.data))throw new Error("Roblox devolvió un formato inesperado.");
 return data;
}
async function searchServerPage(reset){
 if(state.loading)return;
 state.loading=true;$("searchServers").disabled=true;$("nextServers").disabled=true;
 const previousCursor=state.cursor;
 if(reset)state.cursor=null;
 $("serverStatus").textContent="🔎 Consultando servidores públicos...";
 try{
  const data=await fetchServerPage();
  if(reset){state.seen.clear();state.servers=[];}
  const addedServers=[];
  for(const s of data.data){if(s.id&&!state.seen.has(s.id)){state.seen.add(s.id);const normalized=normalizeServer(s);state.servers.push(normalized);addedServers.push(normalized);}}
  state.cursor=data.nextPageCursor||null;
  if(addedServers.length===0){$("serverStatus").textContent="No llegaron servidores nuevos en esta página.";return;}
  renderServers();
  const validAdded=addedServers.filter(s=>s.valid);
  state.history.unshift({date:new Date().toLocaleString("es-UY"),total:addedServers.length,free:validAdded.filter(s=>s.free>0).length,full:validAdded.filter(s=>s.free===0).length});
  state.history=state.history.slice(0,10);persist();renderHistory();
  $("serverStatus").textContent=`✅ Se añadieron ${addedServers.length} servidores. Total acumulado: ${state.servers.length}.`;
 }catch(err){if(reset)state.cursor=previousCursor;$("serverStatus").textContent="❌ "+err.message;toast("No se pudo completar la búsqueda.");}
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
$("sightingForm").addEventListener("submit",e=>{e.preventDefault();state.sightings.unshift({id:Date.now(),egg:$("sightingEgg").value.trim(),zone:$("sightingZone").value.trim(),notes:$("sightingNotes").value.trim(),date:new Date().toLocaleString("es-UY")});$("sightingForm").reset();save();renderSightings();updateDashboard();toast("Hallazgo guardado.");});
$("clearSightings").addEventListener("click",()=>{if(!confirmAction("¿Borrar todos los hallazgos de la bitácora?"))return;state.sightings=[];save();renderSightings();updateDashboard();});

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
  del.addEventListener("click",()=>{if(!confirmAction("¿Eliminar este hallazgo?"))return;state.finderReports=state.finderReports.filter(x=>x.id!==report.id);save();renderFinder();updateDashboard();});
  card.append(del);box.append(card);
 });
}
$("finderForm").addEventListener("submit",e=>{
 e.preventDefault();
 const egg=$("finderEgg").value.trim(),jobId=$("finderJobId").value.trim();
 if(!egg)return;
 state.finderReports.unshift({id:Date.now(),egg,rarity:$("finderRarity").value,jobId,notes:$("finderNotes").value.trim(),date:new Date().toLocaleString("es-UY")});
 state.finderReports=state.finderReports.slice(0,100);
 $("finderForm").reset();save();renderFinder();updateDashboard();toast("Hallazgo guardado en este dispositivo.");
});
$("finderSearch").addEventListener("input",renderFinder);
$("clearFinderReports").addEventListener("click",()=>{
 if(!confirmAction("¿Borrar todos tus hallazgos del Finder?"))return;
 state.finderReports=[];save();renderFinder();updateDashboard();toast("Tus hallazgos fueron borrados.");
});
$("finderGoServers").addEventListener("click",()=>go("servidores"));

function farmElapsed(session){
 if(!session)return 0;
 const running=session.status==="running"&&session.startedAt?Math.max(0,Date.now()-session.startedAt):0;
 return Math.max(0,Number(session.elapsedMs)||0)+running;
}
function formatFarmTime(ms){
 const total=Math.floor(ms/1000),h=Math.floor(total/3600),m=Math.floor(total%3600/60),s=total%60;
 return [h,m,s].map(v=>String(v).padStart(2,"0")).join(":");
}
function renderFarmSession(){
 const session=state.settings.farmSession,elapsed=farmElapsed(session);
 const rate=Math.max(0,Number(state.settings.farmIncomeRate)||0);
 const target=Math.max(0,Number(state.settings.farmTargetMinutes)||0);
 $("farmTimer").textContent=formatFarmTime(elapsed);
 $("farmEarnings").textContent="$"+formatGameNumber(rate*elapsed/1000);
 $("farmTargetStatus").textContent=target?Math.min(100,elapsed/(target*60000)*100).toFixed(0)+"%":"Sin objetivo";
 $("farmIncomeRate").value=state.settings.farmIncomeRate??"";
 $("farmTargetMinutes").value=state.settings.farmTargetMinutes??"";
 const running=session?.status==="running",paused=session?.status==="paused";
 $("farmStart").disabled=running;
 $("farmPause").disabled=!session||(!running&&!paused);
 $("farmPause").textContent=running?"⏸ Pausar":"▶ Reanudar";
 $("farmFinish").disabled=!session;
 $("farmSessionStatus").textContent=running?"Sesión en curso. El contador sigue aunque cambies de pestaña o recargues el panel.":paused?"Sesión pausada. Puedes reanudarla o finalizarla.":session?.status==="finished"?"Última sesión guardada. Puedes iniciar otra cuando quieras.":"Listo. Configura tus datos y comienza a jugar.";
 const box=$("farmHistory");box.replaceChildren();
 const history=state.settings.farmHistory||[];
 if(!history.length){box.innerHTML='<div class="empty-state"><small>Tus sesiones completadas aparecerán aquí.</small></div>';return;}
 history.slice(0,5).forEach(item=>{
  const row=document.createElement("div");row.className="history-item";
  const info=document.createElement("div"),title=document.createElement("b"),detail=document.createElement("small");
  title.textContent=formatFarmTime(item.elapsedMs)+" · $"+formatGameNumber(item.earnings||0);
  detail.textContent=(item.date||"Fecha desconocida")+" · "+(item.rate>0?"$"+formatGameNumber(item.rate)+"/s":"Ingreso no configurado");
  info.append(title,detail);row.append(info);box.append(row);
 });
}
$("farmIncomeRate").addEventListener("input",e=>{state.settings.farmIncomeRate=e.target.value;persist();renderFarmSession();});
$("farmTargetMinutes").addEventListener("input",e=>{state.settings.farmTargetMinutes=e.target.value;persist();renderFarmSession();});
$("farmStart").addEventListener("click",()=>{
 const rate=Number($("farmIncomeRate").value),target=Number($("farmTargetMinutes").value);
 if($("farmIncomeRate").value.trim()!==""&&(!Number.isFinite(rate)||rate<0)){toast("El ingreso por segundo debe ser un número válido.");return;}
 if($("farmTargetMinutes").value.trim()!==""&&(!Number.isInteger(target)||target<1||target>1440)){toast("El objetivo debe ser entre 1 y 1440 minutos.");return;}
 state.settings.farmIncomeRate=$("farmIncomeRate").value;
 state.settings.farmTargetMinutes=$("farmTargetMinutes").value;
 state.settings.farmSession={status:"running",startedAt:Date.now(),elapsedMs:0};
 persist();renderFarmSession();toast("¡Sesión de farm iniciada!");
});
$("farmPause").addEventListener("click",()=>{
 const session=state.settings.farmSession;if(!session)return;
 if(session.status==="running"){session.elapsedMs=farmElapsed(session);session.startedAt=null;session.status="paused";}
 else if(session.status==="paused"){session.startedAt=Date.now();session.status="running";}
 persist();renderFarmSession();
});
$("farmFinish").addEventListener("click",()=>{
 const session=state.settings.farmSession;if(!session)return;
 const elapsed=farmElapsed(session),rate=Math.max(0,Number(state.settings.farmIncomeRate)||0);
 state.settings.farmHistory=state.settings.farmHistory||[];
 state.settings.farmHistory.unshift({id:Date.now(),date:new Date().toLocaleString("es-UY"),elapsedMs:elapsed,rate,earnings:rate*elapsed/1000});
 state.settings.farmHistory=state.settings.farmHistory.slice(0,10);
 state.settings.farmSession={status:"finished",elapsedMs:elapsed,startedAt:null};
 persist();renderFarmSession();toast("Sesión guardada en tu historial.");
});
$("farmReset").addEventListener("click",()=>{
 if(state.settings.farmSession&&state.settings.farmSession.status!=="finished"&&!confirmAction("¿Descartar la sesión actual?"))return;
 state.settings.farmSession=null;persist();renderFarmSession();toast("Temporizador reiniciado.");
});
$("clearFarmHistory").addEventListener("click",()=>{
 if(!confirmAction("¿Borrar el historial de sesiones?"))return;
 state.settings.farmHistory=[];persist();renderFarmSession();toast("Historial de farm borrado.");
});
setInterval(()=>{if(state.settings.farmSession?.status==="running")renderFarmSession();},1000);

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
function renderProtection(){
 const checks=[...document.querySelectorAll("[data-protect-check]")],saved=state.settings.protectionChecks||{};
 const done=checks.filter(c=>saved[c.dataset.protectCheck]).length,active=!!state.settings.protectionMode;
 checks.forEach(c=>c.checked=!!saved[c.dataset.protectCheck]);
 $("toggleProtection").setAttribute("aria-pressed",String(active));
 $("toggleProtection").textContent=active?"🛡️ DESACTIVAR MODO PROTECCIÓN":"🔒 ACTIVAR PROTECCIÓN";
 $("toggleProtection").classList.toggle("protection-active",active);
 $("protectionIndicator").textContent=active?"ACTIVO":"INACTIVO";
 $("protectionIndicator").classList.toggle("is-active",active);
 $("protectionStatus").textContent=active?"Modo de apoyo activado. Completa la rutina y revisa tu base dentro del juego.":"Modo desactivado. Actívalo antes de empezar tu sesión.";
 $("protectionProgressBar").style.width=(checks.length?done/checks.length*100:0)+"%";
 $("protectionProgressCaption").textContent=done+" de "+checks.length+" pasos completados";
}
$("toggleProtection").addEventListener("click",()=>{state.settings.protectionMode=!state.settings.protectionMode;persist();renderProtection();toast(state.settings.protectionMode?"Modo de apoyo activado":"Modo de apoyo desactivado");});
document.querySelectorAll("[data-protect-check]").forEach(c=>c.addEventListener("change",()=>{state.settings.protectionChecks=state.settings.protectionChecks||{};state.settings.protectionChecks[c.dataset.protectCheck]=c.checked;persist();renderProtection();}));
$("resetProtectionChecklist").addEventListener("click",()=>{state.settings.protectionChecks={};persist();renderProtection();toast("Checklist de protección reiniciado");});
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
$("calculateTraining").addEventListener("click",()=>{
 const gain=Number($("treadmillGain").value);
 const multiplier=Number($("trailMultiplier").value);
 const steps=Number($("treadmillSteps").value);
 if($("treadmillGain").value.trim()===""||$("treadmillSteps").value.trim()===""||!Number.isFinite(gain)||!Number.isFinite(multiplier)||!Number.isFinite(steps)||gain<=0||steps<0||!Number.isInteger(steps)){
  $("trainingResult").textContent="Introduce Speed por paso mayor que cero y una cantidad de pasos entera igual o mayor que cero.";return;
 }
 const total=gain*multiplier*steps;
 $("trainingResult").textContent="Ganancia estimada: +"+total.toLocaleString("es-UY",{maximumFractionDigits:2})+" Speed ("+steps.toLocaleString("es-UY")+" pasos × "+gain.toLocaleString("es-UY")+" × "+multiplier.toLocaleString("es-UY")+" trail).";
});

$("reducedMotion").addEventListener("change",e=>{
 state.settings.reducedMotion=e.target.checked;document.body.classList.toggle("reduce-motion",e.target.checked);save();
});
$("confirmDelete").addEventListener("change",e=>{state.settings.confirmDelete=e.target.checked;save();});
$("exportData").addEventListener("click",()=>{
 const data={format:"diego-hub-backup",version:1,exportedAt:new Date().toISOString(),favorites:[...state.favorites],serverFavorites:[...state.serverFavorites],history:state.history,goals:state.goals,sightings:state.sightings,finderReports:state.finderReports,customEggs:state.customEggs,checks:state.checks,settings:state.settings};
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="diego-hub-backup.json";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
 toast("Copia de seguridad preparada.");
});
$("importData").addEventListener("click",()=>$("importFile").click());
$("importFile").addEventListener("change",async event=>{
 const file=event.target.files&&event.target.files[0];if(!file)return;
 try{
  if(file.size>2*1024*1024)throw new Error("El archivo supera 2 MB.");
  const backup=JSON.parse(await file.text());
  if(!backup||typeof backup!=="object"||(!Array.isArray(backup.favorites)&&!Array.isArray(backup.goals)&&backup.format!=="diego-hub-backup"))throw new Error("El archivo no parece una copia de Diego Hub.");
  if(!window.confirm("Importar reemplazará los datos locales actuales por los de esta copia. ¿Continuar?"))return;
  state.favorites=new Set(Array.isArray(backup.favorites)?backup.favorites.filter(x=>typeof x==="string"):[]);
  state.serverFavorites=new Set(Array.isArray(backup.serverFavorites)?backup.serverFavorites.filter(x=>typeof x==="string"):[]);
  state.history=Array.isArray(backup.history)?backup.history.slice(0,50):[];
  state.goals=Array.isArray(backup.goals)?backup.goals:[];
  state.sightings=Array.isArray(backup.sightings)?backup.sightings:[];
  state.finderReports=Array.isArray(backup.finderReports)?backup.finderReports:[];
  state.customEggs=Array.isArray(backup.customEggs)?backup.customEggs.filter(e=>e&&typeof e.name==="string"&&typeof e.zone==="string"):[];
  state.checks=backup.checks&&typeof backup.checks==="object"?backup.checks:{};
  state.settings={...state.settings,...(backup.settings&&typeof backup.settings==="object"?backup.settings:{})};
  persist();fillCompare();renderEggs();renderHistory();renderGoals();renderSightings();renderFinder();renderChecklist();renderProtection();renderServers();
  $("reducedMotion").checked=!!state.settings.reducedMotion;$("confirmDelete").checked=!!state.settings.confirmDelete;
  document.body.classList.toggle("reduce-motion",!!state.settings.reducedMotion);
  toast("Copia importada correctamente.");
 }catch(err){toast("No se pudo importar: "+err.message);}
 finally{event.target.value="";}
});
$("resetData").addEventListener("click",()=>{
 if(!confirmAction("Esto borrará favoritos, historial y registros guardados en este dispositivo. ¿Continuar?"))return;
 state.favorites.clear();state.serverFavorites.clear();state.history=[];state.goals=[];state.sightings=[];state.finderReports=[];state.customEggs=[];state.checks={};
 state.settings={reducedMotion:false,confirmDelete:true,protectionMode:false,protectionChecks:{}};persist();fillCompare();renderEggs();renderHistory();renderGoals();renderSightings();renderFinder();renderChecklist();renderProtection();
 $("reducedMotion").checked=false;$("confirmDelete").checked=true;document.body.classList.remove("reduce-motion");
 toast("Datos locales restablecidos.");
});


function formatGameNumber(value){
 if(!Number.isFinite(value))return "No disponible";
 const abs=Math.abs(value);
 if(abs>=1e12)return (value/1e12).toLocaleString("es-UY",{maximumFractionDigits:2})+"T";
 if(abs>=1e9)return (value/1e9).toLocaleString("es-UY",{maximumFractionDigits:2})+"B";
 if(abs>=1e6)return (value/1e6).toLocaleString("es-UY",{maximumFractionDigits:2})+"M";
 if(abs>=1e3)return (value/1e3).toLocaleString("es-UY",{maximumFractionDigits:2})+"K";
 return value.toLocaleString("es-UY",{maximumFractionDigits:2});
}
function labNumber(id){
 const raw=$(id).value.trim();
 if(raw==="")return null;
 const n=Number(raw);
 return Number.isFinite(n)?n:null;
}
function sizeIncomeMultiplier(weight,baseWeight){
 if(!(weight>0)||!(baseWeight>0))return 1;
 const ratio=weight/baseWeight;
 if(ratio<=0)return 1;
 if(ratio<=125)return Math.pow(ratio,37/60);
 return Math.pow(ratio,2/5)*Math.pow(125,13/60);
}
$("calculatePetIncome").addEventListener("click",()=>{
 const base=labNumber("labBaseIncome"),baseWeight=labNumber("labBaseWeight"),weight=labNumber("labCurrentWeight"),mutation=Number($("labMutation").value);
 const out=$("petIncomeResult");
 if(base===null||base<0||!(mutation>0)){out.textContent="Introduce un ingreso base válido y una mutación conocida.";return;}
 if((weight!==null&&weight<=0)||(baseWeight!==null&&baseWeight<=0)){out.textContent="Los pesos deben ser mayores que cero. Si no conoces uno, déjalo vacío.";return;}
 if(weight!==null&&baseWeight===null){out.textContent="Para calcular el tamaño necesitas introducir también el peso base.";return;}
 const size=sizeIncomeMultiplier(weight,baseWeight),income=base*size*mutation;
 out.textContent="Ingreso estimado: $"+formatGameNumber(income)+"/s · Tamaño ×"+size.toLocaleString("es-UY",{maximumFractionDigits:3})+" · Mutación ×"+mutation+" · Total por hora: $"+formatGameNumber(income*3600)+".";
});
function hatchProbability(pct,attempts){
 const p=pct/100;
 return 1-Math.pow(1-p,attempts);
}
$("calculateChance").addEventListener("click",()=>{
 const pct=labNumber("labChance"),attempts=labNumber("labAttempts"),out=$("chanceResult");
 if(pct===null||pct<=0||pct>100||attempts===null||attempts<1||!Number.isInteger(attempts)){out.textContent="La probabilidad debe ser mayor que 0 y hasta 100%; los intentos deben ser un entero positivo.";return;}
 const chance=hatchProbability(pct,attempts)*100;
 out.textContent="Probabilidad de conseguir al menos uno: "+chance.toLocaleString("es-UY",{maximumFractionDigits:4})+"% en "+attempts.toLocaleString("es-UY")+" intentos. Probabilidad de no conseguir ninguno: "+(100-chance).toLocaleString("es-UY",{maximumFractionDigits:4})+"%.";
});
$("calculateAttempts").addEventListener("click",()=>{
 const pct=labNumber("labChance"),target=labNumber("labTargetChance"),out=$("attemptsResult");
 if(pct===null||pct<=0||pct>100||target===null||target<=0||target>=100){out.textContent="Usa una probabilidad por hatch mayor que 0 y hasta 100%, y un objetivo entre 0 y 100% (sin incluir extremos).";return;}
 const attempts=pct>=100?1:Math.ceil(Math.log(1-target/100)/Math.log(1-pct/100));
 out.textContent="Necesitas aproximadamente "+attempts.toLocaleString("es-UY")+" hatch(es) para alcanzar al menos "+target+"% de probabilidad. No es una garantía: cada intento sigue siendo aleatorio.";
});
$("calculateFarmIncome").addEventListener("click",()=>{
 const income=labNumber("labTotalIncome"),minutes=labNumber("labSessionMinutes"),out=$("farmIncomeResult");
 if(income===null||income<0||minutes===null||minutes<0){out.textContent="Introduce ingresos y duración válidos, iguales o mayores que cero.";return;}
 const total=income*minutes*60;
 out.textContent="Estimación: $"+formatGameNumber(total)+" en "+minutes.toLocaleString("es-UY")+" minutos · $"+formatGameNumber(income*3600)+" por hora · $"+formatGameNumber(income*86400)+" por 24 horas.";
});
$("calculateRoutePlan").addEventListener("click",()=>{
 const current=labNumber("labCurrentSpeed"),target=labNumber("labTargetSpeed"),gain=labNumber("labStepGain"),trail=Number($("labTrailGain").value),out=$("routePlanResult");
 if(current===null||target===null||gain===null||current<0||target<0||gain<=0||!(trail>0)){out.textContent="Completa Speed actual, Speed objetivo y ganancia por paso con valores válidos.";return;}
 const diff=Math.max(0,target-current),perStep=gain*trail,steps=Math.ceil(diff/perStep);
 out.textContent=diff===0?"¡Ya alcanzaste o superaste tu objetivo!": "Te faltan "+formatGameNumber(diff)+" Speed. Ganancia estimada por paso: "+formatGameNumber(perStep)+". Necesitarías aproximadamente "+steps.toLocaleString("es-UY")+" pasos.";
});

function initialize(){
 load();
 $("reducedMotion").checked=!!state.settings.reducedMotion;
 $("confirmDelete").checked=!!state.settings.confirmDelete;
 document.body.classList.toggle("reduce-motion",!!state.settings.reducedMotion);
 fillCompare();renderEggs();renderPets();renderHistory();renderGoals();renderSightings();renderFinder();renderChecklist();renderProtection();renderFarmSession();renderServers();updateDashboard();
}
initialize();
})();