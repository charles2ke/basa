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
    iotMode: 'normal' // 'normal' or 'anomaly'
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

// Initialize application state
function init() {
    // Load from localStorage or seed
    state.routines = JSON.parse(localStorage.getItem('basa_routines')) || seedRoutines;
    state.vitals = JSON.parse(localStorage.getItem('basa_vitals')) || seedVitals;
    state.careEvents = JSON.parse(localStorage.getItem('basa_careEvents')) || seedEvents;
    state.careNotes = JSON.parse(localStorage.getItem('basa_careNotes')) || seedNotes;
    state.vaultDocs = JSON.parse(localStorage.getItem('basa_vaultDocs')) || seedVaultDocs;
    state.isEmergency = JSON.parse(localStorage.getItem('basa_isEmergency')) || false;
    state.emergencyLog = JSON.parse(localStorage.getItem('basa_emergencyLog')) || [];
    state.geofence.radius = JSON.parse(localStorage.getItem('basa_geofence_radius')) || 100;
    state.geofence.parentX = JSON.parse(localStorage.getItem('basa_parentX')) || 200;
    state.geofence.parentY = JSON.parse(localStorage.getItem('basa_parentY')) || 150;
    state.geofence.logs = JSON.parse(localStorage.getItem('basa_geofence_logs')) || [
        { time: "17:00", event: "Parent status active. Coordinates aligned home." }
    ];
    state.viewMode = localStorage.getItem('basa_viewMode') || 'child';
    state.iotMode = localStorage.getItem('basa_iotMode') || 'normal';
    
    // Bind navigation tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
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

    // Voice simulationmic listener
    document.getElementById('btn-voice-mic').addEventListener('click', triggerVoiceCommandSim);
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

    // Apply initialized view configurations
    setViewMode(state.viewMode);
    switchTab('overview');
    checkGeofenceStatus(false); // Evaluate geofence immediately without writing log alerts
    updateUI();
    initMemoryGame();
}

// Save Current State to LocalStorage
function saveState() {
    localStorage.setItem('basa_routines', JSON.stringify(state.routines));
    localStorage.setItem('basa_vitals', JSON.stringify(state.vitals));
    localStorage.setItem('basa_careEvents', JSON.stringify(state.careEvents));
    localStorage.setItem('basa_careNotes', JSON.stringify(state.careNotes));
    localStorage.setItem('basa_vaultDocs', JSON.stringify(state.vaultDocs));
    localStorage.setItem('basa_isEmergency', JSON.stringify(state.isEmergency));
    localStorage.setItem('basa_emergencyLog', JSON.stringify(state.emergencyLog));
    localStorage.setItem('basa_geofence_radius', JSON.stringify(state.geofence.radius));
    localStorage.setItem('basa_parentX', JSON.stringify(state.geofence.parentX));
    localStorage.setItem('basa_parentY', JSON.stringify(state.geofence.parentY));
    localStorage.setItem('basa_geofence_logs', JSON.stringify(state.geofence.logs));
    localStorage.setItem('basa_viewMode', state.viewMode);
    localStorage.setItem('basa_iotMode', state.iotMode);
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
    feed.innerText = `>> ${inputEl.value}\n[Voice Engine] ${outputText}\n\n` + feed.innerText;
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
}

// Bind standard search updates inside records archive
document.getElementById('vault-search').addEventListener('input', updateUI);

// Trigger application startup
init();
