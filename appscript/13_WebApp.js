/**
 * 13_WebApp.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional: Exposes the backend as a JSON REST API via Apps Script Web App.
 * Deploy as: Execute as "Me", Who has access "Anyone within [your org]".
 *
 * The React front-end can call this endpoint instead of the mock services.
 * Replace mockCaseService etc. with fetch() calls to this URL.
 *
 * Supported routes (via ?action= query param):
 *
 *   GET  ?action=cases&userId=u-lm
 *   GET  ?action=case&id=case-1&userId=u-lm
 *   GET  ?action=documents
 *   GET  ?action=correspondence
 *   GET  ?action=entities
 *   GET  ?action=notifications&userId=u-lm
 *   GET  ?action=summary&userId=u-lm
 *
 *   POST body JSON: { action, userId, ...payload }
 *   POST action=createCase    { caseTitle, entityId, caseType, ... }
 *   POST action=updateCase    { id, patch: {...}, reason? }
 *   POST action=createDocument  { ... }
 *   POST action=createCorrespondence { ... }
 *   POST action=approveCorrespondence { id }
 *   POST action=rejectCorrespondence  { id, reason }
 *   POST action=markNotifRead        { notifId }
 *   POST action=markAllNotifsRead    { userId }
 * ─────────────────────────────────────────────────────────────────────────────
 */

function doGet(e) {
  try {
    var params  = e.parameter;
    var action  = params.action;
    var userId  = params.userId;
    var user    = userId ? UserService.getById(userId) : null;

    var result;

    if (action === 'cases') {
      result = CaseService.getAll(params, user);

    } else if (action === 'case') {
      result = CaseService.getById(params.id, user);

    } else if (action === 'documents') {
      result = DocumentService.getAll(params, user);

    } else if (action === 'document') {
      result = DocumentService.getById(params.id);

    } else if (action === 'correspondence') {
      result = CorrespondenceService.getAll(params);

    } else if (action === 'correspondence_item') {
      result = CorrespondenceService.getById(params.id);

    } else if (action === 'entities') {
      result = EntityService.getAll(params);

    } else if (action === 'entity') {
      result = EntityService.getById(params.id);

    } else if (action === 'notifications') {
      if (!userId) throw new Error('userId required');
      result = NotificationService.getForUser(userId);

    } else if (action === 'unread_count') {
      if (!userId) throw new Error('userId required');
      result = { count: NotificationService.getUnreadCount(userId) };

    } else if (action === 'summary') {
      if (!user) throw new Error('userId required');
      result = ReportService.summary(user);

    } else if (action === 'audit') {
      result = AuditService.getAll();

    } else if (action === 'users') {
      result = UserService.getAll();

    } else if (action === 'notes') {
      result = NoteService.getByCase(params.caseId);

    } else if (action === 'activities') {
      result = ActivityService.getByCase(params.caseId);

    } else {
      throw new Error('Unknown action: ' + action);
    }

    return jsonOk(result);

  } catch (err) {
    return jsonError(err.message);
  }
}

function doPost(e) {
  try {
    var body   = JSON.parse(e.postData.contents);
    var action = body.action;
    var userId = body.userId;
    var user   = userId ? UserService.getById(userId) : null;

    var result;

    if (action === 'createCase') {
      if (!user) throw new Error('userId required');
      result = CaseService.create(body.input, user);

    } else if (action === 'updateCase') {
      if (!user) throw new Error('userId required');
      result = CaseService.update(body.id, body.patch, user, body.reason);

    } else if (action === 'deleteCase') {
      if (!user) throw new Error('userId required');
      CaseService.remove(body.id, user);
      result = { ok: true };

    } else if (action === 'createDocument') {
      if (!user) throw new Error('userId required');
      result = DocumentService.create(body.input, user);

    } else if (action === 'updateDocument') {
      if (!user) throw new Error('userId required');
      result = DocumentService.update(body.id, body.patch, user);

    } else if (action === 'deleteDocument') {
      if (!user) throw new Error('userId required');
      DocumentService.remove(body.id, user);
      result = { ok: true };

    } else if (action === 'createCorrespondence') {
      if (!user) throw new Error('userId required');
      result = CorrespondenceService.create(body.input, user);

    } else if (action === 'updateCorrespondence') {
      if (!user) throw new Error('userId required');
      result = CorrespondenceService.update(body.id, body.patch, user);

    } else if (action === 'approveCorrespondence') {
      if (!user) throw new Error('userId required');
      result = CorrespondenceService.approve(body.id, user);

    } else if (action === 'rejectCorrespondence') {
      if (!user) throw new Error('userId required');
      result = CorrespondenceService.reject(body.id, body.reason, user);

    } else if (action === 'createEntity') {
      if (!user) throw new Error('userId required');
      result = EntityService.create(body.input, user);

    } else if (action === 'updateEntity') {
      if (!user) throw new Error('userId required');
      result = EntityService.update(body.id, body.patch, user);

    } else if (action === 'importEntities') {
      if (!user) throw new Error('userId required');
      result = EntityService.importMany(body.rows, user);

    } else if (action === 'createNote') {
      if (!user) throw new Error('userId required');
      result = NoteService.create(body.caseId, body.body, user);

    } else if (action === 'markNotifRead') {
      NotificationService.markRead(body.notifId);
      result = { ok: true };

    } else if (action === 'markAllNotifsRead') {
      if (!userId) throw new Error('userId required');
      NotificationService.markAllRead(userId);
      result = { ok: true };

    } else if (action === 'createUser') {
      if (!user) throw new Error('userId required');
      result = UserService.create(body.input, user);

    } else if (action === 'submitFeedback') {
      var feedbackType = body.feedbackType || 'General';
      var message      = body.message     || '(no message)';
      var rating       = body.rating      || 0;
      var page         = body.page        || '';
      var submittedBy  = body.submittedBy || 'Anonymous';
      var subject = '[LMS Feedback] ' + feedbackType + (rating ? ' · ' + rating + '/5' : '');
      var emailBody =
        'Feedback Type: ' + feedbackType + '\n' +
        'Rating: '        + (rating ? rating + '/5' : 'Not rated') + '\n' +
        'Page: '          + (page || 'Unknown') + '\n' +
        'Submitted by: '  + submittedBy + '\n' +
        'Submitted at: '  + new Date().toISOString() + '\n\n' +
        'Message:\n'      + message;
      MailApp.sendEmail('sarwomjohn@gmail.com', subject, emailBody);
      result = { ok: true };

    } else {
      throw new Error('Unknown action: ' + action);
    }

    return jsonOk(result);

  } catch (err) {
    return jsonError(err.message);
  }
}

// ── Response helpers ──────────────────────────────────────────────────────────

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
