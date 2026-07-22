// แคตตาล็อกชุดคอสตูมแบบเต็มตัว — มาจาก pixel-art/{male,female}-cyber-fantasy-walk-v1
// ผ่าน game/assets/build_outfits.py -> assets/outfits.png (แถวละ 1 ชุด, 16 คอลัมน์ = 4 ทิศ x 4 เฟรมเดิน)
// ต่างจากเครื่องแต่งกายแบบชิ้น ๆ (hat/shirt/wings) รุ่นก่อน — ชุดนี้ครอบทับตัวละครทั้งตัว
// และมี walk-cycle 4 ทิศจริง ไม่ใช่ท่านิ่งท่าเดียว
export const OUTFITS = [
  { id: "male_cyber_fantasy", name: "นักรบไซเบอร์ (ชาย)" },
  { id: "female_cyber_fantasy", name: "นักรบไซเบอร์ (หญิง)" },
];

// สูงเท่าเฟรมตัวละครฐาน (50) แต่กว้างกว่า (32) เพราะท่าหน้าตรงมีปีกกางออกด้านข้าง — ค่าคำนวณ
// จากคอนเทนต์จริงใน build_outfits.py (อย่าเดาเอง ไม่งั้นปีกจะโดนตัดขอบเหมือนที่เคยเกิด)
export const OUTFIT_FRAME_W = 52;
export const OUTFIT_FRAME_H = 50;
export const OUTFIT_DIRS = ["down", "left", "right", "up"];
export const OUTFIT_FRAMES = 4;

export function outfitInfo(id) {
  return OUTFITS.find(o => o.id === id) || null;
}

export function outfitRow(id) {
  return OUTFITS.findIndex(o => o.id === id);
}
