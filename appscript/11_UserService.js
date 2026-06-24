/**
 * 11_UserService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User lookup and management.
 * Mirrors src/context/SessionContext.tsx (DEMO_USERS) and the Users sheet seed.
 *
 * Public API:
 *   UserService.getAll()               → User[]
 *   UserService.getById(id)            → User | null
 *   UserService.getByRole(role)        → User[]
 *   UserService.create(input, admin)   → User   (requires userManagement permission)
 *   UserService.update(id, patch, admin) → User
 * ─────────────────────────────────────────────────────────────────────────────
 */

var UserService = (function () {

  var SHEET = CONFIG.SHEETS.USERS;

  return {

    getAll: function () {
      return SheetDB.getAll(SHEET);
    },

    getById: function (id) {
      return SheetDB.findById(SHEET, 'id', id);
    },

    getByRole: function (role) {
      return SheetDB.findWhere(SHEET, 'role', role);
    },

    create: function (input, admin) {
      Permissions.assertCan(admin, 'userManagement');
      var user = {
        id:        generateId(),
        name:      input.name,
        role:      input.role,
        email:     input.email || '',
        createdAt: nowIso(),
      };
      SheetDB.insert(SHEET, user);
      AuditService.record({ user: admin.name, action: 'Create', module: 'System', recordRef: 'User ' + user.name });
      return user;
    },

    update: function (id, patch, admin) {
      Permissions.assertCan(admin, 'userManagement');
      var updated = SheetDB.update(SHEET, 'id', id, patch);
      if (!updated) throw new Error('User not found: ' + id);
      AuditService.record({ user: admin.name, action: 'Update', module: 'System', recordRef: 'User ' + id });
      return updated;
    },

  };

})();
