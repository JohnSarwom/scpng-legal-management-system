/**
 * 08_CorrespondenceService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Correspondence CRUD with the full approval workflow and notifications.
 * Mirrors src/services/mock/correspondenceService.ts.
 *
 * Approval workflow:
 *   1. Anyone with registerCorrespondence creates a record (status: Open)
 *   2. When actionRequired = 'Approval', the system notifies approvers
 *      (CEO, General Counsel, Legal Manager)
 *   3. An approver calls approve() → status changes, notification sent to registrant
 *   4. An approver calls reject() → similar, notification sent to registrant
 *
 * Public API:
 *   CorrespondenceService.getAll(filter?)             → Correspondence[]
 *   CorrespondenceService.getById(id)                 → Correspondence | null
 *   CorrespondenceService.create(input, user)         → Correspondence
 *   CorrespondenceService.update(id, patch, user)     → Correspondence
 *   CorrespondenceService.approve(id, user)           → Correspondence
 *   CorrespondenceService.reject(id, reason, user)    → Correspondence
 *   CorrespondenceService.remove(id, user)            → void
 * ─────────────────────────────────────────────────────────────────────────────
 */

var CorrespondenceService = (function () {

  var SHEET = CONFIG.SHEETS.CORRESPONDENCE;

  var APPROVAL_ROLES = ['CEO', 'General Counsel', 'Legal Manager'];

  /** Notify all approvers that a correspondence needs their sign-off. */
  function notifyApprovers(corrObj, registrantId) {
    SheetDB.getAll(CONFIG.SHEETS.USERS)
      .filter(function (u) { return APPROVAL_ROLES.indexOf(u.role) !== -1 && u.id !== registrantId; })
      .forEach(function (u) {
        NotificationService.push({
          recipientId: u.id,
          type:        CONFIG.NOTIF_TYPES.CORRESPONDENCE_PENDING_APPROVAL,
          title:       'Correspondence pending approval',
          body:        corrObj.correspondenceNumber + ' "' + corrObj.subject + '" requires your approval.',
          entityType:  'correspondence',
          entityId:    corrObj.id,
          linkTo:      '/correspondence/' + corrObj.id,
        });
      });
  }

  /** Notify the registrant (assignedTo[0] or creator) when approved/rejected. */
  function notifyRegistrant(corrObj, type, actorName) {
    var assignedTo = String(corrObj.assignedTo || '').split(',').map(function (s) { return s.trim(); });
    // Look up user ids from role names in assignedTo
    var users = SheetDB.getAll(CONFIG.SHEETS.USERS);
    var recipients = users.filter(function (u) {
      return assignedTo.indexOf(u.role) !== -1 || assignedTo.indexOf(u.name) !== -1;
    });

    recipients.forEach(function (u) {
      var isApproved = type === CONFIG.NOTIF_TYPES.CORRESPONDENCE_APPROVED;
      NotificationService.push({
        recipientId: u.id,
        type:        type,
        title:       isApproved ? 'Correspondence approved' : 'Correspondence rejected',
        body:        corrObj.correspondenceNumber + ' "' + corrObj.subject + '" was ' +
                     (isApproved ? 'approved' : 'rejected') + ' by ' + actorName + '.',
        entityType:  'correspondence',
        entityId:    corrObj.id,
        linkTo:      '/correspondence/' + corrObj.id,
      });
    });
  }

  return {

    getAll: function (filter) {
      filter = filter || {};
      var rows = SheetDB.getAll(SHEET);

      if (filter.query) {
        var q = filter.query.toLowerCase();
        rows = rows.filter(function (c) {
          return [c.correspondenceNumber, c.subject, c.sender, c.recipient, c.category, c.status]
            .some(function (v) { return String(v).toLowerCase().indexOf(q) !== -1; });
        });
      }

      if (filter.direction)       rows = rows.filter(function (c) { return c.direction === filter.direction; });
      if (filter.status)          rows = rows.filter(function (c) { return c.status === filter.status; });
      if (filter.category)        rows = rows.filter(function (c) { return c.category === filter.category; });
      if (filter.priority)        rows = rows.filter(function (c) { return c.priority === filter.priority; });
      if (filter.confidentiality) rows = rows.filter(function (c) { return c.confidentiality === filter.confidentiality; });
      if (filter.entityId)        rows = rows.filter(function (c) { return c.entityId === filter.entityId; });
      if (filter.caseId)          rows = rows.filter(function (c) { return c.caseId === filter.caseId; });
      if (filter.dateFrom)        rows = rows.filter(function (c) { return c.date >= filter.dateFrom; });
      if (filter.dateTo)          rows = rows.filter(function (c) { return c.date <= filter.dateTo; });

      rows.sort(function (a, b) {
        if (filter.sortBy === 'correspondenceNumber') return b.correspondenceNumber.localeCompare(a.correspondenceNumber);
        if (filter.sortBy === 'status')              return a.status.localeCompare(b.status);
        if (filter.sortBy === 'oldest')              return a.date.localeCompare(b.date);
        return b.date.localeCompare(a.date);
      });

      return rows;
    },

    getById: function (id) {
      return SheetDB.findById(SHEET, 'id', id);
    },

    create: function (input, user) {
      Permissions.assertCan(user, 'registerCorrespondence');

      var corr = Object.assign({}, input, {
        id:                   generateId(),
        correspondenceNumber: SheetDB.nextNumber('correspondence', 'COR'),
        assignedTo:           Array.isArray(input.assignedTo) ? input.assignedTo.join(',') : (input.assignedTo || ''),
        attachments:          Array.isArray(input.attachments) ? input.attachments.join(',') : (input.attachments || ''),
        approvedBy:           '',
        approvedAt:           '',
        closedDate:           '',
        dueDate:              input.dueDate || '',
        responseReference:    input.responseReference || '',
        createdAt:            nowIso(),
        updatedAt:            nowIso(),
      });

      SheetDB.insert(SHEET, corr);
      AuditService.record({ user: user.name, action: 'Create', module: 'Correspondence', recordRef: corr.correspondenceNumber });

      // Trigger approval notifications if this requires approval
      if (corr.actionRequired === 'Approval') {
        notifyApprovers(corr, user.id);
      }

      return corr;
    },

    update: function (id, patch, user) {
      Permissions.assertCan(user, 'registerCorrespondence');
      var existing = this.getById(id);
      if (!existing) throw new Error('Correspondence not found: ' + id);

      if (Array.isArray(patch.assignedTo))  patch.assignedTo  = patch.assignedTo.join(',');
      if (Array.isArray(patch.attachments)) patch.attachments = patch.attachments.join(',');
      patch.updatedAt = nowIso();

      var updated = SheetDB.update(SHEET, 'id', id, patch);
      AuditService.record({ user: user.name, action: 'Update', module: 'Correspondence', recordRef: updated.correspondenceNumber });

      // If actionRequired changed to Approval, re-notify approvers
      if (patch.actionRequired === 'Approval' && existing.actionRequired !== 'Approval') {
        notifyApprovers(updated, user.id);
      }

      return updated;
    },

    /** Approve a correspondence — only roles with approveCorrespondence permission. */
    approve: function (id, user) {
      Permissions.assertCan(user, 'approveCorrespondence');
      var existing = this.getById(id);
      if (!existing) throw new Error('Correspondence not found: ' + id);

      var updated = SheetDB.update(SHEET, 'id', id, {
        status:     'Closed',
        approvedBy: user.id,
        approvedAt: nowIso(),
        closedDate: todayStr(),
        updatedAt:  nowIso(),
      });

      AuditService.record({ user: user.name, action: 'Update', module: 'Correspondence', recordRef: updated.correspondenceNumber });
      notifyRegistrant(updated, CONFIG.NOTIF_TYPES.CORRESPONDENCE_APPROVED, user.name);

      return updated;
    },

    /** Reject a correspondence — only roles with approveCorrespondence permission. */
    reject: function (id, reason, user) {
      Permissions.assertCan(user, 'approveCorrespondence');
      var existing = this.getById(id);
      if (!existing) throw new Error('Correspondence not found: ' + id);

      var updated = SheetDB.update(SHEET, 'id', id, {
        status:    'Open',
        updatedAt: nowIso(),
      });

      AuditService.record({ user: user.name, action: 'Update', module: 'Correspondence', recordRef: updated.correspondenceNumber + ' (rejected: ' + (reason || '') + ')' });
      notifyRegistrant(updated, CONFIG.NOTIF_TYPES.CORRESPONDENCE_REJECTED, user.name);

      return updated;
    },

    remove: function (id, user) {
      Permissions.assertCan(user, 'registerCorrespondence');
      var existing = this.getById(id);
      if (!existing) throw new Error('Correspondence not found: ' + id);
      SheetDB.remove(SHEET, 'id', id);
      AuditService.record({ user: user.name, action: 'Delete', module: 'Correspondence', recordRef: existing.correspondenceNumber });
    },

  };

})();
