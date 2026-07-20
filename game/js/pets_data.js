// แคตตาล็อกสัตว์เลี้ยง — ลำดับต้องตรงแถวใน assets/pets.png (build_pets.py)
// PETS = 15 ชนิดพื้นฐาน เลือกได้ตั้งแต่หน้าสร้างตัวละคร
export const PETS = [
  { id: "dog",      name: "หมา",       emoji: "🐶" },
  { id: "cat",      name: "แมว",       emoji: "🐱" },
  { id: "bird",     name: "นก",        emoji: "🐦" },
  { id: "mouse",    name: "หนู",       emoji: "🐭" },
  { id: "snake",    name: "งู",        emoji: "🐍" },
  { id: "rabbit",   name: "กระต่าย",   emoji: "🐰" },
  { id: "turtle",   name: "เต่า",      emoji: "🐢" },
  { id: "duck",     name: "เป็ด",      emoji: "🦆" },
  { id: "pig",      name: "หมูจิ๋ว",   emoji: "🐷" },
  { id: "penguin",  name: "เพนกวิน",   emoji: "🐧" },
  { id: "frog",     name: "กบ",        emoji: "🐸" },
  { id: "chicken",  name: "ไก่",       emoji: "🐔" },
  { id: "hedgehog", name: "เม่น",      emoji: "🦔" },
  { id: "fox",      name: "จิ้งจอก",   emoji: "🦊" },
  { id: "dragon",   name: "มังกรจิ๋ว", emoji: "🐲" },
];

// LEGENDARY_PETS = ปลดล็อกจาก Daily Login เท่านั้น (ดู unlockDay ใน login_rewards.js)
export const LEGENDARY_PETS = [
  { id: "unicorn",  name: "ยูนิคอร์นสายรุ้ง",   emoji: "🦄", unlockDay: 10 },
  { id: "phoenix",  name: "ฟีนิกซ์เพลิง",       emoji: "🔥", unlockDay: 20 },
  { id: "guardian", name: "สิงโตทองผู้พิทักษ์", emoji: "🦁", unlockDay: 30 },
];

export const ALL_PETS = [...PETS, ...LEGENDARY_PETS];
export const PET_FRAME = 16;

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

export function isLegendary(id) {
  return LEGENDARY_PETS.some(p => p.id === id);
}
