// ---------- Index by term (normalized) ----------
const norm = (s) => (s || "")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .replace(/[·]/g, "")
  .trim();

const BY_TERM = {};
LEXIKON.forEach((d, i) => { BY_TERM[norm(d.begriff)] = i; });

// resolve a related-term string to an index (fuzzy on parentheses/spacing)
function findIndex(term) {
  const n = norm(term);
  if (n in BY_TERM) return BY_TERM[n];
  // strip parenthetical, e.g. "Globaler Süden (Global South)"
  const base = norm(term.replace(/\(.*?\)/g, ""));
  if (base in BY_TERM) return BY_TERM[base];
  // partial match
  const hit = Object.keys(BY_TERM).find(k => k.startsWith(base) || base.startsWith(k));
  return hit ? BY_TERM[hit] : -1;
}

// ---------- Icons (exact paths from the user's SVG) ----------
const ICONS = {
  cog: `<svg viewBox="126 100 62 62" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <g transform="matrix(1,0,0,1,609,-612.035088)">
      <path stroke-width="6" d="M-457.283,723.283C-457.283,720.367 -454.916,718 -452,718C-449.084,718 -446.717,720.367 -446.717,723.283C-445.259,720.758 -442.025,719.891 -439.5,721.349C-436.975,722.807 -436.108,726.041 -437.566,728.566C-435.041,727.108 -431.807,727.975 -430.349,730.5C-428.891,733.025 -429.758,736.259 -432.283,737.717C-429.367,737.717 -427,740.084 -427,743C-427,745.916 -429.367,748.283 -432.283,748.283C-429.758,749.741 -428.891,752.975 -430.349,755.5C-431.807,758.025 -435.041,758.892 -437.566,757.434C-436.108,759.959 -436.975,763.193 -439.5,764.651C-442.025,766.109 -445.259,765.242 -446.717,762.717C-446.717,765.633 -449.084,768 -452,768C-454.916,768 -457.283,765.633 -457.283,762.717C-458.741,765.242 -461.975,766.109 -464.5,764.651C-467.025,763.193 -467.892,759.959 -466.434,757.434C-468.959,758.892 -472.193,758.025 -473.651,755.5C-475.109,752.975 -474.242,749.741 -471.717,748.283C-474.633,748.283 -477,745.916 -477,743C-477,740.084 -474.633,737.717 -471.717,737.717C-474.242,736.259 -475.109,733.025 -473.651,730.5C-472.193,727.975 -468.959,727.108 -466.434,728.566C-467.892,726.041 -467.025,722.807 -464.5,721.349C-461.975,719.891 -458.741,720.758 -457.283,723.283Z"/>
    </g>
  </svg>`,
  spiral: `<svg viewBox="388 101 62 62" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <g transform="matrix(1,0,0,1,418,133)">
      <path stroke-width="2" d="M28,0C28,-15.464 15.464,-28 -0,-28C-14.728,-28 -26.667,-16.061 -26.667,-1.333C-26.667,12.619 -15.356,23.93 -1.404,23.93C11.774,23.93 22.456,13.247 22.456,0.07C22.456,-12.332 12.402,-22.386 -0,-22.386C-11.627,-22.386 -21.053,-12.96 -21.053,-1.333C-21.053,9.519 -12.255,18.316 -1.404,18.316C8.673,18.316 16.842,10.147 16.842,0.07C16.842,-9.231 9.302,-16.772 -0,-16.772C-8.527,-16.772 -15.439,-9.86 -15.439,-1.333C-15.439,6.418 -9.155,12.702 -1.404,12.702C5.573,12.702 11.228,7.046 11.228,0.07C11.228,-6.131 6.201,-11.158 -0,-11.158C-5.426,-11.158 -9.825,-6.759 -9.825,-1.333C-9.825,3.317 -6.054,7.088 -1.404,7.088C2.472,7.088 5.614,3.946 5.614,0.07C5.614,-3.03 3.101,-5.544 -0,-5.544C-2.325,-5.544 -4.211,-3.659 -4.211,-1.333C-4.211,0.217 -2.954,1.474 -1.404,1.474C-0.628,1.474 0,0.845 -0,0.07"/>
    </g>
  </svg>`,
  play: `<svg viewBox="628 100 62 62" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <g transform="matrix(0,0.209424,-0.209424,0,765.162304,203.530357)">
      <path stroke-width="40.59" d="M-346.5,378L-251,569L-442,569L-346.5,378Z"/>
    </g>
  </svg>`
};

// ---------- Elements ----------
const els = {
  card: document.getElementById("card"),
  btns: document.getElementById("btns"),
  letter: document.getElementById("letter"),
  letterGlyph: document.getElementById("letterGlyph"),
  begriff: document.getElementById("begriff"),
  beschreibung: document.getElementById("beschreibung"),
  mapstage: document.getElementById("mapstage"),
  vFront: document.getElementById("view-front"),
  vDesc: document.getElementById("view-desc"),
  vMap: document.getElementById("view-map"),
  vHome: document.getElementById("view-home"),
  homebtn: document.getElementById("homebtn"),
};

let current = 0;          // current term index
let mode = "front";       // front | desc | map | home

// ---------- Rendering ----------
function setMode(next, animate = true) {
  mode = next;
  els.vFront.hidden = next !== "front";
  els.vDesc.hidden = next !== "desc";
  els.vMap.hidden = next !== "map";
  els.vHome.hidden = next !== "home";
  renderButtons();
  if (next === "map") renderMap();
  if (next === "front") fitBegriff();   // measure at rest, before the flip spins the card
  if (animate) {
    const anim = next === "home" ? "spinning" : "flipping";  // house = 5 fast spins
    els.card.classList.remove("flipping", "spinning");
    void els.card.offsetWidth; // reflow to restart
    els.card.classList.add(anim);
  }
}

function renderButtons() {
  // front shows 3 buttons; desc & map show 2 (cog + spiral) as in the design
  let defs = [];
  if (mode === "home") {
    // presentation card: only the play button, to jump into a random term
    defs = [
      { icon: "play", to: "random", label: "Zufall" },
    ];
  } else if (mode === "front") {
    defs = [
      { icon: "cog", to: "desc", label: "Beschreibung" },
      { icon: "spiral", to: "map", label: "Verwandte Begriffe" },
      { icon: "play", to: "random", label: "Zufall" },
    ];
  } else {
    defs = [
      { icon: "cog", to: "desc", label: "Beschreibung" },
      { icon: "spiral", to: "map", label: "Verwandte Begriffe" },
    ];
  }
  els.btns.innerHTML = "";
  defs.forEach(d => {
    const b = document.createElement("button");
    b.className = "iconbtn";
    b.type = "button";
    b.setAttribute("aria-label", d.label);
    b.innerHTML = ICONS[d.icon];
    b.addEventListener("click", () => {
      if (d.to === "random") return loadRandom();
      // toggle: tapping the active mode returns to front
      setMode(mode === d.to ? "front" : d.to);
    });
    els.btns.appendChild(b);
  });
}

function renderCard() {
  const d = LEXIKON[current];
  els.letterGlyph.textContent = d.alphabet || "•";
  els.begriff.textContent = d.begriff;
  els.beschreibung.textContent = d.beschreibung || "—";
  centerLetter();
}

// Optically center the letter in the circle using its real ink box.
// Flexbox centers the glyph's advance width and line box, but each letter's
// side bearings and cap/descender gap differ, so several look off-centre.
// We nudge by the offset between the ink centre and those geometric centres.
function centerLetter() {
  const el = els.letterGlyph;                          // nudge the glyph, not the circle
  const ch = (el.textContent || "").trim();
  if (!ch) return;
  const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
  if (!fs) return;
  const ctx = centerLetter._c || (centerLetter._c = document.createElement("canvas").getContext("2d"));
  ctx.font = `${fs}px "Aminute", sans-serif`;
  const m = ctx.measureText(ch);
  const aL = m.actualBoundingBoxLeft, aR = m.actualBoundingBoxRight;
  const aAsc = m.actualBoundingBoxAscent, aDesc = m.actualBoundingBoxDescent;
  const fAsc = m.fontBoundingBoxAscent, fDesc = m.fontBoundingBoxDescent;
  if ([aL, aR, aAsc, aDesc, fAsc, fDesc].some(v => v == null || isNaN(v))) return;
  const dx = m.width / 2 - (aR - aL) / 2;            // ink centre → advance centre
  const dy = (fDesc - fAsc) / 2 + (aAsc - aDesc) / 2; // ink centre → line-box centre
  el.style.transform = `translate(${dx}px, ${dy}px)`;
}

// Shrink the term until it fits the front view (largest size that fits).
// Upper bound = 34% of card width (the artboard display size).
function fitBegriff() {
  const view = els.vFront;
  const el = els.begriff;
  if (view.hidden || !els.card.clientWidth) return;
  const cs = getComputedStyle(view);
  // 0.94 leaves a safety gap so nothing sits flush against the box edges
  const availH = (view.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)) * 0.94;
  // upper bound generous; the real limits are the content width (rail
  // clearance) and availH (air under the buttons), enforced in the loop.
  const maxPx = els.card.clientWidth * 0.6;
  let lo = 12, hi = maxPx, best = lo;
  for (let k = 0; k < 20; k++) {
    const mid = (lo + hi) / 2;
    el.style.fontSize = mid + "px";
    const fitsW = el.scrollWidth <= el.clientWidth + 0.5;
    const fitsH = el.scrollHeight <= availH + 0.5;
    if (fitsW && fitsH) { best = mid; lo = mid; } else { hi = mid; }
  }
  el.style.fontSize = best + "px";
  alignBegriffLeft(best);
}

// Align the term's actual ink to the button's left edge. The text box already
// starts at --padL (same as the buttons), but each glyph's left side bearing
// makes the visible ink start a bit left/right of that; shift it back so the
// left margin of the typography equals the buttons' exactly.
function alignBegriffLeft(fs) {
  const el = els.begriff;
  const ch = (LEXIKON[current].begriff || "")[0] || "";
  if (!ch || !fs) { el.style.transform = "none"; return; }
  const ctx = alignBegriffLeft._c || (alignBegriffLeft._c = document.createElement("canvas").getContext("2d"));
  ctx.font = `${fs}px "Aminute", sans-serif`;
  const abbL = ctx.measureText(ch).actualBoundingBoxLeft;
  if (abbL == null || isNaN(abbL)) { el.style.transform = "none"; return; }
  el.style.transform = `translateX(${abbL}px)`;
}

// ---------- Verwandte Begriffe: words rotated 90°, in a row ----------
function renderMap() {
  const d = LEXIKON[current];
  const rels = (d.verwandte || []).filter(Boolean);
  els.mapstage.innerHTML = "";

  const row = document.createElement("div");
  row.className = "rel-row";
  rels.forEach(term => {
    const idx = findIndex(term);
    const el = document.createElement(idx >= 0 ? "button" : "span");
    el.className = "rel" + (idx >= 0 ? " is-link" : "");
    el.textContent = term;
    if (idx >= 0) {
      el.type = "button";
      el.addEventListener("click", () => { goTo(idx); });
    }
    row.appendChild(el);
  });
  els.mapstage.appendChild(row);
}

// ---------- Navigation ----------
function goTo(idx, animate = true) {
  current = idx;
  renderCard();
  setMode("front", animate);
}

function loadRandom() {
  let idx = current;
  if (LEXIKON.length > 1) {
    while (idx === current) idx = Math.floor(Math.random() * LEXIKON.length);
  }
  goTo(idx);
}

// house button -> presentation card
els.homebtn.addEventListener("click", () => setMode("home"));

// refit the term on viewport changes (rotation / resize)
let fitTimer;
window.addEventListener("resize", () => {
  clearTimeout(fitTimer);
  fitTimer = setTimeout(() => { fitBegriff(); centerLetter(); }, 120);
});

// re-measure once the custom font is ready (metrics differ from the fallback)
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { if (mode === "front") fitBegriff(); centerLetter(); });
}

// ---------- Init ----------
goTo(Math.floor(Math.random() * LEXIKON.length), false);
renderButtons();
