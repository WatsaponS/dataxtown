// แคตตาล็อกชุดคอสตูมแบบเต็มตัว — มาจาก pixel-art/{male,female}-cyber-fantasy-walk-v1 และ
// pixel-art/layer/* ผ่าน game/assets/build_outfits.py -> assets/outfits.png (แถวละ 1 ชุด,
// 16 คอลัมน์ = 4 ทิศ x 4 เฟรมเดิน) ลำดับต้องตรงกับ VARIANTS ใน build_outfits.py (กำหนด row)
// ต่างจากเครื่องแต่งกายแบบชิ้น ๆ (hat/shirt/wings) รุ่นก่อน — ชุดนี้ครอบทับตัวละครทั้งตัว
// และมี walk-cycle 4 ทิศจริง ไม่ใช่ท่านิ่งท่าเดียว
export const OUTFITS = [
  { id: "male_cyber_fantasy", name: "นักรบไซเบอร์ (ชาย)" },
  { id: "female_cyber_fantasy", name: "นักรบไซเบอร์ (หญิง)" },
  { id: "coral_psychic", name: "นักไซคิกปะการัง" },
  { id: "crimson_aegis_knight", name: "อัศวินโล่เพลิง" },
  { id: "dragon_elf_sentinel", name: "เอลฟ์พิทักษ์มังกร" },
  { id: "emerald_agent", name: "สายลับมรกต" },
  { id: "lunar_frost_noble", name: "ขุนนางน้ำแข็งจันทรา" },
  { id: "night_rift_hunter", name: "นักล่ารอยแยกราตรี" },
  { id: "noir_orchid", name: "กล้วยไม้นัวร์" },
  { id: "rosewind_healer", name: "หมอเวทลมกุหลาบ" },
  { id: "skybreaker_mercenary", name: "ทหารรับจ้างทำลายฟ้า" },
  { id: "male_amber_scout", name: "หน่วยสอดแนมอำพัน (ชาย)" },
  { id: "female_rose_scout", name: "หน่วยสอดแนมกุหลาบ (หญิง)" },
  { id: "male_angel", name: "เทพบุตรปีกทอง (ชาย)" },
  { id: "female_angel", name: "นางฟ้าปีกทอง (หญิง)" },
  { id: "male_black_swordsman", name: "นักดาบเงา (ชาย)" },
  { id: "female_white_rapier", name: "นักฟันดาบขาว (หญิง)" },
  { id: "male_dark_knight_boss", name: "จอมทัพอัศวินมืด (ชาย)" },
  { id: "female_dark_knight_boss", name: "จอมทัพอัศวินมืด (หญิง)" },
  { id: "male_dark_knight", name: "อัศวินมืด (ชาย)" },
  { id: "female_dark_knight", name: "อัศวินมืด (หญิง)" },
  { id: "male_orange_shadow", name: "เงาสีส้ม (ชาย)" },
  { id: "female_violet_moon", name: "จันทราสีม่วง (หญิง)" },
  { id: "male_scarlet_martial", name: "นักสู้เลือดมังกร (ชาย)" },
  { id: "female_violet_martial", name: "นักสู้ดอกไม้ม่วง (หญิง)" },
  { id: "male_silver_fox", name: "จิ้งจอกเงิน (ชาย)" },
  { id: "female_jade_mystic", name: "นักพรตหยก (หญิง)" },
  { id: "male_midnight_gentleman", name: "สุภาพบุรุษเที่ยงคืน (ชาย)" },
  { id: "female_solar_guardian", name: "ผู้พิทักษ์สุริยะ (หญิง)" },
  { id: "male_steel_knight", name: "อัศวินเหล็กกล้า (ชาย)" },
  { id: "female_steel_knight", name: "อัศวินเหล็กกล้า (หญิง)" },
  { id: "male_strawhat_deck", name: "กะลาสีหมวกฟาง (ชาย)" },
  { id: "female_bikini_navigator", name: "นาวิกาชายทะเล (หญิง)" },
];

// สูงเท่าเฟรมตัวละครฐาน (50) แต่กว้างกว่า (32) เพราะท่าหน้าตรงมีปีกกางออกด้านข้าง — ค่าคำนวณ
// จากคอนเทนต์จริงใน build_outfits.py (อย่าเดาเอง ไม่งั้นปีกจะโดนตัดขอบเหมือนที่เคยเกิด)
export const OUTFIT_FRAME_W = 56;
export const OUTFIT_FRAME_H = 55;
export const OUTFIT_DIRS = ["down", "left", "right", "up"];
export const OUTFIT_FRAMES = 4;

export function outfitInfo(id) {
  return OUTFITS.find(o => o.id === id) || null;
}

export function outfitRow(id) {
  return OUTFITS.findIndex(o => o.id === id);
}
