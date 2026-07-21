---
name: dataxtown-dev
description: Develop and modify the DataX Town game (Gather Town-style virtual office of DataX, SCB Park West B floor 7). Use when editing the game code, the floor-7 pixel-art map, avatars, NPCs, zones, or when running/testing the game.
---

# DataX Town Development

เกมออฟฟิศเสมือนแนว Gather Town ของบริษัท DataX (SCB Park West B ชั้น 7)
ก่อนแก้อะไร อ่านภาพรวมระบบใน `docs/GAME_DESIGN.md` ก่อนเสมอ — มันคือ source of truth ของดีไซน์

## Constraints ของเครื่องนี้

- **ไม่มี Node.js** — ห้ามเพิ่ม build step / npm dependency; เกมเป็น vanilla JS ES modules รันตรงในเบราว์เซอร์
- มี Python 3.11 + Pillow — ใช้สร้าง asset ทุกชิ้น (deterministic scripts, ห้ามแก้ PNG ตรง ๆ)
- ต้องเปิดผ่าน http server (ES modules ใช้ file:// ไม่ได้)

## Agents ประจำโปรเจกต์ (.claude/agents/)

- **game-qa** — ตรวจเกมครบทุกระบบด้วยหลักฐานจริง (checklist 8 ข้อ: render, multiplayer,
  quest, leaderboard, มือถือ, เพลง) — ใช้หลังแก้โค้ด/ก่อน push
- **map-design-review** — รีวิวการออกแบบแผนที่ทั้งเชิงเทคนิค (collision overlay, flood-fill
  reachability, โซน/spawn) และเชิง interior design (zoning, circulation, wayfinding,
  เฟอร์นิเจอร์, สี/แสง) — ใช้เมื่อจะแก้ build.py หรือปรับผัง
- **game-audio** — งานดนตรี/เสียงทั้งหมด: แต่ง/ปรับลูปเพลง (PROG/MELODY ใน audio.js),
  เพิ่ม SFX, จูน mix, แก้ปัญหาเสียง — รู้ข้อจำกัด no-audio-files + autoplay policy

## รัน / ทดสอบ

```powershell
python game/server.py         # ★ ตัวหลัก: multiplayer (static + WebSocket /ws พอร์ต 8700, bind 0.0.0.0)
python game/serve.py          # static เฉย ๆ = เล่นคนเดียว (เกม fallback ออฟไลน์เองถ้าไม่มี /ws)
python game/tunnel.py         # เปิดสู่อินเทอร์เน็ตผ่าน Cloudflare Quick Tunnel (นอก LAN เข้าได้)
```

- `server.py --key <รหัส>` = ต้องมี `?key=` ใน URL ถึง join ได้ (ไม่งั้นตอบ `{t:"denied"}`);
  `tunnel.py --key <รหัส>` แค่พิมพ์ลิงก์แชร์ให้ครบ ไม่ได้ enforce เอง
- `net.js` เลือก ws/wss อัตโนมัติจาก `location.protocol` — ห้าม hardcode scheme
- tunnel.py ดาวน์โหลด `cloudflared.exe` ไว้ที่ `bin/` ครั้งแรก; การรัน tunnel/ดาวน์โหลด exe
  อาจโดน permission classifier บล็อก — ให้ผู้ใช้รันเองในเทอร์มินัลแยก
- ทดสอบผ่านอุโมงค์: `bot_client.py --host xxx.trycloudflare.com --tls [--key ...]`

URL params สำหรับทดสอบ: `autostart=1` ข้าม overlay, `name=`, `spawn=<spawnPoint id>`,
`hair=`/`shirt=` (hex ไม่ใส่ #), `settle=<ms>` หน่วง load event ด้วยเวลาจริง,
`touch=1` บังคับเปิด touch UI (joystick/ปุ่มแชต) บนเดสก์ท็อป

ทดสอบจอมือถือ: `cdp_shot.py --width 390 --height 844` (แนวตั้ง) / `--width 844 --height 390` (แนวนอน)
ร่วมกับ `touch=1` — เช็คว่า joystick+ปุ่มแชตโผล่, minimap ย่อ, online list เป็น badge 👥

รัน JS ในหน้าเกมได้ด้วย `cdp_shot.py --eval "<expr>"` (มี user gesture + await promise ให้)
— ⚠️ PowerShell 5.1 ต้องเรียกแบบ `python --% cdp_shot.py ...` (stop-parsing) ไม่งั้น quote พัง
และห้ามต่อคำสั่งอื่นหลัง `;` ในบรรทัดเดียวกับ `--%`
hooks บน window: `__music` (เพลง), `__duelState()` (ดวลที่กำลังเล่นอยู่ — id/isA/status),
`__world` (world ทั้งก้อน — ใช้ teleport/เช็ค quests/points ได้
เช่น `__world.player.x = __world.quests.spots[0].x` แล้วคลิก #quest-hint เพื่อทำ quiz อัตโนมัติ
ตัวอย่าง: `--eval "(async()=>{window.__err=null;addEventListener('error',e=>__err=e.message);__music.start();await new Promise(r=>setTimeout(r,2500));return 'err='+__err;})()"`)

### วิธี verify (ไม่มี JS test runner — ตรวจด้วย screenshot)

ฟีเจอร์ที่ไม่พึ่ง network ใช้ headless screenshot ตรง ๆ ได้:

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --window-size=1280,800 --virtual-time-budget=6000 --screenshot=shot.png `
  "http://localhost:8700/index.html?autostart=1&name=Tester"
```

⚠️ **ห้ามใช้ `--virtual-time-budget` ทดสอบ multiplayer/WebSocket** — มันเร่งเวลาเสมือนจนหน้า
จบก่อน WS จะเปิดจริง (และ `--timeout` ของ Edge ก็ไม่ช่วย) ให้ใช้ `tools/cdp_shot.py`
ซึ่งคุมผ่าน DevTools Protocol และรอ "เวลาจริง" ได้:

```powershell
# 1) ปล่อยผู้เล่นจำลอง (background) — ระวัง: ห้ามใช้ Start-Process กับ args ที่มีช่องว่าง
#    (PowerShell 5.1 ไม่ quote ให้ → argparse พัง) ใช้ run_in_background ของ shell แทน
python game/tools/bot_client.py --name Botto --shirt 2f8f83 --tile 15 23 --seconds 60 --chat "Hello!"
# 2) ถ่ายภาพแบบรอเวลาจริง 8 วิ ให้ WS ต่อและรับ roster/แชตก่อน
python game/tools/cdp_shot.py --url "http://localhost:8700/index.html?autostart=1&name=Tester" --wait 8 --out shot.png
```

เช็คในภาพ: ชื่อบอทใน online list, ตัวบอทบนแผนที่ (สีเสื้อตรง), bubble/chat log

## แผนที่ไฟล์ — แก้อะไรที่ไหน

| งาน | ไฟล์ |
|-----|------|
| เพิ่ม/แก้ NPC, บทพูด, ป้ายโซน, จูนค่า (ความเร็ว, รัศมีได้ยิน) | `game/js/data.js` |
| กติกาเดิน/ชน/ได้ยินกัน (proximity + โซน), AI ของ NPC | `game/js/entities.js` |
| กล้อง, การวาดแผนที่/ตัวละคร/bubble | `game/js/render.js` |
| แชต, minimap, แบนเนอร์, รายชื่อออนไลน์, start overlay | `game/js/ui.js` + `index.html` + `css/style.css` |
| โหลดแผนที่, collision/zone queries | `game/js/world.js` |
| bootstrap, game loop, คีย์บอร์ด, URL params | `game/js/main.js` |
| multiplayer client (remote entity, interpolation, sync) | `game/js/net.js` |
| เพลงประกอบ (Web Audio sequencer — BPM, progression, เมโลดี้, mix) | `game/js/audio.js` |
| ระบบ quest ❓ + quiz modal + leaderboard | `game/js/quests.js` |
| คลังข้อสอบ Databricks 100 ข้อ (เพิ่ม/แก้โจทย์ที่นี่) | `game/js/quiz_data.js` |
| ห้องส่วนตัว + ร้านค้าไอเทม (แคตตาล็อก 20 ชิ้น, ยอดคงเหลือ = points − spent) | `game/js/decor.js` |
| sprite ไอเทมตกแต่ง (ลำดับต้องตรงแคตตาล็อก) | `game/assets/build_items.py` → `items.png` |
| ประวัติแชตรวม (โหลดจาก rooms/main/chat) | `game/js/history.js` |
| สัตว์เลี้ยง — เดินตามเจ้าของด้วย trail-follow, sync ผ่าน join payload | `game/js/pets.js`, `game/js/pets_data.js` |
| sprite สัตว์เลี้ยง (13 นักษัตร × 4 ทิศ × 4 เฟรมเดินจริง, cell 32px — ลำดับต้องตรง pets_data.js PETS) | `game/assets/build_pets.py` → `pets.png` (ต้นฉบับ: `pixel-art/zodiac-pets-economy`) |
| เมนู 🐾 เปลี่ยน/ตั้งชื่อสัตว์เลี้ยงในเกม — เลือกได้ทั้ง 13 ตัวตั้งแต่ต้น ไม่มีล็อก legendary แล้ว | `game/js/pet_menu.js` |
| ท้าเป่ายิ้งฉุบ (2/3=20 แต้ม) — เดินใกล้+กด F/ปุ่ม ⚔️; ท้า NPC (C-level) ได้ด้วย (จำลองในเครื่อง ไม่ผ่าน Firebase, อัตราชนะจูนที่ `duelWinRate` ใน `data.js`) | `game/js/duel.js` |
| ตู้กาชาปอง (100 แต้ม/ครั้ง, ตำแหน่งคงที่ tile [29,26], เดินใกล้+กด G) — แคตตาล็อก+weighted random | `game/js/gacha.js`, `game/js/gacha_data.js` |
| sprite ตู้กาชา (static 1 ชิ้น) / ไอเทมรางวัล 50 ชิ้น (5x10, prefix id `gacha`) | `build_gacha_machine.py`→`gacha_machine.png`, `build_gacha_items.py`→`gacha_items.png` |
| สัตว์เลี้ยงเดินเล่น+โผล่ทริกในห้องส่วนตัว (แยกจาก trail-follow นอกห้อง) | `updateRoomPet`/`drawRoomPet` ใน `game/js/decor.js` |
| multiplayer server + protocol (JSON: join/move/chat) | `game/server.py` |
| **ผังชั้น 7** (ห้อง, โต๊ะ, collision, spawn, โซน) | `pixel-art/scb-park-west-b-floor7/build.py` |
| หน้าตา avatar | `game/assets/build_avatars.py` |

## Workflow แก้แผนที่ (สำคัญ — มี copy step)

**เกมใช้ `scb_floor7_map_large3x.json` — grid 32×32, tileSize 48px (ภาพ 1536×1536, ขยับจาก
tileSize 24px รอบที่ตัวละคร/สไปรท์ใหญ่ขึ้นเป็น DALL-E art — COMPACT downsample factor เลย
กลายเป็น 1 คือไม่มีการย่อคุณภาพจริง ๆ), เดินได้ทุกช่องในกรอบตึก (ชนเฉพาะเปลือกอาคารเฉียง —
เดินทะลุเฟอร์นิเจอร์ได้โดยตั้งใจ)**
ทุกอย่าง generate จาก `build.py` ตัวเดียว ควบคุมผ่าน env vars:

```powershell
Set-Location pixel-art\scb-park-west-b-floor7
$env:DATAXTOWN_SPACE_SCALE = "3"   # 1=ฐาน 16px, 2=spacious2x, 3=large3x (ตัวที่เกมใช้)
$env:DATAXTOWN_COMPACT = "1"       # ★ ที่เกมใช้: art ครึ่งขนาด (tile 24px) + collision เปิดโล่งในกรอบตึก
python build.py                     # ได้ png/@2x/preview/palette/json ครบชุด
Copy-Item scb_floor7_map_large3x.png  ..\..\game\assets\ -Force
Copy-Item scb_floor7_map_large3x.json ..\..\game\assets\ -Force
```

(ไม่ตั้ง DATAXTOWN_COMPACT = ได้ฉบับเต็ม tile 48px พร้อม collision ละเอียดตามเฟอร์นิเจอร์/ประตู)

- ⚠️ ต้องมี pixelstudio ที่ `C:\Users\Admin\.codex\skills\pixel-art-studio\scripts` — ถ้าหาย ให้เขียน render ใหม่ด้วย Pillow หรือแก้ path ในหัวไฟล์
- ⚠️ **ห้ามสร้างสคริปต์อื่นที่เขียนไฟล์ชื่อ `scb_floor7_map_large3x*`** — เคยมี build_large.py
  (upscale อัตโนมัติ) เขียนทับงานละเอียดจาก build.py มาแล้ว จึงถูกลบทิ้ง; build.py คือ source of truth เดียว
- พิกัดทั้งหมดใน `data.js` (NPC home, bot --tile) เป็น **grid 32** — spawn: main_entrance [16,23],
  north_lounge [16,9] (บนเวที playback), west_workspace [5,14], east_workspace [26,17]
- แผนที่นี้มีโซน 15 โซน รวมห้องผู้บริหาร (cco_office, cdo_office, cfo_finance, cto_technology),
  pantry, meeting_0..3, lift_lobby ฯลฯ — ป้ายชื่ออยู่ใน `ZONE_INFO` และประเภทที่เสียงไม่รั่ว
  อยู่ใน `PRIVATE_ZONE_TYPES` (data.js) — เพิ่มโซน type ใหม่ต้องพิจารณาเพิ่มใน Set นี้ด้วย
- ห้ามแก้ `game/assets/scb_floor7_map*` ตรง ๆ — จะถูกทับตอน copy รอบหน้า

## Workflow แก้ avatar

**เปลี่ยนจาก PIL-วาดมือเป็นสไปรท์ DALL-E แล้ว (office-avatar-sprites)** — ต้นฉบับอยู่ที่
`pixel-art/office-avatar-sprites/*_spritesheet.png` (chroma-keyed มาแล้ว) บวก `*_hair_mask.png`/
`*_clothing_mask.png` ให้ recolor ทีหลัง เจนจากเครื่องมือของผู้ใช้เอง (`tools/sprite-generator`)

1. แก้/เพิ่มรายการใน `VARIANTS` ของ `game/assets/build_avatars.py` — **8 แถว**: แถว 0-1 = ชาย/หญิง
   ทั่วไป (recolor ได้อิสระ), แถว 2+ = ดีไซน์เฉพาะผู้บริหารแต่ละคน (ใช้ตรงตัว ไม่ recolor)
   4 ทิศ (down/left/right/up) × 4 เฟรมเดิน, เฟรมเกม 32×50 (ย่อจากต้นฉบับ 128px/เฟรม)
2. `python game/assets/build_avatars.py` → ได้ `avatars.png` + มาสก์ผม/เสื้อ + `avatars.json` ใหม่
   (ใช้ `resize_rgba_premultiplied()` แบบ BOX filter + hard alpha cutoff — **อย่าเปลี่ยนกลับเป็น
   LANCZOS** เด็ดขาด ต้นฉบับเป็น binary-alpha mask ล้วน LANCZOS จะ ring จนขอบตัวละครมีฝ้าเทารอบตัว
   ทั้งตัว เจอบั๊กนี้มาแล้วทั้งในสไปรท์ตัวละครและสัตว์เลี้ยง)
3. ถ้าเปลี่ยนขนาดเฟรม ต้องอัปเดต `CONFIG.frameW/frameH` ใน `game/js/data.js` ให้ตรง

### ระบบ customize สีผม/สีเสื้อ (mask-based recolor)

- `game/js/avatar.js` → `makeCustomSheet(world, variant, {hair, shirt})` คืน canvas 1 แถวเต็ม
  โดยใช้ `applyMaskRecolor()`: พิกเซลใต้มาสก์สีขาว (จาก `*_hair_mask.png`/`*_clothing_mask.png`)
  ถูก remap แบบรักษาความสว่างเดิม (`k = 0.55 + 0.45*((v-lo)/span)`) ไปทางสีที่เลือก — **ไม่ใช่**
  exact-pixel palette swap แบบเดิมอีกต่อไป จึงรับสี hex อะไรก็ได้ ไม่ต้องเทียบสี key เป๊ะ ๆ
- แถวที่มี `role` (ผู้บริหาร) ไม่ผ่าน recolor เลย (ใช้ art ตรงตัวตามที่เตรียมมา)
- entity ที่มี `ent.sheet` (canvas เฉพาะตัว) → `render.js` ใช้แทน sheet รวม (sy=0)
- พาเลตที่ให้เลือกอยู่ที่ `HAIR_COLORS` / `SHIRT_COLORS` ใน `data.js`; ตัวเลือกถูกจำใน
  `localStorage["dataxtown.avatar"]` (name, variant, hair, shirt, pet, dept)
- ทดสอบผ่าน URL: `&hair=e5d9c0&shirt=c94f4f` (hex ไม่ใส่ #, ใช้คู่กับ autostart ได้)

## กติกาสำคัญที่ห้ามพังโดยไม่ตั้งใจ

- **canHear** (`entities.js`): โซน `private_audio`/`presentation` ต้องอยู่โซน id เดียวกันถึงได้ยิน;
  นอกนั้นใช้ระยะ ≤ `CONFIG.proximityRadius` — ทั้ง bubble, chat log, NPC ทักทาย ใช้ฟังก์ชันนี้ทางเดียว
- ตำแหน่ง entity `(x, y)` = จุดกึ่งกลาง **เท้า** (ไม่ใช่กลาง sprite) — hitbox และการวาดอิงจุดนี้
- Map JSON format คือ `DataXTown social-map v1` — จะเพิ่มฟิลด์ได้ แต่ห้ามเปลี่ยนของเดิม (เกมกับ build.py ต้อง sync กัน)
- เรนเดอร์ pixel art ต้องคง nearest-neighbor + integer zoom
- Mobile: breakpoints คือ `max-width: 700px` **หรือ** `max-height: 520px` (มือถือแนวนอน) —
  แก้ CSS มือถือต้องเช็คทั้งสองเงื่อนไข; joystick เป็น analog ผ่าน `controls.joy` (`main.js` →
  `updatePlayer(world, controls, dt)` โดย controls = `{keys: Set, joy: {x,y,active}}`)

## เพิ่มแผนที่ชั้น/อาคารใหม่

สร้างโฟลเดอร์ใหม่ใต้ `pixel-art/` ที่ export PNG + JSON format เดียวกัน แล้วชี้ `CONFIG.mapJson` ใน `data.js` — โค้ดเกมไม่ผูกกับแผนที่ใด

## กติกาสำคัญ: ห้องส่วนตัว (decor.js) ใช้ระบบพิกัด "base" ไม่ใช่ "scaled"

`room-canvas` วาดที่ 384×384 (ขยายจาก 384×288 รอบที่สไปรท์ตัวละครสูงขึ้นเป็น 50px — ดู
`ROOM_ROWS` ใน decor.js) แต่ทุกพิกัด (ตำแหน่งบอท/สัตว์เลี้ยง/เป้าหมายเดิน) เก็บเป็นพิกัด **base**
(192×192, `ROOM_COLS/ROOM_ROWS * CELL(24)`, ยังไม่คูณ `S=2`) แล้วค่อยคูณ `S` ตอนวาดจริงเท่านั้น —
ถ้าเผลอ spawn ตำแหน่งเป็นพิกัด scaled วัตถุจะไปโผล่นอกกรอบห้องโดยไม่มี error ให้เห็น (เจอบั๊กนี้
ตอนทำสัตว์เลี้ยงในห้องมาแล้ว) ก่อนเพิ่มวัตถุเคลื่อนไหวใหม่ในห้องให้เช็คช่วง x∈[16,176]
(บอท/สัตว์เลี้ยงเหมือนกัน), y∈[62,184] สำหรับสัตว์เลี้ยง (`ROOM_PET_Y_MIN/MAX`) หรือ y∈[101,186]
สำหรับบอทเจ้าของห้อง (`ROOM_BOT_Y_MIN/MAX`, เผื่อที่ด้านบนให้พอกับหัวสไปรท์ที่สูงกว่า)

## Multiplayer (เฟส 2 — ใช้งานได้แล้ว, มี 2 โหมด)

**โหมด Firebase (ปัจจุบัน)**: `game/js/firebase-config.js` มี config → `net_firebase.js` ใช้
Realtime Database (`rooms/main/players/<uid>`, `rooms/main/chat`) ผ่าน SDK จาก gstatic CDN
(pin เวอร์ชันใน `SDK` const) — ไม่ต้องมีเซิร์ฟเวอร์เอง

**onDisconnect ไม่ลบผู้เล่นอัตโนมัติแล้ว** (เปลี่ยนพฤติกรรมรอบที่เพิ่มฟีเจอร์ "หลับ") — แค่
`update({online:false, dir:"down", moving:false})` ตัวละครค้างอยู่ที่เดิม ยืนหน้าตรง จาง+ขาวดำ
ขึ้น bubble "Zzz.." ค้างไว้ (`ent.online === false` เช็คได้จาก entity ทุกจุดที่ต้อง gate เช่น
duel proximity/online-list) พอ uid เดิมกลับมาต่อใหม่ (`connectFirebase`) จะ resume ตำแหน่ง x/y/dir
ล่าสุดจาก node เดิมแทน spawn ปกติเอง (เว้นแต่มี `?spawn=` ระบุมาเอง) — uid สุ่มเก็บใน
`localStorage["dataxtown.uid"]` (ไม่ใช้ Firebase Auth)
- Rules อยู่ที่ `docs/firebase-rules.json` — วางใน console แท็บ Rules; เผื่อโครง points/leaderboard ไว้แล้ว (client เขียนไม่ได้)
  ทุกครั้งที่เพิ่ม path ใหม่ใต้ `rooms/main/*` หรือ top-level (เช่น `duels`, `homes`) ต้อง publish rules
  ใหม่ก่อนเสมอ ไม่งั้นได้ 401 Unauthorized เงียบ ๆ — เทสต์ผ่าน REST PUT ก่อนเชื่อว่าใช้ได้จริง
  ⚠️ เวลาขอให้ user publish rules ก้อนใหม่ ให้แปะ**ทั้งไฟล์**เสมอ ไม่ใช่แค่ snippet ส่วนที่เพิ่ม —
  เคยเกิดเหตุ user เข้าใจผิดวางเป็น top-level ทั้งที่โค้ดตั้งใจให้ nested (หรือกลับกัน) ทำให้ path
  ไม่ตรงกัน แก้ไขได้ 2 ทาง: ขอให้ user แก้ rules ใหม่ (รอบที่ 2) หรือแก้โค้ดให้ตรง path ที่ publish
  จริงแทน (เร็วกว่า ไม่ต้องรบกวน user ซ้ำ) — เช็ค path จริงด้วย REST PUT ตรง ๆ ก่อนสรุปว่า "รออะไร"
- ทดสอบ/จำลองผู้เล่นผ่าน REST ได้ตรง ๆ: `PUT <databaseURL>/rooms/main/players/<id>.json`
- ตั้ง `FIREBASE_CONFIG = null` = กลับไปใช้ WebSocket server ในเครื่องแบบเดิม
- ⚠️ **นี่คือฐานข้อมูลจริงที่พนักงานจริงใช้งานอยู่ ไม่ใช่แค่ sandbox ทดสอบ** — ก่อนลบอะไรต้อง
  `GET` เช็คก่อนเสมอ และลบเฉพาะ entry ที่ตัวเองเพิ่งสร้างขึ้นทดสอบ (เทียบชื่อ/timestamp) ห้ามลบของ
  ผู้เล่นจริงเด็ดขาด — และอย่าลืมว่าเก็บกวาดต้องครบทั้ง 3 path ที่ test เขียนไปมักโดน: **`rooms/main/players`,
  `leaderboard`, `homes`** (ลืม 2 อันหลังมาแล้ว เจอ "Tester" ค้างซ้ำ ๆ บน leaderboard จริงจากรอบทดสอบ
  ก่อน ๆ ที่ล้างแค่ players อย่างเดียว) — และตั้งแต่มีฟีเจอร์ "หลับ" แล้ว test session ที่ปิดเบราว์เซอร์
  ไปจะ**ไม่หายเองอีกต่อไป** (แค่ online:false ค้างไว้) ต้องลบมือทุกครั้งหลังทดสอบ

**โหมด WebSocket ในเครื่อง (fallback/dev)**: รายละเอียดด้านล่าง

- Server = `game/server.py` (stdlib ล้วน: http.server + RFC6455 เขียนเองในไฟล์) — protocol อยู่ใน docstring
- Remote player = entity `kind:"remote"` ใน `net.js`; ตำแหน่ง lerp เข้าหาค่าล่าสุด (`tx`,`ty`)
- แชตของ remote วิ่งผ่าน `speak()` → กติกา canHear ทำงานอัตโนมัติ ห้าม bypass
- `world.onChat` ถูก wrap ต่อกันเป็นลูกโซ่ (ui ก่อน แล้ว net ต่อท้ายตอน ws open) — ถ้าเพิ่ม listener ใหม่ให้ wrap แบบเดียวกัน อย่า assign ทับ
- NPC เป็น local ต่อ client (ไม่ sync) — จะ sync จริงต้องย้าย NPC AI ไปฝั่ง server
- เครื่องอื่นเข้าไม่ได้ทั้งที่ LAN เดียวกัน → เช็ค Windows Firewall (ต้อง Allow python ตอนสตาร์ตครั้งแรก)
