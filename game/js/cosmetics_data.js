// แคตตาล็อกเครื่องแต่งกาย — หมวก/เสื้อคลุม/กางเกง-กระโปรง/ปีก ใส่ทับตัวละครได้ทีละ 1 ชิ้น/ช่อง
// ที่มา: pixel-art/cosmetics-sample ผ่าน build_cosmetics.py -> assets/cosmetics.png (แถวละ 1 ไอเทม)
// ลำดับ id ต้องตรงกับ ITEMS ใน build_cosmetics.py (กำหนด row บน cosmetics.png)
export const SLOTS = ["hat", "shirt", "bottom", "wings"];

export const SLOT_LABEL = {
  hat: "หมวก", shirt: "เสื้อคลุม", bottom: "กางเกง/กระโปรง", wings: "ปีก",
};

export const COSMETICS = [
  { id: "hat_arcane_stargazer",  category: "hat",    name: "หมวกจอมเวทย์",        emoji: "🎩" },
  { id: "hat_neon_ronin",        category: "hat",    name: "หมวกนีออนโรนิน",       emoji: "🎩" },
  { id: "shirt_dragon_knight",   category: "shirt",  name: "เกราะอัศวินมังกร",     emoji: "🧥" },
  { id: "shirt_street_phantom",  category: "shirt",  name: "แจ็คเก็ตแฟนธอม",       emoji: "🧥" },
  { id: "pants_rune_ranger",     category: "bottom", name: "กางเกงจอมเวทย์รูน",    emoji: "👖" },
  { id: "pants_cyber_cargo",     category: "bottom", name: "กางเกงคาร์โก้ไซเบอร์", emoji: "👖" },
  { id: "skirt_celestial_mage",  category: "bottom", name: "กระโปรงนางฟ้าสวรรค์",  emoji: "👗" },
  { id: "skirt_gothic_battle",   category: "bottom", name: "กระโปรงนักรบกอธิค",    emoji: "👗" },
  { id: "wings_crystal_seraph",  category: "wings",  name: "ปีกเทวราชคริสตัล",     emoji: "🦋" },
  { id: "wings_mecha_demon",     category: "wings",  name: "ปีกปีศาจเมคา",         emoji: "🦇" },
];

// เท่ากับ CONFIG.frameW/frameH เป๊ะ (ตำแหน่ง/สเกลถูก bake ไว้ในเฟรมนี้แล้วตอน build_cosmetics.py
// วาดทับ (dx,dy) เดียวกับตัวละครได้ตรง ๆ)
export const COSMETIC_FRAME_W = 32;
export const COSMETIC_FRAME_H = 50;

export function cosmeticInfo(id) {
  return COSMETICS.find(c => c.id === id) || null;
}

export function cosmeticsByCategory(category) {
  return COSMETICS.filter(c => c.category === category);
}

export function cosmeticRow(id) {
  return COSMETICS.findIndex(c => c.id === id);
}
