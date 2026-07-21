// แคตตาล็อกไอเทม exclusive จากตู้กาชาปอง 50 ชิ้น — ได้จากการสุ่มเท่านั้น ไม่ซ้ำร้านค้า/login
// ลำดับต้องตรงกับ assets/build_gacha_items.py (5 คอลัมน์ x 10 แถว, index 0-49)
//
// โครง rarity 6 ชั้น (5 ค่าตามที่ตั้งไว้ + ชั้น "ทั่วไป" เติมให้ครบ 100%):
//   mythic 0.5% (1 ชิ้น) → legendary 1% (2) → epic 5% (4) → rare 10% (8)
//   → common 50% (20) → basic 33.5% (15)  รวม = 100%, 50 ชิ้น

export const RARITY = {
  mythic:    { label: "Mythic",    emoji: "💎", color: "#e14fd0", totalRate: 0.5 },
  legendary: { label: "Legendary", emoji: "🌟", color: "#e7b94f", totalRate: 1 },
  epic:      { label: "Epic",      emoji: "🔮", color: "#9867a8", totalRate: 5 },
  rare:      { label: "Rare",      emoji: "💠", color: "#4f8fdd", totalRate: 10 },
  common:    { label: "Common",    emoji: "🍀", color: "#57b06b", totalRate: 50 },
  basic:     { label: "Basic",     emoji: "⚪", color: "#9aa6ad", totalRate: 33.5 },
};

// id ขึ้นต้นด้วย "gacha" ให้ decor.js แยกไปใช้ gacha_items.png ได้ (เหมือน "login" แยกไป items_login.png)
export const GACHA_ITEMS = [
  // ---------- Mythic (1 ชิ้น, รวม 0.5%) ----------
  { id: "gacha00", name: "บัลลังก์เพชร DataX", tier: "mythic" },
  // ---------- Legendary (2 ชิ้น, รวม 1%) ----------
  { id: "gacha01", name: "เปียโนแกรนด์ทองคำ", tier: "legendary" },
  { id: "gacha02", name: "เรือยอทช์จำลองทองคำ", tier: "legendary" },
  // ---------- Epic (4 ชิ้น, รวม 5%) ----------
  { id: "gacha03", name: "รูปปั้นหินอ่อน", tier: "epic" },
  { id: "gacha04", name: "โคมระย้าคริสตัล", tier: "epic" },
  { id: "gacha05", name: "ตู้ไวน์หรู", tier: "epic" },
  { id: "gacha06", name: "นาฬิกาตั้งพื้นโบราณ", tier: "epic" },
  // ---------- Rare (8 ชิ้น, รวม 10%) ----------
  { id: "gacha07", name: "เก้าอี้หนังผู้บริหาร", tier: "rare" },
  { id: "gacha08", name: "ลูกโลกโบราณทองเหลือง", tier: "rare" },
  { id: "gacha09", name: "โคมไฟดีไซเนอร์", tier: "rare" },
  { id: "gacha10", name: "ตู้หนังสือมะฮอกกานี", tier: "rare" },
  { id: "gacha11", name: "พรมเปอร์เซีย", tier: "rare" },
  { id: "gacha12", name: "ตู้เซฟทองคำ", tier: "rare" },
  { id: "gacha13", name: "เตาผิงหินอ่อน", tier: "rare" },
  { id: "gacha14", name: "แจกันลายทอง", tier: "rare" },
  // ---------- Common (20 ชิ้น, รวม 50%) ----------
  { id: "gacha15", name: "ต้นกระบองเพชร", tier: "common" },
  { id: "gacha16", name: "ที่วางปากกาไม้", tier: "common" },
  { id: "gacha17", name: "นาฬิกาปลุกวินเทจ", tier: "common" },
  { id: "gacha18", name: "กระถางดอกทิวลิป", tier: "common" },
  { id: "gacha19", name: "หมอนอิงลายจุด", tier: "common" },
  { id: "gacha20", name: "ตะกร้าผลไม้", tier: "common" },
  { id: "gacha21", name: "กรอบใบประกาศ", tier: "common" },
  { id: "gacha22", name: "เครื่องปิ้งขนมปัง", tier: "common" },
  { id: "gacha23", name: "พัดลมตั้งโต๊ะ", tier: "common" },
  { id: "gacha24", name: "เหรียญรางวัลห้อยคอ", tier: "common" },
  { id: "gacha25", name: "เสื่อโยคะม้วน", tier: "common" },
  { id: "gacha26", name: "ดัมเบลคู่", tier: "common" },
  { id: "gacha27", name: "ไวท์บอร์ดจิ๋ว", tier: "common" },
  { id: "gacha28", name: "ลูกบอลชายหาด", tier: "common" },
  { id: "gacha29", name: "เป้สะพายหลัง", tier: "common" },
  { id: "gacha30", name: "รองเท้าผ้าใบโชว์", tier: "common" },
  { id: "gacha31", name: "แผ่นเสียงไวนิล", tier: "common" },
  { id: "gacha32", name: "ไข่มังกรประดับ", tier: "common" },
  { id: "gacha33", name: "ปฏิทินตั้งโต๊ะ", tier: "common" },
  { id: "gacha34", name: "หุ่นไดโนเสาร์จิ๋ว", tier: "common" },
  // ---------- Basic (15 ชิ้น, รวม 33.5%) ----------
  { id: "gacha35", name: "เทียนหอม", tier: "basic" },
  { id: "gacha36", name: "ต้นไผ่มงคล", tier: "basic" },
  { id: "gacha37", name: "ลูกแก้วมงคล", tier: "basic" },
  { id: "gacha38", name: "กรอบดอกไม้แห้ง", tier: "basic" },
  { id: "gacha39", name: "เกมพกพาเรโทร", tier: "basic" },
  { id: "gacha40", name: "หมวกกันน็อค", tier: "basic" },
  { id: "gacha41", name: "ร่มลายจุด", tier: "basic" },
  { id: "gacha42", name: "ประตูโทริอิจิ๋ว", tier: "basic" },
  { id: "gacha43", name: "แว่นกันแดด", tier: "basic" },
  { id: "gacha44", name: "สมุดโน้ตปกหนัง", tier: "basic" },
  { id: "gacha45", name: "กระบอกน้ำสแตนเลส", tier: "basic" },
  { id: "gacha46", name: "หูฟังเกมมิ่ง", tier: "basic" },
  { id: "gacha47", name: "นกฮูกเซรามิก", tier: "basic" },
  { id: "gacha48", name: "กรวยจราจรจิ๋ว", tier: "basic" },
  { id: "gacha49", name: "ลูกรักบี้จิ๋ว", tier: "basic" },
];

export const GACHA_SHEET_COLS = 5;
export const GACHA_COST = 100;

// tile ~[26.4,23.7] บนแผนที่ COMPACT (tile 24px) — กลางโถงเปิดระหว่างเวิร์คสเตชันตะวันออกกับ
// ห้องประชุม (ขยับเข้ามาจากขอบกำแพงเฉียงทางขวาให้อยู่กลางโถงมากขึ้น)
export const GACHA_X = 634, GACHA_Y = 569;

// จำนวนชิ้นต่อ tier (คำนวณจาก GACHA_ITEMS จริง กันเลขไม่ตรงกันถ้าแก้แคตตาล็อกทีหลัง)
function tierCounts() {
  const counts = {};
  for (const it of GACHA_ITEMS) counts[it.tier] = (counts[it.tier] || 0) + 1;
  return counts;
}
const COUNTS = tierCounts();

// อัตราต่อ "ชิ้น" = อัตรารวมของ tier หารด้วยจำนวนชิ้นใน tier นั้น
function perItemRate(tier) {
  return RARITY[tier].totalRate / COUNTS[tier];
}

// สุ่ม 1 ไอเทมตามน้ำหนัก rarity — คืนทั้ง item และ tier info
export function rollGacha() {
  const weighted = GACHA_ITEMS.map(it => ({ item: it, weight: perItemRate(it.tier) }));
  const total = weighted.reduce((s, w) => s + w.weight, 0); // ควรได้ ~100
  let r = Math.random() * total;
  for (const w of weighted) {
    r -= w.weight;
    if (r <= 0) return w.item;
  }
  return weighted[weighted.length - 1].item;
}

export function gachaItemName(id) {
  const it = GACHA_ITEMS.find(x => x.id === id);
  return it ? it.name : id;
}

export function gachaItemInfo(id) {
  return GACHA_ITEMS.find(x => x.id === id) || null;
}
