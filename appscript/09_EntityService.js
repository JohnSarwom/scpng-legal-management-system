/**
 * 09_EntityService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Entity CRUD. Entities are capital-market participants mirrored from the
 * Licensing system. Mirrors src/services/mock/entityService.ts.
 *
 * Public API:
 *   EntityService.getAll(filter?)               → Entity[]
 *   EntityService.getById(id)                   → Entity | null
 *   EntityService.create(input, user)           → Entity
 *   EntityService.update(id, patch, user)       → Entity
 *   EntityService.importMany(rows, user)        → { created, updated, entities }
 * ─────────────────────────────────────────────────────────────────────────────
 */

var EntityService = (function () {

  var SHEET = CONFIG.SHEETS.ENTITIES;

  return {

    getAll: function (filter) {
      filter = filter || {};
      var rows = SheetDB.getAll(SHEET);

      if (filter.query) {
        var q = filter.query.toLowerCase();
        rows = rows.filter(function (e) {
          return [e.entityId, e.entityName, e.entityType, e.entityStatus, e.licenseNumber]
            .some(function (v) { return String(v).toLowerCase().indexOf(q) !== -1; });
        });
      }

      if (filter.status) rows = rows.filter(function (e) { return e.entityStatus === filter.status; });
      if (filter.type)   rows = rows.filter(function (e) { return e.entityType === filter.type; });
      if (filter.source) rows = rows.filter(function (e) { return e.source === filter.source; });

      return rows.sort(function (a, b) { return a.entityName.localeCompare(b.entityName); });
    },

    getById: function (id) {
      return SheetDB.findById(SHEET, 'entityId', id);
    },

    create: function (input, user) {
      Permissions.assertCan(user, 'manageEntities');

      var count = SheetDB.nextCounter('entity');
      var entity = Object.assign({}, input, {
        entityId:  'ENT-' + String(count).padStart(3, '0'),
        source:    input.source || 'Manual',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      });

      SheetDB.insert(SHEET, entity);
      AuditService.record({ user: user.name, action: 'Create', module: 'Entities', recordRef: entity.entityId });
      return entity;
    },

    update: function (id, patch, user) {
      Permissions.assertCan(user, 'manageEntities');
      var existing = this.getById(id);
      if (!existing) throw new Error('Entity not found: ' + id);

      patch.updatedAt = nowIso();
      var updated = SheetDB.update(SHEET, 'entityId', id, patch);
      AuditService.record({ user: user.name, action: 'Update', module: 'Entities', recordRef: id });
      return updated;
    },

    /**
     * Upsert many entities — used for Licensing API sync or file import.
     * @param {Object[]} rows
     * @param {{id, name, role}} user
     * @returns {{ created: number, updated: number, entities: Object[] }}
     */
    importMany: function (rows, user) {
      Permissions.assertCan(user, 'manageEntities');
      var created = 0;
      var updated = 0;
      var results = [];

      rows.forEach(function (row) {
        if (row.entityId) {
          var existing = EntityService.getById(row.entityId);
          if (existing) {
            var patched = SheetDB.update(SHEET, 'entityId', row.entityId, Object.assign({}, row, { updatedAt: nowIso() }));
            results.push(patched);
            updated++;
            return;
          }
        }
        // Create new
        var count = SheetDB.nextCounter('entity');
        var entity = Object.assign({}, row, {
          entityId:  row.entityId || 'ENT-' + String(count).padStart(3, '0'),
          source:    row.source || 'Imported',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        SheetDB.insert(SHEET, entity);
        results.push(entity);
        created++;
      });

      AuditService.record({ user: user.name, action: 'Create', module: 'Entities', recordRef: 'Import: ' + created + ' created, ' + updated + ' updated' });
      return { created: created, updated: updated, entities: results };
    },

  };

})();
