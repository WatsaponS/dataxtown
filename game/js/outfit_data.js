// แคตตาล็อกชุดคอสตูมแบบเต็มตัว — มาจาก pixel-art/{male,female}-cyber-fantasy-walk-v1
// ผ่าน game/assets/build_outfits.py -> assets/outfits.png (แถวละ 1 ชุด, 16 คอลัมน์ = 4 ทิศ x 4 เฟรมเดิน)
// ต่างจากเครื่องแต่งกายแบบชิ้น ๆ (hat/shirt/wings) รุ่นก่อน — ชุดนี้ครอบทับตัวละครทั้งตัว
// และมี walk-cycle 4 ทิศจริง ไม่ใช่ท่านิ่งท่าเดียว
export const OUTFITS = [
  { id: "male_cyber_fantasy", name: "นักรบไซเบอร์ (ชาย)" },
  { id: "female_cyber_fantasy", name: "นักรบไซเบอร์ (หญิง)" },
];

// ใหญ่กว่าเฟรมตัวละครฐาน (32x50) โดยตั้งใจ — ต้นฉบับสไปรท์ละเอียดกว่าตัวละครฐานมาก ถ้าบีบ
// ลงมาขนาดเดียวกันจะเสียรายละเอียดไปมาก (ดู build_outfits.py) วาดด้วยขนาดนี้ตรง ๆ เสมอ
export const OUTFIT_FRAME_W = 40;
export const OUTFIT_FRAME_H = 62;
export const OUTFIT_DIRS = ["down", "left", "right", "up"];
export const OUTFIT_FRAMES = 4;

export function outfitInfo(id) {
  return OUTFITS.find(o => o.id === id) || null;
}

export function outfitRow(id) {
  return OUTFITS.findIndex(o => o.id === id);
}
