const SIZE = 7, TYPES = 6;
const PATTERNS = [
  { voids: ["0,0","0,1","0,5","0,6","1,0","1,6","5,0","5,6","6,0","6,1","6,5","6,6"], frost: ["3,2","3,3","3,4"] },
  { voids: ["0,0","0,6","6,0","6,6"], frost: ["2,2","2,4","4,2","4,4"] },
  { voids: ["0,0","0,1","5,5","6,5","6,6"], frost: ["3,1","3,2","3,4","3,5"] },
  { voids: ["0,3","3,0","3,6","6,3"], frost: ["1,3","3,1","3,5","5,3"] }
];

let level = 1, target = 1000, goalTotal = 10, maxMoves = 20;
let voids = new Set(), frost = new Set(), grid = [], selected = null;
let score = 0, goalDone = 0, moves = 20, mode = null;
let hammers = 2, shuffles = 2, bombs = 1, busy = false, levelCleared = false;

const fieldEl = document.getElementById("playfield");
const toastEl = document.getElementById("toast");
const nextBtn = document.getElementById("next-btn");
const isVoid = (r, c) => voids.has(`${r},${c}`);

function buildLevelConfig(lvl) {
  const pat = PATTERNS[(lvl - 1) % PATTERNS.length];
  return {
    voids: new Set(pat.voids),
    frost: new Set(pat.frost),
    target: 1000 + (lvl - 1) * 450,
    goalTotal: 10 + (lvl - 1) * 3,
    maxMoves: Math.max(16, 22 - Math.floor((lvl - 1) / 3))
  };
}

function startLevel(lvl = level) {
  level = lvl;
  const cfg = buildLevelConfig(level);
  voids = cfg.voids;
  frost = cfg.frost;
  target = cfg.target;
  goalTotal = cfg.goalTotal;
  maxMoves = cfg.maxMoves;
  moves = maxMoves;
  score = 0;
  goalDone = 0;
  selected = null;
  mode = null;
  levelCleared = false;
  nextBtn.classList.remove("show");

  grid = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => {
      if (isVoid(r, c)) return null;
      const bad = new Set();
      if (c >= 2 && grid[r]?.[c - 1]?.type === grid[r]?.[c - 2]?.type) bad.add(grid[r][c - 1].type);
      if (r >= 2 && grid[r - 1]?.[c]?.type === grid[r - 2]?.[c]?.type) bad.add(grid[r - 1][c].type);
      const pool = Array.from({ length: TYPES }, (_, i) => i).filter(i => !bad.has(i));
      return { type: pool[Math.floor(Math.random() * pool.length)], special: null };
    })
  );
  syncUI(`Level ${level} — Reach ${target} pts & clear ${goalTotal} 🍬`);
  draw();
}

function syncUI(msg) {
  document.getElementById("level-tag").textContent = `LVL ${level} · ∞`;
  document.getElementById("moves").textContent = moves;
  document.getElementById("score").textContent = `${score}/${target}`;
  document.getElementById("goal").textContent = Math.max(0, goalTotal - goalDone);
  document.getElementById("meter").style.width = `${Math.min(100, (score / target) * 100)}%`;
  document.getElementById("hammer-n").textContent = hammers;
  document.getElementById("shuffle-n").textContent = shuffles;
  document.getElementById("bomb-n").textContent = bombs;
  document.getElementById("hammer-btn").classList.toggle("armed", mode === "hammer");
  document.getElementById("bomb-btn").classList.toggle("armed", mode === "bomb");
  if (msg) toastEl.textContent = msg;
}

function findMatches() {
  const matched = new Set();
  const specials = [];
  for (let r = 0; r < SIZE; r++) {
    let c = 0;
    while (c < SIZE) {
      const cur = grid[r][c];
      if (!cur) { c++; continue; }
      let end = c + 1;
      while (end < SIZE && grid[r][end]?.type === cur.type) end++;
      if (end - c >= 3) {
        for (let k = c; k < end; k++) matched.add(`${r},${k}`);
        if (end - c >= 4) specials.push({ r, c: Math.floor((c + end - 1) / 2), type: cur.type, special: end - c >= 5 ? "bomb" : "line" });
      }
      c = end;
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let r = 0;
    while (r < SIZE) {
      const cur = grid[r][c];
      if (!cur) { r++; continue; }
      let end = r + 1;
      while (end < SIZE && grid[end][c]?.type === cur.type) end++;
      if (end - r >= 3) {
        for (let k = r; k < end; k++) matched.add(`${k},${c}`);
        if (end - r >= 4) specials.push({ r: Math.floor((r + end - 1) / 2), c, type: cur.type, special: end - r >= 5 ? "bomb" : "line" });
      }
      r = end;
    }
  }
  return { matched, specials };
}

function dropCandies() {
  for (let c = 0; c < SIZE; c++) {
    let write = SIZE - 1;
    for (let r = SIZE - 1; r >= 0; r--) {
      if (isVoid(r, c)) { write = r - 1; continue; }
      if (grid[r][c]) {
        if (write !== r) { grid[write][c] = grid[r][c]; grid[r][c] = null; }
        write--;
      }
    }
    for (let r = write; r >= 0; r--) {
      if (!isVoid(r, c)) grid[r][c] = { type: Math.floor(Math.random() * TYPES), special: null };
    }
  }
}

async function settle(combo = 1) {
  busy = true;
  while (true) {
    const { matched, specials } = findMatches();
    if (!matched.size) break;
    const blast = new Set(matched);
    for (const key of matched) {
      const [r, c] = key.split(",").map(Number);
      const item = grid[r][c];
      if (item?.special === "line") {
        for (let cc = 0; cc < SIZE; cc++) if (!isVoid(r, cc)) blast.add(`${r},${cc}`);
      } else if (item?.special === "bomb") {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !isVoid(nr, nc)) blast.add(`${nr},${nc}`);
        }
      }
    }
    for (const key of blast) {
      frost.delete(key);
      const [r, c] = key.split(",").map(Number);
      if (grid[r][c]?.type === 0) goalDone++;
      grid[r][c] = null;
    }
    for (const sp of specials) {
      if (!isVoid(sp.r, sp.c)) grid[sp.r][sp.c] = { type: sp.type, special: sp.special };
    }
    score += blast.size * 25 * combo;
    draw();
    await new Promise(r => setTimeout(r, 170));
    dropCandies();
    draw();
    await new Promise(r => setTimeout(r, 170));
    combo++;
  }

  if (!levelCleared && score >= target && goalDone >= goalTotal) {
    levelCleared = true;
    hammers++;
    bombs++;
    nextBtn.classList.add("show");
    syncUI(`Level ${level} Cleared! +1 🔨 & +1 💣 earned!`);
  } else if (!levelCleared && moves <= 0) {
    syncUI("Out of moves! Tap 🔄 to retry");
  } else if (!levelCleared) {
    syncUI(combo > 1 ? `Sweet Combo x${combo}!` : "Ready");
  }
  busy = false;
}

async function onTap(r, c) {
  if (busy || moves <= 0 || isVoid(r, c) || !grid[r][c]) return;
  if (mode === "hammer" && hammers > 0) {
    hammers--; mode = null; frost.delete(`${r},${c}`); grid[r][c] = null; score += 50;
    dropCandies(); draw(); await settle(); return;
  }
  if (mode === "bomb" && bombs > 0) {
    bombs--; mode = null;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !isVoid(nr, nc)) { frost.delete(`${nr},${nc}`); grid[nr][nc] = null; }
    }
    score += 150; dropCandies(); draw(); await settle(); return;
  }
  if (!selected) { selected = { r, c }; draw(); return; }
  if (Math.abs(selected.r - r) + Math.abs(selected.c - c) !== 1) { selected = { r, c }; draw(); return; }

  const a = selected, b = { r, c };
  selected = null;
  [grid[a.r][a.c], grid[b.r][b.c]] = [grid[b.r][b.c], grid[a.r][a.c]];
  draw();

  if (findMatches().matched.size) {
    moves--; syncUI(); await settle();
  } else {
    await new Promise(r => setTimeout(r, 150));
    [grid[a.r][a.c], grid[b.r][b.c]] = [grid[b.r][b.c], grid[a.r][a.c]];
    syncUI("Try another swap");
    draw();
  }
}

function draw() {
  fieldEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const slot = document.createElement("div");
      slot.className = "slot";
      if (isVoid(r, c)) {
        slot.classList.add("void");
      } else {
        if (frost.has(`${r},${c}`)) slot.classList.add("frosting");
        if (selected && selected.r === r && selected.c === c) slot.classList.add("selected");
        const item = grid[r][c];
        if (item) {
          const piece = document.createElement("div");
          piece.className = `piece p${item.type}`;
          if (item.special === "line") piece.classList.add("sp-line");
          if (item.special === "bomb") piece.classList.add("sp-bomb");
          slot.appendChild(piece);
        }
        slot.onclick = () => onTap(r, c);
      }
      fieldEl.appendChild(slot);
    }
  }
}

nextBtn.onclick = () => startLevel(level + 1);
document.getElementById("reset-btn").onclick = () => startLevel(level);
document.getElementById("hammer-btn").onclick = () => {
  if (!busy && hammers > 0) { mode = mode === "hammer" ? null : "hammer"; syncUI(mode ? "Tap a candy to smash" : "Ready"); }
};
document.getElementById("bomb-btn").onclick = () => {
  if (!busy && bombs > 0) { mode = mode === "bomb" ? null : "bomb"; syncUI(mode ? "Tap for 3x3 blast" : "Ready"); }
};
document.getElementById("shuffle-btn").onclick = () => {
  if (busy || shuffles <= 0) return;
  shuffles--;
  const list = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) list.push(grid[r][c]);
  list.sort(() => Math.random() - 0.5);
  let idx = 0;
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) grid[r][c] = list[idx++];
  syncUI("Candies shuffled!");
  draw();
};

startLevel(1);
