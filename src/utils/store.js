/**
 * PROTOTYPE STORAGE ONLY.
 *
 * This is a plain in-memory store (data is lost on restart). It exists so
 * Anchal's module can run and be tested completely independently before
 * Priyanshu's shared PostgreSQL schema exists.
 *
 * Per MASTER_SPECIFICATION.md §18 and ANCHAL_DEVELOPER_INSTRUCTIONS.md §9,
 * the real tables this maps to are: consents, credentials, applications,
 * application_data, access_requests, audit_logs. When the shared schema
 * lands, replace the methods in this file with real DB calls — the
 * services in src/services/* only depend on this file's interface
 * (get/getAll/set/delete/find), so nothing above this layer should need
 * to change.
 */

class Table {
  constructor(name) {
    this.name = name;
    this.rows = new Map();
  }

  set(id, value) {
    this.rows.set(id, value);
    return value;
  }

  get(id) {
    return this.rows.get(id) || null;
  }

  getAll() {
    return Array.from(this.rows.values());
  }

  find(predicate) {
    return this.getAll().filter(predicate);
  }

  findOne(predicate) {
    return this.getAll().find(predicate) || null;
  }

  delete(id) {
    return this.rows.delete(id);
  }

  clear() {
    this.rows.clear();
  }
}

// One table per entity from §18 / §28 of the spec that Anchal owns.
const db = {
  consents: new Table('consents'),
  credentials: new Table('credentials'),
  applications: new Table('applications'),
  applicationData: new Table('application_data'),
  auditLogs: new Table('audit_logs'),
};

function resetAll() {
  Object.values(db).forEach((t) => t.clear());
}

module.exports = { db, resetAll };
