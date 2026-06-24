/**
 * 07_DocumentService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Document CRUD with permission checks, audit logging, and upload notifications.
 * Mirrors src/services/mock/documentService.ts.
 *
 * Public API:
 *   DocumentService.getAll(filter?, user?)        → LegalDocument[]
 *   DocumentService.getById(id)                   → LegalDocument | null
 *   DocumentService.create(input, user)           → LegalDocument
 *   DocumentService.update(id, patch, user)       → LegalDocument
 *   DocumentService.remove(id, user)              → void
 * ─────────────────────────────────────────────────────────────────────────────
 */

var DocumentService = (function () {

  var SHEET = CONFIG.SHEETS.DOCUMENTS;

  /** Notify Legal Manager + the case's responsible officer when a doc is uploaded. */
  function notifyOnUpload(doc, uploaderId) {
    var notifySet = {};

    // Always notify Legal Managers (unless they uploaded it)
    SheetDB.getAll(CONFIG.SHEETS.USERS)
      .filter(function (u) { return u.role === 'Legal Manager' && u.id !== uploaderId; })
      .forEach(function (u) { notifySet[u.id] = true; });

    // Notify the responsible officer on the linked case
    if (doc.caseId) {
      var caseObj = SheetDB.findById(CONFIG.SHEETS.CASES, 'id', doc.caseId);
      if (caseObj && caseObj.responsibleOfficerId && caseObj.responsibleOfficerId !== uploaderId) {
        notifySet[caseObj.responsibleOfficerId] = true;
      }
    }

    Object.keys(notifySet).forEach(function (recipientId) {
      NotificationService.push({
        recipientId: recipientId,
        type:        CONFIG.NOTIF_TYPES.DOCUMENT_UPLOADED,
        title:       'New document uploaded',
        body:        doc.documentNumber + ' "' + doc.title + '" was uploaded' +
                     (doc.caseId ? ' and linked to case.' : '.'),
        entityType:  'document',
        entityId:    doc.id,
        linkTo:      '/documents/' + doc.id,
      });
    });
  }

  return {

    getAll: function (filter, user) {
      filter = filter || {};
      var rows = SheetDB.getAll(SHEET);

      if (filter.query) {
        var q = filter.query.toLowerCase();
        rows = rows.filter(function (d) {
          return [d.documentNumber, d.title, d.category, d.status]
            .some(function (v) { return String(v).toLowerCase().indexOf(q) !== -1; });
        });
      }

      if (filter.category)         rows = rows.filter(function (d) { return d.category === filter.category; });
      if (filter.status)           rows = rows.filter(function (d) { return d.status === filter.status; });
      if (filter.entityId)         rows = rows.filter(function (d) { return d.entityId === filter.entityId; });
      if (filter.caseId)           rows = rows.filter(function (d) { return d.caseId === filter.caseId; });
      if (filter.correspondenceId) rows = rows.filter(function (d) { return d.correspondenceId === filter.correspondenceId; });
      if (filter.dateFrom)         rows = rows.filter(function (d) { return d.uploadDate >= filter.dateFrom; });
      if (filter.dateTo)           rows = rows.filter(function (d) { return d.uploadDate <= filter.dateTo; });

      rows.sort(function (a, b) {
        if (filter.sortBy === 'title')          return a.title.localeCompare(b.title);
        if (filter.sortBy === 'documentNumber') return b.documentNumber.localeCompare(a.documentNumber);
        if (filter.sortBy === 'oldest')         return a.uploadDate.localeCompare(b.uploadDate);
        return b.uploadDate.localeCompare(a.uploadDate);
      });

      return rows;
    },

    getById: function (id) {
      return SheetDB.findById(SHEET, 'id', id);
    },

    create: function (input, user) {
      Permissions.assertCan(user, 'uploadDocuments');

      var doc = Object.assign({}, input, {
        id:             generateId(),
        documentNumber: SheetDB.nextNumber('document', 'DOC'),
        currentVersion: 1,
        uploadedBy:     user.id,
        uploadDate:     todayStr(),
        isConfidential: input.isConfidential ? 'TRUE' : 'FALSE',
        relatedCaseIds: (input.relatedCaseIds || []).join(','),
        createdAt:      nowIso(),
        updatedAt:      nowIso(),
      });

      SheetDB.insert(SHEET, doc);
      AuditService.record({ user: user.name, action: 'Upload', module: 'Documents', recordRef: doc.documentNumber });
      notifyOnUpload(doc, user.id);

      return doc;
    },

    update: function (id, patch, user) {
      Permissions.assertCan(user, 'editDocuments');
      var existing = this.getById(id);
      if (!existing) throw new Error('Document not found: ' + id);

      if (patch.isConfidential !== undefined) patch.isConfidential = patch.isConfidential ? 'TRUE' : 'FALSE';
      if (patch.relatedCaseIds) patch.relatedCaseIds = patch.relatedCaseIds.join(',');
      patch.updatedAt = nowIso();

      var updated = SheetDB.update(SHEET, 'id', id, patch);
      AuditService.record({ user: user.name, action: 'Update', module: 'Documents', recordRef: updated.documentNumber });
      return updated;
    },

    remove: function (id, user) {
      Permissions.assertCan(user, 'editDocuments');
      var existing = this.getById(id);
      if (!existing) throw new Error('Document not found: ' + id);
      SheetDB.remove(SHEET, 'id', id);
      AuditService.record({ user: user.name, action: 'Delete', module: 'Documents', recordRef: existing.documentNumber });
    },

  };

})();
