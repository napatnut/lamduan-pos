# 📘 วิธีติดตั้ง Google Apps Script — Step by Step
## ระบบบันทึกยอดขาย ข้าวซอยลำดวนฟ้าฮ่าม

> เวลาที่ใช้ทั้งหมด: ประมาณ **10-15 นาที** (ทำครั้งเดียว)
> ทำตามทุก Step ห้ามข้าม

---

## 🎯 สิ่งที่จะได้หลังทำเสร็จ

เมื่อพนักงานกดปุ่ม **"📤 ส่งข้อมูลลง Google Sheets"** ในหน้า HTML
→ ข้อมูลจะวิ่งเข้า Google Sheet ของแต่ละสาขาอัตโนมัติ ไม่ต้อง copy-paste

---

# ✅ STEP 1: สร้าง Google Sheet ใหม่

1. เปิดเว็บ → พิมพ์ **`sheets.google.com`** ใน Browser
2. Login ด้วยบัญชี Google ของคุณ (ใช้ `napat.nps@gmail.com`)
3. คลิก **➕ Blank** (สร้าง spreadsheet เปล่า)
4. มุมซ้ายบน คลิกชื่อ **"Untitled spreadsheet"** → พิมพ์ชื่อใหม่:
   ```
   ยอดขายข้าวซอยลำดวนฟ้าฮ่าม
   ```
5. กด **Enter** เพื่อบันทึกชื่อ

> ✅ **เช็คว่าทำถูก:** เห็นไฟล์ Sheet เปล่าๆ ที่มีชื่อ "ยอดขายข้าวซอยลำดวนฟ้าฮ่าม" อยู่บนสุด

---

# ✅ STEP 2: เปิด Apps Script Editor

1. ที่หน้า Sheet → คลิกเมนูบาร์ด้านบน **`Extensions`** (ส่วนขยาย)
2. ในเมนูที่ลงมา คลิก **`Apps Script`**
3. จะเปิด **tab ใหม่** ที่ชื่อ "Untitled project" — นี่คือ Apps Script Editor

> ⚠️ **สำคัญมาก!** ห้ามเปิด Apps Script จาก script.google.com โดยตรง
> ต้องเปิดผ่าน Extensions ของ Sheet เท่านั้น เพื่อให้ผูกกับ Sheet ของเรา

> ✅ **เช็คว่าทำถูก:** หน้าใหม่ที่เปิดมามีหัวเป็นไอคอนสีฟ้ารูป </> และ URL ขึ้นต้นด้วย `script.google.com/macros/...`

---

# ✅ STEP 3: ลบโค้ดเดิม + วางโค้ดใหม่

1. ที่ Apps Script Editor → จะเห็นโค้ดตั้งต้น:
   ```javascript
   function myFunction() {

   }
   ```
2. คลิกในกรอบโค้ด → กด **`Ctrl+A`** (Windows) หรือ **`⌘+A`** (Mac) เพื่อเลือกทั้งหมด
3. กด **`Delete`** ลบโค้ดเดิมทิ้งให้หมด
4. เปิดไฟล์ **`Google_Apps_Script.gs`** ของเรา (ในโฟลเดอร์เดียวกับ HTML) ด้วย Notepad / TextEdit / VS Code
5. กด **`Ctrl+A`** → **`Ctrl+C`** เพื่อ copy ทั้งหมด
6. กลับไปที่ Apps Script Editor → คลิกในกรอบโค้ด → กด **`Ctrl+V`** วาง

> ✅ **เช็คว่าทำถูก:** เห็นโค้ดยาวขึ้นต้นด้วย `/** ... ระบบบันทึกยอดขายประจำวัน - ข้าวซอยลำดวนฟ้าฮ่าม ...`

---

# ✅ STEP 4: บันทึกและตั้งชื่อ Project

1. กด **`Ctrl+S`** (หรือ **`⌘+S`**) — หรือคลิกไอคอน **💾 Save** ที่แถบเครื่องมือบน
2. จะมี popup ขึ้นถามชื่อ Project → พิมพ์:
   ```
   ลำดวน-API
   ```
3. กด **Rename** หรือ **OK**

> ✅ **เช็คว่าทำถูก:** ชื่อบนซ้ายเปลี่ยนจาก "Untitled project" เป็น "ลำดวน-API"

---

# ✅ STEP 5: รัน initialSetup (สร้าง Sheet ทุกสาขาอัตโนมัติ)

1. ที่แถบเครื่องมือด้านบน Apps Script → ดูช่อง **"Select function"** (มีสามเหลี่ยมเล็ก ▼)
2. คลิกเปิด dropdown → เลือก **`initialSetup`**
3. คลิกปุ่ม **▶ Run** (ปุ่มสามเหลี่ยมข้างๆ)
4. **ครั้งแรก** จะมี popup ขึ้นถามสิทธิ์ → ทำตามนี้:

   ### 5.1 หน้าจอ "Authorization required"
   - คลิก **`Review permissions`**

   ### 5.2 หน้าจอ "Choose an account"
   - คลิกที่บัญชี **napat.nps@gmail.com**

   ### 5.3 หน้าจอ "Google hasn't verified this app" (แดงๆ)
   - คลิก **`Advanced`** (ลูกศรเล็กล่างซ้าย)
   - คลิก **`Go to ลำดวน-API (unsafe)`**

   > 💡 ที่ขึ้น "unsafe" เพราะเป็น Script ที่เราเขียนเอง ไม่ใช่ของบริษัทใหญ่ ปลอดภัยครับ

   ### 5.4 หน้าจอ "ลำดวน-API wants to access your Google Account"
   - คลิก **`Allow`** (อนุญาต)

5. รอ 5-10 วินาที จะเห็น popup สีเขียว:
   ```
   ✅ ติดตั้งสำเร็จ!
   • สร้าง Sheet 4 สาขา
   • สร้าง Sheet สรุปรวม
   • สร้าง Sheet ⚙️ ตั้งค่า GP
   ```
6. กด **OK**

> ✅ **เช็คว่าทำถูก:** กลับไปที่ tab Google Sheet → ด้านล่างจะมี tab Sheet ทั้งหมด:
> - 📊 สรุปรวมทุกสาขา
> - วิภาวดี
> - สาทร
> - บรรทัดทอง
> - ประดิพัทธ์
> - ⚙️ ตั้งค่า GP

---

# ✅ STEP 6: Deploy เป็น Web App (สำคัญที่สุด)

นี่คือขั้นตอนที่ทำให้ HTML ภายนอกเรียก Apps Script ได้

1. กลับมาที่ Apps Script Editor
2. มุมขวาบน คลิกปุ่ม **`Deploy`** (ปุ่มสีฟ้า)
3. ในเมนู → คลิก **`New deployment`**

   ### 6.1 หน้าจอ "New deployment"
   - ดูที่ช่อง **"Select type"** ด้านซ้ายบน → คลิกไอคอน **⚙️** (ฟันเฟือง)
   - ในเมนูที่ลงมา → คลิก **`Web app`**

   ### 6.2 กรอกข้อมูล Web app
   - **Description:** พิมพ์ `ลำดวน v1`
   - **Execute as:** เลือก **`Me (napat.nps@gmail.com)`**
   - **Who has access:** เลือก **`Anyone`**

   > ⚠️ **ระวังอย่างยิ่ง!**
   > - ห้ามเลือก "Only myself" → พนักงานจะส่งข้อมูลไม่ได้
   > - ห้ามเลือก "Anyone with Google account" → จะเด้งหน้า Login
   > - ต้องเลือก **`Anyone`** อย่างเดียวเท่านั้น

4. คลิกปุ่ม **`Deploy`** (ฟ้าๆ ขวาล่าง)

5. รอ 5-10 วินาที จะขึ้นหน้าจอ:
   ```
   Deployment successfully updated.
   Web app URL: https://script.google.com/macros/s/AKfycb.../exec
   ```

6. **คัดลอก URL ทั้งบรรทัด!** (คลิก **`Copy`** ที่อยู่ข้าง URL)

   > 💡 **เก็บ URL นี้ไว้ในที่ปลอดภัย** เช่น Notes ใน LINE ส่วนตัว
   > URL นี้คือ "ที่อยู่" สำหรับส่งข้อมูลเข้า Sheet

7. คลิก **`Done`**

> ✅ **เช็คว่าทำถูก:** มี URL อยู่ใน clipboard แล้ว URL ลงท้ายด้วย `/exec` (ห้ามเป็น `/dev`)

---

# ✅ STEP 7: ใส่ URL ลงในไฟล์ HTML

1. เปิดโฟลเดอร์ที่เก็บไฟล์ HTML ของระบบ
2. คลิกขวาที่ไฟล์ **`ระบบบันทึกยอดขาย_ข้าวซอยลำดวน.html`**
3. เลือก **`Open with`** → เลือก **Notepad** (Windows) / **TextEdit** (Mac) / **VS Code**

   > ⚠️ ห้ามดับเบิลคลิกเปิด เพราะจะเปิดในเบราว์เซอร์ไม่ใช่ตัวแก้ไข

4. กด **`Ctrl+F`** (หาคำในไฟล์) → พิมพ์:
   ```
   GOOGLE_SHEETS_URL
   ```
5. จะเจอบรรทัดประมาณนี้:
   ```javascript
   GOOGLE_SHEETS_URL: '',
   ```
6. วาง URL ที่ copy มาระหว่างเครื่องหมาย `''`:
   ```javascript
   GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycb.../exec',
   ```

   > ⚠️ **ต้องคงเครื่องหมาย `'` (single quote) ไว้ทั้งหน้าและหลัง URL**
   > ถ้าทำหายไปแม้แต่ตัวเดียว โค้ดจะพัง

7. กด **`Ctrl+S`** บันทึกไฟล์

> ✅ **เช็คว่าทำถูก:** บรรทัดดังกล่าวมี URL อยู่ในเครื่องหมาย quote ถูกต้อง และมี comma `,` ปิดท้าย

---

# ✅ STEP 8: ทดสอบส่งข้อมูลจริง

1. ดับเบิลคลิกเปิด **`ระบบบันทึกยอดขาย_ข้าวซอยลำดวน.html`** ในเบราว์เซอร์
2. ใน popup ที่ขึ้นมา → คลิก **`วิภาวดี`**
3. กรอกข้อมูลทดสอบง่ายๆ:
   - Step 1: ช่อง Grab → ใส่ `1000`
   - Step 2: ช่องยอดรวมหน้าร้าน → ใส่ `500`
   - Step 3: ข้ามได้ (ไม่ต้องกรอกรายจ่าย)
   - Step 4: คลิก **📤 ส่งข้อมูลลง Google Sheets**
4. ใน Modal ยืนยัน → คลิก **✓ ยืนยันส่ง**
5. รอ 1-2 วินาที จะเห็น toast สีเขียว: **"✅ ส่งข้อมูลเข้า Google Sheets สำเร็จ!"**

6. **ตรวจสอบใน Google Sheet:**
   - กลับไปที่ Browser tab ของ Google Sheet
   - คลิกที่ tab **`วิภาวดี`** ด้านล่าง
   - **กด `F5` หรือ `Ctrl+R` เพื่อ refresh**
   - ✅ จะเห็นแถวข้อมูลใหม่ (Timestamp, วันที่, สาขา, Grab 1000, ฯลฯ)

> 🎉 **สำเร็จ!** ระบบพร้อมใช้งานจริงแล้ว

---

# 🚨 ถ้าทำตามแล้วยังไม่เข้า Sheet — Troubleshoot ทีละขั้น

## ❌ Symptom 1: กดส่งแล้วขึ้น "สำเร็จ" แต่ Sheet ไม่ขึ้นแถวใหม่

**สาเหตุ:** Apps Script รัน error แต่ HTML ไม่เห็นเพราะใช้ no-cors

**วิธีตรวจ:**
1. กลับไปที่ Apps Script Editor
2. คลิกเมนูซ้ายไอคอน **🕐 Executions** (รูปนาฬิกา)
3. ดู list การรันล่าสุด
   - **สีเขียว ✓** = สำเร็จ → ตรวจ Sheet ดู (อาจ refresh ไม่ทัน)
   - **สีแดง ✗** = error → คลิกเปิดดู error message

**ถ้าเจอ error "Cannot read property of null":**
- หมายถึง Apps Script เปิดแบบ Standalone ไม่ผูกกับ Sheet
- → ต้องลบ project นี้ทิ้ง แล้วเปิด Apps Script ใหม่ผ่าน **Extensions → Apps Script** ของ Sheet

## ❌ Symptom 2: ขึ้น "ส่งไม่สำเร็จ"

**สาเหตุที่พบบ่อย:**

| สาเหตุ | วิธีตรวจ | วิธีแก้ |
|--------|---------|--------|
| URL ผิด | URL ลงท้าย `/dev` ไม่ใช่ `/exec` | Deploy ใหม่ตาม Step 6 |
| Access ผิด | เปิด URL โดยตรงใน Browser ขึ้นหน้า Login | กลับไป Edit Deploy → ตั้ง "Anyone" |
| ลืม Authorize | Apps Script ไม่เคย Run มาก่อน | กลับไปทำ Step 5 |

## ❌ Symptom 3: หลังแก้โค้ด Apps Script แล้วระบบเป็นเหมือนเดิม

**สาเหตุที่พบบ่อยที่สุด!** = ลืม Deploy New Version

**วิธีแก้:**
1. Apps Script → คลิก **Deploy** → **Manage deployments**
2. เห็น deployment ที่ Active → คลิก **✏️ Edit** (ดินสอ)
3. ที่ช่อง **Version** → เปลี่ยนจาก "1" หรือเลขเดิม → เลือก **`New version`**
4. คลิก **Deploy**
5. URL ยังเป็นตัวเดิม **ไม่ต้องแก้ HTML** แต่ตอนนี้รันโค้ดใหม่แล้ว

---

# 📝 สรุป Checklist ครั้งสุดท้าย

ก่อนใช้งานจริง ลองตอบคำถามทุกข้อนี้ — ต้องตอบ "ใช่" ทั้งหมด:

- [ ] เปิด Apps Script ผ่าน **Extensions** ของ Sheet (ไม่ใช่ script.google.com โดยตรง)
- [ ] โค้ดใน Apps Script เป็นโค้ดใหม่จากไฟล์ `Google_Apps_Script.gs` (ไม่ใช่ `function myFunction() {}`)
- [ ] รัน `initialSetup` แล้วเห็น Sheet ทุกสาขาในด้านล่าง
- [ ] Deploy เป็น **Web app** (ไม่ใช่ Library / Test deployment)
- [ ] **Execute as: Me**
- [ ] **Who has access: Anyone** (ไม่ใช่ "Anyone with Google account")
- [ ] URL ที่ copy ลงท้ายด้วย **`/exec`**
- [ ] วาง URL ในไฟล์ HTML ที่ตำแหน่ง `GOOGLE_SHEETS_URL: 'URL_HERE',`
- [ ] บันทึกไฟล์ HTML แล้ว
- [ ] ทดสอบส่งข้อมูล + refresh Sheet → เห็นแถวใหม่

---

# 🔄 ภาพรวมการทำงาน (เพื่อให้เข้าใจง่าย)

```
[พนักงานกรอกข้อมูลใน HTML]
        ↓
[กดส่ง → JavaScript ส่ง POST request]
        ↓
[ไปยัง URL ของ Apps Script (.../exec)]
        ↓
[Apps Script รัน function doPost(e)]
        ↓
[รับข้อมูล JSON → แยกตามสาขา]
        ↓
[เขียนแถวใหม่ลง Sheet สาขานั้นๆ]
        ↓
[ตอบกลับ HTML ว่า "สำเร็จ"]
        ↓
[HTML แสดง toast สีเขียว ✅]
```

---

# 🆘 ติดปัญหา?

**ถ้าทำตามทุก Step แล้วยังไม่ได้** — บอกผมว่า:

1. ติดที่ Step ไหน?
2. ขึ้น error อะไร? (ข้อความที่เห็น)
3. ใน Apps Script → Executions มี log แดงไหม? คลิกดู error message ขึ้นว่ายังไง?

**อย่าส่ง URL Apps Script ของคุณให้ผม** เพราะเป็นข้อมูลส่วนตัวที่ใครเข้าถึงก็เขียน Sheet ได้
