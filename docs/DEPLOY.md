# DataX Town — ทางเลือกการ deploy ให้ได้ URL ถาวร (ฟรี)

> **คำแนะนำปัจจุบัน: ตัวเลือก B (Firebase)** — เพราะแผนอนาคตมีระบบภารกิจ/คะแนนสะสม/leaderboard
> ซึ่งต้องมี database ถาวรอยู่แล้ว Firebase ให้ครบในที่เดียว (Hosting + Realtime Database ฟรี)
> ส่วน Render แผนฟรีไม่มี persistent storage — ทำ leaderboard ต้องพ่วง database ข้างนอกอยู่ดี

เกมมี 2 ส่วน: **ไฟล์เกม (static)** + **เซิร์ฟเวอร์ multiplayer (WebSocket)**
"URL ถาวรฟรี" ทำได้หลายทาง ต่างกันที่ว่าเอาส่วน multiplayer ไปไว้ที่ไหน

## ตัวเลือก A: Render.com (แนะนำ — โค้ดเดิมทั้งชุด ไม่ต้องแก้อะไร)

รัน `server.py` เดิมบนคลาวด์ → ได้ทั้งเกม+multiplayer ใน URL เดียวแบบถาวร เช่น
`https://dataxtown.onrender.com`

ขั้นตอน (เตรียมไฟล์ `render.yaml` + `requirements.txt` ไว้ให้แล้ว):
1. push โปรเจกต์นี้ขึ้น GitHub (private ได้)
2. สมัคร render.com (ล็อกอินด้วย GitHub, ฟรี ไม่ต้องใส่บัตร)
3. กด **New → Blueprint** → เลือก repo → Deploy — จบ ได้ URL ถาวรทันที
4. อัปเดตเกม = push commit ใหม่ → Render deploy ให้อัตโนมัติ

ข้อจำกัดแผนฟรี: ไม่มีใครเข้า ~15 นาที เซิร์ฟเวอร์จะหลับ — คนแรกที่เปิดต้องรอ ~1 นาทีให้ตื่น
(ระหว่างใช้งานปกติไม่หลับ) · อยากตั้งรหัสห้อง: เพิ่ม `--key <รหัส>` ต่อท้าย startCommand ใน render.yaml

## ตัวเลือก B: Firebase (ฟรีเหมือนกัน แต่ต้องเขียนระบบ multiplayer ใหม่)

Firebase Hosting โฮสต์ได้เฉพาะไฟล์เกม — รัน server.py ไม่ได้ ดังนั้นส่วน multiplayer ต้อง
เปลี่ยนไปใช้ **Firebase Realtime Database** แทน (sync ตำแหน่ง/แชตผ่าน database, ไม่มีเซิร์ฟเวอร์)

- ข้อดี: ไม่มีอาการหลับแบบ Render, URL สวย `https://<ชื่อ>.web.app`
- ข้อเสีย: ต้องเขียน net layer ใหม่ (~1 ไฟล์ ทำแทนให้ได้), และการ deploy ต้องใช้
  Firebase CLI ซึ่งต้องติดตั้ง Node.js (เครื่องนี้ยังไม่มี) — เลี่ยงได้โดยโฮสต์ไฟล์เกมบน
  GitHub Pages แทน (push ด้วย git ได้เลย) แล้วใช้ Firebase เฉพาะ Realtime Database
- สิ่งที่ต้องทำเอง: สร้างโปรเจกต์ที่ console.firebase.google.com → เปิด Realtime Database
  → คัดลอก `firebaseConfig` มาให้ Claude เขียน adapter + ทดสอบให้
- **รองรับแผนอนาคต**: ภารกิจ/คะแนนสะสม/leaderboard เก็บใน Realtime Database ได้เลย
  (โครง: `players/<id>/points`, `leaderboard/`, `quests/`) — ไม่ต้องเพิ่มบริการอื่นอีก

## ตัวเลือก C: Cloudflare Named Tunnel (เครื่องนี้ต้องเปิดตลอด)

แบบเดียวกับ tunnel.py ที่ใช้อยู่ แต่ URL คงที่ — ต้องมีบัญชี Cloudflare + **โดเมนของตัวเอง**
(เช่น dataxtown.yourdomain.com) เกม/เซิร์ฟเวอร์ยังรันบนเครื่องนี้ จึงเหมาะกับใช้ชั่วคราวเท่านั้น

## สรุปเปรียบเทียบ

| | A. Render | B. Firebase/GH Pages + RTDB | C. Named Tunnel |
|---|---|---|---|
| URL ถาวร | ✅ .onrender.com | ✅ .web.app / .github.io | ✅ โดเมนตัวเอง |
| ฟรี | ✅ (หลับเมื่อ idle) | ✅ | ✅ แต่ต้องซื้อโดเมน |
| แก้โค้ด | ไม่ต้อง | เขียน net ใหม่ | ไม่ต้อง |
| เครื่องนี้ต้องเปิด | ไม่ | ไม่ | ✅ ต้องเปิด |
