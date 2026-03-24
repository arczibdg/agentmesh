import Database from 'better-sqlite3';

export class SqliteBackend {
  private db: Database.Database;
  private closed = false;
  private stmtGet: Database.Statement;
  private stmtSet: Database.Statement;
  private stmtList: Database.Statement;
  private stmtClear: Database.Statement;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory (
        namespace TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_by TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY (namespace, key)
      )
    `);
    this.stmtGet = this.db.prepare('SELECT value FROM memory WHERE namespace = ? AND key = ?');
    this.stmtSet = this.db.prepare('INSERT OR REPLACE INTO memory (namespace, key, value, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)');
    this.stmtList = this.db.prepare('SELECT key FROM memory WHERE namespace = ?');
    this.stmtClear = this.db.prepare('DELETE FROM memory WHERE namespace = ?');
  }

  async get(namespace: string, key: string): Promise<unknown> {
    const row = this.stmtGet.get(namespace, key) as { value: string } | undefined;
    return row ? JSON.parse(row.value) : null;
  }

  async set(namespace: string, key: string, value: unknown, updatedBy: string): Promise<void> {
    this.stmtSet.run(namespace, key, JSON.stringify(value), updatedBy, Date.now());
  }

  async list(namespace: string): Promise<string[]> {
    const rows = this.stmtList.all(namespace) as { key: string }[];
    return rows.map((r) => r.key);
  }

  async clear(namespace: string): Promise<void> {
    this.stmtClear.run(namespace);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.db.close();
  }
}
