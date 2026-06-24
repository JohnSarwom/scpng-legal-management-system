/**
 * 06_CaseService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Case CRUD with permission checks, activity logging, audit logging,
 * and automatic notifications on create/assign/status-change.
 * Mirrors src/services/mock/caseService.ts + src/hooks/useCases.ts notification logic.
 *
 * Public API:
 *   CaseService.getAll(filter?, user?)    → Case[]
 *   CaseService.getById(id, user?)        → Case | null
 *   CaseService.create(input, user)       → Case
 *   CaseService.update(id, patch, user, reason?) → Case
 *   CaseService.remove(id, user)          → void
 * ─────────────────────────────────────────────────────────────────────────────
 */

var CaseService = (function () {

  var SHEET = CONFIG.SHEETS.CASES;

  function logActivity(caseId, type, description, userName) {
    SheetDB.insert(CONFIG.SHEETS.ACTIVITIES, {
      id:          generateId(),
      caseId:      caseId,
      type:        type,
      description: description,
      createdBy:   userName,
      createdAt:   nowIso(),
    });
  }

  /** Notify Legal Manager + General Counsel on case creation. */
  function notifyOnCreate(caseObj, creatorId) {
    var notifyRoles = ['Legal Manager', 'General Counsel'];
    var recipients = SheetDB.getAll(CONFIG.SHEETS.USERS)
      .filter(function (u) { return notifyRoles.indexOf(u.role) !== -1 && u.id !== creatorId; });

    recipients.forEach(function (u) {
      NotificationService.push({
        recipientId: u.id,
        type:        CONFIG.NOTIF_TYPES.CASE_CREATED,
        title:       'New case opened',
        body:        caseObj.caseNumber + ' "' + caseObj.caseTitle + '" has been opened.',
        entityType:  'case',
        entityId:    caseObj.id,
        linkTo:      '/cases/' + caseObj.id,
      });
    });

    // Notify the assigned officer if different from creator
    if (caseObj.responsibleOfficerId && caseObj.responsibleOfficerId !== creatorId) {
      NotificationService.push({
        recipientId: caseObj.responsibleOfficerId,
        type:        CONFIG.NOTIF_TYPES.CASE_ASSIGNED,
        title:       'Case assigned to you',
        body:        caseObj.caseNumber + ' "' + caseObj.caseTitle + '" has been assigned to you.',
        entityType:  'case',
        entityId:    caseObj.id,
        linkTo:      '/cases/' + caseObj.id,
      });
    }
  }

  /** Notify on status change. */
  function notifyOnStatusChange(caseObj, newStatus, actorId) {
    if (caseObj.responsibleOfficerId && caseObj.responsibleOfficerId !== actorId) {
      NotificationService.push({
        recipientId: caseObj.responsibleOfficerId,
        type:        CONFIG.NOTIF_TYPES.CASE_STATUS_CHANGED,
        title:       'Case status updated',
        body:        caseObj.caseNumber + ' "' + caseObj.caseTitle + '" moved to ' + newStatus + '.',
        entityType:  'case',
        entityId:    caseObj.id,
        linkTo:      '/cases/' + caseObj.id,
      });
    }
  }

  /** Notify on re-assignment. */
  function notifyOnAssign(caseObj, newOfficerId, actorId) {
    if (newOfficerId && newOfficerId !== actorId) {
      NotificationService.push({
        recipientId: newOfficerId,
        type:        CONFIG.NOTIF_TYPES.CASE_ASSIGNED,
        title:       'Case assigned to you',
        body:        caseObj.caseNumber + ' "' + caseObj.caseTitle + '" has been assigned to you.',
        entityType:  'case',
        entityId:    caseObj.id,
        linkTo:      '/cases/' + caseObj.id,
      });
    }
  }

  return {

    /** List cases visible to user (respects RBAC + confidentiality). */
    getAll: function (filter, user) {
      filter = filter || {};
      var rows = SheetDB.getAll(SHEET);

      if (user) {
        rows = rows.filter(function (c) { return Permissions.canViewCase(c, user); });
      }

      // Text search
      if (filter.query) {
        var q = filter.query.toLowerCase();
        rows = rows.filter(function (c) {
          return [c.id, c.caseNumber, c.caseTitle, c.description, c.caseType, c.status]
            .some(function (v) { return String(v).toLowerCase().indexOf(q) !== -1; });
        });
      }

      if (filter.status)    rows = rows.filter(function (c) { return c.status === filter.status; });
      if (filter.type)      rows = rows.filter(function (c) { return c.caseType === filter.type; });
      if (filter.officerId) rows = rows.filter(function (c) { return c.responsibleOfficerId === filter.officerId; });
      if (filter.entityId)  rows = rows.filter(function (c) { return c.entityId === filter.entityId; });
      if (filter.dateFrom)  rows = rows.filter(function (c) { return c.dateOpened >= filter.dateFrom; });
      if (filter.dateTo)    rows = rows.filter(function (c) { return c.dateOpened <= filter.dateTo; });

      if (!filter.includeArchived && filter.status !== 'Archived') {
        rows = rows.filter(function (c) { return c.status !== 'Archived'; });
      }

      // Sort
      rows.sort(function (a, b) {
        if (filter.sortBy === 'caseNumber') return b.caseNumber.localeCompare(a.caseNumber);
        if (filter.sortBy === 'oldest')     return a.dateOpened.localeCompare(b.dateOpened);
        if (filter.sortBy === 'status')     return a.status.localeCompare(b.status);
        return b.dateOpened.localeCompare(a.dateOpened);
      });

      return rows;
    },

    /** Get a single case by id (permission-checked if user provided). */
    getById: function (id, user) {
      var caseObj = SheetDB.findById(SHEET, 'id', id);
      if (!caseObj) return null;
      if (user && !Permissions.canViewCase(caseObj, user)) {
        throw new Error('Access denied to case ' + id);
      }
      return caseObj;
    },

    /**
     * Create a new case.
     * @param {Object} input  - all Case fields except id, caseNumber, createdAt, updatedAt
     * @param {{id, name, role}} user
     */
    create: function (input, user) {
      Permissions.assertCan(user, 'createCases');

      var caseObj = Object.assign({}, input, {
        id:           generateId(),
        caseNumber:   SheetDB.nextNumber('case', 'CASE'),
        createdAt:    nowIso(),
        updatedAt:    nowIso(),
        dateClosed:   input.dateClosed || '',
        isConfidential: input.isConfidential ? 'TRUE' : 'FALSE',
        grantedUserIds:     (input.grantedUserIds || []).join(','),
        grantedEditUserIds: (input.grantedEditUserIds || []).join(','),
      });

      SheetDB.insert(SHEET, caseObj);
      logActivity(caseObj.id, 'Case Created', 'Case ' + caseObj.caseNumber + ' opened.', user.name);
      AuditService.record({ user: user.name, action: 'Create', module: 'Cases', recordRef: caseObj.caseNumber });
      notifyOnCreate(caseObj, user.id);

      return caseObj;
    },

    /**
     * Update a case.
     * @param {string} id
     * @param {Object} patch
     * @param {{id, name, role}} user
     * @param {string} [reason]
     */
    update: function (id, patch, user, reason) {
      var existing = this.getById(id, user);
      if (!existing) throw new Error('Case not found: ' + id);
      Permissions.assertCan(user, 'editCases');
      if (!Permissions.canEditCase(existing, user)) throw new Error('Edit access denied for case ' + id);

      var prevStatus  = existing.status;
      var prevOfficer = existing.responsibleOfficerId;

      // Normalise booleans and arrays
      if (patch.isConfidential !== undefined) patch.isConfidential = patch.isConfidential ? 'TRUE' : 'FALSE';
      if (patch.grantedUserIds)     patch.grantedUserIds     = patch.grantedUserIds.join(',');
      if (patch.grantedEditUserIds) patch.grantedEditUserIds = patch.grantedEditUserIds.join(',');
      if (patch.status === 'Closed') patch.dateClosed = todayStr();

      patch.updatedAt = nowIso();

      var updated = SheetDB.update(SHEET, 'id', id, patch);
      if (!updated) throw new Error('Case update failed: ' + id);

      var desc = reason ? 'Updated: ' + reason : 'Case updated.';
      logActivity(id, 'Case Updated', desc, user.name);
      AuditService.record({ user: user.name, action: 'Update', module: 'Cases', recordRef: updated.caseNumber });

      // Fire notifications
      if (patch.status && patch.status !== prevStatus) {
        notifyOnStatusChange(updated, patch.status, user.id);
      }
      if (patch.responsibleOfficerId && patch.responsibleOfficerId !== prevOfficer) {
        notifyOnAssign(updated, patch.responsibleOfficerId, user.id);
      }

      return updated;
    },

    /**
     * Delete a case (General Counsel / Legal Manager only).
     * @param {string} id
     * @param {{id, name, role}} user
     */
    remove: function (id, user) {
      Permissions.assertCan(user, 'closeCases'); // reuse closest permission
      var existing = this.getById(id);
      if (!existing) throw new Error('Case not found: ' + id);
      SheetDB.remove(SHEET, 'id', id);
      AuditService.record({ user: user.name, action: 'Delete', module: 'Cases', recordRef: existing.caseNumber });
    },

  };

})();
