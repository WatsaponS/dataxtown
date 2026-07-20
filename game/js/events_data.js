// ของแต่งห้องตามฤดูกาล/เทศกาล — ซื้อได้ในร้านค้าเฉพาะช่วงที่อีเวนต์ active เท่านั้น
// (ของที่ซื้อไปแล้วยังใช้ได้ตลอดแม้อีเวนต์จบ เหมือน login/กาชา — active แค่คุมว่า "ซื้อเพิ่มได้ไหม")
//
// ตอนนี้มีชุดเดียว (พิสูจน์ระบบ) — จะเพิ่มอีเวนต์ใหม่ในอนาคต ให้เปลี่ยนมาใช้ EVENTS แบบ array
// (คล้าย ACHIEVEMENTS/TEAMS) แทนค่าคงที่แบบเดี่ยวนี้ พร้อมโหลด sheet แยกตาม event id

export const EVENT_ID = "rainy2026";
export const EVENT_NAME = "หน้าฝน DataX";
export const EVENT_START = "2026-07-01";
export const EVENT_END = "2026-08-15";
export const EVENT_SHEET_COLS = 4;

// ลำดับต้องตรงกับ assets/build_event_items.py (4 คอลัมน์ x 2 แถว)
export const EVENT_ITEMS = [
  { id: "event0", name: "ร่มลายทาง", price: 40 },
  { id: "event1", name: "รองเท้าบูทยาง", price: 35 },
  { id: "event2", name: "เสื่อกันน้ำ", price: 45 },
  { id: "event3", name: "กบยางของเล่น", price: 30 },
  { id: "event4", name: "ชุดกันฝนแขวน", price: 40 },
  { id: "event5", name: "ถังเก็บน้ำฝนจิ๋ว", price: 55 },
  { id: "event6", name: "ร่มกางตากแดด-ฝน", price: 60 },
  { id: "event7", name: "ผ้าเช็ดเท้าลายเมฆฝน", price: 25 },
];

// ?debugDate=2026-07-10 บังคับ "วันนี้" สำหรับทดสอบ active/inactive โดยไม่ต้องรอวันจริง
// (เหมือน ?autostart=1 ที่ main.js ใช้อยู่แล้วสำหรับ headless test)
export function isEventActive(now) {
  if (!now) {
    const override = new URLSearchParams(location.search).get("debugDate");
    now = override ? new Date(override) : new Date();
  }
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return today >= EVENT_START && today <= EVENT_END;
}

export function eventItemName(id) {
  const it = EVENT_ITEMS.find(x => x.id === id);
  return it ? it.name : id;
}
