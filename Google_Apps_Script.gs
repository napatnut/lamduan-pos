/**
 * ============================================================
 * ระบบบันทึกยอดขายประจำวัน - ข้าวซอยลำดวนฟ้าฮ่าม
 * Google Apps Script v2 - รองรับ GP Rate ต่อสาขา
 * ============================================================
 *
 * วิธีใช้: ดูที่ไฟล์ คู่มือติดตั้ง_Google_Sheets.md
 *
 * Endpoint:
 *   POST /exec               → บันทึกยอดขายประจำวัน
 *   POST /exec  action=updateGpRates  → อัพเดต GP Rate
 *   GET  /exec?action=ping   → health check
 *   GET  /exec?action=getGpRates&branch=X  → ดึง GP Rate ของสาขา
 *   GET  /exec?action=getGpRatesAll  → ดึง GP Rate ทุกสาขา
 *   GET  /exec?action=getDeferred&branch=X → ดึงรายจ่ายค้าง
 * (รองรับ JSONP: เพิ่ม &callback=funcName)
 * ============================================================
 */

// ========== CONFIG ==========
const BRANCH_LIST = ['วิภาวดี', 'สาทร', 'บรรทัดทอง', 'ประดิพัทธ์'];
const PLATFORMS = ['grab', 'lineman', 'shopee', 'robin', 'other'];
const PLATFORM_LABELS = {
  grab: 'Grab', lineman: 'LINE MAN', shopee: 'Shopee',
  robin: 'Robinhood', other: 'อื่นๆ'
};

// ค่า Default GP (%)
const DEFAULT_GP = {
  grab: 32, lineman: 32, shopee: 32,
  robin: 30, other: 30
};

// PIN สำหรับแก้ GP (เปลี่ยนได้)
const ADMIN_PIN = '1234';

const HEADERS = [
  'Timestamp', 'วันที่', 'สาขา',
  'Grab Gross', 'Grab Net',
  'LINEMAN Gross', 'LINEMAN Net',
  'Shopee Gross', 'Shopee Net',
  'Panda Gross', 'Panda Net',
  'Robinhood Gross', 'Robinhood Net',
  'อื่นๆ Gross', 'อื่นๆ Net',
  'Delivery Net รวม',
  'ยอดหน้าร้าน', 'เงินสดลิ้นชัก', 'ยอดสแกน', 'คนละครึ่ง',
  'จ่ายจริงวันนี้', 'รายการจ่ายจริง',
  'ยกไปพรุ่งนี้', 'รายการยกไปพรุ่งนี้',
  'ค้างเก่าจ่ายวันนี้', 'รายการค้างเก่าจ่ายแล้ว',
  'รายรับรวม', 'เงินส่งคืนเจ้าของ', 'กำไรสุทธิ',
  'GP Snapshot', 'Note'
];

const SUMMARY_SHEET_NAME = '📊 สรุปรวมทุกสาขา';
const DEFERRED_SHEET_NAME = '📌 รายจ่ายค้างคงเหลือ';
const GP_SHEET_NAME = '⚙️ ตั้งค่า GP';
const GP_LOG_SHEET_NAME = '📝 ประวัติแก้ GP';

// ========== ENTRY POINTS ==========

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ถ้าเป็นการอัพเดต GP Rate
    if (data.action === 'updateGpRates') {
      return handleUpdateGpRates(data);
    }

    // ถ้าเป็นการบันทึกยอดขายปกติ
    return handleSaveSales(data);
  } catch (err) {
    Logger.log('Error: ' + err.toString());
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

function doGet(e) {
  const action = e.parameter.action || 'ping';
  const callback = e.parameter.callback;
  let result;

  try {
    if (action === 'ping') {
      result = { status: 'ok', message: '🍜 ระบบข้าวซอยลำดวน v2 ทำงานปกติ', time: new Date().toISOString() };
    } else if (action === 'getGpRates') {
      result = { status: 'ok', branch: e.parameter.branch, rates: getGpRatesForBranch(e.parameter.branch) };
    } else if (action === 'getGpRatesAll') {
      result = { status: 'ok', rates: getAllGpRates() };
    } else if (action === 'getDeferred' && e.parameter.branch) {
      result = { status: 'ok', branch: e.parameter.branch, items: getDeferredForBranch(e.parameter.branch) };
    } else {
      result = { status: 'ok', message: 'unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', error: err.toString() };
  }

  // รองรับ JSONP สำหรับ cross-origin GET
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(result)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return jsonResponse(result);
}

// ========== บันทึกยอดขาย ==========

function handleSaveSales(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const branchSheet = getOrCreateBranchSheet(ss, data.branch);
  appendSalesRow(branchSheet, data);
  updateDeferredSheet(ss, data);
  ensureSummarySheet(ss);
  return jsonResponse({
    status: 'ok',
    branch: data.branch,
    message: 'บันทึกข้อมูลสาขา ' + data.branch + ' สำเร็จ'
  });
}

function getOrCreateBranchSheet(ss, branchName) {
  let sheet = ss.getSheetByName(branchName);
  if (!sheet) {
    sheet = ss.insertSheet(branchName);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
         .setBackground('#D97706')
         .setFontColor('#FFFFFF')
         .setFontWeight('bold')
         .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(3);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 110);
    sheet.setColumnWidth(3, 110);
    for (let c = 4; c <= HEADERS.length; c++) sheet.setColumnWidth(c, 115);
  }
  return sheet;
}

function appendSalesRow(sheet, data) {
  const paidItems = (data.expensesPaid || []).map(x => x.note + ': ' + x.amount).join(' | ');
  const deferredItems = (data.expensesDeferred || []).map(x => x.note + ': ' + x.amount).join(' | ');
  const oldPaidItems = (data.expensesOldPaid || []).map(x => x.note + ': ' + x.amount).join(' | ');
  const gpSnapshot = data.gpSnapshot ? JSON.stringify(data.gpSnapshot) : '';

  const row = [
    new Date(data.timestamp), data.date, data.branch,
    data.grabGross, data.grabNet,
    data.linemanGross, data.linemanNet,
    data.shopeeGross, data.shopeeNet,
    data.pandaGross, data.pandaNet,
    data.robinGross, data.robinNet,
    data.otherGross, data.otherNet,
    data.deliveryNet,
    data.dineTotal, data.cashBox, data.scanTotal, data.govProgram,
    data.expensePaidTotal, paidItems,
    data.expenseDeferredTotal, deferredItems,
    data.expenseOldPaidTotal || 0, oldPaidItems,
    data.revenue, data.cashToOwner, data.netProfit,
    gpSnapshot, data.note || ''
  ];

  sheet.appendRow(row);

  const lastRow = sheet.getLastRow();
  const moneyColumns = [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,23,25,27,28,29];
  moneyColumns.forEach(col => sheet.getRange(lastRow, col).setNumberFormat('#,##0.00'));

  const profitCell = sheet.getRange(lastRow, 29);
  if (data.netProfit >= 0) {
    profitCell.setBackground('#D1FAE5').setFontColor('#065F46').setFontWeight('bold');
  } else {
    profitCell.setBackground('#FEE2E2').setFontColor('#991B1B').setFontWeight('bold');
  }
}

// ========== รายจ่ายค้าง ==========

function updateDeferredSheet(ss, data) {
  let sheet = ss.getSheetByName(DEFERRED_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(DEFERRED_SHEET_NAME);
    const headers = ['วันที่เกิด', 'สาขา', 'รายการ', 'ยอด', 'สถานะ', 'วันที่จ่าย'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#F59E0B').setFontColor('#FFFFFF').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, headers.length, 140);
    sheet.setColumnWidth(3, 220);
  }
  (data.expensesDeferred || []).forEach(exp => {
    sheet.appendRow([data.date, data.branch, exp.note, exp.amount, '⏳ ค้าง', '']);
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setNumberFormat('#,##0.00');
    sheet.getRange(lastRow, 5).setBackground('#FEF3C7').setFontWeight('bold');
  });
  (data.expensesOldPaid || []).forEach(exp => {
    markDeferredAsPaid(sheet, data.branch, exp, data.date);
  });
}

function markDeferredAsPaid(sheet, branch, paidItem, payDate) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    if (row[1] === branch && row[2] === paidItem.note &&
        Number(row[3]) === Number(paidItem.amount) && row[4] === '⏳ ค้าง') {
      const rowNum = i + 2;
      sheet.getRange(rowNum, 5).setValue('✅ จ่ายแล้ว')
           .setBackground('#D1FAE5').setFontColor('#065F46');
      sheet.getRange(rowNum, 6).setValue(payDate);
      return;
    }
  }
}

function getDeferredForBranch(branch) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DEFERRED_SHEET_NAME);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  const items = [];
  values.forEach(row => {
    if (row[1] === branch && row[4] === '⏳ ค้าง') {
      items.push({
        dateIncurred: row[0] instanceof Date ? Utilities.formatDate(row[0], 'Asia/Bangkok', 'yyyy-MM-dd') : String(row[0]),
        note: row[2],
        amount: Number(row[3])
      });
    }
  });
  return items;
}

// ========== GP RATES MANAGEMENT (ใหม่) ==========

function getOrCreateGpSheet(ss) {
  let sheet = ss.getSheetByName(GP_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(GP_SHEET_NAME);
    // Header
    const headers = ['สาขา', ...PLATFORMS.map(p => PLATFORM_LABELS[p] + ' %'), 'อัพเดตล่าสุด'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground('#7C3AED').setFontColor('#FFFFFF').setFontWeight('bold')
         .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    // ใส่ค่า default ทุกสาขา
    BRANCH_LIST.forEach((branch, idx) => {
      const row = idx + 2;
      const values = [branch, ...PLATFORMS.map(p => DEFAULT_GP[p]), new Date()];
      sheet.getRange(row, 1, 1, values.length).setValues([values]);
      sheet.getRange(row, 1).setFontWeight('bold').setBackground('#FEF3C7');
      // Format % columns
      for (let c = 2; c <= PLATFORMS.length + 1; c++) {
        sheet.getRange(row, c).setNumberFormat('0.0"%"').setHorizontalAlignment('center');
      }
      sheet.getRange(row, PLATFORMS.length + 2).setNumberFormat('yyyy-mm-dd hh:mm');
    });

    sheet.setColumnWidth(1, 130);
    for (let c = 2; c <= PLATFORMS.length + 1; c++) sheet.setColumnWidth(c, 110);
    sheet.setColumnWidth(PLATFORMS.length + 2, 150);

    // Note ที่ด้านล่าง
    const noteRow = BRANCH_LIST.length + 4;
    sheet.getRange(noteRow, 1).setValue('📝 หมายเหตุ:').setFontWeight('bold');
    sheet.getRange(noteRow + 1, 1).setValue('• แก้ค่าได้ผ่าน Admin Panel หรือพิมพ์ในตารางตรงนี้ก็ได้');
    sheet.getRange(noteRow + 2, 1).setValue('• เปอร์เซ็นต์คือ "% ที่ Platform หัก" เช่น 32 = หัก 32%, ร้านได้ 68%');
    sheet.getRange(noteRow + 3, 1).setValue('• ถ้าต้องการเพิ่มสาขาใหม่ ให้เพิ่มแถวต่อ + ระบุชื่อให้ตรงกับ HTML');
  }
  return sheet;
}

function getGpRatesForBranch(branch) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateGpSheet(ss);
  const lastRow = Math.max(sheet.getLastRow(), BRANCH_LIST.length + 1);
  const data = sheet.getRange(2, 1, lastRow - 1, PLATFORMS.length + 1).getValues();

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(branch).trim()) {
      const rates = {};
      PLATFORMS.forEach((p, idx) => {
        const val = parseFloat(data[i][idx + 1]);
        rates[p] = isNaN(val) ? DEFAULT_GP[p] : val;
      });
      return rates;
    }
  }
  // ไม่เจอ → คืน default
  return { ...DEFAULT_GP };
}

function getAllGpRates() {
  const result = {};
  BRANCH_LIST.forEach(b => result[b] = getGpRatesForBranch(b));
  return result;
}

function handleUpdateGpRates(data) {
  // ตรวจ PIN
  if (data.pin !== ADMIN_PIN) {
    return jsonResponse({ status: 'error', error: 'PIN ไม่ถูกต้อง' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateGpSheet(ss);
  const lastRow = Math.max(sheet.getLastRow(), BRANCH_LIST.length + 1);
  const branchData = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  // อัพเดตแต่ละสาขาที่ส่งมา
  Object.keys(data.rates || {}).forEach(branch => {
    const rates = data.rates[branch];
    let rowIdx = -1;
    for (let i = 0; i < branchData.length; i++) {
      if (String(branchData[i][0]).trim() === String(branch).trim()) {
        rowIdx = i + 2;
        break;
      }
    }
    if (rowIdx === -1) {
      // เพิ่มแถวใหม่
      sheet.appendRow([branch, ...PLATFORMS.map(p => rates[p] || DEFAULT_GP[p]), new Date()]);
      rowIdx = sheet.getLastRow();
    } else {
      // อัพเดตแถวเดิม
      const values = PLATFORMS.map(p => Number(rates[p]) || DEFAULT_GP[p]);
      sheet.getRange(rowIdx, 2, 1, PLATFORMS.length).setValues([values]);
      sheet.getRange(rowIdx, PLATFORMS.length + 2).setValue(new Date());
    }
  });

  // เขียน Log
  appendGpChangeLog(ss, data);

  return jsonResponse({ status: 'ok', message: 'อัพเดต GP Rate สำเร็จ' });
}

function appendGpChangeLog(ss, data) {
  let log = ss.getSheetByName(GP_LOG_SHEET_NAME);
  if (!log) {
    log = ss.insertSheet(GP_LOG_SHEET_NAME);
    log.getRange(1, 1, 1, 4).setValues([['Timestamp', 'แก้โดย', 'รายละเอียด', 'GP ใหม่ (JSON)']]);
    log.getRange(1, 1, 1, 4)
       .setBackground('#7C3AED').setFontColor('#FFFFFF').setFontWeight('bold');
    log.setFrozenRows(1);
    log.setColumnWidths(1, 4, 180);
    log.setColumnWidth(4, 400);
  }
  log.appendRow([
    new Date(),
    data.adminName || 'Admin',
    'อัพเดต GP Rate ' + Object.keys(data.rates || {}).join(', '),
    JSON.stringify(data.rates)
  ]);
}

// ========== Summary Sheet ==========

function ensureSummarySheet(ss) {
  let sheet = ss.getSheetByName(SUMMARY_SHEET_NAME);
  if (sheet) return;
  sheet = ss.insertSheet(SUMMARY_SHEET_NAME, 0);
  sheet.getRange('A1').setValue('📊 สรุปยอดรวมทุกสาขา (อัพเดตอัตโนมัติ)')
       .setFontSize(16).setFontWeight('bold').setFontColor('#D97706');

  const headers = ['สาขา', 'จำนวนวันที่บันทึก', 'รายรับรวม', 'รายจ่ายจริงรวม', 'กำไรสุทธิรวม', 'กำไรเฉลี่ย/วัน'];
  sheet.getRange(3, 1, 1, headers.length).setValues([headers])
       .setBackground('#D97706').setFontColor('#FFFFFF').setFontWeight('bold');

  BRANCH_LIST.forEach((branch, idx) => {
    const row = idx + 4;
    sheet.getRange(row, 1).setValue(branch).setFontWeight('bold');
    sheet.getRange(row, 2).setFormula(`=IFERROR(COUNTA('${branch}'!B2:B), 0)`);
    sheet.getRange(row, 3).setFormula(`=IFERROR(SUM('${branch}'!AA2:AA), 0)`).setNumberFormat('#,##0.00');
    sheet.getRange(row, 4).setFormula(`=IFERROR(SUM('${branch}'!U2:U) + SUM('${branch}'!Y2:Y), 0)`).setNumberFormat('#,##0.00');
    sheet.getRange(row, 5).setFormula(`=IFERROR(SUM('${branch}'!AC2:AC), 0)`).setNumberFormat('#,##0.00');
    sheet.getRange(row, 6).setFormula(`=IFERROR(E${row}/B${row}, 0)`).setNumberFormat('#,##0.00');
  });

  const totalRow = BRANCH_LIST.length + 4;
  sheet.getRange(totalRow, 1).setValue('🔵 รวมทุกสาขา').setFontWeight('bold').setBackground('#FEF3C7');
  for (let c = 2; c <= 6; c++) {
    const col = String.fromCharCode(64 + c);
    sheet.getRange(totalRow, c).setFormula(`=SUM(${col}4:${col}${totalRow - 1})`)
         .setNumberFormat(c === 2 ? '#,##0' : '#,##0.00')
         .setFontWeight('bold').setBackground('#FEF3C7');
  }
  sheet.setColumnWidths(1, 6, 170);
  sheet.setColumnWidth(1, 200);
}

// ========== UTILITIES ==========

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
         .setMimeType(ContentService.MimeType.JSON);
}

// ========== INITIAL SETUP (รันครั้งเดียว) ==========

function initialSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  BRANCH_LIST.forEach(b => getOrCreateBranchSheet(ss, b));
  getOrCreateGpSheet(ss);
  ensureSummarySheet(ss);

  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert(
    '✅ ติดตั้งสำเร็จ!\n\n' +
    '• สร้าง Sheet 4 สาขา\n' +
    '• สร้าง Sheet สรุปรวม\n' +
    '• สร้าง Sheet ⚙️ ตั้งค่า GP (default 32/35/30)\n\n' +
    'ขั้นตอนถัดไป: Deploy เป็น Web app แล้ว copy URL'
  );
}
