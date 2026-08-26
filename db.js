// basa - Persistence layer
//
// All application data is stored in PouchDB, a free and open source NoSQL
// document database that runs directly in the browser on top of IndexedDB
// (the same storage engine used by mobile browsers and hybrid apps).
//
// PouchDB is asynchronous, so a synchronous localStorage mirror is kept in
// step with every write. The mirror lets the dashboard paint instantly on
// startup (and keeps working in environments where IndexedDB is unavailable,
// such as private browsing modes or the JSDOM test runner) while PouchDB
// remains the durable, syncable source of truth.

(function (global) {
    'use strict';

    const DB_NAME = 'basa';
    const KEY_PREFIX = 'basa_';
    // Per-key write timestamps, used to keep the synchronous mirror from being
    // overwritten by an older PouchDB document during rehydration.
    const META_KEY = 'basa__meta';

    let pouch = null;
    let writeChain = Promise.resolve();

    function hasLocalStorage() {
        try {
            return typeof global.localStorage !== 'undefined' && global.localStorage !== null;
        } catch (err) {
            return false;
        }
    }

    // Lazily create the PouchDB handle. Returns null when PouchDB is not loaded.
    function getPouch() {
        if (pouch) return pouch;
        if (typeof global.PouchDB === 'undefined') return null;
        try {
            pouch = new global.PouchDB(DB_NAME);
        } catch (err) {
            pouch = null;
        }
        return pouch;
    }

    function docId(key) {
        return `${KEY_PREFIX}${key}`;
    }

    function readMirror(key) {
        if (!hasLocalStorage()) return null;
        try {
            return global.localStorage.getItem(docId(key));
        } catch (err) {
            return null;
        }
    }

    function writeMirror(key, rawValue) {
        if (!hasLocalStorage()) return;
        try {
            global.localStorage.setItem(docId(key), rawValue);
        } catch (err) {
            /* Storage full or blocked - PouchDB still holds the data. */
        }
    }

    function readMeta() {
        if (!hasLocalStorage()) return {};
        try {
            return JSON.parse(global.localStorage.getItem(META_KEY)) || {};
        } catch (err) {
            return {};
        }
    }

    function writeMeta(key, timestamp) {
        if (!hasLocalStorage()) return;
        try {
            const meta = readMeta();
            meta[key] = timestamp;
            global.localStorage.setItem(META_KEY, JSON.stringify(meta));
        } catch (err) {
            /* Nothing to do - the timestamp is only an optimisation. */
        }
    }

    // Persist a value into PouchDB. Writes are serialised to avoid document
    // update conflicts when several keys are saved in the same tick.
    function persist(key, value, timestamp) {
        const db = getPouch();
        if (!db) return Promise.resolve(false);

        writeChain = writeChain
            .then(() => db.get(docId(key)).catch(() => null))
            .then((existing) => db.put({
                _id: docId(key),
                _rev: existing ? existing._rev : undefined,
                value: value,
                updatedAt: timestamp
            }))
            .then(() => true)
            .catch(() => false);

        return writeChain;
    }

    const BasaDB = {
        /** True when the NoSQL (PouchDB/IndexedDB) engine is available. */
        isAvailable() {
            return getPouch() !== null;
        },

        /** Human readable name of the active storage engine. */
        engine() {
            return getPouch() ? 'PouchDB (IndexedDB)' : 'Local mirror';
        },

        /** Synchronously read a value, falling back to the supplied default. */
        get(key, fallback) {
            const raw = readMirror(key);
            if (raw === null || raw === undefined) return fallback;
            try {
                const parsed = JSON.parse(raw);
                return parsed === null || parsed === undefined ? fallback : parsed;
            } catch (err) {
                return fallback;
            }
        },

        /**
         * Synchronously read a plain string value. Accepts both JSON encoded
         * and legacy raw strings written by earlier versions of the app.
         */
        getString(key, fallback) {
            const raw = readMirror(key);
            if (raw === null || raw === undefined) return fallback;
            try {
                const parsed = JSON.parse(raw);
                return typeof parsed === 'string' ? parsed : raw;
            } catch (err) {
                return raw;
            }
        },

        /** Write a plain string value (stored unquoted in the mirror). */
        setString(key, value) {
            const timestamp = new Date().toISOString();
            writeMirror(key, String(value));
            writeMeta(key, timestamp);
            return persist(key, String(value), timestamp);
        },

        /** Write a value to PouchDB and to the synchronous mirror. */
        set(key, value) {
            const timestamp = new Date().toISOString();
            writeMirror(key, JSON.stringify(value));
            writeMeta(key, timestamp);
            return persist(key, value, timestamp);
        },

        /**
         * Read every basa document out of PouchDB.
         * Resolves with a plain `{ key: value }` object (empty when PouchDB
         * is unavailable or the database has not been populated yet).
         */
        hydrate() {
            const db = getPouch();
            if (!db) return Promise.resolve({});

            return db.allDocs({ include_docs: true, startkey: KEY_PREFIX, endkey: `${KEY_PREFIX}\uffff` })
                .then((result) => {
                    const data = {};
                    const meta = readMeta();
                    (result.rows || []).forEach((row) => {
                        if (!row.doc || typeof row.doc._id !== 'string') return;
                        const key = row.doc._id.slice(KEY_PREFIX.length);
                        const localTimestamp = meta[key];
                        const remoteTimestamp = row.doc.updatedAt;

                        // A write that has not reached PouchDB yet (for example
                        // when the page was reloaded straight after saving) must
                        // not be reverted by the older stored document.
                        if (localTimestamp && (!remoteTimestamp || localTimestamp > remoteTimestamp)) {
                            return;
                        }

                        data[key] = row.doc.value;
                        writeMirror(key, JSON.stringify(row.doc.value));
                        if (remoteTimestamp) writeMeta(key, remoteTimestamp);
                    });
                    return data;
                })
                .catch(() => ({}));
        }
    };

    global.BasaDB = BasaDB;
}(typeof window !== 'undefined' ? window : globalThis));
