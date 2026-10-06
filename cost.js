/* =========================================================
   TAB CHI PHÍ — quỹ chung 4 người, chi chung chia đều, chi riêng
   Lưu dữ liệu: Google Sheet (EXPENSE_API) → hoặc máy đang mở (chế độ thử)
   ========================================================= */
(() => {
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const PEOPLE = CAST;
const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const catOf = id => CAT[id] || CATEGORIES.find(c => c.name === id) || CAT.khac;
const DAY_OPTS = [{n:0, label:"Trước chuyến", short:"Trước"}].concat(DAYS.map(d => ({n:d.n, label:`Ngày ${d.n} · ${d.date}`, short:`Ngày ${d.n}`})));
const dayLabel = n => (DAY_OPTS.find(o => o.n === n) || DAY_OPTS[0]).label;

/* ---------- tiền ---------- */
function parseMoney(raw){
  let s = String(raw || "").toLowerCase().replace(/\s|đ|₫|vnd|vnđ/g, "");
  if (!s) return 0;
  let m = s.match(/^(\d+)(tr|triệu|trieu|m)(\d{1,3})?$/);            // 1tr5, 2tr, 1tr250
  if (m) return Number(m[1]) * 1e6 + (m[3] ? Number(m[3].padEnd(3, "0")) * 1e3 : 0);
  m = s.match(/^(\d+(?:[.,]\d+)?)(k|nghìn|nghin|ngàn|ngan|tr|triệu|trieu|m)$/);  // 60k, 1.5tr
  if (m){
    const v = Number(m[1].replace(",", "."));
    return Math.round(v * (/^(k|ng)/.test(m[2]) ? 1e3 : 1e6));
  }
  const digits = s.replace(/[.,]/g, "");
  return /^\d+$/.test(digits) ? Number(digits) : NaN;
}
const fmt = n => Math.round(n).toLocaleString("vi-VN") + "đ";
function fmtShort(n){
  n = Math.round(n);
  const a = Math.abs(n), sign = n < 0 ? "−" : "";
  if (a >= 1e6) return sign + (Math.round(a / 1e5) / 10).toString().replace(".", ",") + "tr";
  if (a >= 1e3) return sign + Math.round(a / 1e3) + "k";
  return sign + a + "đ";
}

/* ---------- lưu trữ ---------- */
let state = { expenses: [], contrib: {} };
const contribOf = p => (state.contrib[p] ?? DEFAULT_CONTRIB);

function localStore(){
  const KEY = "dalat-chiphi-v1";
  let data = { expenses: [], contrib: {} };
  try { data = JSON.parse(localStorage.getItem(KEY)) || data; } catch(e){}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch(e){} };
  return {
    kind: "local", needsKey: false,
    init(cb){ cb(data); },
    async upsert(item){ const i = data.expenses.findIndex(x => x.id === item.id); if (i >= 0) data.expenses[i] = item; else data.expenses.push(item); save(); return data; },
    async remove(id){ data.expenses = data.expenses.filter(x => x.id !== id); save(); return data; },
    async setContrib(c){ data.contrib = c; save(); return data; }
  };
}

function claudeStore(db){
  let exp = [], contrib = {}, cb = () => {};
  const push = () => cb({ expenses: exp, contrib });
  return {
    kind: "claude", needsKey: false,
    init(f){
      cb = f;
      db.collection("chiphi").onSnapshot(s => { exp = s.docs.map(d => ({ ...d.data(), id: d.id })); push(); }, () => setSync("err"));
      db.collection("chiphi_cfg").onSnapshot(s => { const d = s.docs.find(x => x.id === "contrib"); contrib = (d && d.data().values) || {}; push(); }, () => {});
    },
    async upsert(item){ const { id, ...rest } = item; await db.collection("chiphi").doc(id).set(rest); },
    async remove(id){ await db.collection("chiphi").doc(id).delete(); },
    async setContrib(c){ await db.collection("chiphi_cfg").doc("contrib").set({ values: c }); }
  };
}

function apiStore(url){
  const KEY = "dalat-chiphi-key";
  let key = ""; try { key = localStorage.getItem(KEY) || ""; } catch(e){}
  let cb = () => {};
  async function post(body){
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...body, key }) });
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || "fail");
    return j;
  }
  async function load(){
    try { const r = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now()); cb(await r.json()); setSync("ok"); }
    catch(e){ setSync("err"); }
  }
  return {
    kind: "api", needsKey: true,
    hasKey: () => !!key,
    async tryKey(k){ const old = key; key = k; try { await post({ action: "check" }); try { localStorage.setItem(KEY, k); } catch(e){} return true; } catch(e){ key = old; return false; } },
    forgetKey(){ key = ""; try { localStorage.removeItem(KEY); } catch(e){} },
    init(f){ cb = f; load(); setInterval(() => { if (!document.hidden && document.body.classList.contains("view-cost")) load(); }, 45000); },
    reload: load,
    async upsert(item){ return post({ action: "upsert", item }); },
    async remove(id){ return post({ action: "delete", id }); },
    async setContrib(c){ return post({ action: "contrib", contrib: c }); }
  };
}

let store = null;
function setSync(s){
  const el = $("#sync"); if (!el) return;
  el.dataset.s = s;
  el.textContent = s === "saving" ? "Đang lưu…" : s === "err" ? "Mất kết nối" : store && store.kind === "local" ? "Chỉ lưu trên máy này" : "Đã đồng bộ";
}
function onData(d){
  state = { expenses: (d.expenses || []).map(normalize), contrib: d.contrib || {} };
  render();
}
function normalize(x){
  const people = Array.isArray(x.people) ? x.people.filter(p => PEOPLE.includes(p)) : PEOPLE.slice();
  return { id: String(x.id), day: Number(x.day) || 0, title: x.title || "", cat: catOf(x.cat).id,
           amount: Number(x.amount) || 0, people: people.length ? people : PEOPLE.slice(),
           status: x.status === "plan" ? "plan" : "done", note: x.note || "", updated: x.updated || 0 };
}
async function write(fn){
  setSync("saving");
  try { const res = await fn(); if (res && res.expenses) onData(res); setSync("ok"); }
  catch(e){ setSync("err"); toast("Không lưu được. Kiểm tra mạng rồi thử lại."); if (store.reload) store.reload(); }
}

/* ---------- tính toán ---------- */
function compute(){
  const per = Object.fromEntries(PEOPLE.map(p => [p, { contrib: contribOf(p), shared: 0, own: 0, plan: 0, byDay: {}, planByDay: {} }]));
  const days = {}, cats = {};
  let spent = 0, plan = 0;
  for (const e of state.expenses){
    const share = e.amount / e.people.length;
    const d = days[e.day] || (days[e.day] = { spent: 0, plan: 0 });
    const c = cats[e.cat] || (cats[e.cat] = { spent: 0, plan: 0 });
    if (e.status === "done"){ spent += e.amount; d.spent += e.amount; c.spent += e.amount; }
    else { plan += e.amount; d.plan += e.amount; c.plan += e.amount; }
    for (const p of e.people){
      const q = per[p];
      if (e.status === "done"){
        if (e.people.length === 1) q.own += share; else q.shared += share;
        q.byDay[e.day] = (q.byDay[e.day] || 0) + share;
      } else {
        q.plan += share;
        q.planByDay[e.day] = (q.planByDay[e.day] || 0) + share;
      }
    }
  }
  const fund = PEOPLE.reduce((s, p) => s + per[p].contrib, 0);
  return { per, days, cats, spent, plan, fund };
}

/* ---------- giao diện ---------- */
let editing = false, dayFilter = "all", statusFilter = "all";
const avatar = (p, cls = "") => `<img class="av ${cls}" src="${AVATAR[p]}" alt="${esc(p)}" title="${esc(p)}">`;

function render(){
  const c = compute();
  renderFund(c); renderPeople(c); renderMatrix(c); renderFilters(c); renderLedger(c); renderCats(c);
  document.body.classList.toggle("cost-editing", editing);
  $("#editToggle").textContent = editing ? "Xong" : "Chỉnh sửa";
  $("#addBtn").hidden = !editing;
}

function renderFund(c){
  const left = c.fund - c.spent, after = left - c.plan;
  const pct = v => c.fund > 0 ? Math.max(0, Math.min(100, v / c.fund * 100)) : 0;
  const over = c.spent + c.plan > c.fund;
  $("#fund").innerHTML = `
    <div class="fund-main">
      <p class="eyebrow">Còn trong quỹ</p>
      <p class="big ${left < 0 ? "neg" : ""}">${fmt(left)}</p>
      <p class="of">trên tổng quỹ ${fmt(c.fund)} · ${PEOPLE.length} người</p>
    </div>
    <div class="stack" role="img" aria-label="Đã chi ${fmt(c.spent)}, dự kiến ${fmt(c.plan)}, tổng quỹ ${fmt(c.fund)}">
      <span class="s-done" style="width:${pct(c.spent)}%"></span><span class="s-plan" style="width:${pct(Math.min(c.plan, Math.max(0, c.fund - c.spent)))}%"></span>
    </div>
    <div class="fund-legend">
      <div><i class="k-done"></i><span>Đã chi</span><b>${fmt(c.spent)}</b></div>
      <div><i class="k-plan"></i><span>Dự kiến sẽ chi</span><b>${fmt(c.plan)}</b></div>
      <div><i class="k-free"></i><span>${after < 0 ? "Thiếu nếu chi hết dự kiến" : "Dư nếu chi hết dự kiến"}</span><b class="${after < 0 ? "neg" : ""}">${fmt(Math.abs(after))}</b></div>
    </div>
    ${over ? `<p class="warn">Tổng chi đã và sẽ chi vượt quỹ ${fmt(c.spent + c.plan - c.fund)}.</p>` : ""}
    <div class="setall edit-only">
      <label for="setAll">Mỗi người góp</label>
      <input id="setAll" inputmode="decimal" placeholder="${fmtShort(DEFAULT_CONTRIB)}">
      <button class="btn small" id="setAllBtn">Áp dụng cho cả ${PEOPLE.length}</button>
    </div>`;
}

function renderPeople(c){
  $("#people").innerHTML = PEOPLE.map(p => {
    const q = c.per[p], used = q.shared + q.own, left = q.contrib - used, after = left - q.plan;
    const w = v => q.contrib > 0 ? Math.max(0, Math.min(100, v / q.contrib * 100)) : 0;
    return `<article class="pcard">
      <header>${avatar(p, "lg")}<div><h4>${esc(p)}</h4><p class="${left < 0 ? "neg" : ""}">${left < 0 ? "Cần góp thêm " + fmt(-left) : "Còn " + fmt(left)}</p></div></header>
      <div class="pbar"><span class="s-done" style="width:${w(used)}%"></span><span class="s-plan" style="width:${w(Math.min(q.plan, Math.max(0, left)))}%"></span></div>
      <dl>
        <div><dt>Đã góp</dt><dd>
          <span class="view-only">${fmt(q.contrib)}</span>
          <input class="edit-only contrib" data-p="${esc(p)}" inputmode="decimal" value="${q.contrib.toLocaleString("vi-VN")}" aria-label="Số tiền ${esc(p)} góp">
        </dd></div>
        <div><dt>Chi chung</dt><dd>${fmt(q.shared)}</dd></div>
        <div><dt>Chi riêng</dt><dd>${fmt(q.own)}</dd></div>
        <div class="muted"><dt>Dự kiến thêm</dt><dd>${fmt(q.plan)}</dd></div>
        <div class="tot"><dt>${after < 0 ? "Thiếu sau dự kiến" : "Dư sau dự kiến"}</dt><dd class="${after < 0 ? "neg" : ""}">${fmt(Math.abs(after))}</dd></div>
      </dl>
    </article>`;
  }).join("");
}

function renderMatrix(c){
  const rows = DAY_OPTS.filter(o => o.n > 0 || c.days[0]);
  const cell = (v, pv) => `${v ? `<b>${fmtShort(v)}</b>` : `<span class="zero">—</span>`}${pv ? `<small>+${fmtShort(pv)} dự kiến</small>` : ""}`;
  $("#matrix").innerHTML = `
    <thead><tr><th scope="col">Ngày</th>${PEOPLE.map(p => `<th scope="col">${avatar(p, "sm")}<span>${esc(p)}</span></th>`).join("")}<th scope="col" class="grp">Cả nhóm</th></tr></thead>
    <tbody>${rows.map(o => `<tr><th scope="row">${o.short}<small>${o.n ? DAYS[o.n - 1].date : "đặt trước"}</small></th>
      ${PEOPLE.map(p => `<td>${cell(c.per[p].byDay[o.n] || 0, c.per[p].planByDay[o.n] || 0)}</td>`).join("")}
      <td class="grp">${cell((c.days[o.n] || {}).spent || 0, (c.days[o.n] || {}).plan || 0)}</td></tr>`).join("")}</tbody>
    <tfoot><tr><th scope="row">Tổng</th>${PEOPLE.map(p => { const q = c.per[p]; return `<td>${cell(q.shared + q.own, q.plan)}</td>`; }).join("")}<td class="grp">${cell(c.spent, c.plan)}</td></tr></tfoot>`;
}

function renderFilters(c){
  const dayBtns = [{k:"all", t:"Tất cả"}].concat(DAY_OPTS.map(o => ({k:String(o.n), t:o.short})));
  $("#filters").innerHTML = `
    <div class="fchips">${dayBtns.map(b => `<button data-day="${b.k}" aria-pressed="${dayFilter === b.k}">${b.t}</button>`).join("")}</div>
    <div class="fchips">${[["all","Tất cả"],["done","Đã chi"],["plan","Dự kiến"]].map(([k,t]) => `<button data-st="${k}" aria-pressed="${statusFilter === k}">${t}</button>`).join("")}</div>`;
}

function renderLedger(c){
  const list = state.expenses
    .filter(e => (dayFilter === "all" || String(e.day) === dayFilter) && (statusFilter === "all" || e.status === statusFilter))
    .sort((a, b) => a.day - b.day || (a.status === b.status ? 0 : a.status === "done" ? -1 : 1) || (a.updated || 0) - (b.updated || 0));
  if (!state.expenses.length){
    $("#ledger").innerHTML = `<div class="empty-ledger"><p>Chưa có khoản chi nào.</p><p class="sub">${editing ? "Bấm “Thêm khoản chi” để bắt đầu." : "Bấm “Chỉnh sửa” để thêm khoản chi đầu tiên."}</p></div>`;
    return;
  }
  if (!list.length){ $("#ledger").innerHTML = `<div class="empty-ledger"><p>Không có khoản nào khớp bộ lọc.</p></div>`; return; }
  const groups = {};
  list.forEach(e => (groups[e.day] = groups[e.day] || []).push(e));
  $("#ledger").innerHTML = Object.keys(groups).sort((a, b) => a - b).map(d => {
    const tot = c.days[d] || { spent: 0, plan: 0 };
    return `<section class="lday">
      <header><h4>${dayLabel(Number(d))}</h4><p>Đã chi <b>${fmt(tot.spent)}</b>${tot.plan ? ` · dự kiến <b>${fmt(tot.plan)}</b>` : ""}</p></header>
      <ul>${groups[d].map(e => {
        const k = catOf(e.cat), all = e.people.length === PEOPLE.length, one = e.people.length === 1;
        return `<li class="item ${e.status}" data-id="${esc(e.id)}" style="--cat:${k.color}">
          <span class="dot" aria-hidden="true"></span>
          <div class="body">
            <p class="ttl">${esc(e.title)}${e.status === "plan" ? ` <span class="tag">Dự kiến</span>` : ""}${one ? ` <span class="tag own">Riêng</span>` : ""}</p>
            <p class="meta"><span class="cat">${k.name}</span><span class="who">${e.people.map(p => avatar(p, "xs")).join("")}</span><span>${all ? "Cả nhóm" : one ? esc(e.people[0]) : e.people.length + " người"}</span></p>
            ${e.note ? `<p class="note">${esc(e.note)}</p>` : ""}
          </div>
          <div class="amt"><b>${fmt(e.amount)}</b>${e.people.length > 1 ? `<small>${fmtShort(e.amount / e.people.length)}/người</small>` : ""}</div>
          <div class="row-act edit-only">
            ${e.status === "plan" ? `<button class="btn small" data-act="done">Đã chi</button>` : ""}
            <button class="btn small ghost" data-act="edit">Sửa</button>
          </div>
        </li>`;
      }).join("")}</ul>
    </section>`;
  }).join("");
}

function renderCats(c){
  const rows = CATEGORIES.map(k => ({ k, v: c.cats[k.id] || { spent: 0, plan: 0 } })).filter(r => r.v.spent || r.v.plan);
  if (!rows.length){ $("#cats").innerHTML = `<p class="sub">Biểu đồ hiện khi có khoản chi.</p>`; return; }
  const max = Math.max(...rows.map(r => r.v.spent + r.v.plan));
  const all = c.spent + c.plan;
  $("#cats").innerHTML = rows.sort((a, b) => (b.v.spent + b.v.plan) - (a.v.spent + a.v.plan)).map(r => `
    <div class="crow" style="--cat:${r.k.color}">
      <span class="cname">${r.k.name}</span>
      <div class="cbar"><span class="s-done" style="width:${r.v.spent / max * 100}%"></span><span class="s-plan" style="width:${r.v.plan / max * 100}%"></span></div>
      <span class="cval"><b>${fmt(r.v.spent + r.v.plan)}</b><small>${Math.round((r.v.spent + r.v.plan) / all * 100)}%</small></span>
    </div>`).join("");
}

/* ---------- biểu mẫu thêm / sửa ---------- */
let draft = null;
function guessCat(t){
  t = t.toLowerCase();
  if (/vé máy bay|xe|taxi|grab|xăng|gửi xe|bay/.test(t)) return "di";
  if (/villa|homestay|khách sạn|phòng/.test(t)) return "o";
  if (/quà|chợ|mua/.test(t)) return "mua";
  if (/vé|đồi|dinh|làng|đêm nhạc|nhà thờ|cung|quảng trường|hầm|chủng viện/.test(t)) return "choi";
  if (/ăn|lẩu|bánh|xôi|cơm|gà|nướng|sữa|cafe|cà phê|phở|tiệm|quán/.test(t)) return "an";
  return null;
}
function openSheet(item){
  draft = item ? { ...item, people: item.people.slice(), mode: "total", input: String(item.amount) }
               : { id: "", day: dayFilter !== "all" ? Number(dayFilter) : 1, title: "", cat: "an", amount: 0, people: PEOPLE.slice(), status: "done", note: "", mode: "each", input: "" };
  $("#sheetTitle").textContent = item ? "Sửa khoản chi" : "Thêm khoản chi";
  $("#fTitle").value = draft.title;
  $("#fAmount").value = item ? item.amount.toLocaleString("vi-VN") : "";
  $("#fNote").value = draft.note;
  $("#fDelete").hidden = !item;
  paintSheet();
  const dlg = $("#sheet");
  if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  setTimeout(() => $("#fTitle").focus(), 50);
}
function closeSheet(){ const d = $("#sheet"); if (d.close) d.close(); else d.removeAttribute("open"); }
function paintSheet(){
  $("#fDay").innerHTML = DAY_OPTS.map(o => `<button data-day="${o.n}" aria-pressed="${draft.day === o.n}">${o.short}</button>`).join("");
  const sugs = draft.day === 0 ? PRE_TRIP_SUGGESTIONS : DAYS[draft.day - 1].stops.concat(DAYS[draft.day - 1].fork ? DAYS[draft.day - 1].fork.a.stops.concat(DAYS[draft.day - 1].fork.b.stops) : []).filter(s => !s.pass).map(s => s.title);
  $("#fSugs").innerHTML = sugs.map(t => `<button data-sug="${esc(t)}">${esc(t)}</button>`).join("");
  $("#fCat").innerHTML = CATEGORIES.map(k => `<button data-cat="${k.id}" aria-pressed="${draft.cat === k.id}" style="--cat:${k.color}"><i></i>${k.name}</button>`).join("");
  $("#fMode").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === draft.mode));
  $("#fWho").innerHTML = PEOPLE.map(p => `<button data-p="${esc(p)}" aria-pressed="${draft.people.includes(p)}">${avatar(p)}<span>${esc(p)}</span></button>`).join("") +
    `<button class="allbtn" data-all="1">Cả nhóm</button>`;
  $("#fStatus").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.s === draft.status));
  preview();
}
function preview(){
  const v = parseMoney($("#fAmount").value), n = draft.people.length, el = $("#fPreview");
  if (!$("#fAmount").value){ el.textContent = ""; el.className = "preview"; return; }
  if (isNaN(v) || v <= 0){ el.textContent = "Chưa hiểu số tiền. Thử dạng 60k, 1tr5 hoặc 250000."; el.className = "preview bad"; return; }
  const total = draft.mode === "each" ? v * n : v, each = total / n;
  el.className = "preview";
  el.innerHTML = n === 1 ? `Chi riêng của <b>${esc(draft.people[0])}</b>: <b>${fmt(total)}</b>`
    : `Tổng <b>${fmt(total)}</b> · chia đều ${n} người, mỗi người <b>${fmt(each)}</b>`;
}
async function saveDraft(){
  const title = $("#fTitle").value.trim();
  const v = parseMoney($("#fAmount").value);
  if (!title){ $("#fTitle").focus(); toast("Nhập tên khoản chi."); return; }
  if (isNaN(v) || v <= 0){ $("#fAmount").focus(); toast("Nhập số tiền hợp lệ."); return; }
  const total = draft.mode === "each" ? v * draft.people.length : v;
  const item = { id: draft.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6)), day: draft.day, title, cat: draft.cat,
                 amount: Math.round(total), people: draft.people.slice(), status: draft.status, note: $("#fNote").value.trim(), updated: Date.now() };
  closeSheet();
  optimistic(xs => { const i = xs.findIndex(x => x.id === item.id); if (i >= 0) xs[i] = item; else xs.push(item); });
  await write(() => store.upsert(item));
}
function optimistic(fn){ fn(state.expenses); render(); }

/* ---------- sự kiện ---------- */
function bind(){
  $("#editToggle").onclick = async () => {
    if (!editing && store.needsKey && !store.hasKey()){
      const k = prompt("Nhập mã chỉnh sửa (đặt trong Google Apps Script):");
      if (!k) return;
      setSync("saving");
      const ok = await store.tryKey(k.trim());
      setSync(ok ? "ok" : "err");
      if (!ok){ toast("Mã không đúng hoặc chưa kết nối được Google Sheet."); return; }
    }
    editing = !editing; render();
  };
  $("#addBtn").onclick = () => openSheet(null);
  $("#cost").addEventListener("click", async e => {
    const f = e.target.closest("[data-day],[data-st]");
    if (f && f.closest("#filters")){ if (f.dataset.day) dayFilter = f.dataset.day; else statusFilter = f.dataset.st; render(); return; }
    if (e.target.id === "setAllBtn"){
      const v = parseMoney($("#setAll").value);
      if (isNaN(v) || v <= 0){ toast("Nhập số tiền góp, ví dụ 2tr."); return; }
      const c = Object.fromEntries(PEOPLE.map(p => [p, v]));
      state.contrib = c; render(); await write(() => store.setContrib(c)); return;
    }
    const act = e.target.closest("[data-act]");
    if (act){
      const it = state.expenses.find(x => x.id === act.closest(".item").dataset.id);
      if (!it) return;
      if (act.dataset.act === "edit") openSheet(it);
      if (act.dataset.act === "done"){ const n = { ...it, status: "done", updated: Date.now() }; optimistic(xs => { xs[xs.indexOf(it)] = n; }); await write(() => store.upsert(n)); }
    }
  });
  $("#cost").addEventListener("change", async e => {
    if (!e.target.classList.contains("contrib")) return;
    const v = parseMoney(e.target.value);
    if (isNaN(v) || v < 0){ toast("Số tiền góp không hợp lệ."); render(); return; }
    const c = Object.fromEntries(PEOPLE.map(p => [p, contribOf(p)]));
    c[e.target.dataset.p] = v; state.contrib = c; render();
    await write(() => store.setContrib(c));
  });
  const sheet = $("#sheet");
  sheet.addEventListener("click", async e => {
    if (e.target === sheet || e.target.closest("[data-close]")){ closeSheet(); return; }
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.day !== undefined && b.closest("#fDay")){ draft.day = Number(b.dataset.day); paintSheet(); }
    else if (b.dataset.sug){ $("#fTitle").value = b.dataset.sug; const g = guessCat(b.dataset.sug); if (g) draft.cat = g; paintSheet(); $("#fAmount").focus(); }
    else if (b.dataset.cat){ draft.cat = b.dataset.cat; paintSheet(); }
    else if (b.dataset.mode){ draft.mode = b.dataset.mode; paintSheet(); }
    else if (b.dataset.all){ draft.people = PEOPLE.slice(); paintSheet(); }
    else if (b.dataset.p){
      const p = b.dataset.p, has = draft.people.includes(p);
      if (has && draft.people.length === 1) return;
      draft.people = has ? draft.people.filter(x => x !== p) : PEOPLE.filter(x => x === p || draft.people.includes(x));
      paintSheet();
    }
    else if (b.dataset.s){ draft.status = b.dataset.s; paintSheet(); }
    else if (b.id === "fSave") saveDraft();
    else if (b.id === "fDelete"){
      if (!confirm(`Xoá khoản “${draft.title}”?`)) return;
      const id = draft.id; closeSheet();
      optimistic(xs => { const i = xs.findIndex(x => x.id === id); if (i >= 0) xs.splice(i, 1); });
      await write(() => store.remove(id));
    }
  });
  $("#fAmount").addEventListener("input", preview);
  $("#fTitle").addEventListener("change", () => { if (!draft.id){ const g = guessCat($("#fTitle").value); if (g){ draft.cat = g; paintSheet(); } } });
  sheet.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.tagName === "INPUT"){ e.preventDefault(); saveDraft(); } });
}

/* ---------- chuyển tab ---------- */
function setView(v, push){
  const cost = v === "cost";
  document.body.classList.toggle("view-cost", cost);
  $("#cost").hidden = !cost;
  document.querySelectorAll(".views button").forEach(b => b.setAttribute("aria-selected", b.dataset.view === v));
  if (cost){ if (typeof stop === "function") stop(); $("#troupe") && $("#troupe").classList.remove("on"); scrollTo({ top: 0, behavior: "instant" }); if (store && store.reload) store.reload(); }
  else { scrollTo({ top: 0, behavior: "instant" }); }
  if (push) history.replaceState(null, "", cost ? "#chi-phi" : location.pathname + location.search);
}
document.querySelectorAll(".views button").forEach(b => b.addEventListener("click", () => setView(b.dataset.view, true)));
addEventListener("hashchange", () => { if (location.hash === "#chi-phi") setView("cost"); });

let toastT;
function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3200); }

/* ---------- khởi động ---------- */
(async () => {
  bind();
  const c = window.claude;
  let db = null;
  if (c && typeof c.use === "function"){ try { db = await c.use("db"); } catch(e){} }
  store = db ? claudeStore(db) : EXPENSE_API ? apiStore(EXPENSE_API) : localStore();
  if (store.kind === "local"){
    const n = $("#costNotice"); n.hidden = false;
    n.innerHTML = `<b>Chế độ thử.</b> Dữ liệu chỉ lưu trên trình duyệt này, người khác chưa xem được. Kết nối Google Sheet theo hướng dẫn trong <code>apps-script/HUONG-DAN.md</code> để cả nhóm cùng xem.`;
  }
  setSync("ok");
  render();
  store.init(onData);
  if (location.hash === "#chi-phi") setView("cost");
})();
})();
