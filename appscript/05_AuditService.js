/**
 * 05_AuditService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Append-only audit log. Every create/update/delete/approve action records here.
 * Mirrors src/services/mock/auditService.ts.
 *
 * Public API:
 *   AuditService.record({ user, action, module, recordRef })  → AuditLog object
 *   AuditService.getAll()                                      → AuditLog[]
 * ─────────────────────────────────────────────────────────────────────────────
 */

var AuditService = (function () {

  var SHEET = CONFIG.SHEETS.AUDIT;

  return {

    /**
     * Append an audit entry.
     * @param {{ user: string, action: string, module: string, recordRef: string }} input
     * @returns {Object}
     */
    record: function (input) {
      var entry = {
        id:        generateId(),
        user:      input.user,
        date:      nowIso(),
        action:    input.action,
        module:    input.module,
        recordRef: input.recordRef,
      };
      SheetDB.insert(SHEET, entry);
      return entry;
    },

    /** Return all audit log entries, newest first. */
    getAll: function () {
      return SheetDB.getAll(SHEET).sort(function (a, b) {
        return b.date > a.date ? 1 : -1;
      });
    },

  };

})();
