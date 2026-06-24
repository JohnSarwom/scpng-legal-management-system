/**
 * 03_Permissions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Role-based access control helpers.
 * Mirrors the logic in src/config/permissions.ts and src/hooks/usePermission.ts.
 *
 * Usage:
 *   Permissions.can('Legal Manager', 'createCases')   → true
 *   Permissions.access('Legal Officer', 'viewCases')  → 'assigned'
 *   Permissions.assertCan(user, 'closeCases')         → throws if denied
 *   Permissions.canViewCase(caseObj, user)            → true/false
 * ─────────────────────────────────────────────────────────────────────────────
 */

var Permissions = (function () {

  /** Return the access level string for a role+action pair. */
  function access(role, action) {
    var matrix = CONFIG.PERMISSIONS[action];
    if (!matrix) return 'none';
    return matrix[role] || 'none';
  }

  /** Return true if role has any access (not 'none') for action. */
  function can(role, action) {
    return access(role, action) !== 'none';
  }

  /**
   * Throw a descriptive error if the user cannot perform action.
   * @param {{role: string, name: string}} user
   * @param {string} action
   */
  function assertCan(user, action) {
    if (!can(user.role, action)) {
      throw new Error(
        'Permission denied: ' + user.name + ' (' + user.role + ') cannot perform "' + action + '"'
      );
    }
  }

  /**
   * Determine if a user can view a specific case.
   * Mirrors canViewCase() from src/lib/utils.ts.
   *
   * Rules:
   *   - 'full' access → always visible
   *   - 'assigned' access → must be responsibleOfficer, or in grantedUserIds (for confidential)
   *   - Confidential cases are only visible to the responsible officer + explicitly granted users
   */
  function canViewCase(caseObj, user) {
    var level = access(user.role, 'viewCases');
    if (level === 'full') return true;
    if (level === 'none') return false;

    // 'assigned' level
    if (caseObj.responsibleOfficerId === user.id) return true;

    // Confidential: only grantedUserIds can see it (beyond the responsible officer)
    if (String(caseObj.isConfidential) === 'TRUE' || caseObj.isConfidential === true) {
      var granted = String(caseObj.grantedUserIds || '').split(',').map(function (s) { return s.trim(); });
      return granted.indexOf(user.id) !== -1;
    }

    return true; // non-confidential assigned-level cases are visible
  }

  /**
   * Determine if a user can edit a specific case.
   * Mirrors the editCases permission + ownership check.
   */
  function canEditCase(caseObj, user) {
    var level = access(user.role, 'editCases');
    if (level === 'full') return true;
    if (level === 'none') return false;
    // 'assigned' — must own it or be in grantedEditUserIds
    if (caseObj.responsibleOfficerId === user.id) return true;
    var grantedEdit = String(caseObj.grantedEditUserIds || '').split(',').map(function (s) { return s.trim(); });
    return grantedEdit.indexOf(user.id) !== -1;
  }

  return { access, can, assertCan, canViewCase, canEditCase };

})();
