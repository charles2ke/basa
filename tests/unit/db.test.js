const path = require('path');

// Minimal in-memory PouchDB stand-in so the persistence layer can be tested
// without IndexedDB, which JSDOM does not provide.
function createPouchMock(store, options = {}) {
  return function PouchDBMock(name) {
    if (options.throwOnConstruct) throw new Error('IndexedDB unavailable');
    this.name = name;
    this.get = (id) => (store[id] ? Promise.resolve(store[id]) : Promise.reject(new Error('missing')));
    this.put = (doc) => {
      if (options.failWrites) return Promise.reject(new Error('write failed'));
      store[doc._id] = Object.assign({}, doc, { _rev: '1-abc' });
      return Promise.resolve({ ok: true });
    };
    this.allDocs = () => {
      if (options.failRead) return Promise.reject(new Error('read failed'));
      return Promise.resolve({ rows: Object.keys(store).map((id) => ({ doc: store[id] })) });
    };
  };
}

function loadDb() {
  jest.resetModules();
  delete window.BasaDB;
  require(path.resolve(__dirname, '../../db.js'));
  return window.BasaDB;
}

describe('BasaDB persistence layer', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete window.PouchDB;
  });

  test('falls back to the synchronous mirror when PouchDB is missing', async () => {
    const db = loadDb();

    expect(db.isAvailable()).toBe(false);
    expect(db.engine()).toBe('Local mirror');

    await db.set('routines', [{ id: 1 }]);
    expect(JSON.parse(window.localStorage.getItem('basa_routines'))).toEqual([{ id: 1 }]);
    expect(db.get('routines', [])).toEqual([{ id: 1 }]);
    expect(db.get('missing', 'fallback')).toBe('fallback');
    await expect(db.hydrate()).resolves.toEqual({});
  });

  test('reads and writes plain strings, tolerating legacy raw values', async () => {
    const db = loadDb();

    await db.setString('viewMode', 'parent');
    expect(window.localStorage.getItem('basa_viewMode')).toBe('parent');
    expect(db.getString('viewMode', 'child')).toBe('parent');

    // JSON encoded strings (written by hydrate) are decoded too
    window.localStorage.setItem('basa_iotMode', JSON.stringify('anomaly'));
    expect(db.getString('iotMode', 'normal')).toBe('anomaly');

    // Non-string JSON is returned verbatim, missing keys use the fallback
    window.localStorage.setItem('basa_count', '42');
    expect(db.getString('count', 'none')).toBe('42');
    expect(db.getString('nothing', 'none')).toBe('none');
  });

  test('returns the fallback for corrupted JSON documents', () => {
    const db = loadDb();
    window.localStorage.setItem('basa_vitals', '{broken');
    expect(db.get('vitals', ['seed'])).toEqual(['seed']);

    window.localStorage.setItem('basa_vitals', 'null');
    expect(db.get('vitals', ['seed'])).toEqual(['seed']);
  });

  test('writes documents into PouchDB and hydrates them back', async () => {
    const store = {};
    window.PouchDB = createPouchMock(store);
    const db = loadDb();

    expect(db.isAvailable()).toBe(true);
    expect(db.engine()).toBe('PouchDB (IndexedDB)');

    await db.set('careNotes', [{ id: 1, text: 'note' }]);
    await db.setString('viewMode', 'parent');
    expect(store.basa_careNotes.value).toEqual([{ id: 1, text: 'note' }]);

    // Updating an existing document reuses its revision
    await db.set('careNotes', [{ id: 2, text: 'updated' }]);
    expect(store.basa_careNotes.value).toEqual([{ id: 2, text: 'updated' }]);

    window.localStorage.clear();
    const data = await db.hydrate();
    expect(data.careNotes).toEqual([{ id: 2, text: 'updated' }]);
    expect(data.viewMode).toBe('parent');
    // Hydration refills the synchronous mirror
    expect(db.get('careNotes', [])).toEqual([{ id: 2, text: 'updated' }]);
  });

  test('survives PouchDB construction, write and read failures', async () => {
    window.PouchDB = createPouchMock({}, { throwOnConstruct: true });
    let db = loadDb();
    expect(db.isAvailable()).toBe(false);

    window.PouchDB = createPouchMock({}, { failWrites: true });
    db = loadDb();
    await expect(db.set('vitals', [1])).resolves.toBe(false);
    // The mirror still holds the value
    expect(db.get('vitals', [])).toEqual([1]);

    window.PouchDB = createPouchMock({ basa_vitals: { _id: 'basa_vitals', value: [1] } }, { failRead: true });
    db = loadDb();
    await expect(db.hydrate()).resolves.toEqual({});
  });

  test('ignores database rows without a usable document', async () => {
    const store = { basa_ok: { _id: 'basa_ok', value: 1 } };
    window.PouchDB = createPouchMock(store);
    const db = loadDb();
    store.broken = { value: 2 };

    await expect(db.hydrate()).resolves.toEqual({ ok: 1 });
  });
});
