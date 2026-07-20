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
hooks บน window: `__music` (เพลง), `__world` (world ทั้งก้อน — ใช้ teleport/เช็ค quests/points ได้
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
| sprite สัตว์เลี้ยง (18 แถว × 2 เฟรม: 0-14 พื้นฐาน, 15-17 legendary — ลำดับต้องตรง pets_data.js) | `game/assets/build_pets.py` → `pets.png` |
| เมนู 🐾 เปลี่ยน/ตั้งชื่อสัตว์เลี้ยงในเกม + lock legendary ที่ยังไม่ปลดล็อก | `game/js/pet_menu.js` |
| สัตว์เลี้ยงเดินเล่น+โผล่ทริกในห้องส่วนตัว (แยกจาก trail-follow นอกห้อง) | `updateRoomPet`/`drawRoomPet` ใน `game/js/decor.js` |
| multiplayer server + protocol (JSON: join/move/chat) | `game/server.py` |
| **ผังชั้น 7** (ห้อง, โต๊ะ, collision, spawn, โซน) | `pixel-art/scb-park-west-b-floor7/build.py` |
| หน้าตา avatar | `game/assets/build_avatars.py` |

## Workflow แก้แผนที่ (สำคัญ — มี copy step)

**เกมใช้ `scb_floor7_map_large3x.json` โหมด COMPACT — grid 32×32, tileSize 24px (ภาพ 768×768),
เดินได้ทุกช่องในกรอบตึก (ชนเฉพาะเปลือกอาคารเฉียง — เดินทะลุเฟอร์นิเจอร์ได้โดยตั้งใจ)**
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

1. แก้ `game/assets/build_avatars.py` — **16 แถว**: rows 0-7 ชาย, rows 8-15 หญิง (8 สีเดียวกัน,
   หญิง = ผมยาวข้างแก้ม + กระโปรง ใน `draw_frame(..., female=True)`), 4 ทิศ × 3 เฟรม, เฟรม 16×24
2. `python game/assets/build_avatars.py` → ได้ `avatars.png` + `avatars.json` ใหม่
3. ถ้าเปลี่ยนจำนวน variant/ขนาดเฟรม ต้องอัปเดต `CONFIG` ใน `game/js/data.js` ให้ตรง
   (`avatarVariants` = แถวทั้งหมด, `colorsPerGender` = แถวต่อเพศ; variant index = gender×8+color)

### ระบบ customize สีผม/สีเสื้อ (palette swap)

- `game/js/avatar.js` → `makeCustomSheet(world, variant, {hair, shirt})` คืน canvas 1 แถว 12 เฟรม
  โดย find-and-replace pixel ที่ตรงกับสี key ของ variant นั้น (สีเงาเสื้อ = สีเสื้อใหม่ × 0.7)
- สี key ต่อ variant อ่านจาก `game/assets/avatars.json` ซึ่ง **generate จาก build_avatars.py** —
  ห้ามแก้ json ตรง ๆ และถ้าเปลี่ยนสีใน `VARIANTS` ของ python ต้องรัน build ใหม่เสมอ ไม่งั้น recolor พัง
  (การ swap เทียบสีแบบ exact-match ต่อ pixel)
- entity ที่มี `ent.sheet` (canvas เฉพาะตัว) → `render.js` ใช้แทน sheet รวม (sy=0);
  remote player ในอนาคตใช้กลไกเดียวกันได้เลย
- พาเลตที่ให้เลือกอยู่ที่ `HAIR_COLORS` / `SHIRT_COLORS` ใน `data.js`; ตัวเลือกถูกจำใน
  `localStorage["dataxtown.avatar"]` (name, variant, hair, shirt)
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

`room-canvas` วาดที่ 384×288 แต่ทุกพิกัด (ตำแหน่งบอท/สัตว์เลี้ยง/เป้าหมายเดิน) เก็บเป็น
พิกัด **base** (192×144, ยังไม่คูณ `S=2`) แล้วค่อยคูณ `S` ตอนวาดจริงเท่านั้น — ถ้าเผลอ spawn
ตำแหน่งเป็นพิกัด scaled (เช่น y > 144) วัตถุจะไปโผล่นอกกรอบห้องโดยไม่มี error ให้เห็น (เจอบั๊กนี้
ตอนทำสัตว์เลี้ยงในห้อง — spawn y:190 เกิน 144 ไปแล้ว) ก่อนเพิ่มวัตถุเคลื่อนไหวใหม่ในห้อง
ให้เช็คช่วง x∈[16,176] y∈[62,136] (ช่วงที่ `updateRoomPet`/`updateBot` สุ่มเป้าหมายจริง)

## Multiplayer (เฟส 2 — ใช้งานได้แล้ว, มี 2 โหมด)

**โหมด Firebase (ปัจจุบัน)**: `game/js/firebase-config.js` มี config → `net_firebase.js` ใช้
Realtime Database (`rooms/main/players/<uid>`, `rooms/main/chat`) ผ่าน SDK จาก gstatic CDN
(pin เวอร์ชันใน `SDK` const) — ไม่ต้องมีเซิร์ฟเวอร์เอง, onDisconnect ลบผู้เล่นอัตโนมัติ,
uid สุ่มเก็บใน `localStorage["dataxtown.uid"]` (ไม่ใช้ Firebase Auth)
- Rules อยู่ที่ `docs/firebase-rules.json` — วางใน console แท็บ Rules; เผื่อโครง points/leaderboard ไว้แล้ว (client เขียนไม่ได้)
- ทดสอบ/จำลองผู้เล่นผ่าน REST ได้ตรง ๆ: `PUT <databaseURL>/rooms/main/players/<id>.json`
- ตั้ง `FIREBASE_CONFIG = null` = กลับไปใช้ WebSocket server ในเครื่องแบบเดิม

**โหมด WebSocket ในเครื่อง (fallback/dev)**: รายละเอียดด้านล่าง

- Server = `game/server.py` (stdlib ล้วน: http.server + RFC6455 เขียนเองในไฟล์) — protocol อยู่ใน docstring
- Remote player = entity `kind:"remote"` ใน `net.js`; ตำแหน่ง lerp เข้าหาค่าล่าสุด (`tx`,`ty`)
- แชตของ remote วิ่งผ่าน `speak()` → กติกา canHear ทำงานอัตโนมัติ ห้าม bypass
- `world.onChat` ถูก wrap ต่อกันเป็นลูกโซ่ (ui ก่อน แล้ว net ต่อท้ายตอน ws open) — ถ้าเพิ่ม listener ใหม่ให้ wrap แบบเดียวกัน อย่า assign ทับ
- NPC เป็น local ต่อ client (ไม่ sync) — จะ sync จริงต้องย้าย NPC AI ไปฝั่ง server
- เครื่องอื่นเข้าไม่ได้ทั้งที่ LAN เดียวกัน → เช็ค Windows Firewall (ต้อง Allow python ตอนสตาร์ตครั้งแรก)
