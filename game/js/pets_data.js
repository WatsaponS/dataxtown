// แคตตาล็อกสัตว์เลี้ยง — 12 นักษัตรจีน + แมว รวม 13 ชนิด เลือกได้ทั้งหมดตั้งแต่หน้าสร้างตัวละคร
// ที่มาสไปรท์: pixel-art/zodiac-pets-economy (เดินจริง 4 ทิศ x 4 เฟรม) ดู build_pets.py
// ลำดับ id ต้องตรงกับ PETS list ใน build_pets.py (กำหนด row บน pets.png)
export const PETS = [
  { id: "rat",     name: "หนูนำโชค",       emoji: "🐀" },
  { id: "ox",      name: "วัวทรัพย์",       emoji: "🐂" },
  { id: "tiger",   name: "เสือมงคล",       emoji: "🐅" },
  { id: "rabbit",  name: "กระต่ายจันทรา",  emoji: "🐇" },
  { id: "dragon",  name: "มังกรหยก",       emoji: "🐉" },
  { id: "snake",   name: "งูมรกต",         emoji: "🐍" },
  { id: "horse",   name: "ม้าวายุ",         emoji: "🐎" },
  { id: "goat",    name: "แพะเมฆา",        emoji: "🐐" },
  { id: "monkey",  name: "ลิงทอง",         emoji: "🐒" },
  { id: "rooster", name: "ไก่อรุณ",        emoji: "🐓" },
  { id: "dog",     name: "สุนัขผู้พิทักษ์", emoji: "🐕" },
  { id: "pig",     name: "หมูออมสิน",      emoji: "🐖" },
  { id: "cat",     name: "แมวกวัก",        emoji: "🐈" },
];

export const ALL_PETS = PETS; // ชื่อเดิมไว้ให้โมดูลอื่น import ไม่ต้องแก้ (ตอนนี้ = PETS ล้วน)

// pets.png: SRC_FRAME px ต่อช่อง (เต็มความละเอียดต้นฉบับ ไม่ถูกย่อ), 4 คอลัมน์ (เฟรมเดิน) x
// (13 สัตว์ x 4 ทิศ) แถว — ดู build_pets.py คนละเรื่องกับ PET_FRAME (ขนาดที่วาดจริงบนจอ,
// ไม่เปลี่ยนจากเดิม) แยกกันเหมือนกับ sourceFrameWidth/displayWidth ในระบบตัวละครความละเอียดสูง —
// ให้ canvas ย่อตอน draw แทนการ bake ไฟล์ย่อไว้ล่วงหน้า ภาพคมกว่าเดิมทั้งที่ขนาดในเกมเท่าเดิม
export const PET_SRC_FRAME = 96;
export const PET_FRAME = 32;
export const PET_DIRS = ["down", "left", "right", "up"];
export const PET_PHASES = 4;

export function petInfo(id) {
  return ALL_PETS.find(p => p.id === id) || null;
}

export function petIndexOf(id) {
  return ALL_PETS.findIndex(p => p.id === id);
}

export function petDisplayName(id) {
  const p = petInfo(id);
  return p ? p.name : id;
}

// แถวบน pets.png สำหรับสัตว์ id หันทิศ dir (คอลัมน์ = เฟรมเดิน 0-3 แยกจัดการเอง)
export function petFrameRow(id, dir) {
  const i = petIndexOf(id);
  if (i < 0) return -1;
  const d = PET_DIRS.indexOf(dir);
  return i * PET_DIRS.length + (d < 0 ? 0 : d);
}

// แถวไอคอนนิ่ง (หันลง เฟรมแรก) ใช้กับตัวเลือกสัตว์เลี้ยงในเมนู/หน้าสร้างตัวละคร
export function petIconRow(id) {
  return petFrameRow(id, "down");
}
