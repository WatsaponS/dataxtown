// รายการอีโมทท่าทาง — ไอดีต้องตรงกับ data-emote ในปุ่มที่ index.html

export const EMOTES = [
  { id: "wave", emoji: "👋" },
  { id: "clap", emoji: "👏" },
  { id: "laugh", emoji: "😂" },
  { id: "heart", emoji: "❤️" },
  { id: "thumbsup", emoji: "👍" },
  { id: "think", emoji: "🤔" },
  { id: "jump", emoji: "🙌" }, // ท่าเฉลิมฉลอง — spriteFrame() ใน entities.js สลับไปใช้เฟรมกระโดดตอนนี้ active
];

export const EMOTE_DURATION_MS = 2500;

export function emoteEmoji(type) {
  const e = EMOTES.find(x => x.id === type);
  return e ? e.emoji : "";
}
