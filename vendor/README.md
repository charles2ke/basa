# Vendored third-party libraries

| File | Library | Version | License |
| :--- | :--- | :--- | :--- |
| `pouchdb.min.js` | [PouchDB](https://pouchdb.com/) | 9.0.0 | Apache-2.0 |

PouchDB is a free and open source NoSQL document database that runs in the
browser on top of IndexedDB, which makes it a good fit for the mobile-first
basa dashboard (offline-first, syncable with CouchDB).

The file is copied verbatim from the `pouchdb` npm package (`dist/pouchdb.min.js`)
so the static site can be deployed to GitHub Pages without a bundler or a CDN.
