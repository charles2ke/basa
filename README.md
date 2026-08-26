# Basa
Home, Ghar, Bari - Elder Care Circle Dashboard.

## Live Demo
<!-- LIVE_DEMO_START -->
🚀 **Live site:** https://charles2ke.github.io/basa/

**Latest deployment run:** https://github.com/charles2ke/basa/actions/runs/33017230050
<!-- LIVE_DEMO_END -->

## CI/CD Status
<!-- BUILD_STATUS_START -->
![Build Status](https://github.com/charles2ke/basa/actions/workflows/ci.yml/badge.svg)

**Last Automated Update:** Wed, 26 Aug 2026 21:51:46 GMT
<!-- BUILD_STATUS_END -->

## Test Coverage Metrics
<!-- COVERAGE_START -->
![Coverage](https://img.shields.io/badge/Coverage-100%25-brightgreen)

| Metric | Total | Covered | Percentage |
| :--- | :---: | :---: | :---: |
| **Lines** | 873 | 873 | 100% |
| **Statements** | 927 | 923 | 99.56% |
| **Functions** | 106 | 104 | 98.11% |
| **Branches** | 373 | 339 | 90.88% |
<!-- COVERAGE_END -->

## Features
- **Smart Ambient Telemetry**: Real-time monitoring of motion sensors, temperature, and environmental status.
- **Geofencing & Alerts**: Safe boundaries visual tracking with automated alerts.
- **Elder Care Circle**: Collaborative platform for scheduling appointments, routines tracking, and caregiver logs sharing.
- **Medical Vault**: Securely encrypted health report logs and prescription storage.
- **Wellness Games**: Brain-training matching games for cognitive engagement.
- **Hamburger Navigation**: The main navigation lives in an off-canvas drawer opened from the header hamburger button on every screen size.
- **Setup Pages**: Dedicated Parent Setup and Child/Caregiver Setup pages for profiles, contacts and alert preferences.
- **Local Emergency Numbers**: Police, ambulance and fire numbers resolved from the visitor's IP location, with a manual country override.
- **Offline NoSQL Storage**: All data is stored on-device in [PouchDB](https://pouchdb.com/), a free and open source NoSQL document database backed by IndexedDB.
- **Mobile Friendly**: Fully responsive layout with stacked cards and touch-friendly controls.

## Data Storage
State is persisted through `db.js`, a thin wrapper around PouchDB (Apache-2.0, vendored in `vendor/pouchdb.min.js`). Each collection - routines, vitals, care events, notes, vault documents, geofence settings, parent/child profiles and the detected emergency location - is stored as its own document. A synchronous `localStorage` mirror keeps the first paint instant and acts as a fallback when IndexedDB is unavailable; per-key write timestamps prevent an older database document from overwriting a newer local write.

## Screenshots

### Dashboard Overview
Daily snapshot of your parent's status: ambient telemetry, safety alerts, medication routines, and the SOS panic protocol.

![Overview dashboard](docs/screenshots/overview.png)

### Medication & Routines
Daily medication and routine checklists with completion progress bars.

![Scheduler](docs/screenshots/scheduler.png)

### Vitals Tracker
Blood pressure, pulse, glucose, and temperature logging with SVG trend charts and a historic readings table.

![Vitals trends](docs/screenshots/vitals.png)

### Care Team Hub
Shared caregiver workspace for coordinating appointments, shift notes, and live caregiver updates.

![Care team workspace](docs/screenshots/careteam.png)

### Medical Vault
Categorized, searchable archive of health reports, prescriptions, and insurance documents.

![Medical vault](docs/screenshots/vault.png)

### Geofence Alerts
Configurable safe-zone radius with wandering simulation that triggers automatic alerts.

![Geofencing and alerts](docs/screenshots/geofence.png)

### Wellness & Voice
Brain-training memory match game plus a voice-command simulator for hands-free routine updates.

![Wellness games](docs/screenshots/wellness.png)

### Hamburger Navigation
The main navigation is tucked behind the header hamburger button and slides in as a drawer, closing on selection, backdrop click, or `Esc`.

![Hamburger navigation drawer](docs/screenshots/hamburger-menu.png)

### Parent Setup
Capture the parent's identity, home address, medical background and accessibility preference.

![Parent setup page](docs/screenshots/setup-parent.png)

### Child / Caregiver Setup
Caregiver contact details, a backup contact, and per-channel alert preferences.

![Child setup page](docs/screenshots/setup-child.png)

### Local Emergency Numbers
Police, ambulance and fire numbers for the country detected from the visitor's IP address, with a manual override.

![Emergency numbers card](docs/screenshots/emergency-numbers.png)

### Mobile & Responsive Layout
The dashboard adapts from phones to desktops: the header wraps into compact rows, the sidebar becomes a horizontally scrollable tab strip, cards stack into a single column, and wide tables scroll horizontally instead of breaking the page.

| Overview (mobile) | Vitals (mobile) |
| :---: | :---: |
| ![Mobile overview](docs/screenshots/mobile-overview.png) | ![Mobile vitals tracker](docs/screenshots/mobile-vitals.png) |

The same hamburger drawer is used on phones:

![Mobile hamburger navigation](docs/screenshots/mobile-hamburger.png)
