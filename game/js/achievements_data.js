// เกณฑ์ปลดล็อกความสำเร็จ/ตำแหน่งแสดง — เช็คจาก stats สะสมที่เก็บใน homes/<uid>.achievements.stats
// stat ที่ใช้: duelWins, gachaMythicPulls, gachaLegendaryPulls, gachaTotalPulls, quizCorrect, itemsPlaced

export const ACHIEVEMENTS = [
  { id: "duel1",   name: "นักดวลมือใหม่",           icon: "🥊", stat: "duelWins", target: 1 },
  { id: "duel10",  name: "นักดวลมือฉมัง",            icon: "⚔️", stat: "duelWins", target: 10 },
  { id: "duel50",  name: "จ้าวสังเวียนเป่ายิ้งฉุบ",   icon: "🏆", stat: "duelWins", target: 50 },
  { id: "mythic1", name: "เจ้าแห่งกาชา",             icon: "💎", stat: "gachaMythicPulls", target: 1 },
  { id: "legend1", name: "นักล่าของหายาก",           icon: "🌟", stat: "gachaLegendaryPulls", target: 1 },
  { id: "pull10",  name: "สายเสี่ยงดวง",             icon: "🎰", stat: "gachaTotalPulls", target: 10 },
  { id: "pull50",  name: "ขาประจำตู้กาชา",           icon: "🎡", stat: "gachaTotalPulls", target: 50 },
  { id: "quiz10",  name: "นักเรียนดี",               icon: "📘", stat: "quizCorrect", target: 10 },
  { id: "quiz50",  name: "ผู้เชี่ยวชาญ Databricks",   icon: "🎓", stat: "quizCorrect", target: 50 },
  { id: "quiz200", name: "ปรมาจารย์ Databricks",      icon: "🧠", stat: "quizCorrect", target: 200 },
  { id: "deco1",   name: "นักแต่งบ้านมือใหม่",        icon: "🖼️", stat: "itemsPlaced", target: 1 },
  { id: "deco10",  name: "อินทีเรียดีไซเนอร์",        icon: "🛋️", stat: "itemsPlaced", target: 10 },
];

export function achievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}
