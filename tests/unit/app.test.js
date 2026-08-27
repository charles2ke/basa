const fs = require('fs');
const path = require('path');

describe('Basa Dashboard Unit Tests', () => {
  beforeEach(() => {
    // Clear Jest module cache
    jest.resetModules();

    // 1. Setup DOM from index.html
    const htmlPath = path.resolve(__dirname, '../../index.html');
    const htmlText = fs.readFileSync(htmlPath, 'utf8');
    document.documentElement.innerHTML = htmlText;

    // 2. Clear localStorage and window properties to ensure 100% test isolation
    window.localStorage.clear();
    const props = [
      'state', 'switchTab', 'setViewMode', 'triggerEmergency', 
      'resolveEmergency', 'toggleRoutineComplete', 'deleteVital', 
      'renderVitalsChart', 'setIoTMode', 'initMemoryGame', 
      'handleMemoryFlip', 'triggerVoiceCommandSim', 'updateUI',
      'toggleWearableConnection', 'syncWearables', 'renderWearables'
    ];
    props.forEach(prop => {
      delete window[prop];
    });

    // 3. Mock unsupported browser APIs in JSDOM
    window.scrollTo = jest.fn();
    window.alert = jest.fn();
    
    // Mock files property on HTMLInputElement
    Object.defineProperty(HTMLInputElement.prototype, 'files', {
      get: function() { return this._files || []; },
      set: function(val) { this._files = val; },
      configurable: true
    });

    // Mock AudioContext
    const mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      type: 'sawtooth',
      frequency: { setValueAtTime: jest.fn() },
    };

    const mockGainNode = {
      connect: jest.fn(),
      gain: { setValueAtTime: jest.fn() },
    };

    const mockAudioContext = jest.fn().mockImplementation(() => ({
      createOscillator: jest.fn().mockReturnValue(mockOscillator),
      createGain: jest.fn().mockReturnValue(mockGainNode),
      destination: {},
      currentTime: 0,
    }));

    window.AudioContext = mockAudioContext;
    window.webkitAudioContext = mockAudioContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test('initial state and DOM elements loaded correctly', () => {
    require('../../app.js');

    expect(window.state).toBeDefined();
    expect(window.state.viewMode).toBe('child');
    expect(window.state.activeTab).toBe('overview');
    expect(document.getElementById('parent-status-text').textContent).toContain('Safe at Home');
    expect(document.getElementById('btn-quick-sos')).not.toBeNull();
  });

  test('loads state from localStorage if available', () => {
    const customRoutines = [{ id: 99, name: "Test Medication", time: "09:00", category: "medication", dosage: "1 pill", completed: false }];
    const customVitals = [{ date: "2026-08-22", systolic: 120, diastolic: 80, pulse: 70, glucose: 90, temp: 36.6 }];
    const customEvents = [{ id: 99, name: "Test Event", assignee: "Charles", date: "2026-08-27", category: "Medical" }];
    const customNotes = [{ id: 99, author: "Charles", timestamp: "2026-08-26T10:15:00.000Z", text: "Test Note" }];
    const customDocs = [{ id: 99, title: "Test Doc", category: "Prescription", size: "1.0 MB", date: "2026-08-16" }];
    const customGeoLogs = [{ time: "12:00", event: "Custom Geo Log" }];

    window.localStorage.setItem('basa_routines', JSON.stringify(customRoutines));
    window.localStorage.setItem('basa_vitals', JSON.stringify(customVitals));
    window.localStorage.setItem('basa_careEvents', JSON.stringify(customEvents));
    window.localStorage.setItem('basa_careNotes', JSON.stringify(customNotes));
    window.localStorage.setItem('basa_vaultDocs', JSON.stringify(customDocs));
    window.localStorage.setItem('basa_isEmergency', 'true');
    window.localStorage.setItem('basa_emergencyLog', JSON.stringify([{ time: "10:00", date: "2026-08-26", gps: "Custom GPS", details: "Panic" }]));
    window.localStorage.setItem('basa_geofence_radius', '150');
    window.localStorage.setItem('basa_parentX', '220');
    window.localStorage.setItem('basa_parentY', '160');
    window.localStorage.setItem('basa_geofence_logs', JSON.stringify(customGeoLogs));
    window.localStorage.setItem('basa_viewMode', 'parent');
    window.localStorage.setItem('basa_iotMode', 'anomaly');

    // Run app.js to reload state from populated localStorage
    require('../../app.js');

    expect(window.state.routines[0].id).toBe(99);
    expect(window.state.vitals[0].systolic).toBe(120);
    expect(window.state.careEvents[0].id).toBe(99);
    expect(window.state.careNotes[0].id).toBe(99);
    expect(window.state.vaultDocs[0].id).toBe(99);
    expect(window.state.isEmergency).toBe(true);
    expect(window.state.geofence.radius).toBe(150);
    expect(window.state.geofence.parentX).toBe(220);
    expect(window.state.geofence.parentY).toBe(160);
    expect(window.state.geofence.logs[0].event).toBe("Custom Geo Log");
    expect(window.state.viewMode).toBe('parent');
    expect(window.state.iotMode).toBe('anomaly');
  });

  test('tab switching logic works', () => {
    require('../../app.js');

    // Switch via button click
    const schedulerBtn = document.querySelector('.tab-btn[data-tab="scheduler"]');
    schedulerBtn.click();
    expect(window.state.activeTab).toBe('scheduler');
    expect(document.getElementById('panel-scheduler').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('panel-overview').classList.contains('hidden')).toBe(true);

    // Switch to vitals triggers chart render
    const vitalsBtn = document.querySelector('.tab-btn[data-tab="vitals"]');
    vitalsBtn.click();
    expect(window.state.activeTab).toBe('vitals');
    expect(document.getElementById('vitals-svg-canvas').innerHTML).not.toBe('');

    // Call switchTab with non-existent tab to test false branch
    window.switchTab('nonexistent');
    expect(window.state.activeTab).toBe('nonexistent');
  });

  test('view mode setting changes classes and visibility', () => {
    require('../../app.js');

    // Switch to parent view
    document.getElementById('btn-view-parent').click();
    expect(window.state.viewMode).toBe('parent');
    expect(document.body.classList.contains('parent-mode')).toBe(true);
    expect(document.getElementById('parent-view-banner').classList.contains('hidden')).toBe(false);

    // Switch back to child view
    document.getElementById('btn-view-child').click();
    expect(window.state.viewMode).toBe('child');
    expect(document.body.classList.contains('parent-mode')).toBe(false);
    expect(document.getElementById('parent-view-banner').classList.contains('hidden')).toBe(true);

    // Switch to child view using back button
    document.getElementById('btn-view-parent').click();
    document.getElementById('btn-back-to-child').click();
    expect(window.state.viewMode).toBe('child');
  });

  test('emergency triggering and resolving', () => {
    require('../../app.js');

    // Trigger SOS via quick SOS
    document.getElementById('btn-quick-sos').click();
    expect(window.state.isEmergency).toBe(true);
    expect(document.getElementById('flash-emergency-banner').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('parent-status-text').textContent).toContain('CRITICAL EMERGENCY!');

    // Resolve SOS
    document.getElementById('btn-resolve-sos').click();
    expect(window.state.isEmergency).toBe(false);
    expect(document.getElementById('flash-emergency-banner').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('parent-status-text').textContent).toContain('Safe at Home');

    // Trigger SOS via dashboard SOS
    document.getElementById('btn-dashboard-sos').click();
    expect(window.state.isEmergency).toBe(true);
  });

  test('playEmergencyBeep handles unsupported AudioContext gracefully', () => {
    const originalAudioContext = window.AudioContext;
    const originalWebkitAudioContext = window.webkitAudioContext;
    delete window.AudioContext;
    delete window.webkitAudioContext;

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    require('../../app.js');

    // Trigger SOS which plays emergency beep
    window.triggerEmergency();
    
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("AudioContext block"));
    warnSpy.mockRestore();

    window.AudioContext = originalAudioContext;
    window.webkitAudioContext = originalWebkitAudioContext;
  });

  test('adding a routine works successfully', () => {
    require('../../app.js');

    document.getElementById('routine-name').value = 'Test Routine';
    document.getElementById('routine-time').value = '10:00';
    document.getElementById('routine-category').value = 'therapy';
    document.getElementById('routine-dosage').value = 'Test routine details';

    const form = document.getElementById('routine-form');
    form.dispatchEvent(new Event('submit'));

    const routines = window.state.routines;
    const added = routines.find(r => r.name === 'Test Routine');
    expect(added).toBeDefined();
    expect(added.category).toBe('therapy');
    expect(added.dosage).toBe('Test routine details');
  });

  test('toggling routine completion', () => {
    require('../../app.js');

    const initialRoutine = window.state.routines[0];
    expect(initialRoutine.completed).toBe(false);

    // Complete routine
    window.toggleRoutineComplete(initialRoutine.id);
    expect(initialRoutine.completed).toBe(true);
    expect(initialRoutine.completedTime).toBeDefined();

    // Undo completion
    window.toggleRoutineComplete(initialRoutine.id);
    expect(initialRoutine.completed).toBe(false);
  });

  test('adding and deleting vitals logs', () => {
    require('../../app.js');

    document.getElementById('vital-systolic').value = '130';
    document.getElementById('vital-diastolic').value = '85';
    document.getElementById('vital-pulse').value = '75';
    document.getElementById('vital-glucose').value = '100';
    document.getElementById('vital-temp').value = '36.8';

    const form = document.getElementById('vitals-form');
    form.dispatchEvent(new Event('submit'));

    const vitals = window.state.vitals;
    expect(vitals.length).toBeGreaterThan(0);
    const added = vitals[vitals.length - 1];
    expect(added.systolic).toBe(130);
    expect(added.glucose).toBe(100);

    // Delete vitals log
    const initialLength = vitals.length;
    window.deleteVital(initialLength - 1);
    expect(window.state.vitals.length).toBe(initialLength - 1);
  });

  test('adding care events (appointments)', () => {
    require('../../app.js');

    document.getElementById('event-name').value = 'Clinic Visit';
    document.getElementById('event-assignee').value = 'Emma (Professional Caregiver)';
    document.getElementById('event-date').value = '2026-08-30';
    document.getElementById('event-category').value = 'Visit';

    const form = document.getElementById('careteam-event-form');
    form.dispatchEvent(new Event('submit'));

    const events = window.state.careEvents;
    const added = events.find(e => e.name === 'Clinic Visit');
    expect(added).toBeDefined();
    expect(added.category).toBe('Visit');
  });

  test('adding caregiver notes', () => {
    require('../../app.js');

    document.getElementById('note-text').value = 'Everything went fine today';

    const form = document.getElementById('careteam-note-form');
    form.dispatchEvent(new Event('submit'));

    const notes = window.state.careNotes;
    expect(notes[0].text).toBe('Everything went fine today');
  });

  test('medical vault file select and upload', () => {
    require('../../app.js');

    const fileInput = document.getElementById('vault-file-input');
    const label = document.getElementById('vault-file-label');

    // Trigger change with no file
    fileInput.dispatchEvent(new Event('change'));
    expect(label.textContent).toBe('Click to select record (PDF/Img)');

    // Trigger change with a mocked file
    const file = new File(['hello'], 'clinical_report.pdf', { type: 'application/pdf' });
    fileInput.files = [file];
    fileInput.dispatchEvent(new Event('change'));
    expect(label.textContent).toBe('clinical_report.pdf');

    // Submit upload form
    document.getElementById('vault-title').value = 'Cardiac Report';
    document.getElementById('vault-category').value = 'Lab Report';

    const form = document.getElementById('vault-upload-form');
    form.dispatchEvent(new Event('submit'));

    const docs = window.state.vaultDocs;
    const added = docs.find(d => d.title === 'Cardiac Report');
    expect(added).toBeDefined();
    expect(added.category).toBe('Lab Report');
  });

  test('medical vault search filter functionality', () => {
    require('../../app.js');

    const searchInput = document.getElementById('vault-search');
    
    // Initial length of vault items
    const vaultGrid = document.getElementById('vault-grid');
    expect(vaultGrid.innerHTML).toContain('Amlodipine Cardiologist Prescription');
    expect(vaultGrid.innerHTML).toContain('Full Bio-lipid Blood Report');

    // Set search query and trigger input event
    searchInput.value = 'Amlodipine';
    searchInput.dispatchEvent(new Event('input'));

    expect(vaultGrid.innerHTML).toContain('Amlodipine Cardiologist Prescription');
    expect(vaultGrid.innerHTML).not.toContain('Full Bio-lipid Blood Report');
  });

  test('geofencing config radius change slider', () => {
    require('../../app.js');

    const slider = document.getElementById('geofence-radius-slider');
    slider.value = 250;
    slider.dispatchEvent(new Event('input'));

    expect(window.state.geofence.radius).toBe(250);
    expect(document.getElementById('geofence-radius-val').textContent).toBe('250 meters');
  });

  test('geofencing wandering simulation coordinates', () => {
    require('../../app.js');

    // Move inside range
    document.getElementById('btn-geo-inside').click();
    expect(window.state.geofence.parentX).toBe(200);
    expect(window.state.geofence.parentY).toBe(150);
    expect(document.getElementById('ov-geofence-status').textContent).toContain('Safe inside bounds');

    // Move near boundary
    document.getElementById('btn-geo-near').click();
    expect(document.getElementById('ov-geofence-status').textContent).toContain('Near boundary');

    // Move outside range (Wandering alert)
    document.getElementById('btn-geo-outside').click();
    expect(document.getElementById('ov-geofence-status').textContent).toContain('ALERT: Wandering!');
    expect(window.state.isEmergency).toBe(true);
  });

  test('IoT anomaly vs normal modes config', () => {
    require('../../app.js');

    // Switch to anomaly mode
    document.getElementById('btn-iot-anomaly').click();
    expect(window.state.iotMode).toBe('anomaly');
    expect(document.getElementById('ambient-alert-badge').classList.contains('hidden')).toBe(false);

    // Switch to normal mode
    document.getElementById('btn-iot-normal').click();
    expect(window.state.iotMode).toBe('normal');
    expect(document.getElementById('ambient-alert-badge').classList.contains('hidden')).toBe(true);
  });

  test('Voice simulation mic input command parser', () => {
    require('../../app.js');

    const input = document.getElementById('voice-input');

    // 1. Empty command
    input.value = '';
    window.triggerVoiceCommandSim();

    // 2. Command "took my pills"
    // Set first routine incomplete
    window.state.routines[0].completed = false;
    input.value = 'took my pills';
    window.triggerVoiceCommandSim();
    expect(window.state.routines[0].completed).toBe(true);

    // Test when all are already completed
    window.state.routines.forEach(r => r.completed = true);
    input.value = 'took my pills';
    window.triggerVoiceCommandSim();
    expect(document.getElementById('voice-output-feed').textContent).toContain('All medication schedule items already marked done');

    // 3. Command "emergency"
    input.value = 'emergency panic';
    window.triggerVoiceCommandSim();
    expect(window.state.isEmergency).toBe(true);

    // 4. Command "log glucose 115"
    input.value = 'log glucose 115';
    window.triggerVoiceCommandSim();
    expect(window.state.vitals[window.state.vitals.length - 1].glucose).toBe(115);

    // 5. Command "log glucose" with invalid syntax
    input.value = 'log glucose high';
    window.triggerVoiceCommandSim();
    expect(document.getElementById('voice-output-feed').textContent).toContain('Syntax error');

    // 6. Command "home check" / "sensor"
    input.value = 'home sensor check';
    window.triggerVoiceCommandSim();
    expect(document.getElementById('voice-output-feed').textContent).toContain('Ambient Smart Telemetry');

    // 7. Unrecognized command
    input.value = 'say hello to my friends';
    window.triggerVoiceCommandSim();
    expect(document.getElementById('voice-output-feed').textContent).toContain('not recognized');

    // 8. Keypress 'Enter' triggers simulation
    input.value = 'emergency';
    const enterEvent = new KeyboardEvent('keypress', { key: 'Enter' });
    input.dispatchEvent(enterEvent);
    expect(window.state.isEmergency).toBe(true);

    // Any other key doesn't trigger
    input.value = 'no trigger';
    const otherKey = new KeyboardEvent('keypress', { key: 'A' });
    input.dispatchEvent(otherKey);
    expect(input.value).toBe('no trigger');
  });

  test('Microphone button live transcribes speech into the command input', () => {
    let instance = null;
    class FakeRecognition {
      constructor() { instance = this; this.started = false; }
      start() { this.started = true; if (this.onstart) this.onstart(); }
      stop() { this.started = false; if (this.onend) this.onend(); }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;

    require('../../app.js');

    const mic = document.getElementById('btn-voice-mic');
    const input = document.getElementById('voice-input');
    const status = document.getElementById('voice-mic-status');

    mic.click();
    expect(instance.started).toBe(true);
    expect(mic.getAttribute('aria-pressed')).toBe('true');
    expect(status.textContent).toContain('Listening');

    // Interim result streams into the input as live text
    instance.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'took my' }], { isFinal: false })]
    });
    expect(input.value).toBe('took my');

    // Final result is retained and executed once the microphone stops
    instance.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'took my pills' }], { isFinal: true })]
    });
    expect(input.value).toBe('took my pills');

    window.state.routines[0].completed = false;
    mic.click();
    expect(mic.getAttribute('aria-pressed')).toBe('false');
    expect(window.state.routines[0].completed).toBe(true);
    expect(input.value).toBe('');
  });

  test('Microphone reports recognition errors and falls back without the API', () => {
    let instance = null;
    class FakeRecognition {
      constructor() { instance = this; }
      start() { if (this.onstart) this.onstart(); }
      stop() { if (this.onend) this.onend(); }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;

    require('../../app.js');

    const mic = document.getElementById('btn-voice-mic');
    const status = document.getElementById('voice-mic-status');

    mic.click();
    instance.onerror({ error: 'not-allowed' });
    expect(status.textContent).toContain('Microphone permission denied');
    expect(mic.getAttribute('aria-pressed')).toBe('false');

    // Without the Web Speech API the typed command is executed instead
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    document.getElementById('voice-input').value = 'emergency panic';
    mic.click();
    expect(status.textContent).toContain('not supported');
    expect(window.state.isEmergency).toBe(true);
  });

  test('Emergency numbers render as dialable tel links', () => {
    require('../../app.js');

    window.state.emergency = { countryCode: 'NP', label: 'Nepal', source: 'manual', detectedAt: null };
    window.renderEmergencyNumbers();

    const cards = document.querySelectorAll('#emergency-numbers-grid a');
    expect(cards.length).toBe(4);
    expect(cards[0].getAttribute('href')).toBe('tel:100');
    expect(cards[0].getAttribute('aria-label')).toBe('Call Police on 100');
    expect(cards[0].textContent).toContain('Tap to call');
    expect(document.getElementById('sos-local-number').getAttribute('href')).toBe('tel:112');
  });

  test('Wellness memory game focus puzzles matching and victory logic', () => {    jest.useFakeTimers();
    require('../../app.js');

    // Click cards to test flipping
    const cards = window.state.game.cards;
    expect(cards.length).toBe(12);

    // Flip first card
    const firstCardId = cards[0].id;
    window.handleMemoryFlip(firstCardId);
    expect(cards[0].flipped).toBe(true);

    // Try flipping the same card again (should do nothing)
    window.handleMemoryFlip(firstCardId);
    expect(window.state.game.flipped.length).toBe(1);

    // Find a non-matching card to flip
    const secondCard = cards.find(c => c.emoji !== cards[0].emoji);
    window.handleMemoryFlip(secondCard.id);
    expect(window.state.game.flipped.length).toBe(2);

    // Fast-forward timeout to flip back non-matching
    jest.advanceTimersByTime(1000);
    expect(cards[0].flipped).toBe(false);
    expect(secondCard.flipped).toBe(false);
    expect(window.state.game.flipped.length).toBe(0);

    // Now test a matching flip
    const matchCard = cards.find(c => c.emoji === cards[0].emoji && c.id !== cards[0].id);
    window.handleMemoryFlip(firstCardId);
    window.handleMemoryFlip(matchCard.id);
    expect(cards[0].matched).toBe(true);
    expect(matchCard.matched).toBe(true);
    expect(window.state.game.matches).toBe(1);

    // Reset game
    document.getElementById('btn-reset-game').click();
    expect(window.state.game.matches).toBe(0);

    // Auto-solve the game to trigger victory condition
    // For each pair, flip them
    const freshCards = window.state.game.cards;
    const emojiMap = {};
    freshCards.forEach(c => {
      if (!emojiMap[c.emoji]) {
        emojiMap[c.emoji] = [];
      }
      emojiMap[c.emoji].push(c);
    });

    Object.values(emojiMap).forEach(([cardA, cardB]) => {
      window.handleMemoryFlip(cardA.id);
      window.handleMemoryFlip(cardB.id);
    });

    expect(window.state.game.matches).toBe(6);
    // Fast-forward alert timeout
    jest.advanceTimersByTime(500);
    expect(window.alert).toHaveBeenCalled();
  });

  test('vitals trend SVG rendering for different types and empty state', () => {
    require('../../app.js');

    // Clear vitals to test empty state
    window.state.vitals = [];
    window.renderVitalsChart('bp');
    expect(document.getElementById('vitals-svg-canvas').innerHTML).toContain('No vitals entries logged yet.');

    // Add multiple entries to draw chart lines properly
    window.state.vitals = [
      { date: "2026-08-22", systolic: 120, diastolic: 80, pulse: 70, glucose: 90, temp: 36.5 },
      { date: "2026-08-23", systolic: 125, diastolic: 82, pulse: 72, glucose: 95, temp: 36.6 },
    ];

    // BP chart
    window.renderVitalsChart('bp');
    expect(document.getElementById('vitals-svg-canvas').innerHTML).toContain('mmHg (Systolic)');

    // Pulse chart
    window.renderVitalsChart('pulse');
    expect(document.getElementById('vitals-svg-canvas').innerHTML).toContain('Heart Rate (bpm)');

    // Glucose chart
    window.renderVitalsChart('glucose');
    expect(document.getElementById('vitals-svg-canvas').innerHTML).toContain('Glucose (mg/dL)');

    // Temp chart
    window.renderVitalsChart('temp');
    expect(document.getElementById('vitals-svg-canvas').innerHTML).toContain('Temperature (°C)');

    // Verify SVG circles interactive tooltips
    const circles = document.querySelectorAll('#vitals-svg-canvas circle');
    expect(circles.length).toBe(2);

    const firstCircle = circles[0];
    const tooltip = document.getElementById('chart-tooltip');

    // mouseover
    firstCircle.dispatchEvent(new Event('mouseover'));
    expect(firstCircle.getAttribute('r')).toBe('8');
    expect(tooltip.classList.contains('hidden')).toBe(false);

    // mouseout
    firstCircle.dispatchEvent(new Event('mouseout'));
    expect(firstCircle.getAttribute('r')).toBe('5');
    expect(tooltip.classList.contains('hidden')).toBe(true);
  });

  test('coverage extension tests for empty states and edge cases', () => {
    require('../../app.js');

    // 1. Shift vitals when more than 10 records are added
    window.state.vitals = [];
    for (let i = 0; i < 10; i++) {
      window.state.vitals.push({
        date: `2026-08-${10 + i}`,
        systolic: 120,
        diastolic: 80,
        pulse: 72,
        glucose: 100,
        temp: 36.6
      });
    }
    // Now trigger form submit to add 11th vital
    document.getElementById('vital-systolic').value = '130';
    document.getElementById('vital-diastolic').value = '85';
    document.getElementById('vital-pulse').value = '75';
    document.getElementById('vital-glucose').value = '105';
    document.getElementById('vital-temp').value = '36.8';
    document.getElementById('vitals-form').dispatchEvent(new Event('submit'));
    // The length should still be 10, meaning state.vitals.shift() was executed (line 360 covered)
    expect(window.state.vitals.length).toBe(10);

    // 2. Clear vitals and verify "No logs found." is rendered in history table (line 1090 covered)
    window.state.vitals = [];
    window.updateUI();
    expect(document.getElementById('vitals-history-tbody').textContent).toContain('No logs found.');

    // 3. Clear careEvents and check calendarContainer (line 1120 covered)
    window.state.careEvents = [];
    window.updateUI();
    expect(document.getElementById('careteam-calendar-container').textContent).toContain('No scheduled appointments inside care circle.');

    // 4. Clear careNotes and check notesList (line 1149 covered)
    window.state.careNotes = [];
    window.updateUI();
    expect(document.getElementById('careteam-notes-list').textContent).toContain('No wellness discussion logs recorded yet.');

    // 5. Clear vaultDocs and search for a non-existent document to show "No matching prescriptions or files located." (line 1177 covered)
    window.state.vaultDocs = [];
    document.getElementById('vault-search').value = 'unknownfile';
    window.updateUI();
    expect(document.getElementById('vault-grid').textContent).toContain('No matching prescriptions or files located.');

    // 6. Test secure vault decryption preview clicking (line 1203 covered) and Insurance category (line 1185)
    window.state.vaultDocs = [
      { id: 1, title: "Test Doc", category: "Prescription", size: "1 MB", date: "2026-08-26" },
      { id: 2, title: "Insurance Doc", category: "Insurance", size: "2 MB", date: "2026-08-26" }
    ];
    document.getElementById('vault-search').value = '';
    window.updateUI();
    const vaultCards = document.querySelectorAll('#vault-grid > div');
    expect(vaultCards.length).toBe(2);
    vaultCards[0].dispatchEvent(new Event('click'));
    expect(window.alert).toHaveBeenCalled();

    // 7. Non-existent routine toggle
    window.toggleRoutineComplete(9999);

    // 8. Add caregiver note in parent mode (line 414 covered)
    window.state.viewMode = 'parent';
    document.getElementById('note-text').value = 'Parent notes';
    document.getElementById('careteam-note-form').dispatchEvent(new Event('submit'));
    expect(window.state.careNotes[0].author).toBe('Self (Parent)');

    // 9. Timeline with geofence log color dot (line 1303)
    window.state.geofence.logs = [{ time: '12:00', event: '🚨 Wandered outside safe perimeter zone!' }];
    window.updateUI();
    expect(document.getElementById('overview-log-timeline').innerHTML).toContain('bg-yellow-500 animate-pulse');

    // 10. Clear everything and check if the activity feed timeline is empty (line 1293 covered)
    window.state.vitals = [];
    window.state.emergencyLog = [];
    window.state.routines = [];
    window.state.geofence.logs = [];
    window.state.careNotes = [];
    window.updateUI();
    expect(document.getElementById('overview-log-timeline').textContent).toContain('No activity logged today yet.');
  });

  test('hamburger menu opens, closes and hides the navigation drawer', () => {
    require('../../app.js');

    const hamburger = document.getElementById('btn-hamburger');
    const overlay = document.getElementById('nav-overlay');

    // Drawer starts closed
    expect(document.body.classList.contains('nav-open')).toBe(false);
    expect(overlay.classList.contains('hidden')).toBe(true);
    expect(hamburger.getAttribute('aria-expanded')).toBe('false');

    // Opening via the hamburger button
    hamburger.dispatchEvent(new Event('click'));
    expect(document.body.classList.contains('nav-open')).toBe(true);
    expect(overlay.classList.contains('hidden')).toBe(false);
    expect(hamburger.getAttribute('aria-expanded')).toBe('true');

    // Toggling closes it again
    hamburger.dispatchEvent(new Event('click'));
    expect(document.body.classList.contains('nav-open')).toBe(false);

    // Overlay click closes the drawer
    window.openNav();
    overlay.dispatchEvent(new Event('click'));
    expect(document.body.classList.contains('nav-open')).toBe(false);

    // Dedicated close button
    window.openNav();
    document.getElementById('btn-close-nav').dispatchEvent(new Event('click'));
    expect(document.body.classList.contains('nav-open')).toBe(false);

    // Escape key closes the drawer, other keys do not
    window.openNav();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
    expect(document.body.classList.contains('nav-open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.body.classList.contains('nav-open')).toBe(false);

    // Selecting a navigation entry closes the drawer and switches panels
    window.openNav();
    document.querySelector("button[data-tab='vault']").dispatchEvent(new Event('click'));
    expect(window.state.activeTab).toBe('vault');
    expect(document.body.classList.contains('nav-open')).toBe(false);
  });

  test('parent setup page saves, persists and re-renders the profile', () => {
    require('../../app.js');

    expect(document.getElementById('setup-parent-summary').textContent).toContain('No parent profile saved yet');

    document.getElementById('parent-name').value = 'Ram Shrestha';
    document.getElementById('parent-dob').value = '1948-04-12';
    document.getElementById('parent-phone').value = '+977 9800000000';
    document.getElementById('parent-blood').value = 'O+';
    document.getElementById('parent-address').value = 'Basa House, Kathmandu';
    document.getElementById('parent-conditions').value = 'Hypertension';
    document.getElementById('parent-allergies').value = 'Penicillin';
    document.getElementById('parent-doctor').value = 'Dr. Roberts';
    document.getElementById('parent-doctor-phone').value = '+977 14000000';
    document.getElementById('parent-large-text').checked = true;
    document.getElementById('setup-parent-form').dispatchEvent(new Event('submit'));

    expect(window.state.parentProfile.name).toBe('Ram Shrestha');
    expect(window.state.parentProfile.largeText).toBe(true);
    // Large text preference switches the dashboard into the parent view
    expect(window.state.viewMode).toBe('parent');
    expect(document.body.classList.contains('parent-mode')).toBe(true);

    const summary = document.getElementById('setup-parent-summary').textContent;
    expect(summary).toContain('Ram Shrestha');
    expect(summary).toContain('Dr. Roberts');

    // Persisted into the storage layer
    expect(JSON.parse(window.localStorage.getItem('basa_parentProfile')).address).toBe('Basa House, Kathmandu');
  });

  test('parent setup summary handles partially filled profiles', () => {
    window.localStorage.setItem('basa_parentProfile', JSON.stringify({ name: 'Solo Parent' }));
    require('../../app.js');

    const summary = document.getElementById('setup-parent-summary').textContent;
    expect(summary).toContain('Solo Parent');
    expect(summary).toContain('None recorded');
    expect(summary).toContain('Disabled');
    expect(document.getElementById('parent-large-text').checked).toBe(false);
  });

  test('child setup page saves caregiver details and alert preferences', () => {
    require('../../app.js');

    expect(document.getElementById('setup-child-summary').textContent).toContain('No caregiver profile saved yet');

    document.getElementById('child-name').value = 'Charles';
    document.getElementById('child-relationship').value = 'Daughter';
    document.getElementById('child-email').value = 'charles@example.com';
    document.getElementById('child-phone').value = '+1 555 0100';
    document.getElementById('child-backup-name').value = 'Emma';
    document.getElementById('child-backup-phone').value = '+1 555 0111';
    document.getElementById('child-alert-geofence').checked = false;
    document.getElementById('setup-child-form').dispatchEvent(new Event('submit'));

    expect(window.state.childProfile.name).toBe('Charles');
    expect(window.state.childProfile.relationship).toBe('Daughter');
    expect(window.state.childProfile.alerts).toEqual({ sos: true, geofence: false, medication: true });

    const summary = document.getElementById('setup-child-summary').textContent;
    expect(summary).toContain('Charles');
    expect(summary).toContain('Emma');
    expect(summary).toContain('Off');

    // Reloading the app restores the saved values into the form
    jest.resetModules();
    require('../../app.js');
    expect(document.getElementById('child-name').value).toBe('Charles');
    expect(document.getElementById('child-alert-geofence').checked).toBe(false);
  });

  test('child setup summary falls back gracefully with missing contacts', () => {
    window.localStorage.setItem('basa_childProfile', JSON.stringify({ name: 'Sam', alerts: { sos: false } }));
    require('../../app.js');

    const summary = document.getElementById('setup-child-summary').textContent;
    expect(summary).toContain('Sam');
    expect(summary).toContain('Not set');
    expect(document.getElementById('child-alert-sos').checked).toBe(false);
  });

  test('more than one parent profile can be added, switched and removed', () => {
    require('../../app.js');

    expect(document.getElementById('setup-parent-list').textContent).toContain('No parents added yet');

    document.getElementById('parent-name').value = 'Ram Shrestha';
    document.getElementById('parent-phone').value = '+977 9800000000';
    document.getElementById('setup-parent-form').dispatchEvent(new Event('submit'));

    // Adding a second parent starts from a blank form
    document.getElementById('btn-add-parent').dispatchEvent(new Event('click'));
    expect(document.getElementById('parent-name').value).toBe('');

    document.getElementById('parent-name').value = 'Sita Shrestha';
    document.getElementById('setup-parent-form').dispatchEvent(new Event('submit'));

    expect(window.state.parentProfiles.map(p => p.name)).toEqual(['Ram Shrestha', 'Sita Shrestha']);
    expect(window.state.parentProfile.name).toBe('Sita Shrestha');
    const list = document.getElementById('setup-parent-list').textContent;
    expect(list).toContain('Ram Shrestha');
    expect(list).toContain('Sita Shrestha');

    // Both profiles survive a reload
    jest.resetModules();
    require('../../app.js');
    expect(window.state.parentProfiles).toHaveLength(2);
    expect(document.getElementById('parent-name').value).toBe('Sita Shrestha');

    // Switching back re-populates the form with the first parent
    window.selectParentProfile(0);
    expect(document.getElementById('parent-name').value).toBe('Ram Shrestha');
    expect(window.state.parentProfile.name).toBe('Ram Shrestha');

    window.removeParentProfile(0);
    expect(window.state.parentProfiles.map(p => p.name)).toEqual(['Sita Shrestha']);
    expect(window.state.parentProfile.name).toBe('Sita Shrestha');
  });

  test('more than one caregiver profile can be added, switched and removed', () => {
    require('../../app.js');

    expect(document.getElementById('setup-child-list').textContent).toContain('No caregivers added yet');

    document.getElementById('child-name').value = 'Charles';
    document.getElementById('setup-child-form').dispatchEvent(new Event('submit'));

    document.getElementById('btn-add-child').dispatchEvent(new Event('click'));
    expect(document.getElementById('child-name').value).toBe('');
    expect(document.getElementById('child-alert-sos').checked).toBe(true);

    document.getElementById('child-name').value = 'Emma';
    document.getElementById('child-relationship').value = 'Professional Caregiver';
    document.getElementById('setup-child-form').dispatchEvent(new Event('submit'));

    expect(window.state.childProfiles.map(c => c.name)).toEqual(['Charles', 'Emma']);
    expect(window.state.childProfile.relationship).toBe('Professional Caregiver');

    jest.resetModules();
    require('../../app.js');
    expect(window.state.childProfiles).toHaveLength(2);

    window.selectChildProfile(0);
    expect(document.getElementById('child-name').value).toBe('Charles');

    window.removeChildProfile(1);
    expect(window.state.childProfiles.map(c => c.name)).toEqual(['Charles']);
    expect(window.state.childProfile.name).toBe('Charles');
  });

  test('legacy single profiles are migrated into the profile lists', () => {
    window.localStorage.setItem('basa_parentProfile', JSON.stringify({ name: 'Solo Parent' }));
    window.localStorage.setItem('basa_childProfile', JSON.stringify({ name: 'Solo Child' }));
    require('../../app.js');

    expect(window.state.parentProfiles.map(p => p.name)).toEqual(['Solo Parent']);
    expect(window.state.childProfiles.map(c => c.name)).toEqual(['Solo Child']);
    expect(window.state.parentProfile.name).toBe('Solo Parent');
  });

  test('emergency numbers fall back to the international line without IP lookup', () => {
    require('../../app.js');

    // JSDOM has no fetch, so the fallback entry is used
    expect(window.state.emergency.countryCode).toBe('DEFAULT');
    expect(window.getEmergencyNumbers().general).toBe('112');
    expect(document.getElementById('emergency-numbers-grid').textContent).toContain('112');
    expect(document.getElementById('emergency-numbers-note').textContent).toContain('IP location unavailable');
    expect(document.getElementById('sos-local-number').textContent).toBe('112');

    // Country dropdown is populated from the offline directory
    const select = document.getElementById('emergency-country-select');
    expect(select.options.length).toBe(Object.keys(window.EMERGENCY_NUMBERS).length);
  });

  test('emergency numbers resolve from the IP location lookup', async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country_code: 'np', city: 'Kathmandu', country_name: 'Nepal' })
    });

    require('../../app.js');
    await window.detectEmergencyLocation(true);

    expect(window.fetch).toHaveBeenCalledWith('https://ipapi.co/json/', expect.any(Object));
    expect(window.state.emergency.countryCode).toBe('NP');
    expect(window.state.emergency.source).toBe('ip');
    expect(document.getElementById('emergency-location').textContent).toBe('Kathmandu, Nepal');
    expect(document.getElementById('emergency-numbers-grid').textContent).toContain('102');
    expect(document.getElementById('emergency-numbers-note').textContent).toContain('Detected from your IP address');
    expect(document.getElementById('sos-local-number').textContent).toBe('112');

    delete window.fetch;
  });

  test('emergency numbers handle failed and rejected IP lookups', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    require('../../app.js');

    await window.detectEmergencyLocation(true);
    expect(window.state.emergency.countryCode).toBe('DEFAULT');
    expect(window.state.emergency.source).toBe('fallback');

    window.fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await window.detectEmergencyLocation(true);
    expect(window.state.emergency.countryCode).toBe('DEFAULT');

    // Unknown country codes also fall back to the international entry
    window.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ country_code: 'ZZ' }) });
    await window.detectEmergencyLocation(true);
    expect(window.state.emergency.countryCode).toBe('DEFAULT');

    delete window.fetch;
  });

  test('manual country override wins over IP detection', async () => {
    window.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ country_code: 'US', city: 'Austin', country_name: 'United States' })
    });
    require('../../app.js');

    const select = document.getElementById('emergency-country-select');
    select.value = 'JP';
    select.dispatchEvent(new Event('change'));

    expect(window.state.emergency.countryCode).toBe('JP');
    expect(window.state.emergency.source).toBe('manual');
    expect(document.getElementById('emergency-location').textContent).toBe('Japan');
    expect(document.getElementById('emergency-numbers-note').textContent).toContain('selected manually');

    // A non-forced detection keeps the manual choice
    await window.detectEmergencyLocation(false);
    expect(window.state.emergency.countryCode).toBe('JP');

    // A forced detection overrides it again
    await window.detectEmergencyLocation(true);
    expect(window.state.emergency.countryCode).toBe('US');

    delete window.fetch;
  });

  test('state hydrates asynchronously from the NoSQL database when available', async () => {
    const stored = {
      routines: [{ id: 7, name: 'DB Routine', time: '09:00', category: 'medication', dosage: '1 pill', completed: false }],
      viewMode: 'parent',
      geofence_radius: 175
    };

    window.BasaDB = {
      isAvailable: () => true,
      engine: () => 'PouchDB (IndexedDB)',
      get: (key, fallback) => {
        const raw = window.localStorage.getItem(`basa_${key}`);
        if (raw === null) return fallback;
        try {
          const parsed = JSON.parse(raw);
          return parsed === null ? fallback : parsed;
        } catch (err) {
          return fallback;
        }
      },
      getString: (key, fallback) => {
        const raw = window.localStorage.getItem(`basa_${key}`);
        if (raw === null) return fallback;
        try {
          const parsed = JSON.parse(raw);
          return typeof parsed === 'string' ? parsed : raw;
        } catch (err) {
          return raw;
        }
      },
      set: jest.fn((key, value) => window.localStorage.setItem(`basa_${key}`, JSON.stringify(value))),
      setString: jest.fn((key, value) => window.localStorage.setItem(`basa_${key}`, String(value))),
      hydrate: jest.fn(() => {
        Object.keys(stored).forEach((key) => {
          window.localStorage.setItem(`basa_${key}`, JSON.stringify(stored[key]));
        });
        return Promise.resolve(stored);
      })
    };

    require('../../app.js');
    await window.hydrateFromDatabase();

    expect(window.BasaDB.hydrate).toHaveBeenCalled();
    expect(window.state.routines[0].name).toBe('DB Routine');
    expect(window.state.viewMode).toBe('parent');
    expect(window.state.geofence.radius).toBe(175);
    expect(document.getElementById('geofence-radius-val').textContent).toBe('175 meters');
    expect(document.getElementById('side-storage-engine').textContent).toContain('PouchDB');
    expect(window.BasaDB.set).toHaveBeenCalled();

    delete window.BasaDB;
  });

  test('an empty NoSQL database is seeded with the current state', async () => {
    window.BasaDB = {
      isAvailable: () => true,
      engine: () => 'PouchDB (IndexedDB)',
      get: (key, fallback) => fallback,
      getString: (key, fallback) => fallback,
      set: jest.fn(),
      setString: jest.fn(),
      hydrate: jest.fn(() => Promise.resolve({}))
    };

    require('../../app.js');
    const hydrated = await window.hydrateFromDatabase();

    expect(hydrated).toBe(false);
    expect(window.BasaDB.set).toHaveBeenCalledWith('routines', expect.any(Array));

    delete window.BasaDB;
  });

  test('hydration is skipped when the NoSQL engine is unavailable', async () => {
    require('../../app.js');
    await expect(window.hydrateFromDatabase()).resolves.toBe(false);
  });

  test('wearable providers connect, persist and disconnect', () => {
    require('../../app.js');

    // All three providers are rendered and start disconnected
    expect(document.getElementById('btn-wearable-googlefit').textContent).toContain('Connect');
    expect(document.getElementById('btn-wearable-garmin')).not.toBeNull();
    expect(document.getElementById('btn-wearable-whoop')).not.toBeNull();
    expect(window.state.wearables.providers.googlefit.connected).toBe(false);

    document.getElementById('btn-wearable-googlefit').click();
    expect(window.state.wearables.providers.googlefit.connected).toBe(true);
    expect(document.getElementById('btn-wearable-googlefit').textContent).toContain('Disconnect');
    expect(JSON.parse(window.localStorage.getItem('basa_wearables')).providers.googlefit.connected).toBe(true);

    // Toggling again disconnects and clears the sync stamp
    document.getElementById('btn-wearable-googlefit').click();
    expect(window.state.wearables.providers.googlefit.connected).toBe(false);
    expect(window.state.wearables.providers.googlefit.lastSync).toBeNull();

    // Unknown providers are ignored
    expect(window.toggleWearableConnection('fitbit')).toBeUndefined();
  });

  test('manual sync requires at least one connected wearable', () => {
    require('../../app.js');

    expect(window.syncWearables()).toBe(0);
    expect(document.getElementById('wearables-sync-status').textContent).toContain('Connect Google Fit');
  });

  test('manual sync pulls vitals from every connected wearable', () => {
    require('../../app.js');

    window.toggleWearableConnection('garmin');
    window.toggleWearableConnection('whoop');

    const before = window.state.vitals.length;
    expect(window.syncWearables()).toBe(2);

    const today = new Date().toISOString().split('T')[0];
    const entry = window.state.vitals.find(v => v.date === today);
    expect(entry).toBeDefined();
    expect(entry.source).toContain('Garmin');
    expect(entry.source).toContain('Whoop');
    expect(entry.pulse).toBeGreaterThan(0);
    expect(entry.temp).toBeGreaterThan(30);
    expect(window.state.vitals.length).toBeGreaterThanOrEqual(before);
    expect(window.state.wearables.lastSync).not.toBeNull();
    expect(window.state.wearables.providers.garmin.lastSync).not.toBeNull();
    expect(window.state.careNotes[0].text).toContain('Synced');
    expect(document.getElementById('wearables-sync-status').textContent).toContain('2 source(s) connected');
  });

  test('manual sync button creates a new dated entry when today has no log', () => {
    window.localStorage.setItem('basa_vitals', JSON.stringify([]));
    require('../../app.js');

    window.toggleWearableConnection('googlefit');
    document.getElementById('btn-wearables-sync').click();

    expect(window.state.vitals.length).toBe(1);
    expect(window.state.vitals[0].glucose).toBeGreaterThan(0);
    expect(document.getElementById('wearable-status-googlefit').textContent).toContain('last sync');
  });

  test('stored wearable connections are restored on load', () => {
    window.localStorage.setItem('basa_wearables', JSON.stringify({
      providers: { whoop: { connected: true, connectedAt: '2026-08-25T10:00:00.000Z', lastSync: 'not-a-date' } },
      lastSync: '2026-08-25T10:05:00.000Z'
    }));
    require('../../app.js');

    expect(window.state.wearables.providers.whoop.connected).toBe(true);
    expect(window.state.wearables.providers.googlefit.connected).toBe(false);
    // Unparseable timestamps degrade gracefully
    expect(document.getElementById('wearable-status-whoop').textContent).toContain('never');
  });

  test('corrupted stored values fall back to the seed data', () => {
    window.localStorage.setItem('basa_routines', '{not json');
    require('../../app.js');
    expect(window.state.routines.length).toBe(3);
  });
});
