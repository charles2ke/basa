// basa - App Controller & State Manager

// Main State Object
let state = {
    viewMode: 'child', // 'child' or 'parent'
    activeTab: 'overview',
    isEmergency: false,
    emergencyLog: [],
    routines: [],
    vitals: [],
    careEvents: [],
    careNotes: [],
    vaultDocs: [],
    geofence: {
        radius: 100, // in meters
        parentX: 200, // relative SVG coordinate
        parentY: 150,
        logs: []
    },
    game: {
        cards: [],
        flipped: [],
        matches: 0,
        moves: 0,
        startTime: null,
        timerInterval: null
    },
    iotMode: 'normal', // 'normal' or 'anomaly'
    wearables: null, // Google Fit / Garmin / Whoop connection + sync metadata
    navOpen: false,
    parentProfile: null,
    childProfile: null,
    emergency: {
        countryCode: '',
        label: '',
        source: '', // 'ip', 'manual' or 'fallback'
        detectedAt: null
    }
};

// Seed Data definition
const seedRoutines = [
    { id: 1, name: "Amlodipine (Blood Pressure)", time: "08:00", category: "medication", dosage: "5mg, take after breakfast", completed: false, completedTime: null },
    { id: 2, name: "Nutritious Lunch Check-in", time: "12:30", category: "routine", dosage: "High protein meal & glass of water", completed: false, completedTime: null },
    { id: 3, name: "Leg Stretch & Physical Therapy", time: "16:00", category: "therapy", dosage: "Walk inside lawn for 15 mins", completed: false, completedTime: null }
];

const seedVitals = [
    { date: "2026-08-22", systolic: 125, diastolic: 82, pulse: 75, glucose: 105, temp: 36.5 },
    { date: "2026-08-23", systolic: 122, diastolic: 80, pulse: 73, glucose: 98, temp: 36.6 },
    { date: "2026-08-24", systolic: 120, diastolic: 79, pulse: 72, glucose: 95, temp: 36.7 },
    { date: "2026-08-25", systolic: 118, diastolic: 78, pulse: 70, glucose: 92, temp: 36.6 },
    { date: "2026-08-26", systolic: 120, diastolic: 80, pulse: 72, glucose: 98, temp: 36.6 }
];

const seedEvents = [
    { id: 1, name: "GP Dr. Roberts Clinic Consult", assignee: "Emma (Professional Caregiver)", date: "2026-08-27", category: "Medical" },
    { id: 2, name: "Monthly Grocery Restock (Basa)", assignee: "Charles (Son)", date: "2026-08-29", category: "Grocery" }
];

const seedNotes = [
    { id: 1, author: "Emma (Pro Caregiver)", timestamp: "2026-08-26T10:15:00.000Z", text: "Dad was very energetic today. Ate all of his breakfast and did the stretch exercise in the backyard." },
    { id: 2, author: "Charles (Son)", timestamp: "2026-08-25T16:45:00.000Z", text: "Ordered the weekly medication delivery. Should arrive by Thursday morning at Basa." }
];

const seedVaultDocs = [
    { id: 1, title: "Amlodipine Cardiologist Prescription", category: "Prescription", size: "1.2 MB", date: "2026-08-16" },
    { id: 2, title: "Full Bio-lipid Blood Report", category: "Lab Report", size: "2.4 MB", date: "2026-08-05" }
];

// Offline directory of official emergency service numbers, keyed by ISO 3166-1 alpha-2 code
const EMERGENCY_NUMBERS = {
    DEFAULT: { country: "International (GSM)", police: "112", ambulance: "112", fire: "112", general: "112" },
    US: { country: "United States", police: "911", ambulance: "911", fire: "911", general: "911" },
    CA: { country: "Canada", police: "911", ambulance: "911", fire: "911", general: "911" },
    MX: { country: "Mexico", police: "911", ambulance: "911", fire: "911", general: "911" },
    BR: { country: "Brazil", police: "190", ambulance: "192", fire: "193", general: "190" },
    AR: { country: "Argentina", police: "101", ambulance: "107", fire: "100", general: "911" },
    CL: { country: "Chile", police: "133", ambulance: "131", fire: "132", general: "133" },
    CO: { country: "Colombia", police: "123", ambulance: "123", fire: "123", general: "123" },
    GB: { country: "United Kingdom", police: "999", ambulance: "999", fire: "999", general: "112" },
    IE: { country: "Ireland", police: "999", ambulance: "999", fire: "999", general: "112" },
    DE: { country: "Germany", police: "110", ambulance: "112", fire: "112", general: "112" },
    FR: { country: "France", police: "17", ambulance: "15", fire: "18", general: "112" },
    IT: { country: "Italy", police: "112", ambulance: "118", fire: "115", general: "112" },
    ES: { country: "Spain", police: "091", ambulance: "112", fire: "080", general: "112" },
    PT: { country: "Portugal", police: "112", ambulance: "112", fire: "112", general: "112" },
    NL: { country: "Netherlands", police: "112", ambulance: "112", fire: "112", general: "112" },
    BE: { country: "Belgium", police: "101", ambulance: "112", fire: "112", general: "112" },
    CH: { country: "Switzerland", police: "117", ambulance: "144", fire: "118", general: "112" },
    AT: { country: "Austria", police: "133", ambulance: "144", fire: "122", general: "112" },
    SE: { country: "Sweden", police: "112", ambulance: "112", fire: "112", general: "112" },
    NO: { country: "Norway", police: "112", ambulance: "113", fire: "110", general: "112" },
    DK: { country: "Denmark", police: "112", ambulance: "112", fire: "112", general: "112" },
    FI: { country: "Finland", police: "112", ambulance: "112", fire: "112", general: "112" },
    PL: { country: "Poland", police: "997", ambulance: "999", fire: "998", general: "112" },
    RU: { country: "Russia", police: "102", ambulance: "103", fire: "101", general: "112" },
    TR: { country: "Türkiye", police: "112", ambulance: "112", fire: "112", general: "112" },
    IL: { country: "Israel", police: "100", ambulance: "101", fire: "102", general: "112" },
    AE: { country: "United Arab Emirates", police: "999", ambulance: "998", fire: "997", general: "999" },
    SA: { country: "Saudi Arabia", police: "999", ambulance: "997", fire: "998", general: "911" },
    EG: { country: "Egypt", police: "122", ambulance: "123", fire: "180", general: "122" },
    ZA: { country: "South Africa", police: "10111", ambulance: "10177", fire: "10177", general: "112" },
    KE: { country: "Kenya", police: "999", ambulance: "999", fire: "999", general: "112" },
    NG: { country: "Nigeria", police: "112", ambulance: "112", fire: "112", general: "112" },
    GH: { country: "Ghana", police: "191", ambulance: "193", fire: "192", general: "112" },
    IN: { country: "India", police: "100", ambulance: "102", fire: "101", general: "112" },
    NP: { country: "Nepal", police: "100", ambulance: "102", fire: "101", general: "112" },
    BD: { country: "Bangladesh", police: "999", ambulance: "999", fire: "999", general: "999" },
    PK: { country: "Pakistan", police: "15", ambulance: "1122", fire: "16", general: "1122" },
    LK: { country: "Sri Lanka", police: "119", ambulance: "1990", fire: "110", general: "119" },
    CN: { country: "China", police: "110", ambulance: "120", fire: "119", general: "110" },
    HK: { country: "Hong Kong", police: "999", ambulance: "999", fire: "999", general: "112" },
    JP: { country: "Japan", police: "110", ambulance: "119", fire: "119", general: "110" },
    KR: { country: "South Korea", police: "112", ambulance: "119", fire: "119", general: "112" },
    SG: { country: "Singapore", police: "999", ambulance: "995", fire: "995", general: "999" },
    MY: { country: "Malaysia", police: "999", ambulance: "999", fire: "994", general: "999" },
    TH: { country: "Thailand", police: "191", ambulance: "1669", fire: "199", general: "191" },
    VN: { country: "Vietnam", police: "113", ambulance: "115", fire: "114", general: "113" },
    ID: { country: "Indonesia", police: "110", ambulance: "119", fire: "113", general: "112" },
    PH: { country: "Philippines", police: "911", ambulance: "911", fire: "911", general: "911" },
    AU: { country: "Australia", police: "000", ambulance: "000", fire: "000", general: "112" },
    NZ: { country: "New Zealand", police: "111", ambulance: "111", fire: "111", general: "111" }
};

// Blank profile templates used by the parent and child setup pages
const emptyParentProfile = {
    name: "", dob: "", phone: "", blood: "", address: "",
    conditions: "", allergies: "", doctor: "", doctorPhone: "", largeText: false
};

const emptyChildProfile = {
    name: "", relationship: "Son", email: "", phone: "",
    backupName: "", backupPhone: "",
    alerts: { sos: true, geofence: true, medication: true }
};

// --- Persistence helpers -------------------------------------------------
// All data lives in the NoSQL document database exposed by db.js (PouchDB on
// IndexedDB). When that layer is unavailable the raw localStorage mirror is
// used directly so the dashboard still works.

function storageGet(key, fallback) {
    if (typeof BasaDB !== 'undefined' && BasaDB) return BasaDB.get(key, fallback);
    try {
        const raw = localStorage.getItem(`basa_${key}`);
        if (raw === null || raw === undefined) return fallback;
        const parsed = JSON.parse(raw);
        return parsed === null || parsed === undefined ? fallback : parsed;
    } catch (err) {
        return fallback;
    }
}

function storageGetString(key, fallback) {
    if (typeof BasaDB !== 'undefined' && BasaDB) return BasaDB.getString(key, fallback);
    const raw = localStorage.getItem(`basa_${key}`);
    return raw === null || raw === undefined ? fallback : raw;
}

function storageSet(key, value) {
    if (typeof BasaDB !== 'undefined' && BasaDB) {
        BasaDB.set(key, value);
        return;
    }
    localStorage.setItem(`basa_${key}`, JSON.stringify(value));
}

function storageSetString(key, value) {
    if (typeof BasaDB !== 'undefined' && BasaDB) {
        BasaDB.setString(key, value);
        return;
    }
    localStorage.setItem(`basa_${key}`, String(value));
}

// Load every persisted collection into the in-memory state object
function loadStateFromStorage() {
    state.routines = storageGet('routines', seedRoutines);
    state.vitals = storageGet('vitals', seedVitals);
    state.careEvents = storageGet('careEvents', seedEvents);
    state.careNotes = storageGet('careNotes', seedNotes);
    state.vaultDocs = storageGet('vaultDocs', seedVaultDocs);
    state.isEmergency = storageGet('isEmergency', false);
    state.emergencyLog = storageGet('emergencyLog', []);
    state.geofence.radius = storageGet('geofence_radius', 100);
    state.geofence.parentX = storageGet('parentX', 200);
    state.geofence.parentY = storageGet('parentY', 150);
    state.geofence.logs = storageGet('geofence_logs', [
        { time: "17:00", event: "Parent status active. Coordinates aligned home." }
    ]);
    state.viewMode = storageGetString('viewMode', 'child');
    state.iotMode = storageGetString('iotMode', 'normal');
    state.parentProfile = Object.assign({}, emptyParentProfile, storageGet('parentProfile', {}));
    state.childProfile = Object.assign({}, emptyChildProfile, storageGet('childProfile', {}));
    state.childProfile.alerts = Object.assign({}, emptyChildProfile.alerts, state.childProfile.alerts);
    state.emergency = Object.assign({ countryCode: '', label: '', source: '', detectedAt: null }, storageGet('emergencyLocation', {}));

    // Wearable connections: merge stored flags on top of the known providers so
    // a newly supported platform still appears after an upgrade.
    const defaults = emptyWearables();
    const stored = storageGet('wearables', {}) || {};
    const storedProviders = stored.providers || {};
    Object.keys(defaults.providers).forEach(id => {
        defaults.providers[id] = Object.assign({}, defaults.providers[id], storedProviders[id]);
    });
    defaults.lastSync = stored.lastSync || null;
    state.wearables = defaults;
}

// Initialize application state
function init() {
    // Load from the NoSQL database mirror (or seed data on first run)
    loadStateFromStorage();
    
    // Bind navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
            closeNav();
        });
    });

    // Hamburger navigation drawer listeners
    document.getElementById('btn-hamburger').addEventListener('click', toggleNav);
    document.getElementById('btn-close-nav').addEventListener('click', closeNav);
    document.getElementById('nav-overlay').addEventListener('click', closeNav);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.navOpen) {
            closeNav();
        }
    });

    // View selector toggle listeners
    document.getElementById('btn-view-child').addEventListener('click', () => setViewMode('child'));
    document.getElementById('btn-view-parent').addEventListener('click', () => setViewMode('parent'));
    document.getElementById('btn-back-to-child').addEventListener('click', () => setViewMode('child'));

    // SOS buttons event listeners
    document.getElementById('btn-quick-sos').addEventListener('click', triggerEmergency);
    document.getElementById('btn-dashboard-sos').addEventListener('click', triggerEmergency);
    document.getElementById('btn-resolve-sos').addEventListener('click', resolveEmergency);

    // Form Submissions
    document.getElementById('routine-form').addEventListener('submit', handleAddRoutine);
    document.getElementById('vitals-form').addEventListener('submit', handleAddVital);
    document.getElementById('btn-wearables-sync').addEventListener('click', syncWearables);
    document.getElementById('careteam-event-form').addEventListener('submit', handleAddEvent);
    document.getElementById('careteam-note-form').addEventListener('submit', handleAddNote);
    document.getElementById('vault-upload-form').addEventListener('submit', handleVaultUpload);

    // File input visual label updater
    document.getElementById('vault-file-input').addEventListener('change', (e) => {
        const fileName = e.target.files[0] ? e.target.files[0].name : "Click to select record (PDF/Img)";
        document.getElementById('vault-file-label').textContent = fileName;
    });

    // Geofencing elements listeners
    const radiusSlider = document.getElementById('geofence-radius-slider');
    radiusSlider.value = state.geofence.radius;
    document.getElementById('geofence-radius-val').textContent = `${state.geofence.radius} meters`;
    radiusSlider.addEventListener('input', handleRadiusChange);

    document.getElementById('btn-geo-inside').addEventListener('click', () => moveParentLocation(200, 150));
    document.getElementById('btn-geo-near').addEventListener('click', () => moveParentLocation(260, 200));
    document.getElementById('btn-geo-outside').addEventListener('click', () => moveParentLocation(330, 220));

    // Voice command listeners: live dictation plus typed command fallback
    document.getElementById('btn-voice-mic').addEventListener('click', toggleVoiceDictation);
    document.getElementById('btn-voice-send').addEventListener('click', triggerVoiceCommandSim);
    document.getElementById('voice-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            triggerVoiceCommandSim();
        }
    });

    // Game reset listener
    document.getElementById('btn-reset-game').addEventListener('click', initMemoryGame);

    // IoT simulation listeners
    document.getElementById('btn-iot-normal').addEventListener('click', () => setIoTMode('normal'));
    document.getElementById('btn-iot-anomaly').addEventListener('click', () => setIoTMode('anomaly'));

    // Setup pages (parent & child profiles)
    document.getElementById('setup-parent-form').addEventListener('submit', handleSaveParentSetup);
    document.getElementById('setup-child-form').addEventListener('submit', handleSaveChildSetup);

    // Emergency numbers controls
    populateEmergencyCountries();
    document.getElementById('emergency-country-select').addEventListener('change', handleEmergencyCountryChange);
    document.getElementById('btn-refresh-emergency').addEventListener('click', () => detectEmergencyLocation(true));

    // Apply initialized view configurations
    setViewMode(state.viewMode);
    switchTab('overview');
    checkGeofenceStatus(false); // Evaluate geofence immediately without writing log alerts
    renderSetupForms();
    renderEmergencyNumbers();
    updateUI();
    initMemoryGame();

    // Storage engine label + asynchronous rehydration from the NoSQL database
    const engineLabel = document.getElementById('side-storage-engine');
    if (engineLabel && typeof BasaDB !== 'undefined' && BasaDB) {
        engineLabel.textContent = `Storage: ${BasaDB.engine()}`;
    }
    hydrateFromDatabase();

    // Resolve emergency service numbers for the current IP location
    detectEmergencyLocation(false);
}

// Re-read the state from the NoSQL database once its asynchronous handle is ready
function hydrateFromDatabase() {
    if (typeof BasaDB === 'undefined' || !BasaDB || !BasaDB.isAvailable()) {
        return Promise.resolve(false);
    }

    return BasaDB.hydrate().then((data) => {
        if (!data || Object.keys(data).length === 0) {
            saveState(); // First run: publish the seeded state into the database
            return false;
        }
        loadStateFromStorage();
        setViewMode(state.viewMode);
        const slider = document.getElementById('geofence-radius-slider');
        slider.value = state.geofence.radius;
        document.getElementById('geofence-radius-val').textContent = `${state.geofence.radius} meters`;
        checkGeofenceStatus(false);
        renderSetupForms();
        renderEmergencyNumbers();
        updateUI();
        return true;
    });
}

// Persist the current state into the NoSQL database (with synchronous mirror)
function saveState() {
    storageSet('routines', state.routines);
    storageSet('vitals', state.vitals);
    storageSet('careEvents', state.careEvents);
    storageSet('careNotes', state.careNotes);
    storageSet('vaultDocs', state.vaultDocs);
    storageSet('isEmergency', state.isEmergency);
    storageSet('emergencyLog', state.emergencyLog);
    storageSet('geofence_radius', state.geofence.radius);
    storageSet('parentX', state.geofence.parentX);
    storageSet('parentY', state.geofence.parentY);
    storageSet('geofence_logs', state.geofence.logs);
    storageSetString('viewMode', state.viewMode);
    storageSetString('iotMode', state.iotMode);
    storageSet('parentProfile', state.parentProfile);
    storageSet('childProfile', state.childProfile);
    storageSet('emergencyLocation', state.emergency);
    storageSet('wearables', state.wearables);
}

// Switch Active Tabs
function switchTab(tabId) {
    state.activeTab = tabId;
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    const targetPanel = document.getElementById(`panel-${tabId}`);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
    }

    // Toggle active tab class in buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Special renders when switching to specific tabs
    if (tabId === 'vitals') {
        renderVitalsChart('bp');
    }

    window.scrollTo(0, 0);
}

// Toggle View Modes
function setViewMode(mode) {
    state.viewMode = mode;
    const body = document.body;
    const childBtn = document.getElementById('btn-view-child');
    const parentBtn = document.getElementById('btn-view-parent');
    const parentNotice = document.getElementById('parent-view-banner');

    if (mode === 'parent') {
        body.classList.add('parent-mode');
        childBtn.className = "px-3 py-1.5 text-xs font-semibold rounded-md text-gray-600 hover:text-gray-800 transition-all duration-200";
        parentBtn.className = "px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm bg-white text-indigo-600 transition-all duration-200";
        parentNotice.classList.remove('hidden');
    } else {
        body.classList.remove('parent-mode');
        childBtn.className = "px-3 py-1.5 text-xs font-semibold rounded-md shadow-sm bg-white text-indigo-600 transition-all duration-200";
        parentBtn.className = "px-3 py-1.5 text-xs font-semibold rounded-md text-gray-600 hover:text-gray-800 transition-all duration-200";
        parentNotice.classList.add('hidden');
    }
    saveState();
}

// --- Hamburger navigation drawer ----------------------------------------

// Open or close the main navigation drawer
function toggleNav() {
    setNavOpen(!state.navOpen);
}

function openNav() {
    setNavOpen(true);
}

function closeNav() {
    setNavOpen(false);
}

function setNavOpen(open) {
    state.navOpen = open;
    const overlay = document.getElementById('nav-overlay');
    const trigger = document.getElementById('btn-hamburger');

    if (open) {
        document.body.classList.add('nav-open');
        overlay.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        const firstTab = document.querySelector('#main-nav .tab-btn');
        if (firstTab) firstTab.focus();
    } else {
        document.body.classList.remove('nav-open');
        overlay.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
    }
}

// --- Setup pages ---------------------------------------------------------

// Persist the parent profile captured on the parent setup page
function handleSaveParentSetup(e) {
    e.preventDefault();

    state.parentProfile = {
        name: document.getElementById('parent-name').value.trim(),
        dob: document.getElementById('parent-dob').value,
        phone: document.getElementById('parent-phone').value.trim(),
        blood: document.getElementById('parent-blood').value,
        address: document.getElementById('parent-address').value.trim(),
        conditions: document.getElementById('parent-conditions').value.trim(),
        allergies: document.getElementById('parent-allergies').value.trim(),
        doctor: document.getElementById('parent-doctor').value.trim(),
        doctorPhone: document.getElementById('parent-doctor-phone').value.trim(),
        largeText: document.getElementById('parent-large-text').checked
    };

    saveState();
    renderSetupForms();
    updateUI();

    if (state.parentProfile.largeText && state.viewMode !== 'parent') {
        setViewMode('parent');
    }
}

// Persist the caregiver ("child") profile captured on the child setup page
function handleSaveChildSetup(e) {
    e.preventDefault();

    state.childProfile = {
        name: document.getElementById('child-name').value.trim(),
        relationship: document.getElementById('child-relationship').value,
        email: document.getElementById('child-email').value.trim(),
        phone: document.getElementById('child-phone').value.trim(),
        backupName: document.getElementById('child-backup-name').value.trim(),
        backupPhone: document.getElementById('child-backup-phone').value.trim(),
        alerts: {
            sos: document.getElementById('child-alert-sos').checked,
            geofence: document.getElementById('child-alert-geofence').checked,
            medication: document.getElementById('child-alert-medication').checked
        }
    };

    saveState();
    renderSetupForms();
    updateUI();
}

// Prefill both setup forms and refresh their saved-profile summaries
function renderSetupForms() {
    const parent = state.parentProfile || Object.assign({}, emptyParentProfile);
    const child = state.childProfile || Object.assign({}, emptyChildProfile);

    document.getElementById('parent-name').value = parent.name || '';
    document.getElementById('parent-dob').value = parent.dob || '';
    document.getElementById('parent-phone').value = parent.phone || '';
    document.getElementById('parent-blood').value = parent.blood || '';
    document.getElementById('parent-address').value = parent.address || '';
    document.getElementById('parent-conditions').value = parent.conditions || '';
    document.getElementById('parent-allergies').value = parent.allergies || '';
    document.getElementById('parent-doctor').value = parent.doctor || '';
    document.getElementById('parent-doctor-phone').value = parent.doctorPhone || '';
    document.getElementById('parent-large-text').checked = !!parent.largeText;

    document.getElementById('child-name').value = child.name || '';
    document.getElementById('child-relationship').value = child.relationship || 'Son';
    document.getElementById('child-email').value = child.email || '';
    document.getElementById('child-phone').value = child.phone || '';
    document.getElementById('child-backup-name').value = child.backupName || '';
    document.getElementById('child-backup-phone').value = child.backupPhone || '';
    document.getElementById('child-alert-sos').checked = !!(child.alerts && child.alerts.sos);
    document.getElementById('child-alert-geofence').checked = !!(child.alerts && child.alerts.geofence);
    document.getElementById('child-alert-medication').checked = !!(child.alerts && child.alerts.medication);

    renderProfileSummary('setup-parent-summary', parent.name ? [
        ['Name', parent.name],
        ['Date of birth', parent.dob || 'Not set'],
        ['Phone', parent.phone || 'Not set'],
        ['Blood group', parent.blood || 'Unknown'],
        ['Home address', parent.address || 'Not set'],
        ['Conditions', parent.conditions || 'None recorded'],
        ['Allergies', parent.allergies || 'None recorded'],
        ['Doctor', parent.doctor ? `${parent.doctor} (${parent.doctorPhone || 'no phone'})` : 'Not set'],
        ['Large text mode', parent.largeText ? 'Enabled' : 'Disabled']
    ] : null, 'No parent profile saved yet. Fill in the form to get started.');

    renderProfileSummary('setup-child-summary', child.name ? [
        ['Name', child.name],
        ['Relationship', child.relationship || 'Not set'],
        ['Email', child.email || 'Not set'],
        ['Mobile', child.phone || 'Not set'],
        ['Backup contact', child.backupName ? `${child.backupName} (${child.backupPhone || 'no phone'})` : 'Not set'],
        ['SOS alerts', child.alerts && child.alerts.sos ? 'On' : 'Off'],
        ['Geofence alerts', child.alerts && child.alerts.geofence ? 'On' : 'Off'],
        ['Medication alerts', child.alerts && child.alerts.medication ? 'On' : 'Off']
    ] : null, 'No caregiver profile saved yet. Fill in the form to get started.');
}

// Render a definition-style summary list, or an empty state message
function renderProfileSummary(containerId, rows, emptyMessage) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (!rows) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-gray-500';
        empty.textContent = emptyMessage;
        container.appendChild(empty);
        return;
    }

    rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        row.className = 'flex justify-between gap-3 border-b border-gray-100 pb-1';

        const labelEl = document.createElement('span');
        labelEl.className = 'text-xs text-gray-500';
        labelEl.textContent = label;

        const valueEl = document.createElement('span');
        valueEl.className = 'text-xs font-semibold text-gray-900 text-right break-words';
        valueEl.textContent = value;

        row.appendChild(labelEl);
        row.appendChild(valueEl);
        container.appendChild(row);
    });
}

// --- Emergency numbers by IP location ------------------------------------

// Fill the manual override dropdown with every country in the offline directory
function populateEmergencyCountries() {
    const select = document.getElementById('emergency-country-select');
    select.innerHTML = '';

    Object.keys(EMERGENCY_NUMBERS)
        .sort((a, b) => EMERGENCY_NUMBERS[a].country.localeCompare(EMERGENCY_NUMBERS[b].country))
        .forEach((code) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = EMERGENCY_NUMBERS[code].country;
            select.appendChild(option);
        });
}

// Look up the directory entry for the currently selected country
function getEmergencyNumbers() {
    const code = (state.emergency && state.emergency.countryCode) || '';
    return EMERGENCY_NUMBERS[code] || EMERGENCY_NUMBERS.DEFAULT;
}

// Manual country override from the dropdown
function handleEmergencyCountryChange(e) {
    const code = e.target.value;
    state.emergency = {
        countryCode: code,
        label: EMERGENCY_NUMBERS[code] ? EMERGENCY_NUMBERS[code].country : EMERGENCY_NUMBERS.DEFAULT.country,
        source: 'manual',
        detectedAt: new Date().toISOString()
    };
    saveState();
    renderEmergencyNumbers();
}

/**
 * Resolve the visitor's country from their IP address and store the matching
 * emergency service numbers. Falls back to the international 112 entry when
 * the lookup is unavailable (offline, blocked, or rate limited).
 */
function detectEmergencyLocation(force) {
    if (!force && state.emergency && state.emergency.source === 'manual') {
        renderEmergencyNumbers();
        return Promise.resolve(getEmergencyNumbers());
    }

    if (typeof fetch !== 'function') {
        applyEmergencyLocation('', '', 'fallback');
        return Promise.resolve(getEmergencyNumbers());
    }

    const locationEl = document.getElementById('emergency-location');
    if (locationEl) locationEl.textContent = 'Detecting location…';

    return fetch('https://ipapi.co/json/', { headers: { Accept: 'application/json' } })
        .then((response) => {
            if (!response.ok) throw new Error('IP lookup failed');
            return response.json();
        })
        .then((data) => {
            const code = (data && (data.country_code || data.country) || '').toUpperCase();
            const place = [data && data.city, data && (data.country_name || data.country)]
                .filter(Boolean)
                .join(', ');
            applyEmergencyLocation(code, place, 'ip');
            return getEmergencyNumbers();
        })
        .catch(() => {
            applyEmergencyLocation('', '', 'fallback');
            return getEmergencyNumbers();
        });
}

// Store a resolved location and repaint the emergency numbers card
function applyEmergencyLocation(countryCode, label, source) {
    const code = EMERGENCY_NUMBERS[countryCode] ? countryCode : 'DEFAULT';
    state.emergency = {
        countryCode: code,
        label: label || EMERGENCY_NUMBERS[code].country,
        source: source,
        detectedAt: new Date().toISOString()
    };
    saveState();
    renderEmergencyNumbers();
}

// Build a safe tel: URI from a displayed emergency number
function telHref(number) {
    const dialable = String(number || '').replace(/[^0-9+*#]/g, '');
    return `tel:${dialable}`;
}

// Paint the emergency numbers card and the SOS banner shortcut
function renderEmergencyNumbers() {
    const numbers = getEmergencyNumbers();
    const grid = document.getElementById('emergency-numbers-grid');
    const locationEl = document.getElementById('emergency-location');
    const noteEl = document.getElementById('emergency-numbers-note');
    const select = document.getElementById('emergency-country-select');
    const bannerNumber = document.getElementById('sos-local-number');

    if (select) select.value = state.emergency.countryCode || 'DEFAULT';
    if (bannerNumber) {
        bannerNumber.textContent = numbers.general;
        if (bannerNumber.tagName === 'A') {
            bannerNumber.href = telHref(numbers.general);
            bannerNumber.setAttribute('aria-label', `Call the local emergency line ${numbers.general}`);
        }
    }

    if (locationEl) {
        locationEl.textContent = state.emergency.label || numbers.country;
    }

    if (noteEl) {
        if (state.emergency.source === 'manual') {
            noteEl.textContent = `Country selected manually: ${numbers.country}. Numbers are stored offline in the app.`;
        } else if (state.emergency.source === 'ip') {
            noteEl.textContent = `Detected from your IP address. Change the country above if it is wrong.`;
        } else {
            noteEl.textContent = 'IP location unavailable - showing the international 112 emergency line. Pick your country above.';
        }
    }

    if (!grid) return;
    grid.innerHTML = '';

    [
        ['Police', numbers.police, 'bg-blue-50 border-blue-100 text-blue-900'],
        ['Ambulance', numbers.ambulance, 'bg-red-50 border-red-100 text-red-900'],
        ['Fire', numbers.fire, 'bg-orange-50 border-orange-100 text-orange-900'],
        ['General', numbers.general, 'bg-gray-50 border-gray-100 text-gray-900']
    ].forEach(([label, number, classes]) => {
        // The whole card is a tel: link so a tap anywhere on it hands the number
        // straight to the phone dialler on mobile devices.
        const card = document.createElement('a');
        card.className = `block p-3 rounded-xl border min-h-[64px] hover:shadow-sm transition ${classes}`;
        card.href = telHref(number);
        card.setAttribute('aria-label', `Call ${label} on ${number}`);

        const title = document.createElement('p');
        title.className = 'text-[10px] uppercase font-bold opacity-70';
        title.textContent = label;

        const value = document.createElement('span');
        value.className = 'text-xl font-extrabold block mt-1';
        value.textContent = number;

        const hint = document.createElement('span');
        hint.className = 'text-[10px] font-semibold opacity-70 block mt-0.5';
        hint.textContent = 'Tap to call';

        card.appendChild(title);
        card.appendChild(value);
        card.appendChild(hint);
        grid.appendChild(card);
    });
}

// Trigger SOS panic button emergency protocol
function triggerEmergency() {
    state.isEmergency = true;
    const now = new Date();
    const timestampStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add to SOS logs
    state.emergencyLog.unshift({
        time: timestampStr,
        date: now.toLocaleDateString(),
        gps: "27.7172° N, 85.3240° E (Home Basa)",
        details: "One-touch dashboard panel button panic pressed."
    });

    // Log to shared notes
    const newNote = {
        id: Date.now(),
        author: "System Broadcast",
        timestamp: now.toISOString(),
        text: "🚨 EMERGENCY SOS INITIATED! Critical family response triggered immediately. Location logged: Kathmandu Home."
    };
    state.careNotes.unshift(newNote);

    saveState();
    updateUI();
    playEmergencyBeep();

    // Flash visual changes immediately
    const flashBanner = document.getElementById('flash-emergency-banner');
    flashBanner.classList.remove('hidden');
    document.getElementById('parent-status-badge').className = "flex items-center bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-300 emergency-pulsing";
    document.getElementById('parent-status-text').textContent = "CRITICAL EMERGENCY!";
    document.getElementById('parent-status-dot').className = "w-2.5 h-2.5 bg-red-600 rounded-full mr-2 animate-ping";
}

// Resolve emergency state
function resolveEmergency() {
    state.isEmergency = false;
    const now = new Date();
    
    // Add resolving note
    state.careNotes.unshift({
        id: Date.now(),
        author: "Charles (Son)",
        timestamp: now.toISOString(),
        text: "✅ Emergency status checked. Parent is safe, SOS false alert resolved."
    });

    saveState();
    // Return to original coords safe state
    moveParentLocation(200, 150);
}

// Sound simulated AudioContext alerts
function playEmergencyBeep() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Pitch A5
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.8); // play for 0.8s
    } catch(e) {
        console.warn("AudioContext block standard restriction: user gesture required to play sounds.");
    }
}

// Handle Add Routine
function handleAddRoutine(e) {
    e.preventDefault();
    const name = document.getElementById('routine-name').value;
    const time = document.getElementById('routine-time').value;
    const categoryOption = document.getElementById('routine-category').value;
    const dosage = document.getElementById('routine-dosage').value;

    const newRoutine = {
        id: Date.now(),
        name,
        time,
        category: categoryOption,
        dosage,
        completed: false,
        completedTime: null
    };

    state.routines.push(newRoutine);
    saveState();
    updateUI();

    // Reset Form
    document.getElementById('routine-name').value = '';
    document.getElementById('routine-time').value = '';
    document.getElementById('routine-dosage').value = '';
}

// Complete Daily Routine Action
function toggleRoutineComplete(id) {
    const routine = state.routines.find(r => r.id === id);
    if (!routine) return;

    routine.completed = !routine.completed;
    const now = new Date();
    routine.completedTime = routine.completed ? now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

    if (routine.completed) {
        // Add log notice to shared caregiver stream
        state.careNotes.unshift({
            id: Date.now(),
            author: "Self (Parent)",
            timestamp: now.toISOString(),
            text: `📝 Checked in: Finished daily schedule task "${routine.name}" at ${routine.completedTime}.`
        });
    }

    saveState();
    updateUI();
}

// Handle Add Vitals entries
function handleAddVital(e) {
    e.preventDefault();
    const systolic = parseInt(document.getElementById('vital-systolic').value);
    const diastolic = parseInt(document.getElementById('vital-diastolic').value);
    const pulse = parseInt(document.getElementById('vital-pulse').value);
    const glucose = parseInt(document.getElementById('vital-glucose').value);
    const temp = parseFloat(document.getElementById('vital-temp').value);
    const today = new Date().toISOString().split('T')[0];

    const newVital = {
        date: today,
        systolic,
        diastolic,
        pulse,
        glucose,
        temp
    };

    state.vitals.push(newVital);
    
    // Sort vitals chronologically
    state.vitals.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Keep max 10 records to keep SVG chart and layout looking neat
    if (state.vitals.length > 10) {
        state.vitals.shift();
    }

    saveState();
    updateUI();
    renderVitalsChart('bp'); // reload active vitals tab graph

    // Reset inputs
    document.getElementById('vital-systolic').value = '';
    document.getElementById('vital-diastolic').value = '';
    document.getElementById('vital-pulse').value = '';
    document.getElementById('vital-glucose').value = '';
    document.getElementById('vital-temp').value = '';
}

// Delete specific Vitals Record from history table
function deleteVital(index) {
    state.vitals.splice(index, 1);
    saveState();
    updateUI();
    renderVitalsChart('bp');
}

// --- Wearables & health platform sync ------------------------------------
// Google Fit, Garmin and Whoop each expose a different subset of metrics, so
// every provider only contributes the readings its devices actually measure.
const WEARABLE_PROVIDERS = [
    { id: 'googlefit', name: 'Google Fit', icon: '🟢', metrics: ['pulse', 'glucose'] },
    { id: 'garmin', name: 'Garmin', icon: '🔵', metrics: ['pulse', 'systolic', 'diastolic'] },
    { id: 'whoop', name: 'Whoop', icon: '🟣', metrics: ['pulse', 'temp'] }
];

// Plausible ranges used when a connected provider streams a fresh reading
const WEARABLE_METRIC_RANGES = {
    systolic: [112, 132],
    diastolic: [72, 86],
    pulse: [62, 88],
    glucose: [88, 116],
    temp: [36.2, 37.0]
};

function emptyWearables() {
    const providers = {};
    WEARABLE_PROVIDERS.forEach(p => {
        providers[p.id] = { connected: false, connectedAt: null, lastSync: null };
    });
    return { providers, lastSync: null };
}

function getWearableProvider(id) {
    return WEARABLE_PROVIDERS.find(p => p.id === id) || null;
}

// Draw one reading for a metric, rounded the way the tracker reports it
function readWearableMetric(metric) {
    const range = WEARABLE_METRIC_RANGES[metric];
    const value = range[0] + Math.random() * (range[1] - range[0]);
    return metric === 'temp' ? Math.round(value * 10) / 10 : Math.round(value);
}

// Connect or disconnect a provider (authorisation is simulated offline)
function toggleWearableConnection(id) {
    const provider = getWearableProvider(id);
    if (!provider) return;

    const entry = state.wearables.providers[id];
    if (entry.connected) {
        state.wearables.providers[id] = { connected: false, connectedAt: null, lastSync: null };
    } else {
        state.wearables.providers[id] = {
            connected: true,
            connectedAt: new Date().toISOString(),
            lastSync: null
        };
    }

    saveState();
    renderWearables();
    return state.wearables.providers[id].connected;
}

// Manual sync: pull the latest reading from every connected provider and merge
// it into today's vitals entry.
function syncWearables() {
    const connected = WEARABLE_PROVIDERS.filter(p => state.wearables.providers[p.id].connected);
    const statusEl = document.getElementById('wearables-sync-status');

    if (connected.length === 0) {
        if (statusEl) statusEl.textContent = 'Connect Google Fit, Garmin or Whoop first, then sync.';
        return 0;
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    let entry = state.vitals.find(v => v.date === today);
    if (!entry) {
        const previous = state.vitals[state.vitals.length - 1] || {};
        entry = {
            date: today,
            systolic: previous.systolic || 120,
            diastolic: previous.diastolic || 80,
            pulse: previous.pulse || 72,
            glucose: previous.glucose || 98,
            temp: previous.temp || 36.6
        };
        state.vitals.push(entry);
        state.vitals.sort((a, b) => new Date(a.date) - new Date(b.date));
        if (state.vitals.length > 10) state.vitals.shift();
    }

    const metrics = [];
    connected.forEach(provider => {
        provider.metrics.forEach(metric => {
            entry[metric] = readWearableMetric(metric);
            if (!metrics.includes(metric)) metrics.push(metric);
        });
        state.wearables.providers[provider.id].lastSync = now.toISOString();
    });

    entry.source = connected.map(p => p.name).join(', ');
    state.wearables.lastSync = now.toISOString();

    state.careNotes.unshift({
        id: Date.now(),
        author: "Basa Sync",
        timestamp: now.toISOString(),
        text: `⌚ Synced ${metrics.length} vital metric(s) from ${entry.source}.`
    });

    saveState();
    updateUI();
    renderVitalsChart('bp');
    return connected.length;
}

// Format an ISO timestamp for the wearables card
function formatSyncTime(iso) {
    if (!iso) return 'never';
    const date = new Date(iso);
    if (isNaN(date.getTime())) return 'never';
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// Repaint the wearable provider rows and the sync status line
function renderWearables() {
    const list = document.getElementById('wearables-list');
    if (!list) return;

    list.innerHTML = '';
    WEARABLE_PROVIDERS.forEach(provider => {
        const entry = state.wearables.providers[provider.id];
        const row = document.createElement('div');
        row.className = "flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100";
        row.innerHTML = `
            <div class="min-w-0 pr-2">
                <p class="text-sm font-semibold text-gray-800">${provider.icon} ${provider.name}</p>
                <p class="text-[10px] text-gray-400" id="wearable-status-${provider.id}">
                    ${entry.connected ? `Connected · last sync ${formatSyncTime(entry.lastSync)}` : 'Not connected'}
                </p>
            </div>
            <button type="button" id="btn-wearable-${provider.id}" onclick="toggleWearableConnection('${provider.id}')"
                class="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition ${entry.connected
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'}">
                ${entry.connected ? 'Disconnect' : 'Connect'}
            </button>
        `;
        list.appendChild(row);
    });

    const statusEl = document.getElementById('wearables-sync-status');
    if (statusEl) {
        const connectedCount = WEARABLE_PROVIDERS.filter(p => state.wearables.providers[p.id].connected).length;
        if (connectedCount === 0) {
            statusEl.textContent = 'No wearable connected. Vitals can still be logged manually above.';
        } else {
            statusEl.textContent = `${connectedCount} source(s) connected · last manual sync: ${formatSyncTime(state.wearables.lastSync)}`;
        }
    }
}

// Handle Add Calendar Appointments
function handleAddEvent(e) {
    e.preventDefault();
    const name = document.getElementById('event-name').value;
    const assignee = document.getElementById('event-assignee').value;
    const date = document.getElementById('event-date').value;
    const category = document.getElementById('event-category').value;

    const newEvent = {
        id: Date.now(),
        name,
        assignee,
        date,
        category
    };

    state.careEvents.push(newEvent);
    // Sort chronologically
    state.careEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

    saveState();
    updateUI();

    document.getElementById('event-name').value = '';
    document.getElementById('event-date').value = '';
}

// Handle adding Note comments to caregiver stream
function handleAddNote(e) {
    e.preventDefault();
    const text = document.getElementById('note-text').value;
    const author = state.viewMode === 'child' ? "Charles (Son)" : "Self (Parent)";

    const newNote = {
        id: Date.now(),
        author,
        timestamp: new Date().toISOString(),
        text
    };

    state.careNotes.unshift(newNote);
    saveState();
    updateUI();

    document.getElementById('note-text').value = '';
}

// Handle uploading mock files inside Medical Vault
function handleVaultUpload(e) {
    e.preventDefault();
    const title = document.getElementById('vault-title').value;
    const category = document.getElementById('vault-category').value;
    const today = new Date().toISOString().split('T')[0];

    const newDoc = {
        id: Date.now(),
        title,
        category,
        size: "820 KB", // Mock standard size
        date: today
    };

    state.vaultDocs.unshift(newDoc);
    saveState();
    updateUI();

    // Reset
    document.getElementById('vault-title').value = '';
    document.getElementById('vault-file-input').value = '';
    document.getElementById('vault-file-label').textContent = "Click to select record (PDF/Img)";
}

// Geofence radius changed slider handler
function handleRadiusChange(e) {
    const r = parseInt(e.target.value);
    state.geofence.radius = r;
    document.getElementById('geofence-radius-val').textContent = `${r} meters`;
    
    // update graphical radius representation circle in map SVG
    const circle = document.getElementById('map-geofence-circle');
    if (circle) {
        circle.setAttribute('r', r);
    }
    
    checkGeofenceStatus(true);
    saveState();
    updateUI();
}

// Parent locator node positions coordinate updater
function moveParentLocation(x, y) {
    state.geofence.parentX = x;
    state.geofence.parentY = y;

    // update position properties in SVG circles immediately
    const node = document.getElementById('map-parent-node');
    const pulse = document.getElementById('map-parent-pulse');
    if (node && pulse) {
        node.setAttribute('cx', x);
        node.setAttribute('cy', y);
        pulse.setAttribute('cx', x);
        pulse.setAttribute('cy', y);
    }

    checkGeofenceStatus(true);
    saveState();
    updateUI();
}

// Evaluate parent distance bounds compared against current geofence limits
function checkGeofenceStatus(writeAlert) {
    const cx = 200; // Center home
    const cy = 150;
    const x = state.geofence.parentX;
    const y = state.geofence.parentY;
    const r = state.geofence.radius;

    // Calc Euclidean distance inside the map grid coordinate system
    const distance = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));

    const mapWarn = document.getElementById('map-warn-overlay');
    const banner = document.getElementById('flash-emergency-banner');

    if (distance > r) {
        // Wandered!
        if (mapWarn) mapWarn.classList.remove('hidden');
        
        if (writeAlert && !state.isEmergency) {
            state.isEmergency = true;
            
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            state.geofence.logs.unshift({
                time: timeStr,
                event: `🚨 Wandering alert! Parent crossed boundary limit of ${r}m.`
            });

            state.emergencyLog.unshift({
                time: timeStr,
                date: now.toLocaleDateString(),
                gps: "Wandered: 27.7198° N, 85.3275° E (Main Street)",
                details: `Geofence violation trigger: Parent distance ${Math.round(distance)}m exceeds range limit.`
            });

            state.careNotes.unshift({
                id: Date.now(),
                author: "Geofence Automated Alert",
                timestamp: now.toISOString(),
                text: `🚨 GEOLOCATION ALERT: Parent wandered outside safe perimeter zone! Current range: ${Math.round(distance)} meters from home.`
            });

            playEmergencyBeep();
        }
    } else {
        if (mapWarn) mapWarn.classList.add('hidden');
        if (!state.isEmergency) {
            if (banner) banner.classList.add('hidden');
        }
    }
}

// --- Live speech to text -------------------------------------------------

let speechRecognizer = null;      // Active SpeechRecognition instance
let isDictating = false;          // True while the microphone is listening
let dictationFinalText = '';      // Finalised transcript for the current session

// Resolve the vendor prefixed Web Speech API constructor, when available
function getSpeechRecognitionCtor() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// Paint the microphone button and the status line for the current state
function setDictationUI(listening, message) {
    const micBtn = document.getElementById('btn-voice-mic');
    const status = document.getElementById('voice-mic-status');

    if (micBtn) {
        micBtn.setAttribute('aria-pressed', listening ? 'true' : 'false');
        micBtn.title = listening ? 'Stop live speech to text' : 'Start live speech to text';
        micBtn.className = listening
            ? 'bg-red-600 border border-red-700 text-white p-2.5 rounded-lg flex items-center justify-center shrink-0 animate-pulse'
            : 'bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-600 p-2.5 rounded-lg flex items-center justify-center shrink-0';
    }

    if (status && message) status.textContent = message;
}

// Write a line into the voice recognition output feed
function logVoiceFeed(text) {
    const feed = document.getElementById('voice-output-feed');
    if (feed) feed.textContent = `${text}\n\n` + feed.textContent;
}

// Start or stop live speech to text on the microphone button
function toggleVoiceDictation() {
    if (isDictating) {
        stopVoiceDictation();
        return;
    }

    const Recognition = getSpeechRecognitionCtor();
    if (!Recognition) {
        // Browser without the Web Speech API: fall back to the typed command
        setDictationUI(false, 'Live speech to text is not supported in this browser. Type the command and press Send.');
        logVoiceFeed('[System] Speech recognition unavailable in this browser - using typed input.');
        triggerVoiceCommandSim();
        return;
    }

    const inputEl = document.getElementById('voice-input');
    dictationFinalText = '';
    if (inputEl) inputEl.value = '';

    try {
        speechRecognizer = new Recognition();
    } catch (err) {
        setDictationUI(false, 'Microphone could not be started. Type the command and press Send.');
        logVoiceFeed('[System] Speech recognition failed to initialise.');
        return;
    }

    speechRecognizer.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    speechRecognizer.continuous = true;
    speechRecognizer.interimResults = true;

    speechRecognizer.onstart = () => {
        isDictating = true;
        setDictationUI(true, 'Listening… speak your command. Tap the microphone again to stop.');
        logVoiceFeed('[System] Microphone live. Listening for a command…');
    };

    speechRecognizer.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const transcript = result[0] ? result[0].transcript : '';
            if (result.isFinal) {
                dictationFinalText = `${dictationFinalText} ${transcript}`.trim();
            } else {
                interim += transcript;
            }
        }

        const liveText = `${dictationFinalText} ${interim}`.trim();
        const field = document.getElementById('voice-input');
        if (field) field.value = liveText;
        setDictationUI(true, liveText ? `Heard: “${liveText}”` : 'Listening… speak your command.');
    };

    speechRecognizer.onerror = (event) => {
        const reason = event && event.error ? event.error : 'unknown';
        const message = reason === 'not-allowed' || reason === 'service-not-allowed'
            ? 'Microphone permission denied. Allow microphone access or type the command and press Send.'
            : `Speech recognition error (${reason}). Type the command and press Send.`;
        isDictating = false;
        setDictationUI(false, message);
        logVoiceFeed(`[System] ${message}`);
    };

    speechRecognizer.onend = () => {
        isDictating = false;
        setDictationUI(false, 'Microphone off. Tap the microphone to dictate again.');
        const spoken = dictationFinalText.trim();
        if (spoken) {
            const field = document.getElementById('voice-input');
            if (field) field.value = spoken;
            triggerVoiceCommandSim();
        }
        dictationFinalText = '';
        speechRecognizer = null;
    };

    try {
        speechRecognizer.start();
    } catch (err) {
        isDictating = false;
        setDictationUI(false, 'Microphone could not be started. Type the command and press Send.');
    }
}

// Stop an in-flight dictation session
function stopVoiceDictation() {
    if (!speechRecognizer) {
        isDictating = false;
        setDictationUI(false, 'Microphone off. Tap the microphone to dictate again.');
        return;
    }
    try {
        speechRecognizer.stop();
    } catch (err) {
        isDictating = false;
        setDictationUI(false, 'Microphone off. Tap the microphone to dictate again.');
    }
}

// Handle Simulated Voice Commands analyzer
function triggerVoiceCommandSim() {
    const inputEl = document.getElementById('voice-input');
    const commandText = inputEl.value.trim().toLowerCase();
    if (!commandText) return;

    const feed = document.getElementById('voice-output-feed');
    let outputText = "";

    if (commandText.includes("took my pills") || commandText.includes("took pills")) {
        // Mark all daily schedule items as complete
        let count = 0;
        state.routines.forEach(r => {
            if (r.category === 'medication' && !r.completed) {
                r.completed = true;
                r.completedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                count++;
            }
        });
        
        if (count > 0) {
            state.careNotes.unshift({
                id: Date.now(),
                author: "Voice Assistant (Microphone)",
                timestamp: new Date().toISOString(),
                text: "📝 Voice check-in: 'Dad took morning pills' parsed and registered daily progress."
            });
            outputText = `Success: Marked ${count} medications completed via voice commands.`;
        } else {
            outputText = "Routines check: All medication schedule items already marked done.";
        }
    } 
    else if (commandText.includes("emergency") || commandText.includes("sos") || commandText.includes("panic")) {
        triggerEmergency();
        outputText = "🚨 ALERT: EMERGENCY PANIC SOS TRIGGERED VIA VOICE PROTOCOL!";
    } 
    else if (commandText.includes("log glucose")) {
        // Match numbers in string
        const matches = commandText.match(/\d+/);
        if (matches && matches[0]) {
            const val = parseInt(matches[0]);
            const newVital = {
                date: new Date().toISOString().split('T')[0],
                systolic: 120,
                diastolic: 80,
                pulse: 72,
                glucose: val,
                temp: 36.6
            };
            state.vitals.push(newVital);
            outputText = `Success: Logged fast blood glucose concentration of ${val} mg/dL.`;
            
            state.careNotes.unshift({
                id: Date.now(),
                author: "Voice Assistant (Microphone)",
                timestamp: new Date().toISOString(),
                text: `🩺 Vitals voice entry logged: Fast blood glucose levels recorded at ${val} mg/dL.`
            });
        } else {
            outputText = "Syntax error: Could not resolve a valid blood glucose integer value. Try: 'log glucose 110'";
        }
    } 
    else if (commandText.includes("home check") || commandText.includes("sensor")) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        outputText = `Ambient Smart Telemetry at ${timeStr}:\nKitchen Motion: Active\nBedroom Temp: 22.5°C\nBathroom: normal`;
    } 
    else {
        outputText = `Error: Voice command "${commandText}" not recognized. Try: "took my pills" or "emergency panic".`;
    }

    // append to visual feed
    feed.textContent = `>> ${inputEl.value}\n[Voice Engine] ${outputText}\n\n` + feed.textContent;
    inputEl.value = "";
    
    saveState();
    updateUI();
}

// Toggling Live IoT telemetry status check warning modes
function setIoTMode(mode) {
    state.iotMode = mode;
    const dotKitchen = document.getElementById('iot-dot-kitchen');
    const valKitchen = document.getElementById('iot-val-kitchen');

    const dotBathroom = document.getElementById('iot-dot-bathroom');
    const valBathroom = document.getElementById('iot-val-bathroom');
    const subBathroom = document.getElementById('iot-sub-bathroom');

    const sensKitchen = document.getElementById('sensor-kitchen');
    const sensBathroom = document.getElementById('sensor-bathroom');

    const iotHeader = document.getElementById('ambient-alert-badge');

    if (mode === 'anomaly') {
        // Simulation: Bathroom inactivity warning
        dotKitchen.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
        valKitchen.textContent = "No Motion";
        
        dotBathroom.className = "w-2 h-2 rounded-full bg-red-600 animate-ping";
        valBathroom.textContent = "Inactive (4h)";
        valBathroom.className = "text-2xl font-black text-red-600";
        subBathroom.textContent = "CRITICAL: Bathroom inactive beyond fall thresholds!";
        subBathroom.className = "text-[10px] text-red-500 font-bold";

        sensKitchen.textContent = "Motion: Inactive";
        sensKitchen.className = "text-xs font-semibold text-yellow-600 mt-1";
        sensBathroom.textContent = "Bathroom: INACTIVE";
        sensBathroom.className = "text-xs font-semibold text-red-600 mt-1 animate-pulse";

        iotHeader.classList.remove('hidden');

        // Append alert to caregiver note feed
        state.careNotes.unshift({
            id: Date.now(),
            author: "Smart Home AI Guardian",
            timestamp: new Date().toISOString(),
            text: "⚠️ ANOMALY INACTIVITY WARNING: Bathroom sensor registers zero motion in 4 hours. Automated verification recommended."
        });
    } else {
        // Restore Normal telemetry values
        dotKitchen.className = "w-2 h-2 rounded-full bg-green-500";
        valKitchen.textContent = "Active";

        dotBathroom.className = "w-2 h-2 rounded-full bg-green-500";
        valBathroom.textContent = "Normal";
        valBathroom.className = "text-2xl font-black text-gray-800";
        subBathroom.textContent = "Motion detected in last hour";
        subBathroom.className = "text-[10px] text-gray-400";

        sensKitchen.textContent = "Motion: 2m ago";
        sensKitchen.className = "text-xs font-semibold text-gray-700 mt-1";
        sensBathroom.textContent = "Bathroom: Active 10m ago";
        sensBathroom.className = "text-xs font-semibold text-gray-700 mt-1";

        iotHeader.classList.add('hidden');
    }
    saveState();
    updateUI();
}

// Initializing Memory game puzzles
function initMemoryGame() {
    const emojis = ['🍎', '🧩', '🧠', '🌻', '🧘', '☕', '🍎', '🧩', '🧠', '🌻', '🧘', '☕'];
    
    // Shuffle Array
    for (let i = emojis.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emojis[i], emojis[j]] = [emojis[j], emojis[i]];
    }

    state.game.cards = emojis.map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false
    }));

    state.game.flipped = [];
    state.game.matches = 0;
    state.game.moves = 0;
    state.game.startTime = Date.now();
    
    // Clear dynamic game timer
    clearInterval(state.game.timerInterval);
    document.getElementById('game-time').textContent = '0s';
    state.game.timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - state.game.startTime) / 1000);
        document.getElementById('game-time').textContent = `${elapsed}s`;
    }, 1000);

    renderMemoryGame();
}

// Render Memory board matching cells
function renderMemoryGame() {
    const grid = document.getElementById('memory-game-grid');
    grid.innerHTML = '';

    state.game.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = `memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`;
        cardEl.setAttribute('data-id', card.id);

        cardEl.innerHTML = `
            <div class="memory-card-inner">
                <div class="memory-card-front text-sm font-bold">basa</div>
                <div class="memory-card-back text-xl">${card.emoji}</div>
            </div>
        `;

        if (!card.flipped && !card.matched && state.game.flipped.length < 2) {
            cardEl.addEventListener('click', () => handleMemoryFlip(card.id));
        }

        grid.appendChild(cardEl);
    });

    document.getElementById('game-moves').textContent = state.game.moves;
    document.getElementById('game-matches').textContent = `${state.game.matches} / 6`;
}

// Process memory cell flippings logic
function handleMemoryFlip(id) {
    const card = state.game.cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched || state.game.flipped.length >= 2) return;

    card.flipped = true;
    state.game.flipped.push(card);
    renderMemoryGame();

    if (state.game.flipped.length === 2) {
        state.game.moves++;
        const [first, second] = state.game.flipped;

        if (first.emoji === second.emoji) {
            // Match found!
            first.matched = true;
            second.matched = true;
            state.game.matches++;
            state.game.flipped = [];
            
            if (state.game.matches === 6) {
                clearInterval(state.game.timerInterval);
                const timeDiff = Math.floor((Date.now() - state.game.startTime) / 1000);
                
                // Add victory logs to caregivers notes stream
                state.careNotes.unshift({
                    id: Date.now(),
                    author: "Brain Exercise Hub",
                    timestamp: new Date().toISOString(),
                    text: `🧠 Wellness check: Dad completed memory match puzzles challenge in ${timeDiff}s and ${state.game.moves} moves! Focus status registered: Excellent.`
                });
                
                setTimeout(() => {
                    alert(`Fantastic job, Dad! You completed the memory challenge successfully in ${timeDiff} seconds!`);
                    saveState();
                    updateUI();
                }, 500);
            }
            renderMemoryGame();
        } else {
            // No match. Flip back after delay
            setTimeout(() => {
                first.flipped = false;
                second.flipped = false;
                state.game.flipped = [];
                renderMemoryGame();
            }, 1000);
        }
    }
}

// Re-draw vitals charts SVG trends lines
function renderVitalsChart(type) {
    const svg = document.getElementById('vitals-svg-canvas');
    if (!svg) return;

    // Clear contents
    svg.innerHTML = '';

    const vitalsData = state.vitals;
    if (vitalsData.length === 0) {
        svg.innerHTML = `<text x="180" y="100" fill="#9ca3af" font-size="14">No vitals entries logged yet.</text>`;
        return;
    }

    const width = 500;
    const height = 200;
    const padding = 30;

    // Retrieve corresponding values
    let values = [];
    let labelY = '';

    if (type === 'bp') {
        values = vitalsData.map(v => v.systolic); // Graph systolic BP trend
        labelY = 'mmHg (Systolic)';
    } else if (type === 'pulse') {
        values = vitalsData.map(v => v.pulse);
        labelY = 'Heart Rate (bpm)';
    } else if (type === 'glucose') {
        values = vitalsData.map(v => v.glucose);
        labelY = 'Glucose (mg/dL)';
    } else if (type === 'temp') {
        values = vitalsData.map(v => v.temp);
        labelY = 'Temperature (°C)';
    }

    const minVal = Math.min(...values) - 5 > 0 ? Math.min(...values) - 5 : 0;
    const maxVal = Math.max(...values) + 5;
    const valueRange = maxVal - minVal || 1;

    // Draw Chart axes
    const axisGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    axisGroup.setAttribute("stroke", "#e5e7eb");
    axisGroup.setAttribute("stroke-width", "1");

    // X axis line
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", padding);
    xAxis.setAttribute("y1", height - padding);
    xAxis.setAttribute("x2", width - padding);
    xAxis.setAttribute("y2", height - padding);
    axisGroup.appendChild(xAxis);

    // Y axis line
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", padding);
    yAxis.setAttribute("y1", padding);
    yAxis.setAttribute("x2", padding);
    yAxis.setAttribute("y2", height - padding);
    axisGroup.appendChild(yAxis);
    svg.appendChild(axisGroup);

    // Render Grid Guide Lines (horizontal)
    const gridGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gridGroup.setAttribute("stroke", "#f3f4f6");
    gridGroup.setAttribute("stroke-width", "1");
    gridGroup.setAttribute("stroke-dasharray", "3 3");

    for (let i = 1; i <= 4; i++) {
        const yVal = padding + ((height - 2 * padding) / 4) * i;
        const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        gridLine.setAttribute("x1", padding);
        gridLine.setAttribute("y1", yVal);
        gridLine.setAttribute("x2", width - padding);
        gridLine.setAttribute("y2", yVal);
        gridGroup.appendChild(gridLine);
    }
    svg.appendChild(gridGroup);

    // Plot Points and lines mapping
    const points = [];
    const count = vitalsData.length;
    const stepX = (width - 2 * padding) / (count - 1 || 1);

    for (let i = 0; i < count; i++) {
        const x = padding + i * stepX;
        const ratio = (values[i] - minVal) / valueRange;
        const y = height - padding - ratio * (height - 2 * padding);
        points.push({ x, y, val: values[i], date: vitalsData[i].date });
    }

    // Draw connecting lines polyline path
    if (points.length > 1) {
        const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
        polyline.setAttribute("fill", "none");
        polyline.setAttribute("stroke", "#4f46e5");
        polyline.setAttribute("stroke-width", "3");
        polyline.setAttribute("points", pointsStr);
        svg.appendChild(polyline);
    }

    // Render nodes data indicators and tooltips
    const tooltip = document.getElementById('chart-tooltip');
    
    points.forEach(p => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", p.x);
        circle.setAttribute("cy", p.y);
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "#ffffff");
        circle.setAttribute("stroke", "#4f46e5");
        circle.setAttribute("stroke-width", "2.5");
        circle.style.cursor = "pointer";

        // Dynamic Interactive Mouse tooltip listeners
        circle.addEventListener('mouseover', (e) => {
            circle.setAttribute("r", "8");
            circle.setAttribute("fill", "#4f46e5");
            tooltip.classList.remove('hidden');
            tooltip.style.left = `${e.clientX - 40}px`;
            tooltip.style.top = `${e.clientY - 60}px`;
            tooltip.textContent = `${p.date}: ${p.val}`;
        });

        circle.addEventListener('mouseout', () => {
            circle.setAttribute("r", "5");
            circle.setAttribute("fill", "#ffffff");
            tooltip.classList.add('hidden');
        });

        svg.appendChild(circle);
    });

    // Chart Text labels
    const textGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    textGroup.setAttribute("fill", "#6b7280");
    textGroup.setAttribute("font-size", "9");
    textGroup.setAttribute("font-family", "monospace");

    // Y Axis Max label
    const maxText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    maxText.setAttribute("x", "2");
    maxText.setAttribute("y", padding + 5);
    maxText.textContent = Math.round(maxVal);
    textGroup.appendChild(maxText);

    // Y Axis Min label
    const minText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    minText.setAttribute("x", "2");
    minText.setAttribute("y", height - padding);
    minText.textContent = Math.round(minVal);
    textGroup.appendChild(minText);

    // Chart Y Axis Category header title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", padding);
    titleText.setAttribute("y", padding - 10);
    titleText.setAttribute("font-weight", "bold");
    titleText.setAttribute("fill", "#4f46e5");
    titleText.textContent = labelY;
    textGroup.appendChild(titleText);

    svg.appendChild(textGroup);

    // Update active chart tabs classes visually
    const tabs = ['bp', 'pulse', 'glucose', 'temp'];
    tabs.forEach(t => {
        const tabEl = document.getElementById(`chart-tab-${t}`);
        if (t === type) {
            tabEl.className = "px-3 py-1 text-xs font-medium rounded-md bg-white text-indigo-600 shadow-sm transition";
        } else {
            tabEl.className = "px-3 py-1 text-xs font-medium rounded-md text-gray-600 hover:text-gray-800 transition";
        }
    });
}

// Master UI Update Renderer
function updateUI() {
    // 1. Top Emergency Banner flash state & Ambient alert badge update
    const banner = document.getElementById('flash-emergency-banner');
    
    const iotHeader = document.getElementById('ambient-alert-badge');
    if (state.iotMode === 'anomaly') {
        iotHeader.classList.remove('hidden');
    } else {
        iotHeader.classList.add('hidden');
    }

    if (state.isEmergency) {
        banner.classList.remove('hidden');
        document.getElementById('parent-status-badge').className = "flex items-center bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-300 emergency-pulsing";
        document.getElementById('parent-status-text').textContent = "CRITICAL EMERGENCY!";
        document.getElementById('parent-status-dot').className = "w-2.5 h-2.5 bg-red-600 rounded-full mr-2 animate-ping";

        if (state.emergencyLog.length > 0) {
            document.getElementById('sos-gps-text').textContent = state.emergencyLog[0].gps;
        }
    } else {
        banner.classList.add('hidden');
        document.getElementById('parent-status-badge').className = "flex items-center bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm transition-all duration-300";
        document.getElementById('parent-status-text').textContent = "Safe at Home";
        document.getElementById('parent-status-dot').className = "w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse";
    }

    // Last SOS alert timestamp updates
    document.getElementById('overview-last-sos-time').textContent = state.emergencyLog.length > 0 ? 
        `${state.emergencyLog[0].date} at ${state.emergencyLog[0].time}` : "Never";

    // 2. Daily Routines checklist rendering
    const routineListOverview = document.getElementById('overview-routine-list');
    const routineListMain = document.getElementById('scheduler-items-container');
    
    routineListOverview.innerHTML = '';
    routineListMain.innerHTML = '';

    // Calculate Completion rates
    const completedCount = state.routines.filter(r => r.completed).length;
    const totalCount = state.routines.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    document.getElementById('overview-routine-progress-pct').textContent = `${pct}%`;
    document.getElementById('overview-routine-progress-bar').style.width = `${pct}%`;

    // Populate Overview Tab Items (first 3)
    state.routines.slice(0, 3).forEach(r => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs";
        item.innerHTML = `
            <div class="flex items-center space-x-2">
                <span class="${r.completed ? 'text-green-600 line-through font-semibold' : 'text-gray-700'}">${r.time} - ${r.name}</span>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${r.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                ${r.completed ? 'Done' : 'Pending'}
            </span>
        `;
        routineListOverview.appendChild(item);
    });

    // Populate Scheduler Tab checklist (Complete dynamic list)
    state.routines.forEach(r => {
        const item = document.createElement('div');
        item.className = `flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border transition-all ${r.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'}`;
        
        let categoryEmoji = '💡';
        if (r.category === 'medication') categoryEmoji = '💊';
        else if (r.category === 'therapy') categoryEmoji = '🏃';

        item.innerHTML = `
            <div class="space-y-1">
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-semibold ${r.completed ? 'text-green-900 line-through' : 'text-gray-900'}">${categoryEmoji} ${r.name}</span>
                    <span class="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full">${r.time}</span>
                </div>
                <p class="text-xs text-gray-500">${r.dosage}</p>
            </div>
            <div class="mt-3 sm:mt-0 flex items-center space-x-3 justify-end">
                ${r.completed ? `
                    <span class="text-xs font-semibold text-green-700">✓ Taken at ${r.completedTime}</span>
                    <button onclick="toggleRoutineComplete(${r.id})" class="text-xs text-gray-400 hover:text-gray-600 underline">Undo</button>
                ` : `
                    <button onclick="toggleRoutineComplete(${r.id})" class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs shadow-sm transition">
                        Mark Taken
                    </button>
                `}
            </div>
        `;
        routineListMain.appendChild(item);
    });

    // History of completion list populate
    const checkinLog = document.getElementById('scheduler-history-log');
    checkinLog.innerHTML = '';
    const completedItems = state.routines.filter(r => r.completed);
    if (completedItems.length === 0) {
        checkinLog.innerHTML = `<p class="text-xs text-gray-400 italic">No check-ins logged for today yet.</p>`;
    } else {
        completedItems.forEach(r => {
            const row = document.createElement('div');
            row.className = "flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100 text-xs";
            row.innerHTML = `
                <span class="text-gray-700">Task "${r.name}" confirmed taken</span>
                <span class="font-mono text-gray-400 text-[10px]">${r.completedTime}</span>
            `;
            checkinLog.appendChild(row);
        });
    }

    // 3. Vitals History update in table & Overview
    const vitalsTbody = document.getElementById('vitals-history-tbody');
    vitalsTbody.innerHTML = '';
    
    if (state.vitals.length === 0) {
        vitalsTbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-xs text-gray-400">No logs found.</td></tr>`;
    } else {
        state.vitals.forEach((v, index) => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 border-b border-gray-100";
            tr.innerHTML = `
                <td class="py-3 font-semibold text-gray-800">${v.date}</td>
                <td class="py-3">${v.systolic}/${v.diastolic} <span class="text-xs text-gray-400">mmHg</span></td>
                <td class="py-3">${v.pulse} <span class="text-xs text-gray-400">bpm</span></td>
                <td class="py-3">${v.glucose} <span class="text-xs text-gray-400">mg/dL</span></td>
                <td class="py-3">${v.temp} <span class="text-xs text-gray-400">°C</span></td>
                <td class="py-3">
                    <button onclick="deleteVital(${index})" class="text-xs text-red-500 hover:text-red-700 hover:underline">Delete</button>
                </td>
            `;
            vitalsTbody.appendChild(tr);
        });

        // Set latest stats in Overview
        const latest = state.vitals[state.vitals.length - 1];
        document.getElementById('ov-vital-bp').textContent = `${latest.systolic}/${latest.diastolic}`;
        document.getElementById('ov-vital-pulse').textContent = latest.pulse;
        document.getElementById('ov-vital-glucose').textContent = latest.glucose;
        document.getElementById('ov-vital-temp').textContent = latest.temp;
    }

    // 4. Shared Care team workspace Calendar items list render
    const calendarContainer = document.getElementById('careteam-calendar-container');
    calendarContainer.innerHTML = '';
    if (state.careEvents.length === 0) {
        calendarContainer.innerHTML = `<p class="text-xs text-gray-400 italic">No scheduled appointments inside care circle.</p>`;
    } else {
        state.careEvents.forEach(ev => {
            const item = document.createElement('div');
            item.className = "flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs";
            
            let catBadge = 'bg-blue-100 text-blue-700';
            if (ev.category === 'Grocery') catBadge = 'bg-amber-100 text-amber-700';
            else if (ev.category === 'Visit') catBadge = 'bg-green-100 text-green-700';

            item.innerHTML = `
                <div class="space-y-0.5">
                    <p class="font-bold text-gray-800">${ev.name}</p>
                    <p class="text-gray-400">Assigned: <span class="font-semibold text-gray-600">${ev.assignee}</span></p>
                </div>
                <div class="text-right">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${catBadge} block mb-1">${ev.category}</span>
                    <span class="font-mono text-gray-500 text-[10px] block">${ev.date}</span>
                </div>
            `;
            calendarContainer.appendChild(item);
        });
    }

    // Care team Notes discussion forum updates
    const notesList = document.getElementById('careteam-notes-list');
    notesList.innerHTML = '';
    
    if (state.careNotes.length === 0) {
        notesList.innerHTML = `<p class="text-xs text-gray-400 italic">No wellness discussion logs recorded yet.</p>`;
    } else {
        state.careNotes.forEach(n => {
            const item = document.createElement('div');
            item.className = "p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1";
            
            const timeObj = new Date(n.timestamp);
            const dateStr = timeObj.toLocaleDateString() + ' ' + timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="flex justify-between items-center text-xs">
                    <span class="font-bold text-indigo-700">${n.author}</span>
                    <span class="font-mono text-gray-400 text-[10px]">${dateStr}</span>
                </div>
                <p class="text-xs text-gray-700 leading-relaxed">${n.text}</p>
            `;
            notesList.appendChild(item);
        });
    }

    // 5. Medical Vault document grid display
    const vaultGrid = document.getElementById('vault-grid');
    const searchVal = document.getElementById('vault-search').value.toLowerCase();
    vaultGrid.innerHTML = '';

    const filteredDocs = state.vaultDocs.filter(d => d.title.toLowerCase().includes(searchVal));

    if (filteredDocs.length === 0) {
        vaultGrid.innerHTML = `<p class="col-span-3 text-center text-xs text-gray-400 py-6">No matching prescriptions or files located.</p>`;
    } else {
        filteredDocs.forEach(d => {
            const item = document.createElement('div');
            item.className = "bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl p-4 flex flex-col justify-between transition h-36 cursor-pointer shadow-sm";
            
            let emoji = '📄';
            if (d.category === 'Lab Report') emoji = '🧪';
            else if (d.category === 'Insurance') emoji = '💳';

            item.innerHTML = `
                <div class="space-y-1">
                    <div class="flex items-center space-x-1.5 text-xs text-indigo-600 font-bold uppercase tracking-wider">
                        <span>${emoji}</span>
                        <span>${d.category}</span>
                    </div>
                    <h4 class="font-bold text-gray-800 text-sm line-clamp-2">${d.title}</h4>
                </div>
                <div class="flex justify-between items-center text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                    <span>${d.size}</span>
                    <span>${d.date}</span>
                </div>
            `;
            
            // Preview card alerts on click
            item.addEventListener('click', () => {
                alert(`Decrypted Record: "${d.title}"\nCategory: ${d.category}\nUploaded on: ${d.date}\nSecure Vault status: Encrypted (Local persistent simulation)`);
            });

            vaultGrid.appendChild(item);
        });
    }

    // 6. Geofence Alerts & Coordinates update
    const distanceText = document.getElementById('ov-geofence-status');
    const coordsText = document.getElementById('ov-geofence-coords');
    const radiusText = document.getElementById('geofence-radius-val');
    
    radiusText.textContent = `${state.geofence.radius} meters`;
    coordsText.textContent = `Parent Coordinates: x:${state.geofence.parentX}, y:${state.geofence.parentY}`;

    // Compute range warning distance
    const cx = 200;
    const cy = 150;
    const x = state.geofence.parentX;
    const y = state.geofence.parentY;
    const distance = Math.round(Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2)));

    if (distance > state.geofence.radius) {
        distanceText.textContent = `ALERT: Wandering! ${distance}m from home (Safe limit: ${state.geofence.radius}m)`;
        distanceText.className = "text-sm font-bold text-red-600 animate-pulse";
    } else if (distance >= state.geofence.radius - 30) {
        distanceText.textContent = `WARNING: Near boundary (${distance}m from home)`;
        distanceText.className = "text-sm font-bold text-yellow-600";
    } else {
        distanceText.textContent = `Safe inside bounds (${distance}m from home)`;
        distanceText.className = "text-sm font-semibold text-green-600";
    }

    // Geofencing detailed list rendering
    const geoLog = document.getElementById('geofence-alert-log');
    geoLog.innerHTML = '';
    state.geofence.logs.forEach(l => {
        const row = document.createElement('div');
        row.className = "flex justify-between border-b border-gray-50 pb-1 text-[11px] leading-tight";
        row.innerHTML = `
            <span class="text-gray-700">${l.event}</span>
            <span class="font-mono text-gray-400">${l.time}</span>
        `;
        geoLog.appendChild(row);
    });

    // 7. Global Activity log timeline at bottom of dashboard
    const timeline = document.getElementById('overview-log-timeline');
    timeline.innerHTML = '';

    // Merge logs from routines, vitals, geofence, and emergencies for a unified live stream
    let masterEvents = [];

    // emergency SOS events
    state.emergencyLog.forEach(l => {
        masterEvents.push({
            time: l.time,
            type: 'sos',
            text: `🚨 SOS panic trigger logged: ${l.details} GPS: ${l.gps}`
        });
    });

    // routines completions
    state.routines.filter(r => r.completed).forEach(r => {
        masterEvents.push({
            time: r.completedTime,
            type: 'routine',
            text: `✓ Checked in Daily Routine: "${r.name}" successfully marked done.`
        });
    });

    // vital additions
    state.vitals.slice(-3).forEach(v => {
        masterEvents.push({
            time: "Today",
            type: 'vital',
            text: `🩺 Vitals recorded: Blood Pressure ${v.systolic}/${v.diastolic} mmHg, Heart Rate ${v.pulse} bpm.`
        });
    });

    // geofence wandering alerts
    state.geofence.logs.slice(0, 3).forEach(g => {
        masterEvents.push({
            time: g.time,
            type: 'geofence',
            text: g.event
        });
    });

    if (masterEvents.length === 0) {
        timeline.innerHTML = `<p class="text-xs text-gray-400 italic">No activity logged today yet.</p>`;
    } else {
        masterEvents.slice(0, 10).forEach(ev => {
            const row = document.createElement('div');
            row.className = "flex items-start space-x-3 text-xs leading-normal p-2.5 rounded-lg bg-gray-50 border border-gray-100";
            
            let colorDot = 'bg-blue-500';
            if (ev.type === 'sos') colorDot = 'bg-red-600 animate-ping';
            else if (ev.type === 'routine') colorDot = 'bg-green-500';
            else if (ev.type === 'vital') colorDot = 'bg-indigo-500';
            else if (ev.type === 'geofence') colorDot = 'bg-yellow-500 animate-pulse';

            row.innerHTML = `
                <span class="w-2 h-2 rounded-full ${colorDot} mt-1.5 shrink-0"></span>
                <div class="flex-grow flex justify-between items-start">
                    <span class="text-gray-700">${ev.text}</span>
                    <span class="font-mono text-[9px] text-gray-400 shrink-0 ml-4">${ev.time}</span>
                </div>
            `;
            timeline.appendChild(row);
        });
    }

    // Sidebar side ambient statistics updates
    document.getElementById('side-ambient-temp').textContent = state.iotMode === 'anomaly' ? "20.1 °C" : "22.5 °C";
    document.getElementById('side-ambient-light').textContent = state.iotMode === 'anomaly' ? "15 lx (Dark)" : "350 lx";
    document.getElementById('side-ambient-activity').textContent = state.iotMode === 'anomaly' ? "Inactive Warning" : "Active";
    document.getElementById('side-ambient-activity').className = state.iotMode === 'anomaly' ? "text-red-500 font-bold" : "text-green-600 font-semibold";

    // Wearable connection rows + manual sync status
    renderWearables();
}

// Bind standard search updates inside records archive
document.getElementById('vault-search').addEventListener('input', updateUI);

// Trigger application startup
init();

// Expose functions globally for dynamic HTML event handlers and testing
if (typeof window !== 'undefined') {
    window.state = state;
    window.switchTab = switchTab;
    window.setViewMode = setViewMode;
    window.triggerEmergency = triggerEmergency;
    window.resolveEmergency = resolveEmergency;
    window.toggleRoutineComplete = toggleRoutineComplete;
    window.deleteVital = deleteVital;
    window.toggleWearableConnection = toggleWearableConnection;
    window.syncWearables = syncWearables;
    window.renderWearables = renderWearables;
    window.WEARABLE_PROVIDERS = WEARABLE_PROVIDERS;
    window.renderVitalsChart = renderVitalsChart;
    window.setIoTMode = setIoTMode;
    window.initMemoryGame = initMemoryGame;
    window.handleMemoryFlip = handleMemoryFlip;
    window.triggerVoiceCommandSim = triggerVoiceCommandSim;
    window.toggleVoiceDictation = toggleVoiceDictation;
    window.stopVoiceDictation = stopVoiceDictation;
    window.updateUI = updateUI;
    window.toggleNav = toggleNav;
    window.openNav = openNav;
    window.closeNav = closeNav;
    window.renderSetupForms = renderSetupForms;
    window.renderEmergencyNumbers = renderEmergencyNumbers;
    window.detectEmergencyLocation = detectEmergencyLocation;
    window.getEmergencyNumbers = getEmergencyNumbers;
    window.hydrateFromDatabase = hydrateFromDatabase;
    window.EMERGENCY_NUMBERS = EMERGENCY_NUMBERS;
}
