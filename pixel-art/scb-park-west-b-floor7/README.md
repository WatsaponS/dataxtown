# SCB Park West B — Floor 7 social-game concept

ต้นแบบแผนที่ Pixel Art แบบ top-down ซึ่งอ้างอิงการจัดโซนจากแบบแปลนชั้น 7 และปรับให้เหมาะกับเกมพบปะออนไลน์แนว Gather

## Design

- กริด 32×32 ช่อง; 1 ช่อง = 16×16 พิกเซล
- กรอบอาคารเป็นทรงลิ่มคล้ายสามเหลี่ยม: ด้านบนแคบ ผนังสองข้างเฉียง และฐานด้านล่างกว้าง ตามบุคลิกของแบบแปลนต้นฉบับ
- โถงลิฟต์และทางเข้าหลักอยู่กึ่งกลาง ทำหน้าที่เป็นจุดเกิดหลัก
- ทางเดินวนรอบ service core ลดทางตันและรองรับการเดินสวนกัน
- ปีกซ้ายและขวาเป็นพื้นที่ทำงาน พร้อมช่องทางเดินภายใน
- พื้นที่ทำงานใช้พื้นสีขาว ไม่มีต้นไม้ และมี workstation 4 แถว แถวละ 4 ที่นั่ง รวมจอ monitor 16 จุด
- Play Back เป็นพื้นที่กิจกรรมรวม ส่วนห้องประชุมและ Phone Booth ใช้เป็น private-audio zones
- สีเขียวหมายถึงพื้นที่ทำงาน, น้ำเงินหมายถึงห้องปิด, ชมพูหมายถึง breakout และสีทองหมายถึงพื้นที่ประชุม/กิจกรรม

## Files

- `scb_floor7_map.png` — ภาพเกมต้นฉบับ 512×512 พิกเซล
- `scb_floor7_map@2x.png` — ภาพขยายด้วย nearest-neighbor
- `scb_floor7_map.json` — collision grid, spawn points และ interaction zones
- `build.py` — source of truth สำหรับสร้างไฟล์ทั้งหมดใหม่

สร้างไฟล์ใหม่ด้วย `python build.py` จากโฟลเดอร์นี้ ห้ามแก้ PNG โดยตรง ให้แก้ `build.py` แล้ว render ใหม่

เวอร์ชันทดลองที่เพิ่มพื้นที่ต่อช่องเป็น 2 เท่า (32×32 พิกเซลต่อช่อง) สร้างด้วย PowerShell:

`$env:DATAXTOWN_SPACE_SCALE='2'; python build.py; Remove-Item Env:DATAXTOWN_SPACE_SCALE`

เวอร์ชัน Large 3x ใช้พื้นที่ต่อช่อง 48×48 พิกเซล, workstation 32 จุด และ service core ขนาดเล็กลง:

`$env:DATAXTOWN_SPACE_SCALE='3'; python build.py; Remove-Item Env:DATAXTOWN_SPACE_SCALE`

> แผนที่นี้เป็นงานออกแบบสำหรับเกม ไม่ใช่แบบก่อสร้างหรือแผนหนีไฟ
