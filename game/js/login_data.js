// ไอเทม exclusive จาก daily login 30 วัน — ได้จากการ login เท่านั้น ไม่มีขายในร้าน
// ลำดับ = วันที่ 1-30 และต้องตรงกับ sprite ใน assets/items_login.png (build_login_items.py)

export const LOGIN_ITEMS = [
  { id: "login1",  name: "ริบบิ้นต้อนรับ" },
  { id: "login2",  name: "โปสเตอร์ DataX" },
  { id: "login3",  name: "แก้วทองพนักงานดีเด่น" },
  { id: "login4",  name: "ลูกโป่งปาร์ตี้" },
  { id: "login5",  name: "ต้นบอนไซ" },
  { id: "login6",  name: "โคมไฟลาวา" },
  { id: "login7",  name: "เค้กครบรอบ" },
  { id: "login8",  name: "แมวกวักทอง" },
  { id: "login9",  name: "พรมแดง VIP" },
  { id: "login10", name: "ถ้วยรางวัลเงิน" },
  { id: "login11", name: "ตู้กาชาปอง" },
  { id: "login12", name: "เก้าอี้เกมมิ่ง" },
  { id: "login13", name: "ตู้เพลง Jukebox" },
  { id: "login14", name: "กระจกกรอบทอง" },
  { id: "login15", name: "สเก็ตบอร์ด" },
  { id: "login16", name: "ตู้โชว์ฟิกเกอร์" },
  { id: "login17", name: "ป้ายนีออน DataX" },
  { id: "login18", name: "น้ำพุจิ๋ว" },
  { id: "login19", name: "แซกโซโฟนทอง" },
  { id: "login20", name: "ถ้วยรางวัลทอง" },
  { id: "login21", name: "เครื่องชงกาแฟ" },
  { id: "login22", name: "เต็นท์แคมป์" },
  { id: "login23", name: "ลูกโลกทอง" },
  { id: "login24", name: "กล้องดูดาว" },
  { id: "login25", name: "ดิสโก้บอล" },
  { id: "login26", name: "สโนว์โกลบ" },
  { id: "login27", name: "ชุดเกราะอัศวิน" },
  { id: "login28", name: "เก้าอี้บีนแบ็ก" },
  { id: "login29", name: "จรวดจำลอง" },
  { id: "login30", name: "มงกุฎ DataX 👑" },
];

export const LOGIN_SHEET_COLS = 5;

export function loginItemName(id) {
  const it = LOGIN_ITEMS.find(x => x.id === id);
  return it ? it.name : id;
}
