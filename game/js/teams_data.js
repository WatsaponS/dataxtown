// ทีมสี 6 ทีม (ไม่ใช้ตำแหน่งผู้บริหารจริงเพื่อไม่ให้สับสนกับ NPC) — เลือกตอนสร้างตัวละคร
// ใช้แข่งคะแนนสะสมเป็นทีมบน Leaderboard แท็บ "ทีม"

export const TEAMS = [
  { id: "byte",   name: "ทีม Byte",   color: "#4f8fdd", emoji: "💾" },
  { id: "pixel",  name: "ทีม Pixel",  color: "#d895bd", emoji: "🎨" },
  { id: "query",  name: "ทีม Query",  color: "#57b06b", emoji: "🔍" },
  { id: "cache",  name: "ทีม Cache",  color: "#d97a55", emoji: "⚡" },
  { id: "cloud",  name: "ทีม Cloud",  color: "#65a9c2", emoji: "☁️" },
  { id: "neural", name: "ทีม Neural", color: "#9867a8", emoji: "🧠" },
];

export function teamById(id) {
  return TEAMS.find(t => t.id === id) || null;
}
