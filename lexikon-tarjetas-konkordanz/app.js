// ---------- state ----------
let cur = Math.floor(Math.random() * TERMS.length);
let flipped = false;
let busy = false;

const els = {
  scene: document.getElementById("scene"),
  card: document.getElementById("card3d"),
  term: document.getElementById("term"),
  def: document.getElementById("def"),
  count: document.getElementById("count"),
  backTitle: document.getElementById("backTitle"),
  frags: document.getElementById("frags"),
  home: document.getElementById("home"),
  homebtn: document.getElementById("homebtn"),
};

// ---------- render ----------
function render() {
  const t = TERMS[cur];
  els.term.textContent = t.begriff;
  els.def.textContent = t.definition || "";
  els.backTitle.textContent = t.begriff;

  const n = t.frags.filter(Boolean).length;
  els.count.textContent = n + "/6 Quellen";

  els.frags.innerHTML = "";
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
    els.frags.appendChild(div);
  });

  fitTerm();
}

// shrink the front term to fit its box
function fitTerm() {
  const box = els.term.parentElement;
  const el = els.term;
  const avail = box.clientHeight;
  if (!avail) return;
  let lo = 16, hi = box.clientWidth * 0.62, best = lo;
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = mid + "px";
    const fits = el.scrollWidth <= el.clientWidth + 0.5 && el.scrollHeight <= avail + 0.5;
    if (fits) { best = mid; lo = mid; } else { hi = mid; }
  }
  el.style.fontSize = best + "px";
}

// ---------- flip (vertical swipe) ----------
function flip() {
  flipped = !flipped;
  els.card.classList.toggle("flipped", flipped);
}

// ---------- random term (horizontal swipe) ----------
function randomTerm(dir) {           // dir: +1 left, -1 right
  if (busy) return;
  busy = true;
  let next = cur;
  if (TERMS.length > 1) while (next === cur) next = Math.floor(Math.random() * TERMS.length);

  els.card.classList.remove("flipped");
  flipped = false;

  const c = els.card;
  const cls = dir > 0 ? "spinY" : "spinYr";      // spin in the swipe direction
  c.classList.add(cls);
  setTimeout(() => { cur = next; render(); }, 250);   // swap term mid-spin (edge-on)
  setTimeout(() => { c.classList.remove("spinY", "spinYr"); busy = false; }, 510);
}

// ---------- home / presentation (square button) ----------
let atHome = false;
function goHome() {
  atHome = true;
  els.card.classList.remove("flipped"); flipped = false;
  els.card.classList.remove("homespin"); void els.card.offsetWidth;
  els.card.classList.add("homespin");          // spin many times
  setTimeout(() => { els.home.classList.add("open"); }, 780);
}
function leaveHome() {
  atHome = false;
  els.home.classList.remove("open");
}
els.homebtn.addEventListener("click", (e) => {
  e.stopPropagation();
  atHome ? leaveHome() : goHome();
});

// ---------- gestures ----------
let sw = null;
els.scene.addEventListener("pointerdown", (e) => {
  if (atHome || e.target === els.homebtn) { sw = null; return; }
  sw = { x: e.clientX, y: e.clientY };
});
els.scene.addEventListener("pointerup", (e) => {
  if (!sw) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  sw = null;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 40 && ady < 40) return;              // not a swipe
  if (adx > ady) randomTerm(dx < 0 ? 1 : -1);    // horizontal -> random term
  else flip();                                    // vertical -> flip to fragments
});
els.scene.addEventListener("pointercancel", () => { sw = null; });

// keyboard for desktop testing
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") randomTerm(1);
  else if (e.key === "ArrowRight") randomTerm(-1);
  else if (e.key === "ArrowUp" || e.key === "ArrowDown") flip();
});

window.addEventListener("resize", () => { clearTimeout(fitTerm._t); fitTerm._t = setTimeout(fitTerm, 100); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTerm);

// ---------- init ----------
render();
