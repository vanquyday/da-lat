/**
 * Backend chi phí chuyến Đà Lạt — dán toàn bộ file này vào Apps Script của Google Sheet.
 * Hướng dẫn: xem HUONG-DAN.md cùng thư mục.
 */

// ⚠️ ĐỔI MÃ NÀY. Ai có mã mới được thêm/sửa/xoá khoản chi trên trang web.
const EDIT_KEY = 'doi-ma-nay-di';

const CAST = ['Quý', 'Lệ', 'Long', 'Nhi'];
const DEFAULT_CONTRIB = 2000000;
const SHEET_EXP = 'Chi phí';
const SHEET_GOP = 'Góp quỹ';
const HEAD = ['ID', 'Ngày', 'Khoản chi', 'Hạng mục', 'Số tiền (tổng)', 'Người chia', 'Trạng thái', 'Ghi chú', 'Cập nhật'];
const CATS = { an: 'Ăn uống', di: 'Di chuyển', o: 'Lưu trú', choi: 'Vui chơi', mua: 'Mua sắm', khac: 'Khác' };

/** Chạy 1 lần để tạo 2 trang tính. */
function setup() { expSheet_(); gopSheet_(); }

function doGet() { return json_(readAll_()); }

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, error: 'bad_json' }); }
  if (body.key !== EDIT_KEY) return json_({ ok: false, error: 'wrong_key' });
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (body.action === 'upsert') upsert_(body.item);
    else if (body.action === 'delete') remove_(body.id);
    else if (body.action === 'contrib') setContrib_(body.contrib || {});
    else if (body.action !== 'check') return json_({ ok: false, error: 'unknown_action' });
    return json_(Object.assign({ ok: true }, readAll_()));
  } finally { lock.releaseLock(); }
}

/* ---------- trang tính ---------- */
function expSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_EXP);
  if (!sh) {
    sh = ss.insertSheet(SHEET_EXP);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold');
    sh.getRange('E:E').setNumberFormat('#,##0');
    sh.getRange('I:I').setNumberFormat('dd/MM HH:mm');
    sh.setColumnWidth(3, 240);
  }
  return sh;
}
function gopSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_GOP);
  if (!sh) {
    sh = ss.insertSheet(SHEET_GOP);
    sh.appendRow(['Tên', 'Số tiền góp']);
    sh.getRange(1, 1, 1, 2).setFontWeight('bold');
    CAST.forEach(n => sh.appendRow([n, DEFAULT_CONTRIB]));
    sh.getRange('B:B').setNumberFormat('#,##0');
  }
  return sh;
}

/* ---------- đọc ---------- */
function readAll_() {
  const sh = expSheet_();
  const vals = sh.getDataRange().getValues();
  const expenses = [];
  for (let r = 1; r < vals.length; r++) {
    const v = vals[r];
    if (!v[2] && !v[4]) continue;
    let id = String(v[0] || '').trim();
    if (!id) { id = Utilities.getUuid().slice(0, 8); sh.getRange(r + 1, 1).setValue(id); }
    expenses.push({
      id: id,
      day: dayNum_(v[1]),
      title: String(v[2] || ''),
      cat: catId_(v[3]),
      amount: money_(v[4]),
      people: people_(v[5]),
      status: /dự kiến|du kien|plan/i.test(String(v[6])) ? 'plan' : 'done',
      note: String(v[7] || ''),
      updated: v[8] instanceof Date ? v[8].getTime() : 0
    });
  }
  const contrib = {};
  gopSheet_().getDataRange().getValues().slice(1).forEach(row => {
    const n = String(row[0] || '').trim();
    if (CAST.indexOf(n) >= 0) contrib[n] = money_(row[1]);
  });
  return { expenses: expenses, contrib: contrib };
}

/* ---------- ghi ---------- */
function upsert_(it) {
  if (!it || !it.id) throw new Error('missing item');
  const sh = expSheet_();
  const row = [
    String(it.id),
    Number(it.day) ? 'Ngày ' + Number(it.day) : 'Trước chuyến',
    String(it.title || ''),
    CATS[it.cat] || 'Khác',
    Math.round(Number(it.amount) || 0),
    (it.people || []).length === CAST.length ? 'Cả nhóm' : (it.people || []).join(', '),
    it.status === 'plan' ? 'Dự kiến' : 'Đã chi',
    String(it.note || ''),
    new Date()
  ];
  const r = findRow_(sh, it.id);
  if (r) sh.getRange(r, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
}
function remove_(id) {
  const sh = expSheet_();
  const r = findRow_(sh, id);
  if (r) sh.deleteRow(r);
}
function setContrib_(c) {
  const sh = gopSheet_();
  const vals = sh.getDataRange().getValues();
  CAST.forEach(n => {
    if (c[n] === undefined) return;
    let r = 0;
    for (let i = 1; i < vals.length; i++) if (String(vals[i][0]).trim() === n) { r = i + 1; break; }
    if (r) sh.getRange(r, 2).setValue(Math.round(Number(c[n]) || 0));
    else sh.appendRow([n, Math.round(Number(c[n]) || 0)]);
  });
}

/* ---------- tiện ích ---------- */
function findRow_(sh, id) {
  const ids = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues();
  for (let i = 1; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 1;
  return 0;
}
function dayNum_(v) { const m = String(v).match(/\d/); return m ? Number(m[0]) : 0; }
function catId_(v) {
  const s = String(v || '').trim();
  for (const k in CATS) if (k === s || CATS[k].toLowerCase() === s.toLowerCase()) return k;
  return 'khac';
}
function money_(v) {
  if (typeof v === 'number') return v;
  const s = String(v || '').toLowerCase().replace(/\s|đ|₫|vnd/g, '');
  let m = s.match(/^(\d+(?:[.,]\d+)?)(k|tr|m)$/);
  if (m) return Math.round(Number(m[1].replace(',', '.')) * (m[2] === 'k' ? 1e3 : 1e6));
  return Number(s.replace(/[.,]/g, '')) || 0;
}
function people_(v) {
  const s = String(v || '').trim();
  if (!s || /cả nhóm|ca nhom|tất cả/i.test(s)) return CAST.slice();
  const list = s.split(/[,;+&]/).map(x => x.trim()).filter(x => CAST.indexOf(x) >= 0);
  return list.length ? list : CAST.slice();
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
