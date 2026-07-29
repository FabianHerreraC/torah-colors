// ---------- build graph ----------
const W = 1600, H = 1000, CX = W / 2, CY = H / 2, RAD = 400;
const SVGNS = "http://www.w3.org/2000/svg";

// 6 source nodes pinned on a hexagon (pointy-top): index 0 = top, clockwise
const srcNodes = SOURCES.map((s, i) => {
  const ang = (-90 + i * 60) * Math.PI / 180;
  return { s, i, x: CX + Math.cos(ang) * RAD, y: CY + Math.sin(ang) * RAD, ang };
});

// term nodes with their source links
const termNodes = [];
TERMS.forEach((t, i) => {
  const links = [];
  t.frags.forEach((f, si) => { if (f) links.push(si); });
  const deg = links.length;
  // seed position: centroid of linked sources, jittered
  let sx = CX, sy = CY;
  if (deg) {
    sx = links.reduce((a, si) => a + srcNodes[si].x, 0) / deg;
    sy = links.reduce((a, si) => a + srcNodes[si].y, 0) / deg;
  }
  termNodes.push({
    t, i, links, deg,
    x: sx + (Math.random() - 0.5) * 120,
    y: sy + (Math.random() - 0.5) * 120,
    vx: 0, vy: 0, fixed: false
  });
});

const termRadius = () => 12;   // all term dots uniform, ~ "Sumak Kawsay" size
const labelSet = new Set(termNodes.filter(n => n.deg >= 4).map(n => n.i)); // label the well-attested terms

// ---------- SVG ----------
const svg = document.getElementById("graph");
const gViewport = document.getElementById("viewport");
const gEdges = document.getElementById("edges");
const gTerms = document.getElementById("terms");
const gSources = document.getElementById("sources");
const glowEl = document.getElementById("glowEllipse");
glowEl.setAttribute("cx", CX); glowEl.setAttribute("cy", CY);
glowEl.setAttribute("rx", RAD * 1.1); glowEl.setAttribute("ry", RAD * 1.1);

// edges: term -> each linked source
const edgeList = [];
termNodes.forEach(n => n.links.forEach(si => edgeList.push({ t: n, s: srcNodes[si] })));
const edgeEls = edgeList.map(() => {
  const l = document.createElementNS(SVGNS, "line");
  l.setAttribute("class", "edge");
  gEdges.appendChild(l);
  return l;
});

// term elements
const termEls = termNodes.map(n => {
  const g = document.createElementNS(SVGNS, "g");
  g.setAttribute("class", "term" + (labelSet.has(n.i) ? " label" : ""));
  const c = document.createElementNS(SVGNS, "circle");
  c.setAttribute("r", termRadius(n));
  const tx = document.createElementNS(SVGNS, "text");
  tx.setAttribute("x", termRadius(n) + 5);
  tx.setAttribute("font-size", 13 + Math.min(n.deg, 5));
  tx.textContent = n.t.begriff;
  g.appendChild(c); g.appendChild(tx);
  gTerms.appendChild(g);
  g._node = n;
  return g;
});

// source elements (drawn on top)
const srcEls = srcNodes.map(sn => {
  const g = document.createElementNS(SVGNS, "g");
  g.setAttribute("class", "source");
  const c = document.createElementNS(SVGNS, "circle");
  c.setAttribute("r", 26);
  const num = document.createElementNS(SVGNS, "text");
  num.setAttribute("class", "num");
  num.textContent = sn.i + 1;
  const name = document.createElementNS(SVGNS, "text");
  name.setAttribute("class", "name");
  name.textContent = sn.s.author + (sn.s.year ? " " + sn.s.year : "");
  // place name outside the hexagon
  const out = 46, ax = Math.cos(sn.ang), ay = Math.sin(sn.ang);
  name.setAttribute("x", ax * out);
  name.setAttribute("y", ay * out + 5);
  name.setAttribute("text-anchor", ax > 0.3 ? "start" : ax < -0.3 ? "end" : "middle");
  g.appendChild(c); g.appendChild(num); g.appendChild(name);
  g.setAttribute("transform", `translate(${sn.x},${sn.y})`);
  gSources.appendChild(g);
  g._src = sn;
  return g;
});

// ---------- force simulation ----------
let alpha = 1;
const REP = 7000, SPRING = 0.032, SPRING_LEN = 70, GRAV = 0.0015, DAMP = 0.86;

function step() {
  alpha *= 0.99;
  // repulsion among terms
  for (let a = 0; a < termNodes.length; a++) {
    const na = termNodes[a];
    for (let b = a + 1; b < termNodes.length; b++) {
      const nb = termNodes[b];
      let dx = na.x - nb.x, dy = na.y - nb.y;
      let d2 = dx * dx + dy * dy || 0.01;
      const d = Math.sqrt(d2);
      const f = (REP * alpha) / d2;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      na.vx += fx; na.vy += fy; nb.vx -= fx; nb.vy -= fy;
    }
  }
  // springs term -> linked sources (fixed anchors)
  for (const n of termNodes) {
    for (const si of n.links) {
      const s = srcNodes[si];
      let dx = s.x - n.x, dy = s.y - n.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - SPRING_LEN) * SPRING * alpha;
      n.vx += (dx / d) * f; n.vy += (dy / d) * f;
    }
    n.vx += (CX - n.x) * GRAV * alpha;
    n.vy += (CY - n.y) * GRAV * alpha;
  }
  // integrate terms
  for (const n of termNodes) {
    if (n.fixed) { n.vx = 0; n.vy = 0; continue; }
    n.vx *= DAMP; n.vy *= DAMP;
    n.x += Math.max(-22, Math.min(22, n.vx));
    n.y += Math.max(-22, Math.min(22, n.vy));
  }
}

function render() {
  for (let i = 0; i < edgeList.length; i++) {
    const e = edgeList[i], l = edgeEls[i];
    l.setAttribute("x1", e.t.x); l.setAttribute("y1", e.t.y);
    l.setAttribute("x2", e.s.x); l.setAttribute("y2", e.s.y);
  }
  for (let i = 0; i < termNodes.length; i++) {
    termEls[i].setAttribute("transform", `translate(${termNodes[i].x},${termNodes[i].y})`);
  }
}

let userInteracted = false;
function loop() {
  if (alpha > 0.03) { step(); if (!userInteracted) fitToScreen(); }
  render();
  requestAnimationFrame(loop);
}

// ---------- pan / zoom ----------
const view = { x: 0, y: 0, k: 1 };
const applyView = () => gViewport.setAttribute("transform", `translate(${view.x},${view.y}) scale(${view.k})`);
function fitToScreen() {
  const pad = 150;
  const minX = CX - RAD - pad, maxX = CX + RAD + pad;
  const minY = CY - RAD - pad, maxY = CY + RAD + pad;
  const vw = svg.clientWidth, vh = svg.clientHeight;
  view.k = Math.min(vw / (maxX - minX), vh / (maxY - minY));
  view.x = vw / 2 - CX * view.k;
  view.y = vh / 2 - CY * view.k;
  applyView();
}
window.addEventListener("resize", () => { if (!userInteracted) fitToScreen(); });
loop();

svg.addEventListener("wheel", (e) => {
  e.preventDefault();
  userInteracted = true;
  const rect = svg.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  const k2 = Math.max(0.25, Math.min(4, view.k * Math.exp(-e.deltaY * 0.0015)));
  view.x = mx - (mx - view.x) * (k2 / view.k);
  view.y = my - (my - view.y) * (k2 / view.k);
  view.k = k2; applyView();
}, { passive: false });

// ---------- pointer: pan bg / drag term ----------
let drag = null;
const toSim = (cx, cy) => {
  const r = svg.getBoundingClientRect();
  return { x: (cx - r.left - view.x) / view.k, y: (cy - r.top - view.y) / view.k };
};
svg.addEventListener("pointerdown", (e) => {
  const tg = e.target.closest(".term");
  const sg = e.target.closest(".source");
  if (tg) {
    drag = { node: tg._node, moved: false, x0: e.clientX, y0: e.clientY };
    tg._node.fixed = true;
  } else if (sg) {
    drag = { src: sg._src, moved: false, x0: e.clientX, y0: e.clientY };
  } else {
    userInteracted = true;
    drag = { pan: true, x0: e.clientX, y0: e.clientY, vx0: view.x, vy0: view.y };
    svg.classList.add("panning");
  }
  svg.setPointerCapture(e.pointerId);
});
svg.addEventListener("pointermove", (e) => {
  if (!drag) return;
  const moved = Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) > 4;
  if (drag.node) {
    const p = toSim(e.clientX, e.clientY);
    drag.node.x = p.x; drag.node.y = p.y;
    if (moved) { drag.moved = true; userInteracted = true; alpha = Math.max(alpha, 0.2); }
  } else if (drag.pan) {
    view.x = drag.vx0 + (e.clientX - drag.x0);
    view.y = drag.vy0 + (e.clientY - drag.y0);
    applyView();
  } else if (drag.src && moved) drag.moved = true;
});
svg.addEventListener("pointerup", () => {
  if (drag && drag.node) { drag.node.fixed = false; if (!drag.moved) openTerm(drag.node.i); }
  else if (drag && drag.src && !drag.moved) toggleSource(drag.src.i);
  drag = null; svg.classList.remove("panning");
});

// ---------- hover ----------
const noSel = () => selTerm == null && selSrc == null && selLetter == null;
termEls.forEach(g => {
  g.addEventListener("pointerenter", () => { if (noSel()) highlightTerm(g._node.i); });
  g.addEventListener("pointerleave", () => { if (noSel()) clearFocus(); });
});
srcEls.forEach(g => {
  g.addEventListener("pointerenter", () => { if (noSel()) highlightSource(g._src.i); });
  g.addEventListener("pointerleave", () => { if (noSel()) clearFocus(); });
});

function highlightTerm(i) {
  const n = termNodes[i];
  gTerms.classList.add("has-focus"); gEdges.classList.add("has-focus");
  termEls.forEach((g, k) => g.classList.toggle("active", k === i));
  edgeEls.forEach((l, k) => l.classList.toggle("active", edgeList[k].t === n));
  srcEls.forEach((g, k) => g.classList.toggle("active", n.links.includes(k)));
}
function highlightSource(si) {
  gTerms.classList.add("has-focus"); gEdges.classList.add("has-focus");
  srcEls.forEach((g, k) => g.classList.toggle("active", k === si));
  termEls.forEach((g) => g.classList.toggle("neighbor", g._node.links.includes(si)));
  edgeEls.forEach((l, k) => l.classList.toggle("active", edgeList[k].s === srcNodes[si]));
}
function clearFocus() {
  gTerms.classList.remove("has-focus"); gEdges.classList.remove("has-focus");
  termEls.forEach(g => g.classList.remove("active", "neighbor"));
  srcEls.forEach(g => g.classList.remove("active"));
  edgeEls.forEach(l => l.classList.remove("active"));
}

// ---------- panel ----------
const panel = document.getElementById("panel");
let selTerm = null, selSrc = null, selLetter = null;

function openTerm(i) {
  selTerm = i; selSrc = null; clearLetter();
  const t = TERMS[i];
  document.getElementById("panelTitle").textContent = t.begriff;
  document.getElementById("panelDef").textContent = t.definition || "";
  const box = document.getElementById("panelFrags");
  box.innerHTML = "";
  SOURCES.forEach((s, si) => {
    const f = t.frags[si];
    const div = document.createElement("div");
    div.className = "frag" + (f ? "" : " empty");
    const src = document.createElement("div");
    src.className = "frag-src";
    src.textContent = (si + 1) + " · " + s.author + (s.year ? " " + s.year : "");
    const txt = document.createElement("div");
    txt.className = "frag-txt";
    txt.textContent = f || "kein Fragment";
    div.appendChild(src); div.appendChild(txt);
    box.appendChild(div);
  });
  panel.hidden = false;
  highlightTerm(i);
}
function toggleSource(si) {
  if (selSrc === si) { closePanel(); return; }
  selSrc = si; selTerm = null; clearLetter();
  panel.hidden = true;
  highlightSource(si);
}
function closePanel() {
  panel.hidden = true; selTerm = null; selSrc = null; clearLetter(); clearFocus();
}

// ---------- vertical alphabet ----------
const letterOf = (b) => {
  const c = (b || "").trim().charAt(0).toUpperCase();
  return ({ "Ä": "A", "Ö": "O", "Ü": "U" })[c] || c;
};
termNodes.forEach(n => { n.letter = letterOf(n.t.begriff); });
const ALPHA = [...new Set(termNodes.map(n => n.letter))].sort();
const alphaEl = document.getElementById("alphabet");
const alphaBtns = {};
ALPHA.forEach(L => {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = L;
  b.addEventListener("click", () => selectLetter(L));
  alphaEl.appendChild(b);
  alphaBtns[L] = b;
});
function clearLetter() {
  selLetter = null;
  Object.values(alphaBtns).forEach(b => b.classList.remove("on"));
}
function selectLetter(L) {
  if (selLetter === L) { closePanel(); return; }        // toggle off
  panel.hidden = true; selTerm = null; selSrc = null;
  selLetter = L;
  Object.values(alphaBtns).forEach(b => b.classList.toggle("on", b.textContent === L));
  gTerms.classList.add("has-focus");
  gEdges.classList.add("has-focus");
  termEls.forEach(g => {
    g.classList.toggle("neighbor", g._node.letter === L);   // light up + show label
    g.classList.remove("active");
  });
  srcEls.forEach(g => g.classList.remove("active"));
  edgeEls.forEach(l => l.classList.remove("active"));
}
document.getElementById("panelClose").addEventListener("click", closePanel);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePanel(); });
