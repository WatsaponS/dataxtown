// ถ้วยรางวัลจบฤดูกาลรายสัปดาห์ — แจกเฉพาะ 3 อันดับแรกของ Leaderboard สัปดาห์ที่แล้วเท่านั้น
// ลำดับต้องตรงกับ assets/build_season_items.py (3 คอลัมน์ x 1 แถว)

export const SEASON_SHEET_COLS = 3;

export const SEASON_REWARD_ITEMS = [
  { id: "season0", name: "ถ้วยรางวัลทองประจำสัปดาห์" },
  { id: "season1", name: "ถ้วยรางวัลเงินประจำสัปดาห์" },
  { id: "season2", name: "ถ้วยรางวัลทองแดงประจำสัปดาห์" },
];

export function seasonItemName(id) {
  const it = SEASON_REWARD_ITEMS.find(x => x.id === id);
  return it ? it.name : id;
}
