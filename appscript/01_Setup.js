/**
 * 01_Setup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time setup: creates all sheets with correct headers, then seeds all
 * mock data from the React app (db.ts) into the Google Sheet.
 *
 * RUN ONCE:  Setup.runFullSetup()
 * RESET:     Setup.clearAllData()  then  Setup.runFullSetup()
 * ─────────────────────────────────────────────────────────────────────────────
 */

var Setup = (function () {

  // ── Sheet header definitions ─────────────────────────────────────────────────

  var HEADERS = {
    Users: [
      'id', 'name', 'role', 'email', 'createdAt'
    ],
    Entities: [
      'entityId', 'entityName', 'entityStatus', 'entityType',
      'registrationDetails', 'licenseNumber', 'registrationDate', 'source',
      'createdAt', 'updatedAt'
    ],
    Cases: [
      'id', 'caseNumber', 'caseTitle', 'entityId', 'caseType', 'description',
      'responsibleOfficerId', 'status', 'dateOpened', 'dateClosed',
      'isConfidential', 'confidentialClass', 'grantedUserIds', 'grantedEditUserIds',
      'createdAt', 'updatedAt'
    ],
    Documents: [
      'id', 'documentNumber', 'title', 'category', 'currentVersion',
      'entityId', 'caseId', 'correspondenceId', 'relatedCaseIds',
      'uploadedBy', 'uploadDate', 'status', 'isConfidential', 'classification',
      'sourceUrl', 'expiryDate', 'createdAt', 'updatedAt'
    ],
    Correspondence: [
      'id', 'correspondenceNumber', 'subject', 'direction', 'date',
      'sender', 'recipient', 'category', 'priority', 'confidentiality',
      'assignedTo', 'actionRequired', 'dueDate', 'responseReference',
      'entityId', 'caseId', 'attachments', 'status', 'closedDate',
      'approvedBy', 'approvedAt'
    ],
    Notes: [
      'id', 'caseId', 'body', 'createdBy', 'createdAt'
    ],
    Activities: [
      'id', 'caseId', 'type', 'description', 'createdBy', 'createdAt'
    ],
    AuditLog: [
      'id', 'user', 'date', 'action', 'module', 'recordRef'
    ],
    Notifications: [
      'id', 'recipientId', 'type', 'title', 'body',
      'entityType', 'entityId', 'linkTo', 'read', 'createdAt'
    ],
    Counters: [
      'key', 'value'
    ],
  };

  // ── Seed data (mirrors src/services/mock/db.ts) ──────────────────────────────

  var SEED_USERS = [
    ['u-ceo',  'James Joshua',     'CEO',                  'james.joshua@scpng.gov.pg',     nowIso()],
    ['u-gc',   'Andy Ambulu',      'General Counsel',      'andy.ambulu@scpng.gov.pg',      nowIso()],
    ['u-lm',   'Tyson Yapao',      'Legal Manager',        'tyson.yapao@scpng.gov.pg',      nowIso()],
    ['u-sr',   'Isaac Mel',        'Senior Legal Officer', 'isaac.mel@scpng.gov.pg',        nowIso()],
    ['u-lo1',  'Immanuel Minoga',  'Legal Officer',        'immanuel.minoga@scpng.gov.pg',  nowIso()],
    ['u-lo2',  'Tony Kawas',       'Senior Legal Officer', 'tony.kawas@scpng.gov.pg',       nowIso()],
    ['u-eo',   'Ninipe Gurumo',    'Executive Officer',    'ninipe.gurumo@scpng.gov.pg',    nowIso()],
    ['u-lo3',  'Johnson Tengere',  'Legal Officer',        'johnson.tengere@scpng.gov.pg',  nowIso()],
  ];

  var SEED_ENTITIES = [
    ['ENT-001','Kumul Capital Markets Limited',     'Registered','Broker-Dealer',        'Licensed broker-dealer, Port Moresby, renewed 2026.',          'SCPNG-BD-001','2021-02-10','Licensing', nowIso(), nowIso()],
    ['ENT-002','Pacific Balanced Fund Management',  'Registered','Fund Manager',         'Fund manager operating domestic unit trust products.',          'SCPNG-FM-002','2020-07-22','Licensing', nowIso(), nowIso()],
    ['ENT-003','Sepik Securities Brokers',          'Suspended', 'Broker-Dealer',        'Broker licence suspended pending compliance remediation.',      'SCPNG-BD-003','2019-11-05','Licensing', nowIso(), nowIso()],
    ['ENT-004','New Guinea Energy Holdings',        'Registered','Listed Issuer',        'PNGX listed issuer, energy sector.',                            'SCPNG-LI-004','2018-04-30','Licensing', nowIso(), nowIso()],
    ['ENT-005','Highlands Trustees & Custody',      'Pending',   'Trustee/Custodian',    'Trustee application under regulatory review.',                  '',            '2026-01-15','Licensing', nowIso(), nowIso()],
    ['ENT-006','Coral Sea Superannuation Nominees', 'Registered','Trustee/Custodian',    'Licensed nominee and custodial services provider.',             'SCPNG-TC-006','2017-09-12','Licensing', nowIso(), nowIso()],
    ['ENT-007','Bougainville Resources Exchange',   'Registered','Market Participant',   'Market participant with cross-border listing exposure.',         'SCPNG-MP-007','2022-03-18','Licensing', nowIso(), nowIso()],
    ['ENT-008','Motuan Asset Advisors',             'Registered','Investment Adviser',   'Investment adviser licence, Port Moresby.',                     'SCPNG-IA-008','2021-08-01','Licensing', nowIso(), nowIso()],
    ['ENT-009','PNG Infrastructure Notes PLC',      'Registered','Listed Issuer',        'Debt issuer with gazettal requirements.',                        'SCPNG-LI-009','2023-05-26','Licensing', nowIso(), nowIso()],
    ['ENT-010','Madang Growth Equities',            'Revoked',   'Fund Manager',         'Licence revoked following enforcement decision.',               'SCPNG-FM-010','2016-12-09','Licensing', nowIso(), nowIso()],
    ['ENT-011','National Capital Custodians',       'Registered','Trustee/Custodian',    'Custodian with institutional client base.',                     'SCPNG-TC-011','2019-02-14','Licensing', nowIso(), nowIso()],
    ['ENT-012','Ramu Compliance Services',          'Registered','Other',                'Compliance consulting firm for market participants.',            'SCPNG-OT-012','2020-10-03','Licensing', nowIso(), nowIso()],
  ];

  var SEED_CASES = [
    ['case-1',  'CASE-2026-001','Sepik Securities licence suspension appeal',        'ENT-003','Regulatory',  'Review of suspension appeal and remediation undertakings.',          'u-lm',  'Under Review','2026-01-13','',           'FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-2',  'CASE-2026-002','Kumul Capital market manipulation inquiry',         'ENT-001','Compliance',  'Legal support for investigation into unusual trade activity.',        'u-gc',  'Open',        '2026-02-04','',           'TRUE', 'Regulatory Investigations', 'u-lm','',   nowIso(), nowIso()],
    ['case-3',  'CASE-2026-003','Employment disciplinary review',                    'ENT-012','Employment',  'Advice on staff disciplinary matter involving privileged records.',   'u-sr',  'Pending',     '2026-02-18','',           'TRUE', 'Employment Disciplinary Cases','','',  nowIso(), nowIso()],
    ['case-4',  'CASE-2026-004','PNG Infrastructure Notes prospectus review',        'ENT-009','Contracts',   'Prospectus and note deed legal review.',                              'u-lo1', 'Open',        '2026-03-01','',           'FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-5',  'CASE-2026-005','Madang Growth revocation litigation',               'ENT-010','Litigation',  'Court challenge to licence revocation.',                              'u-gc',  'Open',        '2026-03-09','',           'TRUE', 'Litigation Matters',        '','',          nowIso(), nowIso()],
    ['case-6',  'CASE-2026-006','Bougainville Exchange listing rules advice',        'ENT-007','Regulatory',  'Advice on listing rule harmonisation.',                               'u-lo2', 'Draft',       '2026-03-22','',           'FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-7',  'CASE-2026-007','Pacific Balanced Fund deed amendment',              'ENT-002','Contracts',   'Review trust deed amendment and investor notices.',                   'u-lo1', 'Closed',      '2026-01-30','2026-04-12','FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-8',  'CASE-2026-008','Board delegation instrument update',                'ENT-006','Other',       'Confidential advice on board delegation instrument.',                 'u-lm',  'Pending',     '2026-04-08','',           'TRUE', 'Board Matters',             '','',          nowIso(), nowIso()],
    ['case-9',  'CASE-2026-009','Motuan Asset adviser agreement',                    'ENT-008','Contracts',   'Standard adviser agreement revision.',                                'u-lo3', 'Open',        '2026-04-21','',           'FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-10', 'CASE-2026-010','National Capital custody compliance notice',        'ENT-011','Compliance',  'Draft compliance notice and enforcement options.',                    'u-sr',  'Under Review','2026-05-03','',           'FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-11', 'CASE-2026-011','Highlands trustee application conditions',          'ENT-005','Regulatory',  'Licence condition drafting for trustee application.',                 'u-lo2', 'Open',        '2026-05-20','',           'FALSE','',                        '','',          nowIso(), nowIso()],
    ['case-12', 'CASE-2026-012','New Guinea Energy continuous disclosure matter',    'ENT-004','Compliance',  'Continuous disclosure advice and CEO brief.',                         'u-eo',  'Open',        '2026-06-01','',           'FALSE','',                        '','',          nowIso(), nowIso()],
  ];

  var SEED_DOCUMENTS = [
    ['doc-1',  'DOC-2026-001','Sepik Suspension Notice',       'Compliance Documents',  '1','ENT-003','case-1', '','',       'u-lm',  '2026-01-10','Active',     'FALSE','Restricted',  '','',           nowIso(), nowIso()],
    ['doc-2',  'DOC-2026-002','Kumul Investigation Brief',     'Internal Memos',        '2','ENT-001','case-2', '','',       'u-gc',  '2026-02-10','Active',     'TRUE', 'Confidential','','',           nowIso(), nowIso()],
    ['doc-3',  'DOC-2026-003','Employment Advice Draft',       'Legal Opinions',        '1','ENT-012','case-3', '','',       'u-sr',  '2026-03-10','Draft',      'TRUE', 'Confidential','','',           nowIso(), nowIso()],
    ['doc-4',  'DOC-2026-004','Prospectus Legal Review',       'Legal Opinions',        '1','ENT-009','case-4', '','case-12','u-lo1', '2026-04-10','Active',     'FALSE','Restricted',  '','',           nowIso(), nowIso()],
    ['doc-5',  'DOC-2026-005','Court Originating Summons',     'Court Documents',       '1','ENT-010','case-5', '','',       'u-gc',  '2026-05-10','Active',     'TRUE', 'Confidential','','',           nowIso(), nowIso()],
    ['doc-6',  'DOC-2026-006','Listing Rules Markup',          'Agreements',            '1','ENT-007','case-6', '','case-11','u-lo2', '2026-06-10','Draft',      'FALSE','Restricted',  '','',           nowIso(), nowIso()],
    ['doc-7',  'DOC-2026-007','Fund Deed Amendment',           'Contracts',             '1','ENT-002','case-7', '','',       'u-lo1', '2026-01-10','Superseded', 'FALSE','Restricted',  '','2026-09-30', nowIso(), nowIso()],
    ['doc-8',  'DOC-2026-008','Board Delegation Note',         'Internal Memos',        '2','ENT-006','case-8', '','',       'u-lm',  '2026-02-10','Active',     'TRUE', 'Confidential','','',           nowIso(), nowIso()],
    ['doc-9',  'DOC-2026-009','Adviser Agreement',             'Contracts',             '1','ENT-008','case-9', '','case-7', 'u-lo3', '2026-03-10','Active',     'FALSE','Restricted',  '','2026-09-30', nowIso(), nowIso()],
    ['doc-10', 'DOC-2026-010','Custody Compliance Notice',     'External Correspondence','1','ENT-011','case-10','','',      'u-sr',  '2026-04-10','Active',     'FALSE','Restricted',  '','',           nowIso(), nowIso()],
  ];

  var SEED_CORRESPONDENCE = [
    ['corr-1','COR-2026-001','CEO request for Sepik suspension update',      'Incoming','2026-02-16','CEO Office',        'Legal Division',                  'Regulatory Communications',      'High',    'Confidential','Legal Manager',   'Response',        '2026-02-20','COR-2026-002','ENT-003','case-1', 'doc-1','Closed',          '2026-02-20','u-ceo','2026-02-20'],
    ['corr-2','COR-2026-002','Kumul inquiry holding response',               'Outgoing','2026-03-05','SCPNG CEO',         'Kumul Capital Markets Limited',    'Regulatory Communications',      'High',    'Confidential','General Counsel', 'Response',        '2026-03-19','',            'ENT-001','case-2', 'doc-2','Awaiting Response','',          '',     ''],
    ['corr-3','COR-2026-003','Prospectus clarification request',             'Incoming','2026-03-18','PNG Infrastructure Notes PLC','SCPNG CEO',             'Regulatory Communications',      'Medium',  'Internal',    'Senior Legal Officer','Review',      '2026-04-01','',            'ENT-009','case-4', 'doc-4','Under Review',    '',          '',     ''],
    ['corr-4','COR-2026-004','Revocation proceedings service update',        'Incoming','2026-03-29','External Counsel',  'General Counsel',                 'Complaints Escalated to CEO',    'Critical','Restricted',  'General Counsel','Review',         '2026-04-10','',            'ENT-010','case-5', 'doc-5','Investigating',   '',          '',     ''],
    ['corr-5','COR-2026-005','Board delegation advice request',              'Incoming','2026-04-12','Chairman',          'Legal Manager',                    'Board Communications',           'High',    'Confidential','Legal Manager',   'Approval',        '2026-04-22','',            'ENT-006','case-8', 'doc-8','In Progress',     '',          '',     ''],
    ['corr-6','COR-2026-006','Custody compliance notice dispatch',           'Outgoing','2026-05-11','SCPNG CEO',         'National Capital Custodians',      'Regulatory Communications',      'Medium',  'Internal',    'Legal Manager',   'Information Only','',           '',            'ENT-011','case-10','doc-10','Closed',         '2026-05-19','u-lm', '2026-05-12'],
    ['corr-7','COR-2026-007','Trustee conditions consultation',              'Outgoing','2026-05-26','SCPNG Legal',       'Highlands Trustees & Custody',     'Stakeholder Letters',            'Medium',  'Internal',    'Senior Legal Officer','Response',   '2026-06-10','',            'ENT-005','case-11','',    'Open',            '',          '',     ''],
    ['corr-8','COR-2026-008','Disclosure matter CEO briefing',               'Incoming','2026-06-02','Market Supervision','CEO Office',                      'Internal Executive Directives',  'High',    'Confidential','CEO Office',      'Review',          '2026-06-12','',            'ENT-004','case-12','',    'Awaiting Response','',         '',     ''],
    ['corr-9','COR-2026-009','Adviser agreement confirmation',               'Outgoing','2026-06-08','SCPNG Legal',       'Motuan Asset Advisors',            'Stakeholder Letters',            'Low',     'Internal',    'Legal Officer',   'Information Only','',           'COR-2026-007','ENT-008','case-9', 'doc-9','Responded',       '2026-06-13','',    ''],
  ];

  var SEED_NOTES = [
    ['note-1','case-1','Requested updated remediation schedule from licence holder.','Tyson Yapao', nowIso()],
    ['note-2','case-5','External counsel brief settled for filing timeline.',         'Andy Ambulu', nowIso()],
  ];

  var SEED_ACTIVITIES = [
    ['act-1','case-1',  'Status Change',   'Case moved to Under Review.','Tyson Yapao',     nowIso()],
    ['act-2','case-4',  'Document linked', 'Prospectus review memo linked.','Immanuel Minoga', nowIso()],
  ];

  var SEED_NOTIFICATIONS = [
    ['notif-1',  'u-lm',  'case_assigned',                   'Case assigned to you',            'CASE-2026-001 "Sepik Securities licence suspension appeal" has been assigned to you.',       'case',           'case-1', '/cases/case-1',           'FALSE','2026-06-20T08:10:00Z'],
    ['notif-2',  'u-lm',  'correspondence_pending_approval', 'Correspondence pending approval',  'COR-2026-005 "Board delegation advice request" requires your approval.',                    'correspondence', 'corr-5', '/correspondence/corr-5',  'FALSE','2026-06-21T09:30:00Z'],
    ['notif-3',  'u-lm',  'document_uploaded',               'New document uploaded',            'DOC-2026-008 "Board Delegation Note" was uploaded and linked to CASE-2026-008.',            'document',       'doc-8',  '/documents/doc-8',        'TRUE', '2026-06-19T14:00:00Z'],
    ['notif-4',  'u-gc',  'correspondence_pending_approval', 'Correspondence pending approval',  'COR-2026-002 "Kumul inquiry holding response" is awaiting your approval before dispatch.','correspondence', 'corr-2', '/correspondence/corr-2',  'FALSE','2026-06-22T07:45:00Z'],
    ['notif-5',  'u-gc',  'case_status_changed',             'Case status updated',              'CASE-2026-005 "Madang Growth revocation litigation" moved to Open.',                        'case',           'case-5', '/cases/case-5',           'FALSE','2026-06-23T10:00:00Z'],
    ['notif-6',  'u-sr',  'case_assigned',                   'Case assigned to you',             'CASE-2026-003 "Employment disciplinary review" has been assigned to you.',                  'case',           'case-3', '/cases/case-3',           'FALSE','2026-06-21T11:15:00Z'],
    ['notif-7',  'u-sr',  'document_uploaded',               'New document uploaded',            'DOC-2026-003 "Employment Advice Draft" was added to your case.',                            'document',       'doc-3',  '/documents/doc-3',        'TRUE', '2026-06-18T09:00:00Z'],
    ['notif-8',  'u-lo1', 'case_assigned',                   'Case assigned to you',             'CASE-2026-004 "PNG Infrastructure Notes prospectus review" has been assigned to you.',     'case',           'case-4', '/cases/case-4',           'FALSE','2026-06-20T08:30:00Z'],
    ['notif-9',  'u-lo1', 'correspondence_approved',         'Correspondence approved',          'COR-2026-006 "Custody compliance notice dispatch" has been approved and dispatched.',      'correspondence', 'corr-6', '/correspondence/corr-6',  'TRUE', '2026-06-19T16:00:00Z'],
    ['notif-10', 'u-eo',  'case_created',                    'New case opened',                  'CASE-2026-012 "New Guinea Energy continuous disclosure matter" has been opened.',           'case',           'case-12','/cases/case-12',          'FALSE','2026-06-22T13:00:00Z'],
    ['notif-11', 'u-ceo', 'case_status_changed',             'Case status updated',              'CASE-2026-001 "Sepik Securities licence suspension appeal" is now Under Review.',           'case',           'case-1', '/cases/case-1',           'FALSE','2026-06-23T08:00:00Z'],
  ];

  var SEED_COUNTERS = [
    ['case',           12],
    ['document',       28],
    ['correspondence',  9],
    ['entity',         12],
    ['notification',   11],
  ];

  // ── Private helpers ──────────────────────────────────────────────────────────

  function createSheet(ss, name, headers) {
    var existing = ss.getSheetByName(name);
    var sheet = existing || ss.insertSheet(name);
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#7B1A2E')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    return sheet;
  }

  function appendRows(sheetName, rows) {
    if (!rows || rows.length === 0) return;
    var sheet = getSheet(sheetName);
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  return {

    /** Creates all sheets with headers. Safe to re-run — clears and rebuilds. */
    createAllSheets: function () {
      var ss = getSpreadsheet();
      Object.entries(HEADERS).forEach(function (entry) {
        createSheet(ss, entry[0], entry[1]);
      });
      Logger.log('All sheets created.');
    },

    /** Seeds all mock data. Run after createAllSheets(). */
    seedAllData: function () {
      appendRows(CONFIG.SHEETS.USERS,          SEED_USERS);
      appendRows(CONFIG.SHEETS.ENTITIES,       SEED_ENTITIES);
      appendRows(CONFIG.SHEETS.CASES,          SEED_CASES);
      appendRows(CONFIG.SHEETS.DOCUMENTS,      SEED_DOCUMENTS);
      appendRows(CONFIG.SHEETS.CORRESPONDENCE, SEED_CORRESPONDENCE);
      appendRows(CONFIG.SHEETS.NOTES,          SEED_NOTES);
      appendRows(CONFIG.SHEETS.ACTIVITIES,     SEED_ACTIVITIES);
      appendRows(CONFIG.SHEETS.NOTIFICATIONS,  SEED_NOTIFICATIONS);
      appendRows(CONFIG.SHEETS.COUNTERS,       SEED_COUNTERS);
      appendRows(CONFIG.SHEETS.AUDIT,          [
        [generateId(), 'System', nowIso(), 'Create', 'System', 'Seed data loaded'],
      ]);
      Logger.log('All seed data written.');
    },

    /** Clears all data rows (keeps headers). */
    clearAllData: function () {
      var ss = getSpreadsheet();
      Object.values(CONFIG.SHEETS).forEach(function (name) {
        var sheet = ss.getSheetByName(name);
        if (!sheet) return;
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
      });
      Logger.log('All data cleared.');
    },

    /** Full setup: create sheets + seed data. Run this once. */
    runFullSetup: function () {
      this.createAllSheets();
      this.seedAllData();
      Logger.log('Full setup complete.');
    },
  };

})();

/** Top-level runner — call this from the Apps Script editor to set up. */
function runFullSetup() {
  Setup.runFullSetup();
}
