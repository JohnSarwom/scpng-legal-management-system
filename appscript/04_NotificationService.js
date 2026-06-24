/**
 * 04_NotificationService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Notification CRUD + email dispatch.
 * Mirrors src/services/mock/notificationService.ts and NotificationContext.tsx.
 *
 * Public API:
 *   NotificationService.getForUser(userId)         → array of notification objects
 *   NotificationService.markRead(notifId)          → void
 *   NotificationService.markAllRead(userId)        → void
 *   NotificationService.push(payload)              → writes row + optionally sends email
 *   NotificationService.getUnreadCount(userId)     → number
 *
 * Email is sent automatically on push() when CONFIG.EMAIL.ENABLED = true,
 * as long as the recipient has an email in the Users sheet.
 * ─────────────────────────────────────────────────────────────────────────────
 */

var NotificationService = (function () {

  var SHEET = CONFIG.SHEETS.NOTIFICATIONS;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function getUserEmail(userId) {
    var user = SheetDB.findById(CONFIG.SHEETS.USERS, 'id', userId);
    return user ? user.email : null;
  }

  function getUserName(userId) {
    var user = SheetDB.findById(CONFIG.SHEETS.USERS, 'id', userId);
    return user ? user.name : userId;
  }

  /** Human-readable label for a notification type. */
  var TYPE_LABELS = {
    case_created:                     'New Case Opened',
    case_assigned:                    'Case Assigned to You',
    case_status_changed:              'Case Status Updated',
    document_uploaded:                'New Document Uploaded',
    correspondence_pending_approval:  'Correspondence Pending Approval',
    correspondence_approved:          'Correspondence Approved',
    correspondence_rejected:          'Correspondence Rejected',
  };

  function sendEmail(recipientEmail, recipientName, notification) {
    if (!CONFIG.EMAIL.ENABLED) return;
    if (!recipientEmail) return;

    var subject = CONFIG.EMAIL.SUBJECT_PREFIX + ' ' + notification.title;
    var body = [
      'Dear ' + recipientName + ',',
      '',
      notification.body,
      '',
      'Log in to the SCPNG Legal Management System to view this item.',
      '',
      '— ' + CONFIG.EMAIL.FROM_NAME,
    ].join('\n');

    try {
      GmailApp.sendEmail(recipientEmail, subject, body, {
        name: CONFIG.EMAIL.FROM_NAME,
      });
    } catch (e) {
      Logger.log('Email send failed for ' + recipientEmail + ': ' + e.message);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  return {

    /**
     * Get all notifications for a user, newest first.
     * @param {string} userId
     * @returns {Object[]}
     */
    getForUser: function (userId) {
      return SheetDB.getAll(SHEET)
        .filter(function (n) { return n.recipientId === userId; })
        .sort(function (a, b) { return b.createdAt > a.createdAt ? 1 : -1; });
    },

    /**
     * Count unread notifications for a user.
     * @param {string} userId
     * @returns {number}
     */
    getUnreadCount: function (userId) {
      return this.getForUser(userId).filter(function (n) {
        return String(n.read) === 'FALSE' || n.read === false;
      }).length;
    },

    /**
     * Mark a single notification as read.
     * @param {string} notifId
     */
    markRead: function (notifId) {
      SheetDB.update(SHEET, 'id', notifId, { read: 'TRUE' });
    },

    /**
     * Mark all of a user's notifications as read.
     * @param {string} userId
     */
    markAllRead: function (userId) {
      var all = this.getForUser(userId);
      all.forEach(function (n) {
        if (String(n.read) !== 'TRUE') {
          SheetDB.update(SHEET, 'id', n.id, { read: 'TRUE' });
        }
      });
    },

    /**
     * Create a new notification and (optionally) send an email.
     *
     * @param {{
     *   recipientId:  string,
     *   type:         string,   // CONFIG.NOTIF_TYPES.*
     *   title:        string,
     *   body:         string,
     *   entityType:   string,   // 'case' | 'document' | 'correspondence'
     *   entityId:     string,
     *   linkTo:       string,   // relative path e.g. '/cases/case-1'
     * }} payload
     * @returns {Object} the new notification object
     */
    push: function (payload) {
      var notif = {
        id:           generateId(),
        recipientId:  payload.recipientId,
        type:         payload.type,
        title:        payload.title,
        body:         payload.body,
        entityType:   payload.entityType,
        entityId:     payload.entityId,
        linkTo:       payload.linkTo,
        read:         'FALSE',
        createdAt:    nowIso(),
      };

      SheetDB.insert(SHEET, notif);

      // Fire email
      var email = getUserEmail(payload.recipientId);
      var name  = getUserName(payload.recipientId);
      sendEmail(email, name, notif);

      AuditService.record({
        user:      'System',
        action:    'Create',
        module:    'System',
        recordRef: 'Notification ' + notif.id + ' → ' + payload.recipientId,
      });

      return notif;
    },

    /**
     * Push a notification to multiple recipients at once.
     * @param {string[]} recipientIds
     * @param {Object} payload  - same as push() but without recipientId
     */
    pushToMany: function (recipientIds, payload) {
      var self = this;
      recipientIds.forEach(function (id) {
        self.push(Object.assign({}, payload, { recipientId: id }));
      });
    },
  };

})();
