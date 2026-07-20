// คลังภารกิจประจำวัน — สุ่ม 3 อันจากพูลนี้ทุกวัน (รีเซ็ตเที่ยงคืนตามเวลาเครื่องผู้เล่น)
// เป้าหมายทุกอันคือ "ทำ 1 ครั้ง" ให้เรียบง่ายชัดเจน ไม่ต้องมี target ตัวเลขแยกเก็บ

export const MISSION_POOL = [
  { id: "quiz",        icon: "❓", title: "ตอบ Quiz ให้ถูก",      desc: "ไปหาป้าย ❓ แล้วตอบให้ถูกอย่างน้อย 1 ข้อ", reward: 15 },
  { id: "duel_win",    icon: "⚔️", title: "ชนะเป่ายิ้งฉุบ",       desc: "ท้าใครสักคนแล้วเอาชนะให้ได้ 1 ครั้ง",        reward: 15 },
  { id: "chat",        icon: "💬", title: "ทักทายเพื่อนร่วมงาน",   desc: "ส่งข้อความแชท 1 ข้อความ",                   reward: 10 },
  { id: "gacha_pull",  icon: "🎰", title: "ลองเสี่ยงดวง",          desc: "สุ่มกาชาปอง 1 ครั้ง",                        reward: 10 },
  { id: "item_placed", icon: "🖼️", title: "แต่งห้องนิดหน่อย",      desc: "จัดวางไอเทมในห้องของคุณ 1 ชิ้น",             reward: 10 },
  { id: "board_open",  icon: "🏆", title: "เช็คอันดับ",            desc: "เปิดดู Leaderboard สักครั้ง",               reward: 10 },
  { id: "shop_buy",    icon: "🛍️", title: "ช้อปของแต่งห้อง",       desc: "ซื้อไอเทมจากร้านค้า 1 ชิ้น",                 reward: 15 },
  { id: "visit_room",  icon: "🚪", title: "ไปเยี่ยมเพื่อน",        desc: "แวะดูห้องของเพื่อนร่วมงานสักคน",             reward: 10 },
];

export const MISSIONS_PER_DAY = 3;
export const ALL_DONE_BONUS = 30;
export const STREAK_MILESTONE_EVERY = 7;
export const STREAK_MILESTONE_BONUS = 50;

export function missionById(id) {
  return MISSION_POOL.find(m => m.id === id) || null;
}
