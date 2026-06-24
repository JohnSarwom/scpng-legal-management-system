/**
 * 00_Config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central configuration for the SCPNG Legal Management System – Apps Script.
 * Every other file reads from this object; change values here, not scattered.
 *
 * HOW TO USE:
 *   1. Open your Google Sheet.
 *   2. Copy the Spreadsheet ID from the URL (the long string between /d/ and /edit).
 *   3. Paste it into SPREADSHEET_ID below.
 *   4. Run Setup.runFullSetup() once to create all sheets and seed all data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

var CONFIG = {

  // ── Spreadsheet ─────────────────────────────────────────────────────────────
  SPREADSHEET_ID: 'PASTE_YOUR_SPREADSHEET_ID_HERE',

  // ── Sheet (tab) names ───────────────────────────────────────────────────────
  SHEETS: {
    USERS:            'Users',
    ENTITIES:         'Entities',
    CASES:            'Cases',
    DOCUMENTS:        'Documents',
    CORRESPONDENCE:   'Correspondence',
    NOTES:            'Notes',
    ACTIVITIES:       'Activities',
    AUDIT:            'AuditLog',
    NOTIFICATIONS:    'Notifications',
    COUNTERS:         'Counters',
  },

  // ── Email notification settings ─────────────────────────────────────────────
  EMAIL: {
    ENABLED: true,              // set false during testing to suppress emails
    FROM_NAME: 'SCPNG Legal System',
    SUBJECT_PREFIX: '[SCPNG Legal]',
  },

  // ── Role definitions (mirrors src/config/enums.ts) ──────────────────────────
  ROLES: [
    'CEO',
    'General Counsel',
    'Legal Manager',
    'Senior Legal Officer',
    'Legal Officer',
    'Executive Officer',
  ],

  // ── Permission matrix (mirrors src/config/permissions.ts) ───────────────────
  // Values: 'full' | 'assigned' | 'limited' | 'none'
  PERMISSIONS: {
    viewCases:                    { 'CEO': 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'assigned', 'Legal Officer': 'assigned', 'Executive Officer': 'assigned' },
    createCases:                  { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'full',     'Executive Officer': 'none'     },
    editCases:                    { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'assigned', 'Executive Officer': 'none'     },
    closeCases:                   { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none',     'Legal Officer': 'none',     'Executive Officer': 'none'     },
    assignCases:                  { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none',     'Legal Officer': 'none',     'Executive Officer': 'none'     },
    viewDocuments:                { 'CEO': 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'full',     'Executive Officer': 'full'     },
    uploadDocuments:              { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'full',     'Executive Officer': 'full'     },
    editDocuments:                { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'assigned', 'Executive Officer': 'none'     },
    registerCorrespondence:       { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'full',     'Executive Officer': 'full'     },
    approveCorrespondence:        { 'CEO': 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none',     'Legal Officer': 'none',     'Executive Officer': 'none'     },
    viewReports:                  { 'CEO': 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'limited',  'Legal Officer': 'limited',  'Executive Officer': 'limited'  },
    userManagement:               { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'none', 'Senior Legal Officer': 'none',     'Legal Officer': 'none',     'Executive Officer': 'none'     },
    viewEntities:                 { 'CEO': 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'full',     'Executive Officer': 'full'     },
    manageEntities:               { 'CEO': 'none', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'none',     'Legal Officer': 'none',     'Executive Officer': 'none'     },
    viewNotifications:            { 'CEO': 'full', 'General Counsel': 'full', 'Legal Manager': 'full', 'Senior Legal Officer': 'full',     'Legal Officer': 'full',     'Executive Officer': 'full'     },
  },

  // ── Notification types ───────────────────────────────────────────────────────
  NOTIF_TYPES: {
    CASE_CREATED:                       'case_created',
    CASE_ASSIGNED:                      'case_assigned',
    CASE_STATUS_CHANGED:                'case_status_changed',
    DOCUMENT_UPLOADED:                  'document_uploaded',
    CORRESPONDENCE_PENDING_APPROVAL:    'correspondence_pending_approval',
    CORRESPONDENCE_APPROVED:            'correspondence_approved',
    CORRESPONDENCE_REJECTED:            'correspondence_rejected',
  },
};

/** Helper: return the spreadsheet object (cached per execution). */
function getSpreadsheet() {
  return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
}

/** Helper: return a named sheet, throws if missing. */
function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

/** Helper: check if a user role has a given permission. */
function can(role, action) {
  var matrix = CONFIG.PERMISSIONS[action];
  if (!matrix) return false;
  return matrix[role] !== 'none';
}

/** Helper: generate a UUID-like ID. */
function generateId() {
  return Utilities.getUuid();
}

/** Helper: ISO timestamp string. */
function nowIso() {
  return new Date().toISOString();
}

/** Helper: today as YYYY-MM-DD. */
function todayStr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
