// มอนสเตอร์ป่า — ค่าคงที่ของ monsters.png (ดู build_monsters.py) เก็บ hand-synced กับสคริปต์
// build เหมือน pets_data.js/outfit_data.js (monsters.json เป็นแค่เอกสารอ้างอิง ไม่ได้ถูก fetch จริง)
export const MONSTER_FRAME_W = 88;
export const MONSTER_FRAME_H = 128;
export const MONSTER_COLUMNS = 12;
export const MONSTER_COUNT = 120;

// ขนาดที่วาดจริงบนจอ (โผล่มาเป็นของประดับชั่วคราว ไม่ผูกกับ hitbox ใด ๆ)
export const MONSTER_DISPLAY_W = 88;
export const MONSTER_DISPLAY_H = 128;

export function monsterFrameRC(index) {
  return { col: index % MONSTER_COLUMNS, row: Math.floor(index / MONSTER_COLUMNS) };
}
