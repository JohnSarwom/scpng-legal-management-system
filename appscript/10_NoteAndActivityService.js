/**
 * 10_NoteAndActivityService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Notes (manual case comments) and Activities (system-generated timeline events).
 * Mirrors src/services/mock/noteService.ts and activityService.ts.
 *
 * NoteService:
 *   NoteService.getByCase(caseId)             → Note[]
 *   NoteService.create(caseId, body, user)    → Note
 *
 * ActivityService:
 *   ActivityService.getByCase(caseId)         → Activity[]
 *   ActivityService.record(caseId, type, description, user) → Activity
 * ─────────────────────────────────────────────────────────────────────────────
 */

var NoteService = (function () {

  var SHEET = CONFIG.SHEETS.NOTES;

  return {

    getByCase: function (caseId) {
      return SheetDB.findWhere(SHEET, 'caseId', caseId)
        .sort(function (a, b) { return b.createdAt > a.createdAt ? 1 : -1; });
    },

    create: function (caseId, body, user) {
      var note = {
        id:        generateId(),
        caseId:    caseId,
        body:      body,
        createdBy: user.name,
        createdAt: nowIso(),
      };
      SheetDB.insert(SHEET, note);
      AuditService.record({ user: user.name, action: 'Create', module: 'Cases', recordRef: 'Note on case ' + caseId });
      return note;
    },

  };

})();


var ActivityService = (function () {

  var SHEET = CONFIG.SHEETS.ACTIVITIES;

  return {

    getByCase: function (caseId) {
      return SheetDB.findWhere(SHEET, 'caseId', caseId)
        .sort(function (a, b) { return b.createdAt > a.createdAt ? 1 : -1; });
    },

    record: function (caseId, type, description, user) {
      var activity = {
        id:          generateId(),
        caseId:      caseId,
        type:        type,
        description: description,
        createdBy:   user.name,
        createdAt:   nowIso(),
      };
      SheetDB.insert(SHEET, activity);
      return activity;
    },

  };

})();
