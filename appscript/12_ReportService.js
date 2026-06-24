/**
 * 12_ReportService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dashboard summary statistics and report generation.
 * Mirrors src/services/mock/reportService.ts.
 *
 * Public API:
 *   ReportService.summary(user)   → { totalCases, openCases, ... }
 *   ReportService.auditLog()      → AuditLog[]
 *   ReportService.casesByStatus() → { status: count }
 *   ReportService.casesByType()   → { type: count }
 *   ReportService.corrByStatus()  → { status: count }
 * ─────────────────────────────────────────────────────────────────────────────
 */

var ReportService = (function () {

  function countBy(arr, key) {
    return arr.reduce(function (acc, item) {
      var v = item[key] || 'Unknown';
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
  }

  return {

    /**
     * High-level summary numbers for the dashboard.
     * @param {{id, name, role}} user
     */
    summary: function (user) {
      var allCases = CaseService.getAll({}, user);
      var allDocs  = DocumentService.getAll({});
      var allCorr  = CorrespondenceService.getAll({});
      var allNotif = NotificationService.getForUser(user.id);

      return {
        totalCases:             allCases.length,
        openCases:              allCases.filter(function (c) { return c.status === 'Open'; }).length,
        pendingCases:           allCases.filter(function (c) { return c.status === 'Pending'; }).length,
        underReviewCases:       allCases.filter(function (c) { return c.status === 'Under Review'; }).length,
        closedCases:            allCases.filter(function (c) { return c.status === 'Closed'; }).length,
        totalDocuments:         allDocs.length,
        draftDocuments:         allDocs.filter(function (d) { return d.status === 'Draft'; }).length,
        totalCorrespondence:    allCorr.length,
        pendingApproval:        allCorr.filter(function (c) { return c.actionRequired === 'Approval' && c.status !== 'Closed'; }).length,
        unreadNotifications:    allNotif.filter(function (n) { return String(n.read) !== 'TRUE'; }).length,
      };
    },

    /** Cases grouped by status. */
    casesByStatus: function (user) {
      return countBy(CaseService.getAll({}, user), 'status');
    },

    /** Cases grouped by type. */
    casesByType: function (user) {
      return countBy(CaseService.getAll({}, user), 'caseType');
    },

    /** Correspondence grouped by status. */
    corrByStatus: function () {
      return countBy(CorrespondenceService.getAll({}), 'status');
    },

    /** Full audit log (newest first). */
    auditLog: function () {
      return AuditService.getAll();
    },

    /**
     * Write a summary report to a new sheet tab for archiving.
     * @param {{id, name, role}} user
     */
    writeReportSheet: function (user) {
      Permissions.assertCan(user, 'viewReports');
      var ss   = getSpreadsheet();
      var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
      var name = 'Report-' + date;

      var existing = ss.getSheetByName(name);
      var sheet = existing || ss.insertSheet(name);
      sheet.clearContents();

      var summary = this.summary(user);
      var rows = [['Metric', 'Value']].concat(
        Object.entries(summary).map(function (e) { return [e[0], e[1]]; })
      );
      sheet.getRange(1, 1, rows.length, 2).setValues(rows);
      sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#7B1A2E').setFontColor('#ffffff');

      Logger.log('Report written to sheet: ' + name);
      return name;
    },

  };

})();
