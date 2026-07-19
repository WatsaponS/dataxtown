# DataX Town — Game Design Document

เกมออฟฟิศเสมือนแนว Gather Town จำลองบริษัท **DataX** ชั้น 7 อาคาร **SCB Park West B**
ผู้เล่นบังคับ avatar เดินในแผนที่ top-down pixel art พบปะเพื่อนร่วมงาน คุยกันตามระยะใกล้–ไกล
และใช้ห้องประชุม/โซนกิจกรรมเหมือนออฟฟิศจริง

> แผนที่เป็นงานออกแบบเชิงเกมเท่านั้น ไม่ใช่แบบก่อสร้างหรือแผนหนีไฟ

---

## 1. เป้าหมายและขอบเขต

| เฟส | ขอบเขต | สถานะ |
|-----|--------|-------|
| MVP (เฟสนี้) | เดินในแผนที่, กล้องตาม, ชนกำแพง, โซนปฏิสัมพันธ์, แชต + bubble, NPC เพื่อนร่วมงาน, proximity ring, minimap | ✅ สร้างแล้ว |
| เฟส 2 | Multiplayer จริงผ่าน WebSocket (หลายคนเห็นกันสด, LAN) | ✅ สร้างแล้ว (ดู §7) |
| เฟส 3 | เสียง/วิดีโอตามระยะ (WebRTC), ปฏิทิน/จองห้อง, สถานะ Busy/Available | แนวคิด |

## 2. สถานที่: SCB Park West B ชั้น 7

ผังอ้างอิงจาก `pixel-art/scb-park-west-b-floor7/` — เกมใช้ **`scb_floor7_map_large3x` โหมด COMPACT
(กริด 32×32 ช่อง, tile 24px = ภาพ 768×768)** ฉบับละเอียด: เฟอร์นิเจอร์ครบ (โต๊ะ+จอ, โซฟา,
pantry มีตู้เย็น), ห้องผู้บริหารแยกเป็นโซนของตัวเอง
**Collision แบบเดินอิสระ**: เดินได้ทุกช่องภายในกรอบตึก ชนเฉพาะเปลือกอาคารเฉียง (ตามสไตล์ Gather
ที่เดินทับเฟอร์นิเจอร์ได้) — generate จาก `build.py` ด้วย `DATAXTOWN_SPACE_SCALE=3` + `DATAXTOWN_COMPACT=1`

- **โถงลิฟต์ / ทางเข้าหลัก** — กึ่งกลางแผนที่, จุดเกิดหลัก (`main_entrance`)
- **Play Back Stage** (สีทอง ด้านบน) — โซน presentation สำหรับ town hall / demo day
- **ห้อง Collaboration ด้านบน** (สีน้ำเงิน) — ห้องประชุมย่อย
- **ปีกซ้าย/ขวา** (สีเขียว) — โต๊ะทำงานทีม West / East, เดินตามช่องทางเดินระหว่างแถวโต๊ะ
- **Breakout ซ้าย/ขวา** (สีชมพู) — โซน social นั่งเล่นคุยเล่น
- **Meeting Suite ด้านล่าง** — แถวห้องประชุม เป็น **private audio zone**
- **Phone Booths** (สีม่วง มุมล่างขวา) — คุยส่วนตัว 1–2 คน

## 3. ระบบหลัก (Core Systems)

### 3.1 การเคลื่อนที่และการชน
- เดินแบบ smooth (pixel-based) ด้วย WASD / ลูกศร, ความเร็ว ~90 px/วินาที (วิ่ง Shift ×1.6)
- ตรวจชนด้วย **collision grid** ระดับ tile จาก `scb_floor7_map.json` (`0` เดินได้, `1` ตัน)
- hitbox ของ avatar คือกล่องเล็กที่ "เท้า" ทำให้เดินเฉียดขอบโต๊ะได้ธรรมชาติ
- แยกแกน X/Y ตอนตรวจชน (slide ไปตามกำแพงได้ ไม่ติดตะกุกตะกัก)

### 3.2 กล้องและการเรนเดอร์
- กล้องตามผู้เล่น, ล็อกไม่ให้เกินขอบแผนที่, ซูมเป็นจำนวนเต็ม (integer zoom) ปรับด้วยปุ่ม +/-
- เรนเดอร์ผ่าน Canvas 2D, `imageSmoothingEnabled = false` (nearest-neighbor) รักษาความคมของ pixel art
- ลำดับวาด: แผนที่ → ตัวละคร (เรียงตามค่า y ให้บังกันถูกต้อง) → bubble/ป้ายชื่อ → UI

### 3.3 Avatar
- สไปรต์ 16×24 px, 4 ทิศ (down/left/right/up) × 3 เฟรม (idle + เดิน 2 เฟรม)
- **เลือกเพศได้**: ชาย 8 สี (rows 0-7) / หญิง 8 สี (rows 8-15 — ผมยาว + กระโปรง);
  ปุ่มเพศในหน้า start จะสลับชุดตัวละครให้เลือก, ป้ายชื่อลอยเหนือหัว
- **Customize สีผม/สีเสื้อ**: หน้า start มีแถบสี (ผม 10 สี, เสื้อ 12 สี + ปุ่ม ✕ กลับสีเดิม)
  พร้อม preview สด — ทำงานด้วย palette swap ฝั่งเบราว์เซอร์ (`avatar.js`) เทียบสี key
  ของแต่ละ variant จาก `avatars.json` แล้วสร้าง spritesheet เฉพาะตัวเป็น canvas
- ตัวเลือก (ชื่อ, ตัวละคร, สีผม, สีเสื้อ) ถูกจำใน localStorage — เข้าเกมรอบหน้าไม่ต้องตั้งใหม่
- spritesheet สร้างจาก `game/assets/build_avatars.py` (Pillow) — แก้สคริปต์แล้วรันใหม่ ห้ามแก้ PNG ตรง ๆ

### 3.4 โซนปฏิสัมพันธ์ (Interaction Zones)
อ่านจาก `interactionZones` ในแผนที่ JSON — แต่ละโซนมี `type`:

| type | พฤติกรรม |
|------|----------|
| `presentation` | เข้าโซนแล้วขึ้นแบนเนอร์ "🎤 Play Back Stage"; ใครอยู่ในโซนได้ยิน/เห็นแชตกันหมด (จำลองโหมด spotlight ของ Gather) |
| `social` | โซนพักผ่อน แชตระยะปกติ มีแบนเนอร์บอกชื่อโซน |
| `private_audio` | แชต/เสียงไม่รั่วออกนอกโซน — คนนอกโซนไม่เห็น bubble ของคนในโซน และกลับกัน |

### 3.5 Proximity (หัวใจแบบ Gather Town)
- ผู้เล่นมี **รัศมีสนทนา** (~4 tiles) วาดเป็นวงจาง ๆ รอบตัว
- ตัวละครอื่นที่อยู่ในรัศมี = "ได้ยินกัน" → bubble แชตแสดงชัด, อยู่ไกล = จางลง/ซ่อน
- ถ้าทั้งคู่อยู่ใน `private_audio` โซนเดียวกัน ให้ถือว่าได้ยินกันเสมอ (ทั้งห้อง)

### 3.6 แชต
- กด `Enter` เปิดช่องพิมพ์ → ข้อความขึ้นเป็น bubble เหนือหัว ~6 วินาที + ลง log ด้านซ้าย
- กติกาการมองเห็นตาม §3.4–3.5 (ระยะ + โซน)

### 3.7 NPC ทีมผู้บริหาร
- NPC คือผู้บริหาร DataX 5 คน: **พี่หนุ่ม (CEO)** บนเวที Play Back, **พี่อ้อ (CTO, หญิง)** ปีกตะวันตก,
  **พี่แตน (CDO, หญิง)** ปีกตะวันออก, **พี่หว่า (CCO)** breakout ตะวันออก, **คุณ TT (CFO)** meeting suite
- แต่ละคนมีบทพูดให้กำลังใจตามบทบาท 4-5 ประโยค สุ่มพูดเมื่อผู้เล่นเข้าใกล้ (ผ่านกติกา canHear)
- เดินสุ่มแบบมีจังหวะ (เดิน → หยุดพัก → เดิน) เคารพ collision grid เดียวกับผู้เล่น
- นิยามใน `game/js/data.js` (ชื่อ, ตำแหน่ง, เพศผ่าน variant, จุดประจำ, บทพูด) — เพิ่ม/แก้ได้ที่ไฟล์เดียว

### 3.8 เพลงประกอบ
- ลูป lo-fi/chiptune 8 บาร์ @96 BPM **สังเคราะห์สดด้วย Web Audio API** (`audio.js`) — ไม่มีไฟล์เสียง
- โครงเพลง: Fmaj7 → G7 → Em7 → Am7, เบส triangle, คอร์ดสแต็บ off-beat แบบ roll,
  เมโลดี้ square โปร่ง ๆ 2 รอบไม่ซ้ำกัน, กลองจาก noise (hat/rim) + sine kick, สวิง 8th เบา ๆ
- เริ่มเล่นหลัง user gesture แรก (นโยบาย autoplay), master volume 0.14 ให้เป็น background
- ปุ่ม 🎵/🔇 ข้าง minimap หรือคีย์ B — สถานะจำใน `localStorage["dataxtown.music"]`

### 3.9 Quest & Leaderboard
- จุด quest ❓ สุ่มตำแหน่งบน tile ที่เดินได้ 3 จุด (เห็นบน minimap ด้วย) — เดินเข้าใกล้กด E/แตะป้าย
- Quiz Databricks: สุ่ม 3 ข้อจากคลัง 100 ข้อ (`quiz_data.js`) แบบ choice A-D,
  **ตำแหน่งตัวเลือกถูกสลับใหม่ทุกครั้ง** กันจำ pattern เฉลย, ตอบถูกข้อละ 10 คะแนน
- ทำเสร็จจุดนั้นหายและสุ่มเกิดจุดใหม่ — เล่นซ้ำได้เรื่อย ๆ
- คะแนนสะสมตามชื่อผู้เล่น เก็บที่ `leaderboard/<uid>` ใน Firebase (resume ข้ามเซสชันด้วย uid เดิม)
- Leaderboard เปิดดูได้จากปุ่ม 🏆 บน HUD หรือคีย์ L — เรียงคะแนน top 20 ไฮไลต์ตัวเอง
- จุด quest เป็น local ต่อ client (แต่ละคนเห็นตำแหน่งต่างกัน) — คะแนนเท่านั้นที่แชร์กลาง

### 3.10 UI
- **Minimap** มุมขวาบน (วาดจาก collision grid + จุดผู้เล่น/NPC)
- แบนเนอร์ชื่อโซนเมื่อเข้า/ออก, รายชื่อคนออนไลน์, คำแนะนำปุ่มมุมล่าง

## 4. โครงสร้างโปรเจกต์

```
DataXTown/
├── docs/GAME_DESIGN.md          ← เอกสารนี้
├── pixel-art/scb-park-west-b-floor7/
│   ├── build.py                 ← source of truth ของแผนที่ (ต้องใช้ pixelstudio, ดูหมายเหตุ)
│   ├── scb_floor7_map.png       ← ภาพแผนที่ 512×512
│   └── scb_floor7_map.json      ← collision + spawn + zones (format: DataXTown social-map v1)
├── game/
│   ├── index.html               ← หน้าเกม (เปิดผ่าน http server เท่านั้น)
│   ├── server.py                ← ★ ตัวหลัก: multiplayer server (static + WebSocket, stdlib ล้วน)
│   ├── serve.py                 ← static server เฉย ๆ (เล่นคนเดียว/dev)
│   ├── css/style.css
│   ├── js/
│   │   ├── main.js              ← bootstrap + game loop
│   │   ├── data.js              ← ค่าคงที่, รายชื่อ NPC, ป้ายโซน, พาเลตสี (แก้คอนเทนต์ที่นี่)
│   │   ├── world.js             ← โหลดแผนที่, collision, โซน
│   │   ├── entities.js          ← Player / NPC / physics / proximity
│   │   ├── avatar.js            ← palette swap สีผม/สีเสื้อ
│   │   ├── net.js               ← multiplayer client (remote players, sync, interpolation)
│   │   ├── render.js            ← กล้อง + วาดทุกอย่าง
│   │   └── ui.js                ← แชต, minimap, แบนเนอร์, รายชื่อ
│   ├── tools/
│   │   ├── bot_client.py        ← ผู้เล่นจำลอง (ทดสอบ multiplayer)
│   │   └── cdp_shot.py          ← screenshot ผ่าน DevTools Protocol (รอเวลาจริงได้)
│   └── assets/
│       ├── build_avatars.py     ← สร้าง avatars.png (Pillow)
│       ├── avatars.png          ← spritesheet 8 ตัวละคร
│       ├── scb_floor7_map.png   ← คัดลอกจาก pixel-art/ (อย่าแก้ที่นี่)
│       └── scb_floor7_map.json  ← คัดลอกจาก pixel-art/
└── .claude/skills/dataxtown-dev/  ← skill สำหรับกลับมาแก้เกมภายหลัง
```

**Data flow:** `build.py` → PNG+JSON → คัดลอกเข้า `game/assets/` → เกมอ่านตอนโหลด
แก้แผนที่ = แก้ `build.py` → รัน → คัดลอกไฟล์ใหม่ (มีขั้นตอนละเอียดใน skill)

## 5. รูปแบบข้อมูลแผนที่ (social-map v1)

```jsonc
{
  "format": "DataXTown social-map v1",
  "tileSize": 16, "width": 32, "height": 32,
  "art": "scb_floor7_map.png",
  "collision": { "blocked": 1, "walkable": 0, "data": [[...32×32...]] },
  "spawnPoints": [ { "id": "main_entrance", "tile": [16, 23] } ],
  "interactionZones": [
    { "id": "playback", "type": "presentation", "rect": [x, y, w, h] }
  ]
}
```

เกมเขียนให้ **ไม่ผูกกับแผนที่ใดแผนที่หนึ่ง** — เพิ่มชั้นอื่น/อาคารอื่นได้โดยทำโฟลเดอร์
pixel-art ใหม่ที่ export format เดียวกัน แล้วชี้ path ใน `data.js`

## 6. เหตุผลเชิงเทคนิค

- **Vanilla JS + Canvas, ไม่มี build step** — เครื่องนี้ไม่มี Node.js; ทั้งเกมรันด้วยเบราว์เซอร์ + `python -m http.server` เท่านั้น ทำให้แก้ไฟล์แล้วรีเฟรชเห็นผลทันที
- ES modules แยกไฟล์ตามหน้าที่ → แก้เฉพาะจุดได้โดยไม่กระทบส่วนอื่น
- สถานะเกมรวมอยู่ใน object เดียว (`world`) → ต่อ multiplayer ภายหลังคือ sync object นี้

## 7. Multiplayer (เฟส 2 — ✅ ใช้งานได้แล้ว)

- **Server:** `game/server.py` — Python stdlib ล้วน (`http.server` + WebSocket RFC 6455 ที่เขียนเองในไฟล์)
  เสิร์ฟไฟล์เกมและ endpoint `/ws` ในพอร์ต 8700 เดียวกัน, bind `0.0.0.0` ให้เครื่องอื่นใน LAN เข้าได้
  (สคริปต์พิมพ์ URL สำหรับ LAN ตอนสตาร์ต; Windows Firewall ต้องกด Allow ครั้งแรก)
- **Protocol** (JSON text frames — ดู docstring บนหัว `server.py`):
  client → server: `join` (โปรไฟล์+สี+ตำแหน่ง), `move` (throttle 10/วินาที เฉพาะตอนเปลี่ยน), `chat`
  server → client: `welcome` (id + roster), `join`, `leave`, `move`, `chat`
- Server เป็น authoritative เรื่องรายชื่อ/id; ตำแหน่งเป็น client-authoritative (พอสำหรับเกมออฟฟิศ ไม่กัน cheat)
- **Client:** `game/js/net.js` — remote player คือ entity `kind:"remote"` ที่ตำแหน่ง lerp เข้าหาค่าล่าสุดจากเซิร์ฟเวอร์
  สีผม/สีเสื้อ custom ถูกส่งไปกับ `join` แล้ว render ฝั่งรับด้วย palette swap ตัวเดียวกับผู้เล่นเอง
- แชตของ remote วิ่งผ่าน `speak()` ปกติ → กติกา canHear (โซนส่วนตัว/ระยะ §3.4–3.5) ใช้กับคนจริงโดยอัตโนมัติ
- ต่อเซิร์ฟเวอร์ไม่ได้หรือหลุด → เกมเล่นออฟไลน์ต่อได้ พร้อมข้อความแจ้งใน chat log
- ข้อจำกัดที่ตั้งใจ: NPC เป็น local ของแต่ละ client (ไม่ sync ตำแหน่ง/บทพูดข้ามจอ) — ยอมรับได้ในเฟสนี้
- ทดสอบอัตโนมัติ: `tools/bot_client.py` (ผู้เล่นจำลอง, มี `--tls` สำหรับทดสอบผ่านอุโมงค์) + `tools/cdp_shot.py` (screenshot แบบรอเวลาจริง)

### การเข้าจากนอกวง LAN (internal release)

- `game/tunnel.py` เปิด **Cloudflare Quick Tunnel** ชี้เข้า localhost:8700 → ได้ลิงก์
  `https://xxx.trycloudflare.com` ที่ใครก็เข้าได้ (ดาวน์โหลด `cloudflared.exe` ไว้ที่ `bin/` อัตโนมัติครั้งแรก)
- ฝั่งเกมเลือก `wss://` อัตโนมัติเมื่อหน้าเสิร์ฟผ่าน https (`net.js`)
- **Access key** (เลือกใช้): `server.py --key <รหัส>` → client ต้องแนบ key (มากับ URL param `?key=`)
  ใน join message ไม่งั้นเซิร์ฟเวอร์ตอบ `{t:"denied"}` และตัดการเชื่อมต่อ — กันคนนอกที่เดาลิงก์
- ข้อจำกัด Quick Tunnel: URL สุ่มใหม่ทุกครั้ง อายุเท่าโปรเซส tunnel; ต้องการ URL ถาวร →
  Cloudflare named tunnel (มีบัญชี+โดเมน) หรือย้ายไป host บน VM/cloud

## 8. ปุ่มควบคุม

| ปุ่ม | การทำงาน |
|------|-----------|
| WASD / ลูกศร | เดิน |
| Shift | วิ่ง |
| Enter | เปิด/ส่งแชต (Esc ยกเลิก) |
| + / - | ซูมกล้อง |
| M | เปิด/ปิด minimap |

### มือถือ / จอสัมผัส

- ตรวจจับด้วย `pointer: coarse` (บังคับเปิดได้ด้วย `?touch=1` ไว้ทดสอบบนเดสก์ท็อป)
- **Virtual joystick** มุมล่างซ้าย (แบบ analog — ดันสุดขอบ = วิ่ง), **ปุ่ม 💬** มุมล่างขวาเปิด/ส่งแชต
- จอแคบ (≤700px) หรือจอเตี้ย (≤520px เช่นมือถือแนวนอน): minimap ย่อเหลือ 96px,
  รายชื่อออนไลน์ยุบเป็น badge `👥 N` (แตะเพื่อกางรายชื่อ), chat log แคบ/เตี้ยลง,
  ซ่อน hint คีย์บอร์ด, หน้า start ปรับกว้าง 92vw เลื่อนแนวตั้งได้
- viewport ปิด pinch-zoom (`user-scalable=no`) + `touch-action: none` บน canvas/joystick กันหน้าเลื่อน
- ใช้ `100dvh` กันปัญหา address bar ของเบราว์เซอร์มือถือ
