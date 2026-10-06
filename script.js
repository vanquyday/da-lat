/* ===== Render ===== */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
let frameNo = 0;

function stopHTML(s, dayN){
  if (s.pass){
    return `<div class="pass" data-day="${dayN}" data-t="${s.t}">
      <span class="t">${s.t}</span><span class="dash"></span>
      <span class="ttl">${esc(s.title)}${s.note?`<small>${esc(s.note)}</small>`:""}</span></div>`;
  }
  frameNo++;
  return `<article class="frame" id="f-${s.id}" data-id="${s.id}" data-day="${dayN}" data-t="${s.t}">
    <span class="edge">ĐÀ LẠT 2026 ▸ ${String(frameNo).padStart(2,"0")}A</span>
    <div class="shot">
      <img class="bg" alt="" hidden><img class="main" alt="${esc(s.title)}" decoding="async" hidden>
      <div class="empty"><div>
        <div class="slate">${esc(s.title)}</div>
        <span class="hint">Khung hình đang chờ ảnh</span>
      </div></div>
    </div>
    <div class="cap">
      <div class="t">${s.t}</div>
      <div class="meta"><h3>${esc(s.title)}</h3>${s.note?`<p>${esc(s.note)}</p>`:""}${s.km?`<span class="km">${esc(s.km)}</span>`:""}</div>
    </div>
  </article>`;
}

function render(){
  let html = "";
  const credits = [];
  DAYS.forEach(d => {
    const places = [...d.stops, ...(d.fork ? d.fork.a.stops : [])].filter(s => !s.pass).length;
    html += `<section class="card" id="day-${d.n}" data-day="${d.n}" data-t="${d.date}">
      <div class="no">Ngày ${d.n} / 4</div><h2>${esc(d.name)}</h2>
      <div class="wd">${d.wd}, ${d.date}</div><div class="stat">${places} cảnh quay</div></section><div class="cut"></div>`;
    credits.push(`<li class="head">Ngày ${d.n} · ${d.date}</li>`);
    if (d.fork){
      const f = d.fork;
      html += `<div class="fork" data-day="${d.n}"><div class="q">${esc(f.q)}</div>
        <div class="tabs" role="tablist">
          <button role="tab" aria-selected="true" data-branch="a"><b>${f.a.label}</b><span>${esc(f.a.sub)}</span></button>
          <button role="tab" aria-selected="false" data-branch="b"><b>${f.b.label}</b><span>${esc(f.b.sub)}</span></button>
        </div></div>`;
      html += `<div class="branch" data-branch="a">${f.a.stops.map(s=>stopHTML(s,d.n)).join("")}</div>`;
      html += `<div class="branch" data-branch="b" hidden>${f.b.stops.map(s=>stopHTML(s,d.n)).join("")}</div>`;
      f.a.stops.filter(s=>!s.pass).forEach(s=>credits.push(`<li><span>${s.t}</span><span>${esc(s.title)}</span></li>`));
    }
    d.stops.forEach(s => {
      html += stopHTML(s, d.n);
      if (!s.pass) credits.push(`<li><span>${s.t}</span><span>${esc(s.title)}</span></li>`);
    });
    html += `<div class="cut"></div>`;
  });
  $("#frames").innerHTML = html;
  $("#creditList").innerHTML = `<li class="head">Diễn viên</li>` + CAST.map(c=>`<li><span>Vai chính</span><span>${c}</span></li>`).join("") + `<li class="head">Theo thứ tự xuất hiện</li>` + credits.join("");
  $("#credits").style.setProperty("--dur", Math.max(30, credits.length * 1.6) + "s");
  $("#days").innerHTML = DAYS.map(d => `<a href="#day-${d.n}" data-day="${d.n}"><b>Ngày ${d.n}</b><small>${d.date}</small></a>`).join("");
}
render();

/* fork tabs */
document.addEventListener("click", e => {
  const tab = e.target.closest(".tabs button");
  if (!tab) return;
  const fork = tab.closest(".fork");
  fork.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b === tab ? "true" : "false"));
  let el = fork.nextElementSibling;
  while (el && el.classList.contains("branch")){ el.hidden = el.dataset.branch !== tab.dataset.branch; el = el.nextElementSibling; }
});

/* cast in hero + troupe travelling along the reel */
$("#cast").innerHTML = CAST.map(n => `<figure><img src="${AVATAR[n]}" alt=""><figcaption>${n}</figcaption></figure>`).join("");
$("#troupe").innerHTML = `<div class="bubble" id="bubble"></div>` +
  CAST.map((n,i) => `<div class="mate" style="--i:${i}"><img src="${AVATAR[n]}" alt=""><span>${n}</span></div>`).join("");
let troupeAt = null, walkT = null;
function moveTroupe(el){
  if (el === troupeAt || !$("#reel").contains(el)) return;
  troupeAt = el;
  const tr = $("#troupe"), wide = matchMedia("(min-width:960px)").matches;
  const STACK = 3 * 76 + 70; // height of the 4-avatar column on desktop
  let anchor, y;
  if (el.classList.contains("frame")){
    const shot = el.querySelector(".shot");
    const top = el.offsetTop + el.clientTop + shot.offsetTop;
    anchor = wide ? top + shot.offsetHeight / 2 : top + 10;
  } else {
    anchor = wide ? el.offsetTop + el.offsetHeight / 2 : el.offsetTop + (el.classList.contains("pass") ? -24 : 20);
  }
  y = wide ? anchor - STACK / 2 : anchor;
  tr.style.setProperty("--y", y + "px");
  const b = $("#bubble"), t = (el.querySelector(".ttl,h3,h2")||{}).textContent || "";
  b.style.setProperty("--y", (y - 30) + "px");
  const mood = /nghỉ ngơi sớm/i.test(t) ? "Zzz…" : /bay|sân bay/i.test(t) ? "Lên đường!" : /ăn|lẩu|bánh|xôi|cơm|gà|nướng|sữa/i.test(t) ? "Đói rồi!" : /mây|hoàng hôn|đồi/i.test(t) ? "Đẹp quá!" : "";
  b.textContent = mood; b.classList.toggle("show", !!mood);
  tr.classList.add("on");
  tr.classList.remove("walk"); void tr.offsetWidth; tr.classList.add("walk");
}
addEventListener("resize", () => { const el = troupeAt; troupeAt = null; if (el) moveTroupe(el); });

/* projector focus: the frame in the gate lights up */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let litEl = null, ticking = false;
function pickShot(){
  ticking = false;
  const mid = innerHeight / 2;
  let best = null, bd = Infinity;
  document.querySelectorAll(".frame,.pass,.card").forEach(el => {
    if (el.offsetParent === null) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const d = mid >= r.top && mid <= r.bottom ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (d < bd || (d === bd && el.classList.contains("frame"))){ bd = d; best = el; }
  });
  if (!best){ $("#troupe").classList.remove("on"); return; }
  if (best === litEl) return;
  if (litEl) litEl.classList.remove("lit");
  litEl = best; best.classList.add("lit");
  moveTroupe(best);
  const day = best.dataset.day;
  document.querySelectorAll("#days a").forEach(a => {
    const on = a.dataset.day === day;
    a.classList.toggle("on", on);
    if (on){ const nav = $("#days"); nav.scrollTo({left: a.offsetLeft - nav.offsetLeft - 8, behavior:"smooth"}); }
  });
  $("#tc").textContent = `Ngày ${day} · ${best.dataset.t}`;
}
addEventListener("scroll", () => { if (!ticking){ ticking = true; requestAnimationFrame(pickShot); } }, {passive:true});
document.addEventListener("click", e => { if (e.target.closest(".tabs button")) setTimeout(() => { litEl = null; troupeAt = null; pickShot(); }, 30); });
pickShot();

/* credits roll when visible */
new IntersectionObserver(([en]) => $("#credits").classList.toggle("run", en.isIntersecting), {threshold:.2}).observe($("#credits"));

/* opening: the title fades in on load */
requestAnimationFrame(() => document.body.classList.add("rolling"));

/* music: unlocked by the first click, starts on scroll or "Tự chiếu" */

const music = $("#music");
let musicWanted = true, musicStarted = false, primed = false, fadeRaf = null;
function primeMusic(){
  if (primed) return; primed = true;
  music.src = MUSIC_SRC; music.volume = 0;
  const p = music.play();
  if (p) p.then(() => { if (!musicStarted) music.pause(); }).catch(() => {});
}
function fadeTo(target, ms, then){
  cancelAnimationFrame(fadeRaf);
  const from = music.volume, t0 = performance.now();
  (function f(now){
    const k = Math.min(1, (now - t0) / ms);
    try { music.volume = from + (target - from) * k; } catch(e){}
    if (k < 1) fadeRaf = requestAnimationFrame(f); else if (then) then();
  })(t0);
}
function paintSound(){
  const s = $("#sound"), playing = musicStarted && !music.paused && musicWanted;
  s.classList.toggle("on", playing);
  s.classList.toggle("muted", !musicWanted);
  s.setAttribute("aria-pressed", playing);
}
function startMusic(){
  if (document.body.classList.contains("view-cost")) return;
  if (!musicWanted || (musicStarted && !music.paused)) return;
  if (!primed) primeMusic();
  musicStarted = true;
  music.volume = 0;
  const p = music.play();
  if (p) p.then(() => { pendingMusic = false; fadeTo(0.75, 1800); paintSound(); })
          .catch(() => { musicStarted = false; pendingMusic = true; paintSound(); });
  paintSound();
}
// browsers only allow sound after a click, tap or key press: if scrolling was too early, start on the first one
let pendingMusic = false;
["pointerdown","keydown","touchend"].forEach(ev => addEventListener(ev, e => {
  if (e.target.closest && e.target.closest("#sound")) return;
  if (!primed) primeMusic();
  if (pendingMusic) startMusic();
}, {passive:true}));
$("#sound").onclick = () => {
  if (!primed) primeMusic();
  musicWanted = !musicWanted || music.paused;
  if (musicWanted) startMusic();
  else fadeTo(0, 500, () => { music.pause(); paintSound(); });
  paintSound();
};
music.addEventListener("pause", paintSound);
music.addEventListener("play", paintSound);
addEventListener("wheel", startMusic, {passive:true});
addEventListener("scroll", () => { if (scrollY > 40 && !raf) startMusic(); }, {passive:true});
let wasPlaying = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden){ wasPlaying = !music.paused; music.pause(); }
  else if (wasPlaying && musicWanted) music.play().catch(() => {});
});

/* auto-play: the reel drifts continuously to the end */
let raf = null, last = 0, pos = 0, vel = 0, speedIdx = 0;
const SPEEDS = [2, 3, 4, 8];
function setPlaying(on){
  $("#play").setAttribute("aria-pressed", on);
  $("#playLbl").textContent = on ? "Tạm dừng" : "Tự chiếu";
  $("#playIcon").setAttribute("d", on ? "M3 1.5h3v11H3zM8 1.5h3v11H8z" : "M3 1.5v11l9-5.5z");
  $("#speed").hidden = !on;
}
function stop(){ if (raf){ cancelAnimationFrame(raf); raf = null; } setPlaying(false); }
function targetSpeed(){
  // base ~ 65px/s; slow down while a photo sits in the projector gate
  let v = innerWidth < 640 ? 65 : 80;
  if ($("#reel").getBoundingClientRect().top > innerHeight * 0.45) return v * 4 * SPEEDS[speedIdx]; // glide past the title
  if (litEl && litEl.classList.contains("frame")){
    const shot = litEl.querySelector(".shot").getBoundingClientRect();
    const d = Math.abs(shot.top + shot.height / 2 - innerHeight / 2);
    if (d < shot.height * 0.35) v *= 0.45;
  } else if (litEl && litEl.classList.contains("card")) v *= 0.6;
  return v * SPEEDS[speedIdx];
}
function tick(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  vel += (targetSpeed() - vel) * Math.min(1, dt * 2.5);   // ease in/out between speeds
  pos += vel * dt;
  const max = document.documentElement.scrollHeight - innerHeight;
  if (pos >= max){ scrollTo({top:max, behavior:"instant"}); stop(); return; }
  scrollTo({top:pos, behavior:"instant"});
  raf = requestAnimationFrame(tick);
}
function play(){
  const max = document.documentElement.scrollHeight - innerHeight;
  if (scrollY >= max - 4) scrollTo({top:0, behavior:"instant"});
  pos = scrollY; vel = 0; last = performance.now();
  setPlaying(true);
  raf = requestAnimationFrame(tick);
}
$("#play").onclick = () => { if (raf) stop(); else { startMusic(); play(); } };
$("#speed").onclick = () => {
  speedIdx = (speedIdx + 1) % SPEEDS.length;
  $("#speed").textContent = SPEEDS[speedIdx].toString().replace(".", ",") + "×";
};
// the viewer takes over: pause
["wheel","touchmove"].forEach(ev => addEventListener(ev, () => { if (raf) stop(); }, {passive:true}));
addEventListener("keydown", e => {
  if (e.key === " " && e.target === document.body && !document.body.classList.contains("view-cost")){ e.preventDefault(); if (raf) stop(); else { startMusic(); play(); } return; }
  if (raf && ["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"].includes(e.key)) stop();
});
document.addEventListener("click", e => { if (raf && e.target.closest("#days a")) stop(); });
document.addEventListener("visibilitychange", () => { if (document.hidden && raf) stop(); });
$("#again").onclick = () => { stop(); scrollTo({top:0, behavior: reduce ? "auto" : "smooth"}); };

/* ===== Ảnh: tải dần khi cuộn tới gần ===== */
const nearIO = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const m = e.target.querySelector("img.main");
  if (m.dataset.src && !m.getAttribute("src")) m.src = m.dataset.src;
  nearIO.unobserve(e.target);
}), {rootMargin:"150% 0px"});
document.querySelectorAll(".frame").forEach(f => {
  const id = f.dataset.id, src = PHOTO[id];
  const main = f.querySelector("img.main"), bg = f.querySelector("img.bg"), empty = f.querySelector(".empty");
  if (!src) return;
  main.dataset.src = src;
  bg.src = PHOTO_BG[id] || src;
  if (!PHOTO_BG[id]) bg.style.filter = "blur(22px) brightness(.55)";
  main.hidden = bg.hidden = false; empty.hidden = true;
  nearIO.observe(f);
});
