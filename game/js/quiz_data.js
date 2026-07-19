// คลังข้อสอบ Databricks 100 ข้อ — ระบบ quest สุ่มมาครั้งละ 3 ข้อ
// รูปแบบ: { q: คำถาม, c: [ตัวเลือก A, B, C, D], a: index คำตอบถูก (0-3) }

export const QUIZ = [
  // ---------- พื้นฐาน Spark / Databricks (1-10)
  { q: "Databricks ก่อตั้งโดยทีมผู้สร้าง engine ตัวใด?", c: ["Hadoop MapReduce", "Apache Spark", "Apache Flink", "Presto"], a: 1 },
  { q: "ภาษาใดที่ notebook ของ Databricks ไม่รองรับ?", c: ["Python", "R", "SQL", "PHP"], a: 3 },
  { q: "magic command สำหรับเปลี่ยน cell เป็นภาษา SQL คือ?", c: ["%%sql", "%sql", "#sql", "--sql"], a: 1 },
  { q: "RDD ย่อมาจากอะไร?", c: ["Rapid Data Delivery", "Remote Distributed Disk", "Resilient Distributed Dataset", "Reactive Data Design"], a: 2 },
  { q: "Spark DataFrame คืออะไร?", c: ["ไฟล์ CSV ขนาดใหญ่", "ตารางข้อมูลแบบกระจายตัวพร้อม schema", "database ในหน่วยความจำ", "รูปแบบไฟล์ของ Delta"], a: 1 },
  { q: "ข้อใดเป็น wide transformation?", c: ["filter", "select", "groupBy", "withColumn"], a: 2 },
  { q: "Spark ประมวลผล transformation แบบใด?", c: ["eager ทันที", "lazy evaluation", "ตาม schedule", "สุ่มลำดับ"], a: 1 },
  { q: "คำสั่งใดเป็น action ที่ trigger การประมวลผลจริง?", c: ["count()", "select()", "filter()", "withColumnRenamed()"], a: 0 },
  { q: "Spark cluster ประกอบด้วยส่วนหลักคือ?", c: ["master กับ slave database", "driver กับ worker/executor", "web server กับ cache", "queue กับ consumer"], a: 1 },
  { q: "executor ทำหน้าที่อะไร?", c: ["แจกจ่ายงานให้ driver", "รัน task และเก็บข้อมูล cache", "เก็บ metadata ของตาราง", "ตรวจสิทธิ์ผู้ใช้"], a: 1 },
  // ---------- Delta Lake (11-22)
  { q: "Delta Lake เพิ่มความสามารถหลักอะไรให้ data lake?", c: ["ACID transactions", "GPU acceleration", "การส่งอีเมล", "React UI"], a: 0 },
  { q: "Delta Lake เก็บข้อมูลบนไฟล์ format ใด?", c: ["CSV", "JSON", "Parquet", "Avro"], a: 2 },
  { q: "Time Travel ของ Delta ใช้ทำอะไร?", c: ["ตั้งเวลารัน job", "อ่านข้อมูลเวอร์ชันในอดีต", "ย้าย region ของ storage", "เร่งความเร็ว query"], a: 1 },
  { q: "คำสั่งดูประวัติเวอร์ชันของ Delta table คือ?", c: ["SHOW LOG", "DESCRIBE HISTORY", "SELECT VERSION", "LIST VERSIONS"], a: 1 },
  { q: "MERGE INTO ใช้ทำอะไร?", c: ["รวมสอง cluster", "ทำ upsert (update+insert) ข้อมูล", "รวมไฟล์ Parquet", "รวม schema สองตาราง"], a: 1 },
  { q: "VACUUM ใน Delta ทำอะไร?", c: ["ลบไฟล์เก่าที่ไม่ถูกอ้างอิงแล้ว", "ล้าง cache ของ cluster", "ลบตารางทั้งหมด", "บีบอัดข้อมูลเป็น ZIP"], a: 0 },
  { q: "OPTIMIZE ทำอะไรกับ Delta table?", c: ["ลบข้อมูลซ้ำ", "รวมไฟล์เล็ก ๆ เป็นไฟล์ใหญ่", "เข้ารหัสข้อมูล", "สร้าง index แบบ B-tree"], a: 1 },
  { q: "Z-ORDER BY ช่วยอะไร?", c: ["เรียงชื่อไฟล์ตามอักษร", "เร่ง query ที่ filter คอลัมน์นั้นผ่าน data skipping", "แปลงเป็น JSON", "ลดจำนวน executor"], a: 1 },
  { q: "โฟลเดอร์ _delta_log เก็บอะไร?", c: ["ข้อมูลสำรองทั้งตาราง", "transaction log ของตาราง", "log การ login ผู้ใช้", "ไฟล์ config ของ cluster"], a: 1 },
  { q: "Schema enforcement หมายถึง?", c: ["บังคับตั้งชื่อคอลัมน์เป็นอังกฤษ", "ปฏิเสธการเขียนข้อมูลที่ schema ไม่ตรง", "แปลง schema อัตโนมัติเสมอ", "ห้ามแก้ตารางทุกกรณี"], a: 1 },
  { q: "option ใดเปิด schema evolution ตอนเขียน Delta?", c: ["autoSchema", "evolveNow", "mergeSchema", "forceSchema"], a: 2 },
  { q: "Change Data Feed (CDF) ให้ความสามารถอะไร?", c: ["stream เพลงในออฟฟิศ", "อ่านเฉพาะแถวที่ถูกเปลี่ยนแปลงระหว่างเวอร์ชัน", "แจ้งเตือนทางอีเมล", "สำรองข้อมูลอัตโนมัติ"], a: 1 },
  // ---------- Medallion / Lakehouse (23-26)
  { q: "สถาปัตยกรรม Medallion ประกอบด้วยชั้นใด?", c: ["Bronze-Silver-Gold", "Raw-Stage-Mart", "Dev-Test-Prod", "Hot-Warm-Cold"], a: 0 },
  { q: "ชั้น Bronze เก็บข้อมูลแบบใด?", c: ["ข้อมูลดิบตามต้นทาง", "ข้อมูลสรุปสำหรับผู้บริหาร", "เฉพาะข้อมูลที่ผิด", "ข้อมูลที่ถูกลบ"], a: 0 },
  { q: "ชั้น Gold เหมาะกับอะไรที่สุด?", c: ["เก็บ log ดิบ", "ข้อมูลพร้อมใช้สำหรับ BI/ธุรกิจ", "ไฟล์ชั่วคราว", "ข้อมูลที่รอตรวจสอบ"], a: 1 },
  { q: "แนวคิด Lakehouse คือ?", c: ["ย้ายทุกอย่างเข้า data warehouse", "รวมข้อดีของ data lake กับ data warehouse", "ใช้เฉพาะ NoSQL", "เก็บข้อมูลบนเครื่อง local"], a: 1 },
  // ---------- Cluster / Compute (27-32)
  { q: "Job cluster ต่างจาก all-purpose cluster อย่างไร?", c: ["แรงกว่าเสมอ", "สร้างตอนรัน job และดับเองเมื่อเสร็จ", "ใช้ SQL ไม่ได้", "ฟรีไม่คิดเงิน"], a: 1 },
  { q: "Autoscaling ของ cluster ทำอะไร?", c: ["ปรับขนาดหน้าจอ", "เพิ่ม/ลดจำนวน worker ตามโหลดงาน", "อัปเกรด Spark อัตโนมัติ", "ลบข้อมูลเก่า"], a: 1 },
  { q: "ตั้งค่าใดช่วยประหยัดเมื่อลืมปิด cluster?", c: ["auto termination", "auto backup", "auto commit", "auto scaling"], a: 0 },
  { q: "Photon คืออะไร?", c: ["บริการส่งข้อความ", "engine ประมวลผลแบบ vectorized เขียนด้วย C++", "GPU รุ่นใหม่", "ตัวจัดการ secret"], a: 1 },
  { q: "DBU คือหน่วยของอะไร?", c: ["ขนาด storage", "หน่วยคิดค่าประมวลผลของ Databricks", "จำนวนผู้ใช้", "ความเร็วเครือข่าย"], a: 1 },
  { q: "ใช้ spot instance กับ worker เพื่ออะไร?", c: ["เพิ่มความปลอดภัย", "ลดต้นทุน แลกกับโอกาสโดนเรียกคืน", "ทำให้ query แม่นขึ้น", "สำรองข้อมูล"], a: 1 },
  // ---------- Notebook / Workspace (33-38)
  { q: "%run ./other_notebook ทำอะไร?", c: ["เปิดแท็บใหม่", "รัน notebook อื่นและใช้ตัวแปรร่วมกันได้", "ลบ notebook อื่น", "แปลงเป็น Python script"], a: 1 },
  { q: "dbutils.widgets ใช้ทำอะไร?", c: ["วาดกราฟ", "รับ parameter เข้า notebook", "จัดการไฟล์", "ตั้งเวลารัน"], a: 1 },
  { q: "dbutils.secrets.get ใช้เพื่อ?", c: ["สุ่มรหัสผ่านใหม่", "อ่านค่า credential จาก secret scope", "เข้ารหัสตาราง", "ซ่อน cell"], a: 1 },
  { q: "dbutils.fs ใช้จัดการอะไร?", c: ["ไฟล์บน DBFS/storage", "สิทธิ์ผู้ใช้", "เวอร์ชัน Spark", "ค่า config ของ SQL"], a: 0 },
  { q: "display(df) ต่างจาก df.show() อย่างไร?", c: ["ไม่ต่างกัน", "แสดงตาราง interactive และสร้างกราฟได้", "เร็วกว่าเสมอ", "ใช้ได้เฉพาะ SQL"], a: 1 },
  { q: "Databricks Repos เชื่อมต่อกับอะไร?", c: ["Git provider เช่น GitHub/GitLab", "Docker Hub", "Slack", "Jira"], a: 0 },
  // ---------- Jobs / Workflows (39-42)
  { q: "Databricks Workflows ใช้ทำอะไร?", c: ["แก้โค้ดอัตโนมัติ", "ตั้ง schedule และ orchestrate task ต่าง ๆ", "สร้าง dashboard", "จัดการสิทธิ์"], a: 1 },
  { q: "การตั้ง task dependency ใน job มีไว้เพื่อ?", c: ["ประหยัด DBU", "กำหนดลำดับการรันของ task", "เพิ่ม memory", "ป้องกันการลบ job"], a: 1 },
  { q: "อยากให้ task ลองใหม่อัตโนมัติเมื่อ fail ต้องตั้ง?", c: ["retry policy", "auto heal", "failover cluster", "checkpoint"], a: 0 },
  { q: "cron expression ใน job ใช้กำหนดอะไร?", c: ["จำนวน worker", "เวลารันตามรอบ", "ชื่อ notebook", "ภาษาที่ใช้"], a: 1 },
  // ---------- Delta Live Tables (43-45)
  { q: "Delta Live Tables (DLT) คืออะไร?", c: ["ตารางที่ลบไม่ได้", "framework สร้าง data pipeline แบบ declarative", "บริการ streaming วิดีโอ", "ปลั๊กอิน BI"], a: 1 },
  { q: "expectation ใน DLT ใช้ทำอะไร?", c: ["คาดการณ์โหลดงาน", "ตรวจสอบคุณภาพข้อมูลตามเงื่อนไข", "ประเมินค่าใช้จ่าย", "เดา schema"], a: 1 },
  { q: "ใน Python สร้างตาราง DLT ด้วย decorator ใด?", c: ["@dlt.table", "@delta.live", "@table.create", "@spark.table"], a: 0 },
  // ---------- Unity Catalog (46-50)
  { q: "Unity Catalog ใช้ทำอะไรเป็นหลัก?", c: ["เร่งความเร็ว query", "governance และจัดการสิทธิ์ข้อมูลแบบรวมศูนย์", "แปลงไฟล์ CSV", "สร้าง ML model"], a: 1 },
  { q: "ลำดับ namespace ของ Unity Catalog คือ?", c: ["schema.catalog.table", "catalog.schema.table", "table.schema.catalog", "workspace.folder.table"], a: 1 },
  { q: "GRANT SELECT ON TABLE ... TO ... ให้สิทธิ์อะไร?", c: ["แก้ไขข้อมูล", "อ่านข้อมูลในตาราง", "ลบตาราง", "เปลี่ยนเจ้าของ"], a: 1 },
  { q: "data lineage ใน Unity Catalog บอกอะไร?", c: ["ราคาของข้อมูล", "เส้นทางที่มา-ที่ไปของข้อมูลแต่ละตาราง", "อายุของ cluster", "จำนวนผู้ใช้งาน"], a: 1 },
  { q: "ลบ managed table แล้วเกิดอะไรขึ้น?", c: ["ข้อมูลใน storage ถูกลบไปด้วย", "เหลือข้อมูลไว้เสมอ", "ตารางย้ายไป Bronze", "cluster ดับ"], a: 0 },
  // ---------- Databricks SQL (51-54)
  { q: "Databricks SQL เหมาะกับผู้ใช้กลุ่มใดที่สุด?", c: ["นัก analyst ที่ทำงานด้วย SQL/BI", "วิศวกรเครือข่าย", "นักออกแบบ UI", "ทีมกฎหมาย"], a: 0 },
  { q: "SQL Warehouse คืออะไร?", c: ["โกดังเก็บไฟล์ SQL", "compute สำหรับรัน SQL query โดยเฉพาะ", "ตารางระบบ", "รูปแบบไฟล์"], a: 1 },
  { q: "dashboard ใน Databricks SQL อัปเดตข้อมูลได้โดย?", c: ["ต้องกดรีเฟรชเองเท่านั้น", "ตั้ง schedule refresh อัตโนมัติ", "อัปเดตแบบ realtime เสมอ", "รีเฟรชไม่ได้"], a: 1 },
  { q: "ข้อดีของ serverless SQL warehouse คือ?", c: ["ฟรีตลอดชีพ", "start เร็วและไม่ต้องบริหาร infra เอง", "แรงกว่าทุกแบบเสมอ", "ใช้ Python ได้"], a: 1 },
  // ---------- MLflow / ML (55-59)
  { q: "MLflow ใช้ทำอะไรเป็นหลัก?", c: ["จัดการ network", "track การทดลองและวงจรชีวิตของ ML model", "สร้างเว็บไซต์", "แปลงข้อมูลเป็น JSON"], a: 1 },
  { q: "ส่วนใดของ MLflow เก็บโมเดลพร้อมจัดการ stage/version?", c: ["Model Registry", "Model Zoo", "Model Cache", "Model Vault"], a: 0 },
  { q: "MLflow run บันทึกอะไรได้บ้าง?", c: ["เฉพาะโค้ด", "params, metrics และ artifacts", "เฉพาะรูปภาพ", "เฉพาะ log error"], a: 1 },
  { q: "Feature Store มีไว้เพื่อ?", c: ["ขาย feature ให้ลูกค้า", "เก็บและแชร์ feature ให้ทีม ML ใช้ซ้ำ", "เก็บหน้า UI", "สำรอง notebook"], a: 1 },
  { q: "Databricks AutoML ช่วยอะไร?", c: ["เขียนอีเมลอัตโนมัติ", "สร้าง baseline model พร้อมโค้ดให้อัตโนมัติ", "ซื้อ GPU อัตโนมัติ", "แปล SQL เป็น Python"], a: 1 },
  // ---------- Streaming / Auto Loader (60-64)
  { q: "Structured Streaming ประมวลผลข้อมูลแบบใดเป็นค่าเริ่มต้น?", c: ["batch วันละครั้ง", "micro-batch ต่อเนื่อง", "ทีละ record เสมอ", "สุ่มตามโหลด"], a: 1 },
  { q: "Auto Loader เหมาะกับงานใด?", c: ["โหลดไฟล์ใหม่จาก cloud storage แบบ incremental", "โหลดหน้าเว็บ", "โหลดโมเดล ML", "ดาวน์โหลด log ของ cluster"], a: 0 },
  { q: "checkpoint ใน streaming เก็บอะไร?", c: ["สำเนาข้อมูลทั้งหมด", "สถานะและความคืบหน้าของ stream", "รหัสผ่าน", "ประวัติ commit ของ Git"], a: 1 },
  { q: "trigger แบบ availableNow เหมาะเมื่อใด?", c: ["อยากรันต่อเนื่องตลอดไป", "อยากประมวลผลข้อมูลที่ค้างอยู่แล้วหยุด", "อยากรันทุกวินาที", "อยากปิด checkpoint"], a: 1 },
  { q: "watermark ใน streaming ใช้จัดการอะไร?", c: ["ลายน้ำบนรายงาน", "ข้อมูลที่มาช้าและการจำกัดขนาด state", "สีของ dashboard", "สิทธิ์ผู้ใช้"], a: 1 },
  // ---------- Performance (65-70)
  { q: "ควรใช้ cache()/persist() เมื่อใด?", c: ["ทุกครั้งที่สร้าง DataFrame", "เมื่อใช้ DataFrame เดิมซ้ำหลายครั้ง", "เมื่อข้อมูลใหญ่เกิน memory เท่านั้น", "ก่อนเขียนไฟล์เสมอ"], a: 1 },
  { q: "ไฟล์เล็กจำนวนมาก (small files problem) ส่งผลอย่างไร?", c: ["query เร็วขึ้น", "overhead สูง query ช้าลง", "ประหยัด storage", "ไม่มีผลใด ๆ"], a: 1 },
  { q: "broadcast join เหมาะเมื่อใด?", c: ["ตารางทั้งคู่ใหญ่มาก", "ตารางหนึ่งเล็กพอจะส่งไปทุก executor", "ไม่มี join key", "ข้อมูลเป็น streaming"], a: 1 },
  { q: "data skew คืออะไร?", c: ["ข้อมูลผิด format", "ข้อมูลกระจุกตัวในบาง partition มากผิดปกติ", "ข้อมูลถูกลบ", "ข้อมูลซ้ำสองชุด"], a: 1 },
  { q: "AQE (Adaptive Query Execution) ทำอะไร?", c: ["ปรับแผน query ระหว่างรันตามข้อมูลจริง", "แก้ syntax ให้อัตโนมัติ", "เพิ่ม worker อัตโนมัติ", "แปลง SQL เป็น Python"], a: 0 },
  { q: "shuffle ใน Spark เกิดจากอะไร?", c: ["การอ่านไฟล์ CSV", "wide transformation เช่น join/groupBy", "การ print ผลลัพธ์", "การตั้งชื่อตัวแปร"], a: 1 },
  // ---------- Storage / Format (71-74)
  { q: "DBFS คืออะไร?", c: ["database ในตัว", "layer ระบบไฟล์เสมือนบน object storage", "รูปแบบไฟล์ใหม่", "เครื่องมือ backup"], a: 1 },
  { q: "mount point ใช้ทำอะไร?", c: ["เพิ่ม RAM ให้ cluster", "เชื่อม external storage มาเป็น path ใน workspace", "ต่อจอเพิ่ม", "สร้าง VPN"], a: 1 },
  { q: "Parquet เป็นไฟล์ format แบบใด?", c: ["row-based", "columnar", "key-value", "plain text"], a: 1 },
  { q: "columnar format เหมาะกับงานใด?", c: ["อ่านทีละแถวทั้งแถว", "งาน analytics ที่อ่านบางคอลัมน์", "เก็บรูปภาพ", "เก็บวิดีโอ"], a: 1 },
  // ---------- Platform / อื่น ๆ (75-80)
  { q: "workspace ใน Databricks คืออะไร?", c: ["เครื่อง VM ส่วนตัว", "พื้นที่รวม notebook, job และทรัพยากรของทีม", "โฟลเดอร์ Windows", "ชื่อของ cluster"], a: 1 },
  { q: "cluster policy มีไว้เพื่อ?", c: ["ควบคุม/จำกัดรูปแบบการสร้าง cluster ของผู้ใช้", "เพิ่มความเร็ว cluster", "แชร์ cluster ข้ามบริษัท", "สำรอง cluster"], a: 0 },
  { q: "secret scope ช่วยป้องกันอะไร?", c: ["การ hardcode credential ในโค้ด", "การลบตารางผิด", "query ที่ช้า", "ไฟล์เสียหาย"], a: 0 },
  { q: "Databricks REST API ใช้ทำอะไรได้?", c: ["สั่งงาน platform เช่นสร้าง job/cluster แบบอัตโนมัติ", "เล่นเกมในออฟฟิศ", "แก้ bug ใน Spark", "อ่านอีเมล"], a: 0 },
  { q: "Databricks ให้บริการบน cloud ใดบ้าง?", c: ["AWS เท่านั้น", "Azure เท่านั้น", "AWS, Azure และ GCP", "ต้องติดตั้ง on-premise เท่านั้น"], a: 2 },
  { q: "Delta Sharing คืออะไร?", c: ["แชร์หน้าจอในทีม", "open protocol สำหรับแชร์ข้อมูลข้ามองค์กร", "แชร์ค่าใช้จ่าย cluster", "แชร์ notebook เป็น PDF"], a: 1 },
  // ---------- SQL บน Databricks (81-85)
  { q: "CREATE TABLE t USING DELTA จะได้ตารางแบบใด?", c: ["ตาราง CSV", "Delta table", "view ชั่วคราว", "ตารางใน MySQL"], a: 1 },
  { q: "COPY INTO เหมาะกับงานใด?", c: ["โหลดไฟล์เข้า table แบบ incremental และ idempotent", "คัดลอก cluster", "สำเนา workspace", "ก๊อปปี้ dashboard"], a: 0 },
  { q: "CTAS ย่อมาจากอะไร?", c: ["Create Table As Select", "Copy Table And Save", "Create Temp Auto Schema", "Cluster Table Access System"], a: 0 },
  { q: "คำสั่งดูโครงสร้างคอลัมน์ของตารางคือ?", c: ["SHOW DATA", "DESCRIBE TABLE", "LIST COLUMNS", "PRINT SCHEMA"], a: 1 },
  { q: "TEMPORARY VIEW มีอายุถึงเมื่อใด?", c: ["ถาวรตลอดไป", "จบ session/notebook นั้น", "7 วัน", "จนกว่าจะรัน VACUUM"], a: 1 },
  // ---------- Spark API (86-90)
  { q: "option(\"header\",\"true\") ตอนอ่าน CSV หมายถึง?", c: ["ข้ามบรรทัดแรก", "ใช้บรรทัดแรกเป็นชื่อคอลัมน์", "อ่านเฉพาะหัวไฟล์", "เพิ่มหัวตารางใหม่"], a: 1 },
  { q: "df.write.mode(\"overwrite\") ทำอะไร?", c: ["เขียนต่อท้ายข้อมูลเดิม", "เขียนทับข้อมูลเดิมทั้งหมด", "เขียนเฉพาะแถวใหม่", "ไม่เขียนถ้ามีข้อมูลอยู่"], a: 1 },
  { q: "withColumn ใช้ทำอะไร?", c: ["ลบคอลัมน์", "เพิ่มหรือแทนที่คอลัมน์", "เปลี่ยนชื่อตาราง", "รวมตาราง"], a: 1 },
  { q: "explode() ใช้กับข้อมูลแบบใด?", c: ["กระจาย array/map ให้เป็นหลายแถว", "ลบข้อมูลเสีย", "บีบอัดข้อมูล", "สุ่มตัวอย่างข้อมูล"], a: 0 },
  { q: "ข้อควรรู้เกี่ยวกับ Python UDF คือ?", c: ["เร็วกว่า built-in function เสมอ", "มักช้ากว่า built-in function ควรใช้เท่าที่จำเป็น", "ใช้ได้เฉพาะ Scala", "ห้ามใช้ใน production"], a: 1 },
  // ---------- Governance / Security (91-92)
  { q: "table ACL ควบคุมอะไร?", c: ["ขนาดของตาราง", "สิทธิ์การเข้าถึงตารางของผู้ใช้/กลุ่ม", "ความเร็ว query", "จำนวนคอลัมน์"], a: 1 },
  { q: "ข้อมูล PII ควรจัดการอย่างไร?", c: ["เปิดให้ทุกคนเข้าถึง", "mask หรือจำกัดสิทธิ์การเข้าถึง", "ลบทิ้งทั้งหมดเสมอ", "เก็บใน notebook"], a: 1 },
  // ---------- Delta ขั้นสูง / ฟีเจอร์ใหม่ (93-96)
  { q: "RESTORE TABLE ใช้ทำอะไร?", c: ["กู้ cluster ที่ดับ", "ย้อนตารางกลับไปเวอร์ชันก่อนหน้า", "กู้รหัสผ่าน", "รีสตาร์ต job"], a: 1 },
  { q: "ควรรัน OPTIMIZE เมื่อใด?", c: ["ทุกครั้งก่อน SELECT", "เมื่อตารางสะสมไฟล์เล็กจำนวนมาก", "เฉพาะวันหยุด", "หลัง VACUUM เท่านั้น"], a: 1 },
  { q: "Liquid Clustering คืออะไร?", c: ["การระบายความร้อน data center", "วิธีจัด layout ข้อมูลแบบยืดหยุ่นแทน partition/Z-order", "การรวม cluster สองตัว", "ระบบสำรองไฟ"], a: 1 },
  { q: "การ reuse job cluster ระหว่างหลาย task ช่วยอะไร?", c: ["เพิ่มความปลอดภัย", "ลดเวลารอ start cluster ของแต่ละ task", "ทำให้โค้ดสั้นลง", "เพิ่ม DBU"], a: 1 },
  // ---------- แนวคิด / ฟีเจอร์เสริม (97-100)
  { q: "ชั้น Silver ใน Medallion ควรมีข้อมูลแบบใด?", c: ["ดิบสุด ๆ ยังไม่แตะ", "ผ่านการ clean/join ให้อยู่ในรูปมาตรฐาน", "เฉพาะข้อมูลสรุปรายเดือน", "เฉพาะข้อมูลที่ผิดพลาด"], a: 1 },
  { q: "Databricks Assistant ช่วยอะไร?", c: ["ชงกาแฟ", "ช่วยเขียน/อธิบาย/แก้โค้ดด้วย AI", "จองห้องประชุม", "อนุมัติงบประมาณ"], a: 1 },
  { q: "Unity Catalog Volume ใช้เก็บอะไร?", c: ["เสียงเพลง", "ไฟล์ non-tabular ภายใต้ governance เดียวกัน", "ค่า DBU", "ประวัติ query"], a: 1 },
  { q: "Lakehouse Federation ช่วยให้ทำอะไรได้?", c: ["รวมบริษัทเข้าด้วยกัน", "query ฐานข้อมูลภายนอกโดยไม่ต้องย้ายข้อมูลเข้ามา", "สร้างสหพันธ์ผู้ใช้", "แชร์ cluster ข้าม cloud"], a: 1 },
];
