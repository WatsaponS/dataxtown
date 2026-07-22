// Manifest ของสไปรท์ตัวละครความละเอียดสูง (128x128/เฟรม) — แยกจากระบบ avatar เดิม (avatars.png,
// CONFIG.frameW/H 32x50) โดยสิ้นเชิง ไม่แก้ค่าคงที่เดิมเลย เพิ่มตัวละครใหม่ = เพิ่ม entry ในนี้
// อันเดียว ไม่ต้องแตะโค้ด render/network
//
// ทำไมต้องแยก sourceFrame/display/anchor/collision ออกจากกัน (ไม่ใช้ frameW/frameH ตัวเดียว
// เหมือนระบบเดิม): สไปรท์ต้นฉบับ 128x128 แต่ควรโชว์บนจอแค่ ~64x64 world-px (พอดี tile 48 ที่
// defaultZoom=2 => 128 physical px คมพอดี ไม่ต้องย่อไฟล์ต้นฉบับลงเอง) ส่วน collision ต้องอิงจาก
// สรีระตัวละครจริง (footprint) ไม่ใช่ขนาดภาพที่โชว์ ไม่งั้นเปลี่ยนสไปรท์ทีไร hitbox เพี้ยนไปด้วย
//
// รูปแบบ sheet: columns = frame เดิน 0..framesPerDirection-1, rows = ทิศตามลำดับ directions[]
// (ตรงข้ามกับ avatars.png/outfits.png ที่เรียงทิศเป็นคอลัมน์ในแถวเดียว) — ต้องมี adapter คำนวณ
// sx/sy แยกทั้งสองแบบ (ดู sprites.js)
export const SPRITE_MANIFEST = [
  {
    id: "rosewind_healer_v2",
    name: "หมอเวทลมกุหลาบ (ทดลอง ความละเอียดสูง)",
    image: "assets/characters/rosewind-healer-v2-walk-sheet.png",
    sourceFrameWidth: 128,
    sourceFrameHeight: 128,
    columns: 4,
    rows: 4,
    directions: ["down", "left", "right", "up"],
    framesPerDirection: 4,
    frameDurationMs: 140,
    // ~2x เฟรมเดิม (32) แต่คมกว่าเดิมมาก เพราะต้นฉบับมีรายละเอียดสูงกว่า ไม่บีบลงเหลือ 32x50
    // เหมือนระบบ avatar เดิม — ใหญ่กว่า tile 48px นิดหน่อยเท่านั้น (ไม่บังแผนที่)
    displayWidth: 64,
    displayHeight: 64,
    anchorX: 64,        // = sourceFrameWidth/2 (พิกัดใน source space ก่อนสเกล)
    groundAnchorY: 120, // จาก rosewind-healer-v2-walk.json ต้นฉบับ (พิกัดใน source space)
    // footprint ชนกำแพง/เฟอร์นิเจอร์ — ตั้งใจใกล้เคียงตัวละครเดิม (HW=10,FOOT=10) ไม่ผูกกับ
    // displayWidth/Height เลย เปลี่ยนขนาดภาพในอนาคตจะไม่กระทบ collision
    collisionWidth: 18,
    collisionHeight: 12,
    // ไม่มี hair/clothing mask ให้ตอนนี้ (ไม่ต้อง recolor) — เผื่ออนาคตเพิ่ม mask ทีหลังได้เลย
    // โดยไม่ต้องแก้ schema (ดู avatar-recolor interface ใน sprites.js)
    hairMask: null,
    clothingMask: null,
  },
];

export function getSpriteDef(id) {
  if (!id) return null;
  return SPRITE_MANIFEST.find(d => d.id === id) || null;
}
