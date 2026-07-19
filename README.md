# DataX Town

เกมออฟฟิศเสมือนแนว Gather Town — จำลองบริษัท **DataX** ชั้น 7 อาคาร **SCB Park West B**

## เริ่มเล่น (multiplayer)

```powershell
python game/server.py
```

- เครื่องนี้: http://localhost:8700 → ใส่ชื่อ เลือกตัวละคร+สีผม/สีเสื้อ แล้วเข้าออฟฟิศ
- **ชวนคนอื่น:** ให้เปิด `http://<ip-เครื่องนี้>:8700` จากเครื่องใน LAN เดียวกัน
  (สคริปต์พิมพ์ URL ให้ตอนสตาร์ต; ถ้า Windows Firewall ถามให้กด Allow)
- ทุกคนจะเห็นกันเดินไปมา แชตกันตามระยะใกล้ไกล — ต้องมีแค่ Python 3 ไม่ต้องใช้ Node.js
- `python game/serve.py` = โหมดเล่นคนเดียว (ไม่มี multiplayer)

## ชวนคนนอกวง LAN (ผ่านอินเทอร์เน็ต)

เปิดอีกหน้าต่างควบคู่กับ server.py:

```powershell
python game/tunnel.py
```

ครั้งแรกจะดาวน์โหลด `cloudflared.exe` (~60MB) ไว้ที่ `bin/` อัตโนมัติ จากนั้นจะได้ลิงก์
`https://xxxx.trycloudflare.com` — แชร์ให้ใครก็ได้ เข้าจากที่ไหนก็ได้ (รองรับ wss ในตัว)

- URL เปลี่ยนใหม่ทุกครั้งที่รัน และอยู่ได้เท่าที่หน้าต่าง tunnel เปิดอยู่
- กันคนนอกบริษัท: รันเซิร์ฟเวอร์ด้วยรหัสเข้าห้อง แล้วแชร์ลิงก์พร้อม key เท่านั้น

  ```powershell
  python game/server.py --key datax2026
  python game/tunnel.py --key datax2026   # จะพิมพ์ลิงก์พร้อม ?key= ให้เลย
  ```

## ในเกมมีอะไร

- แผนที่ pixel art ชั้น 7: โถงลิฟต์, Play Back Stage, ปีกทำงาน West/East, Breakout, Meeting Suite, Phone Booth
- เดินด้วย WASD/ลูกศร (Shift วิ่ง), กล้องตาม, ซูม +/-, minimap (M)
- แชตด้วย Enter — เห็น/ได้ยินกันตามระยะใกล้ไกลแบบ Gather Town; ห้องประชุมและ Phone Booth เสียงไม่รั่วออกนอกห้อง
- เพื่อนร่วมงาน NPC 8 คนเดินไปมาและทักทายเมื่อเข้าใกล้

## โครงสร้าง

- `docs/GAME_DESIGN.md` — เอกสารออกแบบระบบทั้งหมด (อ่านก่อนแก้)
- `game/` — ตัวเกม (vanilla JS + Canvas, ไม่มี build step)
- `pixel-art/scb-park-west-b-floor7/` — source of truth ของแผนที่ (`build.py`)
- `.claude/skills/dataxtown-dev/` — skill สำหรับให้ Claude กลับมาแก้เกมได้โดยไม่ต้องเริ่มคิดใหม่
