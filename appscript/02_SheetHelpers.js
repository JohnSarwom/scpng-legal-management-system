/**
 * 02_SheetHelpers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Low-level read/write helpers for Google Sheets.
 * All service files go through these — never talk to Sheets directly.
 *
 * Pattern:
 *   SheetDB.getAll('Cases')           → array of plain objects
 *   SheetDB.findById('Cases','id', x) → single object or null
 *   SheetDB.insert('Cases', obj)      → writes row, returns obj
 *   SheetDB.update('Cases','id', x, patch) → updates row in place, returns obj
 *   SheetDB.remove('Cases','id', x)   → deletes row
 *   SheetDB.nextCounter('case')       → increments + returns new number
 * ─────────────────────────────────────────────────────────────────────────────
 */

var SheetDB = (function () {

  /** Read the header row and all data rows as array of objects. */
  function getAll(sheetName) {
    var sheet = getSheet(sheetName);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return [];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data    = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    return data.map(function (row) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = row[i]; });
      return obj;
    });
  }

  /** Find all rows where obj[keyCol] === value. */
  function findWhere(sheetName, keyCol, value) {
    return getAll(sheetName).filter(function (row) {
      return String(row[keyCol]) === String(value);
    });
  }

  /** Find first row where obj[keyCol] === value, or null. */
  function findById(sheetName, keyCol, value) {
    var rows = findWhere(sheetName, keyCol, value);
    return rows.length > 0 ? rows[0] : null;
  }

  /** Append a new row. obj must have keys matching the sheet headers. */
  function insert(sheetName, obj) {
    var sheet   = getSheet(sheetName);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row     = headers.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
    sheet.appendRow(row);
    return obj;
  }

  /**
   * Update a row in place.
   * @param {string} sheetName
   * @param {string} keyCol    - header name used to identify the row (e.g. 'id')
   * @param {string} value     - value to match
   * @param {Object} patch     - partial object with fields to overwrite
   * @returns {Object|null}    - updated object, or null if not found
   */
  function update(sheetName, keyCol, value, patch) {
    var sheet   = getSheet(sheetName);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return null;
    var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var keyIndex = headers.indexOf(keyCol);
    if (keyIndex === -1) throw new Error('Column not found: ' + keyCol);

    for (var i = 0; i < data.length; i++) {
      if (String(data[i][keyIndex]) === String(value)) {
        var updatedObj = {};
        headers.forEach(function (h, j) { updatedObj[h] = data[i][j]; });
        Object.assign(updatedObj, patch);
        var newRow = headers.map(function (h) { return updatedObj[h] !== undefined ? updatedObj[h] : ''; });
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([newRow]);
        return updatedObj;
      }
    }
    return null;
  }

  /** Delete the row where obj[keyCol] === value. */
  function remove(sheetName, keyCol, value) {
    var sheet    = getSheet(sheetName);
    var headers  = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var lastRow  = sheet.getLastRow();
    if (lastRow < 2) return false;
    var data     = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    var keyIndex = headers.indexOf(keyCol);

    for (var i = data.length - 1; i >= 0; i--) {
      if (String(data[i][keyIndex]) === String(value)) {
        sheet.deleteRow(i + 2);
        return true;
      }
    }
    return false;
  }

  /**
   * Read the current counter, increment by 1, write it back, return new value.
   * @param {string} key  - one of: 'case','document','correspondence','entity','notification'
   */
  function nextCounter(key) {
    var sheet    = getSheet(CONFIG.SHEETS.COUNTERS);
    var lastRow  = sheet.getLastRow();
    var data     = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === key) {
        var next = Number(data[i][1]) + 1;
        sheet.getRange(i + 2, 2).setValue(next);
        return next;
      }
    }
    throw new Error('Counter key not found: ' + key);
  }

  /**
   * Build a padded reference number.
   * nextNumber('case','CASE') → 'CASE-2026-013'
   */
  function nextNumber(counterKey, prefix) {
    var n    = nextCounter(counterKey);
    var year = new Date().getFullYear();
    return prefix + '-' + year + '-' + String(n).padStart(3, '0');
  }

  return { getAll, findWhere, findById, insert, update, remove, nextCounter, nextNumber };

})();
