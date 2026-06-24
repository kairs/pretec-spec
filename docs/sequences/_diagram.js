/* Shared interactive sequence-diagram renderer for Pretec specs.
 *
 * Each docs/sequences/<id>.html defines a global `DIAGRAM` object and calls
 * renderSequence(DIAGRAM). Schema:
 *
 *   DIAGRAM = {
 *     id:"I-4", title:"Customer Sync", status:"partial",   // done|partial|todo
 *     summary:"one-liner", spec:"../customer-sync-spec.md",
 *     epic:"../epics/I-4-customer-sync.html",
 *     provisional:false,                  // whole diagram is a stub?
 *     actors:[ {id,label,sub,role} ],     // role -> CSS accent colour var
 *     steps:[ ...items ]
 *   }
 *
 * Step items (flat list, fragments are open/else/end markers):
 *   message : {from,to,label,detail, kind:"sync"|"async"|"return",
 *              note?, provisional?}        // from===to renders a self-call
 *   fragment: {frag:"loop"|"alt"|"opt"|"par", label}
 *             {frag:"else", label}
 *             {frag:"end"}
 *   note    : {kind:"note", over:[actorIds], text}
 */
const SVGNS = "http://www.w3.org/2000/svg";
const STATUS = {
  done:    {label:"Written", cls:"b-done"},
  partial: {label:"Partial", cls:"b-partial"},
  todo:    {label:"Stub — provisional", cls:"b-todo"},
};

function el(tag, attrs={}, parent){
  const e = document.createElementNS(SVGNS, tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  if(parent) parent.appendChild(e);
  return e;
}
const cssVar = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// ---- layout constants -------------------------------------------------------
const MARGIN_X = 80, ACTOR_W = 150, ACTOR_H = 46, ACTOR_TOP = 16;
const GAP = 210;                 // horizontal spacing between lifelines
const LIFE_TOP = ACTOR_TOP + ACTOR_H;
const ROW = 50;                  // vertical step between messages
const SELF_DROP = 26;            // height of a self-call loop
const FRAG_PAD_TOP = 26, FRAG_PAD_BOT = 16, FRAG_GAP = 14;

let DG, actorIndex, msgEls = [], current = -1, locked = false, playTimer = null;

function renderSequence(d){
  DG = d;
  document.title = `Pretec — ${d.id} ${d.title} (sequence)`;
  buildHeader(d);

  const svg = document.getElementById("svg");
  svg.textContent = "";
  actorIndex = Object.fromEntries(d.actors.map((a,i)=>[a.id,i]));
  const width = MARGIN_X*2 + (d.actors.length-1)*GAP;

  defineMarkers(svg);
  const gFrag = el("g",{}, svg);   // behind
  const gLife = el("g",{}, svg);
  const gNote = el("g",{}, svg);
  const gMsg  = el("g",{}, svg);   // front
  const gActor= el("g",{}, svg);

  // walk steps: place rows, draw messages/notes, accumulate fragment boxes
  let y = LIFE_TOP + 30;
  const fragStack = [];
  msgEls = [];
  let seq = 0;

  const touch = (xa, xb, yy) => fragStack.forEach(f=>{
    f.minX = Math.min(f.minX, xa, xb); f.maxX = Math.max(f.maxX, xa, xb);
    f.lastY = yy;
  });

  for(const s of d.steps){
    if(s.frag === "end"){
      const f = fragStack.pop();
      const pad = Math.max(8, 26 - f.depth*10);   // outer fragments wider than nested
      const x1 = (isFinite(f.minX) ? f.minX : actorX(0)) - pad;
      const x2 = (isFinite(f.maxX) ? f.maxX : actorX(d.actors.length-1)) + pad;
      const top = f.top, bot = y + FRAG_PAD_BOT;
      drawFragment(gFrag, f, x1, x2, top, bot);
      y = bot + FRAG_GAP;
      continue;
    }
    if(s.frag === "else"){
      const f = fragStack[fragStack.length-1];
      f.dividers.push({y:y - ROW/2 + 4, label:s.label});
      y += 6;
      continue;
    }
    if(s.frag){ // open
      y += FRAG_GAP;
      fragStack.push({type:s.frag, label:s.label||"", top:y, depth:fragStack.length,
                      minX:Infinity, maxX:-Infinity, lastY:y, dividers:[]});
      y += FRAG_PAD_TOP;
      continue;
    }
    if(s.kind === "note"){
      const xs = (s.over||d.actors.map(a=>a.id)).map(id=>actorX(actorIndex[id]));
      const h = drawNote(gNote, s.text, Math.min(...xs), Math.max(...xs), y);
      touch(Math.min(...xs), Math.max(...xs), y);
      y += h + 16;
      continue;
    }
    // message
    seq += 1;
    const isSelf = s.from === s.to;
    const xa = actorX(actorIndex[s.from]);
    const xb = actorX(actorIndex[s.to]);
    const node = drawMessage(gMsg, s, seq, xa, xb, y, isSelf);
    msgEls.push({g:node, step:s, seq, from:s.from, to:s.to});
    touch(xa, xb, y);
    y += isSelf ? SELF_DROP + ROW - 12 : ROW;
  }

  const height = y + 30;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);

  // lifelines + actor heads (drawn last for correct layering, full height)
  d.actors.forEach((a,i)=>{
    const x = actorX(i);
    el("line",{class:"lifeline", x1:x, y1:LIFE_TOP, x2:x, y2:height-16}, gLife);
    drawActor(gActor, a, x);
  });

  wireGlobalInteractions();
  updateStepButtons();
}

const actorX = i => MARGIN_X + i*GAP;

function buildHeader(d){
  const st = STATUS[d.status] || STATUS.todo;
  document.getElementById("h-id").textContent = d.id;
  document.getElementById("h-title").textContent = d.title;
  document.getElementById("h-summary").textContent = d.summary || "";
  const b = document.getElementById("h-badge");
  b.className = "badge " + st.cls; b.textContent = st.label;
  document.getElementById("h-spec").href = d.spec;
  const epic = document.getElementById("h-epic");
  if(d.epic){ epic.href = d.epic; epic.style.display = ""; }
  else epic.style.display = "none";
}

function defineMarkers(svg){
  const defs = el("defs",{}, svg);
  const mk = (id, fill, open) => {
    const m = el("marker",{id, viewBox:"0 0 10 10", refX:8.6, refY:5,
      markerWidth:8, markerHeight:8, orient:"auto"}, defs);
    el("path", open
      ? {d:"M0,0 L10,5 L0,10", fill:"none", stroke:fill, "stroke-width":1.6}
      : {d:"M0,0 L10,5 L0,10 z", fill:fill}, m);
  };
  mk("a-sync",  cssVar("--ink"), false);
  mk("a-async", cssVar("--ink"), true);
  mk("a-ret",   cssVar("--muted"), false);
  mk("a-prov",  cssVar("--todo"), false);
}

function drawActor(g, a, x){
  const grp = el("g",{class:"actor"}, g);
  grp.dataset.id = a.id;
  el("rect",{x:x-ACTOR_W/2, y:ACTOR_TOP, width:ACTOR_W, height:ACTOR_H, rx:9}, grp);
  el("line",{class:"accent", x1:x-ACTOR_W/2+3, y1:ACTOR_TOP+9, x2:x-ACTOR_W/2+3,
    y2:ACTOR_TOP+ACTOR_H-9, stroke:cssVar("--"+(a.role||"sub"))}, grp);
  el("text",{class:"alabel", x:x-ACTOR_W/2+14, y:ACTOR_TOP+(a.sub?20:28)}, grp).textContent=a.label;
  if(a.sub) el("text",{class:"asub", x:x-ACTOR_W/2+14, y:ACTOR_TOP+34}, grp).textContent=a.sub;
  grp.addEventListener("mouseenter",()=>{ if(!locked) highlightActor(a.id); });
  grp.addEventListener("mouseleave",()=>{ if(!locked) clearHighlight(); });
  grp.addEventListener("click",ev=>{ ev.stopPropagation(); lockActor(a.id); });
}

function drawMessage(g, s, seq, xa, xb, y, isSelf){
  const grp = el("g",{class:"msg"+(s.provisional?" prov":"")+(isSelf?" self":"")}, g);
  grp.dataset.seq = seq;
  const kind = s.kind || "sync";
  const lineCls = "line " + (kind==="return"?"ret":kind==="async"?"async":"");
  const marker = s.provisional ? "url(#a-prov)"
    : kind==="return" ? "url(#a-ret)" : kind==="async" ? "url(#a-async)" : "url(#a-sync)";

  let labelX, labelY = y - 8, d, hitD;
  if(isSelf){
    const r = 46;
    d = `M${xa},${y} L${xa+r},${y} L${xa+r},${y+SELF_DROP} L${xa+6},${y+SELF_DROP}`;
    hitD = d;
    labelX = xa + r + 8; labelY = y + SELF_DROP/2 + 4;
    el("path",{class:lineCls, d, "marker-end":marker, fill:"none"}, grp);
  } else {
    d = `M${xa},${y} L${xb},${y}`;
    hitD = d;
    labelX = (xa+xb)/2;
    el("path",{class:lineCls, d, "marker-end":marker}, grp);
  }
  el("path",{class:"hit", d:hitD}, grp);

  // sequence number near the source
  const sx = isSelf ? xa+3 : xa + (xb>xa?6:-6);
  el("text",{class:"seq", x:sx, y:y-6, "text-anchor":xb>=xa?"start":"end"}, grp).textContent = seq;

  // label with background
  const text = (s.label||"");
  const w = text.length*6.0 + 14;
  el("rect",{class:"mlabel-bg", x: isSelf?labelX-4:labelX-w/2, y:labelY-12,
    width: isSelf? w : w, height:16, rx:3}, grp);
  el("text",{class:"mlabel", x:labelX, y:labelY,
    "text-anchor": isSelf?"start":"middle"}, grp).textContent = text;

  grp.addEventListener("click",ev=>{ ev.stopPropagation(); selectMessage(seq-1, true); });
  grp.addEventListener("mouseenter",()=>{ if(!locked) hoverMessage(seq-1); });
  grp.addEventListener("mouseleave",()=>{ if(!locked) clearHighlight(); });
  return grp;
}

function drawFragment(g, f, x1, x2, top, bot){
  const grp = el("g",{class:"frag"}, g);
  el("rect",{x:x1, y:top, width:x2-x1, height:bot-top, rx:6}, grp);
  // type tab
  const tw = f.type.length*7 + 16;
  el("path",{class:"ftab",
    d:`M${x1},${top} h${tw} l-8,12 h${-(tw-8)} z`}, grp);
  el("text",{class:"ftype", x:x1+7, y:top+10}, grp).textContent = f.type;
  if(f.label) el("text",{class:"fcond", x:x1+tw+8, y:top+10}, grp).textContent = "[ "+f.label+" ]";
  // else dividers
  f.dividers.forEach(dv=>{
    el("line",{class:"fdiv", x1:x1, y1:dv.y, x2:x2, y2:dv.y}, grp);
    if(dv.label) el("text",{class:"fcond", x:x1+8, y:dv.y+13}, grp).textContent = "[ "+dv.label+" ]";
  });
}

function drawNote(g, text, xL, xR, y){
  const grp = el("g",{class:"note"}, g);
  const lines = wrap(text, 46);
  const h = lines.length*14 + 14;
  const cx = (xL+xR)/2, w = Math.max(160, xR-xL+40);
  el("rect",{x:cx-w/2, y, width:w, height:h, rx:6}, grp);
  lines.forEach((ln,i)=>
    el("text",{x:cx, y:y+18+i*14, "text-anchor":"middle"}, grp).textContent = ln);
  return h;
}
function wrap(t, n){
  const words = t.split(/\s+/), out=[]; let cur="";
  for(const w of words){
    if((cur+" "+w).trim().length > n){ out.push(cur.trim()); cur=w; }
    else cur += " "+w;
  }
  if(cur.trim()) out.push(cur.trim());
  return out;
}

// ---- interaction ------------------------------------------------------------
const svgRoot = () => document.getElementById("svg");
function setDim(on){ svgRoot().classList.toggle("dim", on); }
function clearHL(){ svgRoot().querySelectorAll(".hl").forEach(e=>e.classList.remove("hl")); }

function markActors(ids){
  svgRoot().querySelectorAll(".actor").forEach(a=>
    a.classList.toggle("hl", ids.has(a.dataset.id)));
}

function hoverMessage(i){
  const m = msgEls[i]; if(!m) return;
  setDim(true); clearHL();
  m.g.classList.add("hl");
  markActors(new Set([m.from, m.to]));
}
function highlightActor(id){
  setDim(true); clearHL();
  const ids = new Set([id]);
  msgEls.forEach(m=>{
    if(m.from===id || m.to===id){ m.g.classList.add("hl"); ids.add(m.from); ids.add(m.to); }
  });
  markActors(ids);
}
function clearHighlight(){
  setDim(false); clearHL();
  svgRoot().querySelectorAll(".actor.hl").forEach(a=>a.classList.remove("hl"));
}
function lockActor(id){ locked = true; highlightActor(id); openActorPanel(id); }

function selectMessage(i, lock){
  if(i<0 || i>=msgEls.length) return;
  current = i; if(lock) locked = true;
  setDim(true); clearHL();
  svgRoot().querySelectorAll(".msg.current").forEach(e=>e.classList.remove("current"));
  const m = msgEls[i];
  m.g.classList.add("hl","current");
  markActors(new Set([m.from, m.to]));
  openStepPanel(m);
  updateStepButtons();
}

function resetView(){
  locked = false; current = -1; stopPlay();
  svgRoot().querySelectorAll(".msg.current").forEach(e=>e.classList.remove("current"));
  clearHighlight(); closePanel(); updateStepButtons();
}

function wireGlobalInteractions(){
  document.getElementById("stage").addEventListener("click",()=>{ if(locked) resetView(); });
  document.getElementById("pclose").onclick = ()=>{ closePanel(); locked=false; clearHighlight(); };
  document.addEventListener("keydown",e=>{
    if(e.key==="ArrowRight"||e.key==="ArrowDown"){ e.preventDefault(); stepBy(1); }
    else if(e.key==="ArrowLeft"||e.key==="ArrowUp"){ e.preventDefault(); stepBy(-1); }
    else if(e.key==="Escape") resetView();
  });
  document.getElementById("btn-prev").onclick = ()=>stepBy(-1);
  document.getElementById("btn-next").onclick = ()=>stepBy(1);
  document.getElementById("btn-play").onclick = togglePlay;
  document.getElementById("btn-reset").onclick = resetView;
}
function stepBy(n){
  stopPlay();
  let i = current + n;
  if(i < 0) i = 0;
  if(i >= msgEls.length) i = msgEls.length-1;
  selectMessage(i, true);
  scrollToCurrent();
}
function togglePlay(){
  if(playTimer){ stopPlay(); return; }
  if(current >= msgEls.length-1) current = -1;
  document.getElementById("btn-play").textContent = "⏸ Pause";
  playTimer = setInterval(()=>{
    if(current >= msgEls.length-1){ stopPlay(); return; }
    selectMessage(current+1, true); scrollToCurrent();
  }, 1400);
}
function stopPlay(){
  if(playTimer){ clearInterval(playTimer); playTimer=null; }
  const b = document.getElementById("btn-play"); if(b) b.textContent = "▶ Play";
}
function scrollToCurrent(){
  const m = msgEls[current]; if(!m) return;
  m.g.scrollIntoView({block:"center", behavior:"smooth"});
}
function updateStepButtons(){
  const pos = document.getElementById("pos");
  pos.textContent = current<0 ? `${msgEls.length} steps` : `Step ${current+1} / ${msgEls.length}`;
  document.getElementById("btn-prev").disabled = current<=0;
  document.getElementById("btn-next").disabled = current>=msgEls.length-1;
}

// ---- side panel -------------------------------------------------------------
const labelOf = id => (DG.actors.find(a=>a.id===id)||{}).label || id;
function openPanel(html){
  document.getElementById("panel-content").innerHTML = html;
  document.getElementById("panel").classList.add("open");
}
function closePanel(){ document.getElementById("panel").classList.remove("open"); }

function openStepPanel(m){
  const s = m.step, kind = s.kind||"sync";
  const arrow = kind==="return" ? "⇠" : s.from===s.to ? "↺" : "→";
  const kindLabel = {sync:"Synchronous call", async:"Async / fire-and-forget", return:"Return"}[kind];
  openPanel(
    `<div class="p-head">
       <div class="p-step">Step ${m.seq} of ${msgEls.length}</div>
       <div class="p-title">${esc(s.label||"")}</div>
       <div class="p-flow">
         <span class="p-chip">${esc(labelOf(s.from))}</span>
         <span class="p-arrow">${arrow}</span>
         <span class="p-chip">${esc(labelOf(s.to))}</span>
         <span class="p-kind">${kindLabel}</span>
       </div>
     </div>
     <div class="p-body">
       ${s.detail?`<p class="p-detail">${esc(s.detail)}</p>`:`<p class="p-detail" style="color:var(--muted)">No additional detail in spec.</p>`}
       ${s.note?`<div class="p-note">${esc(s.note)}</div>`:""}
       ${s.provisional?`<div class="p-prov">Provisional — this step is inferred; the underlying spec is still a stub.</div>`:""}
     </div>`);
}
function openActorPanel(id){
  const a = DG.actors.find(x=>x.id===id);
  const ins = msgEls.filter(m=>m.to===id).length, outs = msgEls.filter(m=>m.from===id).length;
  openPanel(
    `<div class="p-head">
       <div class="p-step">Participant</div>
       <div class="p-title">${esc(a.label)}</div>
       <div class="p-flow"><span class="p-kind" style="text-transform:capitalize">${esc(a.role||"")}</span></div>
     </div>
     <div class="p-body">
       <p class="p-detail">${esc(a.sub||"")}</p>
       <p class="p-detail" style="color:var(--muted);margin-top:12px">${outs} message(s) sent · ${ins} received in this flow.</p>
     </div>`);
}
function esc(s){ return String(s).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
