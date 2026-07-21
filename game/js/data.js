// คอนเทนต์และค่าคงที่ของเกม — แก้ NPC / ป้ายโซน / จูนค่าต่าง ๆ ที่ไฟล์นี้ไฟล์เดียว

export const CONFIG = {
  mapJson: "assets/scb_floor7_map_large3x.json",   // แผนที่ใหญ่ 96×96 tiles
  avatarSheet: "assets/avatars.png",
  avatarMeta: "assets/avatars.json",
  walkSpeed: 90,          // px/วินาที
  runMultiplier: 1.6,
  proximityRadius: 88,    // ~3.7 tiles (tile 24px) — ระยะ "ได้ยินกัน" ครอบกลุ่มโซฟา/คลัสเตอร์คุยงาน
  bubbleSeconds: 6,
  defaultZoom: 2,
  frameW: 16, frameH: 24,
  avatarVariants: 16,     // rows 0-7 ชาย, 8-15 หญิง (สีเดียวกัน 8 ชุด)
  colorsPerGender: 8,
};

// พาเลตสำหรับ customize ตัวละคร (null = ใช้สีเดิมของ variant)
export const HAIR_COLORS = [
  "#2b2233", "#1f1a16", "#5a3825", "#703c22", "#8a2f2f",
  "#d9a441", "#e5d9c0", "#3a3f6b", "#2e6b4f", "#c66a9a",
];
export const SHIRT_COLORS = [
  "#4f8fdd", "#e2698a", "#57b06b", "#e7b94f", "#9867a8",
  "#65a9c2", "#d97e3f", "#7f8c9f", "#c94f4f", "#3a4a8c",
  "#2f8f83", "#f2f2e9",
];

// ป้ายชื่อโซน อิง id ใน scb_floor7_map_large3x.json
export const ZONE_INFO = {
  cco_office:           { name: "🤝 ห้องพี่หว่า (CCO)", note: "ปรึกษาเรื่องลูกค้า/ดีลได้ที่นี่" },
  cro_office:           { name: "🛡️ ห้องคุณ Manis (CRO)", note: "ปรึกษาความเสี่ยงและ compliance" },
  cdo_office:           { name: "📊 ห้องพี่แตน (CDO)", note: "คุยเรื่องข้อมูลและ insight" },
  cfo_finance:          { name: "💰 ห้องคุณ TT (CFO)", note: "เรื่องงบและการเงิน เชิญทางนี้" },
  cto_technology:       { name: "💻 ห้องพี่อ้อ (CTO)", note: "คุยเทคนิค/architecture ได้เต็มที่" },
  pantry:               { name: "🍪 Pantry", note: "เติมพลังกาแฟและขนม" },
  open_space_west:      { name: "🎤 Open Space — เวที DataX", note: "โซนกิจกรรมรวม/ทาวน์ฮอลล์ — ทุกคนบนเวทีได้ยินกันหมด" },
  meeting_0:            { name: "🔒 Meeting Room 0", note: "เสียงไม่รั่วออกนอกห้อง" },
  meeting_1:            { name: "🔒 Meeting Room 1", note: "เสียงไม่รั่วออกนอกห้อง" },
  meeting_2:            { name: "🔒 Meeting Room 2", note: "เสียงไม่รั่วออกนอกห้อง" },
  meeting_3:            { name: "🔒 Meeting Room 3", note: "เสียงไม่รั่วออกนอกห้อง" },
  lift_lobby:           { name: "🛗 โถงลิฟต์", note: "" },
  phone_booth_northwest:{ name: "📞 Phone Booth (เหนือ)", note: "คุยส่วนตัว" },
  phone_booths:         { name: "📞 Phone Booth", note: "คุยส่วนตัว" },
  huddle_room:          { name: "🔒 Huddle Room", note: "ห้องคุยเล็กสำหรับ 2 คน เสียงไม่รั่วออกนอกห้อง" },
  supply_closet:        { name: "🗄️ ห้องเก็บอุปกรณ์", note: "" },
};

// ประเภทโซนที่ "เสียงไม่รั่ว" — ต้องอยู่โซน id เดียวกันถึงได้ยินกัน (ใช้ใน canHear)
export const PRIVATE_ZONE_TYPES = new Set([
  "private_audio", "presentation", "meeting",
  "executive_consultation", "data_executive", "executive_finance", "technology", "risk_executive",
]);

// ทีมผู้บริหาร DataX (NPC) — home คือ tile ประจำ (grid 32, tile 48px) แต่ละคนประจำห้อง/โซนของตัวเอง
// variant: 0-7 ชาย, 8-15 หญิง (ดู build_avatars.py) — บทพูดสุ่มจาก lines เมื่อผู้เล่นเข้าใกล้
export const NPCS = [
  { name: "พี่หนุ่ม", role: "CEO", variant: 0, home: [15, 8], roam: 2,
    lines: [
      "DataX จะไปได้ไกลแค่ไหน อยู่ที่พวกเราทุกคนครับ 🚀",
      "ล้มได้ แต่ลุกให้เร็ว เรียนรู้ให้ไวนะครับ",
      "ประตูห้องพี่หนุ่มเปิดเสมอ มีไอเดียอะไรมาเล่าได้เลย",
      "ขอบคุณที่ทุ่มเทกันนะครับ แต่อย่าลืมพักผ่อนด้วย",
      "ปีนี้เราจะโตไปด้วยกันทั้งทีมครับ",
    ] },
  { name: "พี่อ้อ", role: "CTO", variant: 12, home: [3, 22], roam: 1,
    lines: [
      "โค้ดไม่ต้องเพอร์เฟกต์ ขอให้กล้า ship แล้วเรียนรู้ไปด้วยกันค่ะ 💪",
      "ติด bug ตรงไหน มาคุยกับพี่อ้อได้เลย เดี๋ยวช่วยกันแกะ",
      "อย่าลืม review โค้ดให้กันนะคะ ทีมเราเก่งขึ้นไปพร้อมกัน",
      "Tech debt ค่อย ๆ ทยอยใช้คืน ไม่ต้องรีบ แต่อย่าหยุดพัฒนา",
      "ภูมิใจในทีม engineering ของเรามากเลยค่ะ สู้ ๆ นะ",
    ] },
  { name: "พี่หว่า", role: "CCO", variant: 6, home: [11, 3], roam: 1,
    lines: [
      "ลูกค้ายิ้มได้เพราะพวกเราทุกคนครับ เก่งมาก!",
      "ฟังเสียงลูกค้าเยอะ ๆ นะครับ insight ดี ๆ อยู่ตรงนั้นแหละ",
      "ดีลไหนติดขัด มาปรึกษาพี่หว่าได้เสมอครับ",
      "เป้า Q นี้ไม่ไกลเกินเอื้อม ช่วยกันอีกนิดครับทุกคน 🔥",
    ] },
  { name: "คุณ Manis", role: "CRO", variant: 5, home: [15, 3], roam: 1,
    lines: [
      "ความเสี่ยงไม่ใช่สิ่งที่ต้องกลัว แต่ต้องรู้จักมันให้ดีพอครับ",
      "ก่อน launch อะไรใหม่ แวะมาคุยเรื่อง risk กับคุณ Manis ได้เสมอครับ",
      "Data governance ที่ดี = ความเสี่ยงที่ต่ำ ขอบคุณที่ช่วยกันดูแลนะครับ",
      "เจออะไรผิดปกติ รีบแจ้งทันที อย่าเก็บไว้คนเดียวนะครับ 🛡️",
      "กล้าเสี่ยงอย่างมีข้อมูล คือวิธีที่ DataX เติบโตอย่างปลอดภัยครับ",
    ] },
  { name: "พี่แตน", role: "CDO", variant: 11, home: [19, 3], roam: 1,
    lines: [
      "ข้อมูลที่ดีเริ่มจาก pipeline ที่แข็งแรง ขอบคุณที่ดูแลกันนะคะ",
      "ตัวเลขทุกตัวมีเรื่องเล่า อย่าลืมตั้งคำถามกับข้อมูลค่ะ",
      "Data quality สำคัญที่สุด ช้าแต่ชัวร์นะคะทุกคน",
      "Dashboard ใหม่สวยมาก ใครทำยกมือหน่อย เก่งมากค่ะ 👏",
      "อยากเห็น insight ใหม่ ๆ ทุกสัปดาห์เลยค่ะ สู้ ๆ",
    ] },
  { name: "คุณ TT", role: "CFO", variant: 7, home: [25, 13], roam: 2,
    lines: [
      "งบมีไว้ลงทุนกับของที่ใช่ เสนอมาได้เลยครับ",
      "ประหยัดได้ประหยัด แต่คุณภาพงานห้ามลดครับ 😄",
      "ตัวเลขไตรมาสนี้สวยเพราะทุกคนช่วยกันครับ",
      "อย่าลืมเคลียร์ expense ก่อนสิ้นเดือนนะครับ",
    ] },
];
