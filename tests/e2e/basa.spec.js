// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");

/** The main navigation now lives behind the hamburger menu. */
async function openTab(page, tab) {
  await page.click("#btn-hamburger");
  await page.click(`button[data-tab='${tab}']`);
  await expect(page.locator(`#panel-${tab}`)).toBeVisible();
}

test.describe("basa - Parent Care & Safety Hub E2E Tests", () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the index.html file directly through the served port 8080
    await page.goto("/");
  });

  test("App title and basic dashboard layout load successfully", async ({ page }) => {
    // Check main title
    await expect(page).toHaveTitle(/basa - Home & Parent Care Dashboard/);
    
    // Check initial parent status is Safe
    const statusText = page.locator("#parent-status-text");
    await expect(statusText).toContainText("Safe at Home");

    // Check quick SOS button exists
    const sosBtn = page.locator("#btn-quick-sos");
    await expect(sosBtn).toBeVisible();
  });

  test("View switching toggles large accessibility scaling styles", async ({ page }) => {
    const body = page.locator("body");
    
    // Switch to Parent View (Large accessibility mode)
    await page.click("#btn-view-parent");
    await expect(body).toHaveClass(/parent-mode/);
    await expect(page.locator("#parent-view-banner")).toBeVisible();

    // Switch back to Child View
    await page.click("#btn-view-child");
    await expect(body).not.toHaveClass(/parent-mode/);
    await expect(page.locator("#parent-view-banner")).toBeHidden();
  });

  test("Navigation switching renders tab panels correctly", async ({ page }) => {
    // Click Medication scheduler tab
    await openTab(page, "scheduler");
    await expect(page.locator("#panel-scheduler")).toBeVisible();
    await expect(page.locator("#panel-overview")).toBeHidden();

    // Click Vitals tab
    await openTab(page, "vitals");
    await expect(page.locator("#panel-vitals")).toBeVisible();
    
    // Verify SVG trend line is rendering
    await expect(page.locator("#vitals-svg-canvas")).toBeVisible();

    // Click Care Team Hub tab
    await openTab(page, "careteam");
    await expect(page.locator("#panel-careteam")).toBeVisible();

    // Click Medical Vault tab
    await openTab(page, "vault");
    await expect(page.locator("#panel-vault")).toBeVisible();

    // Click Geofence Alerts tab
    await openTab(page, "geofence");
    await expect(page.locator("#panel-geofence")).toBeVisible();

    // Click Wellness & Voice tab
    await openTab(page, "wellness");
    await expect(page.locator("#panel-wellness")).toBeVisible();
  });

  test("Medication routines checklist updates completion progress bars", async ({ page }) => {
    // Navigate to medication scheduler
    await openTab(page, "scheduler");

    // Check progress on dashboard overview (0% initial or from seed)
    await openTab(page, "overview");
    const progressText = await page.locator("#overview-routine-progress-pct").textContent();

    // Navigate back to scheduler and mark the first routine completed
    await openTab(page, "scheduler");
    
    // Click "Mark Taken" on first routine
    const markTakenBtn = page.locator("text=Mark Taken").first();
    await markTakenBtn.click();

    // Check that success check is shown
    await expect(page.locator("text=✓ Taken at").first()).toBeVisible();

    // Go back to overview and check progress bar update
    await openTab(page, "overview");
    const progressTextUpdated = await page.locator("#overview-routine-progress-pct").textContent();
    
    // Verify progress value increased
    expect(parseInt(progressTextUpdated || "0")).toBeGreaterThan(parseInt(progressText || "0"));
  });

  test("SOS panic protocols trigger flashing critical alerts & resolve safely", async ({ page }) => {
    // Click the Header SOS button
    await page.click("#btn-quick-sos");

    // Check emergency warning flashes visible
    const emergencyBanner = page.locator("#flash-emergency-banner");
    await expect(emergencyBanner).toBeVisible();
    await expect(emergencyBanner).toContainText("EMERGENCY ACTIVATED!");

    // Verify parent status dot is pulsing alert
    const statusText = page.locator("#parent-status-text");
    await expect(statusText).toContainText("CRITICAL EMERGENCY!");

    // Resolve the emergency
    await page.click("#btn-resolve-sos");
    
    // Verify status returns to safe
    await expect(emergencyBanner).toBeHidden();
    await expect(statusText).toContainText("Safe at Home");
  });

  test("Vitals logging updates SVG trends visual nodes & logs in tables", async ({ page }) => {
    await openTab(page, "vitals");

    // Count rows initially in history table
    const initialRows = await page.locator("#vitals-history-tbody tr").count();

    // Fill in vitals logging form
    await page.fill("#vital-systolic", "135");
    await page.fill("#vital-diastolic", "85");
    await page.fill("#vital-pulse", "78");
    await page.fill("#vital-glucose", "112");
    await page.fill("#vital-temp", "36.8");

    // Submit log
    await page.click("text=Save Vital Log");

    // Check history table updated
    const finalRows = await page.locator("#vitals-history-tbody tr").count();
    expect(finalRows).toBe(initialRows + 1);

    // Verify new row contains logged values
    const newRow = page.locator("#vitals-history-tbody tr").last();
    await expect(newRow).toContainText("135/85 mmHg");
    await expect(newRow).toContainText("78 bpm");
    await expect(newRow).toContainText("112 mg/dL");
    await expect(newRow).toContainText("36.8 °C");
  });

  test("Care team workspace coordinates shared appointments & live caregiver updates", async ({ page }) => {
    await openTab(page, "careteam");

    // Count comments/notes in caregiver thread
    const initialNotesCount = await page.locator("#careteam-notes-list > div").count();

    // Post a caregiver note update
    await page.fill("#note-text", "Verified that Dad had breakfast and his morning medication is taken.");
    await page.click("button[type='submit']:has-text('Post')");

    // Check notes list updated
    const finalNotesCount = await page.locator("#careteam-notes-list > div").count();
    expect(finalNotesCount).toBe(initialNotesCount + 1);
    await expect(page.locator("#careteam-notes-list > div").first()).toContainText("Verified that Dad had breakfast");
  });

  test("Medical Vault processes mock document archiving search categorization", async ({ page }) => {
    await openTab(page, "vault");

    // Fill file upload details
    await page.fill("#vault-title", "Cardiology Clinic Report Nov 2026");
    await page.selectOption("#vault-category", "Lab Report");
    
    // Trigger mock encryption upload
    await page.click("text=Upload & Encrypt File");

    // Check record is listed inside archive grid
    const vaultGrid = page.locator("#vault-grid");
    await expect(vaultGrid).toContainText("Cardiology Clinic Report Nov 2026");

    // Search filter check
    await page.fill("#vault-search", "Cardiology");
    await expect(vaultGrid).toContainText("Cardiology Clinic Report Nov 2026");
    await expect(vaultGrid).not.toContainText("Full Bio-lipid Blood Report");
  });

  test("Geofencing limits configure dynamically & wandering simulations trigger automatic alerts", async ({ page }) => {
    await openTab(page, "geofence");

    // Geofencing sliders render
    const slider = page.locator("#geofence-radius-slider");
    await expect(slider).toBeVisible();

    // Trigger parent inside boundary (safe)
    await page.click("#btn-geo-inside");
    await expect(page.locator("#ov-geofence-status")).toContainText("Safe inside bounds");
    await expect(page.locator("#map-warn-overlay")).toBeHidden();

    // Simulate wandering outside safe geofence radius
    await page.click("#btn-geo-outside");
    
    // Check visual alert map overlay flashing
    await expect(page.locator("#map-warn-overlay")).toBeVisible();
    await expect(page.locator("#ov-geofence-status")).toContainText("ALERT: Wandering!");
    
    // Emergency global banner automatically raised
    await expect(page.locator("#flash-emergency-banner")).toBeVisible();
  });

  test("Wellness match games execute focus memory match puzzles", async ({ page }) => {
    await openTab(page, "wellness");

    // Brain training card board grid renders 12 cells
    const gameGrid = page.locator("#memory-game-grid");
    await expect(gameGrid).toBeVisible();
    const cardsCount = await page.locator("#memory-game-grid > div").count();
    expect(cardsCount).toBe(12);

    // Click the first card
    const firstCard = page.locator("#memory-game-grid > div").first();
    await firstCard.click();
    await expect(firstCard).toHaveClass(/flipped/);
  });

  test("Ambient IoT simulator toggles normal vs anomaly telemetry alerts", async ({ page }) => {
    await openTab(page, "wellness");

    // Trigger normal active IoT telemetry
    await page.click("#btn-iot-normal");
    await expect(page.locator("#sensor-bathroom")).toContainText("Bathroom: Active");
    await expect(page.locator("#ambient-alert-badge")).toBeHidden();

    // Simulate inactivity anomaly fall risk
    await page.click("#btn-iot-anomaly");
    await expect(page.locator("#sensor-bathroom")).toContainText("Bathroom: INACTIVE");
    
    // Check indicator warning badges in top header
    await expect(page.locator("#ambient-alert-badge")).toBeVisible();
    await expect(page.locator("#ambient-alert-badge")).toContainText("No Activity Warning");
  });

  test("Voice commands parse routine updates successfully", async ({ page }) => {
    await openTab(page, "wellness");

    // Fill command field
    await page.fill("#voice-input", "took my pills");
    await page.click("#btn-voice-send");

    // Output visual feed logs successful voice parsing
    const feed = page.locator("#voice-output-feed");
    await expect(feed).toContainText("Success: Marked");
  });

  test("Microphone button live transcribes speech into the command box", async ({ page }) => {
    // Replace the Web Speech API with a stub that emits interim then final results
    await page.addInitScript(() => {
      class FakeRecognition {
        start() {
          setTimeout(() => {
            if (this.onstart) this.onstart();
            if (this.onresult) {
              this.onresult({
                resultIndex: 0,
                results: [Object.assign([{ transcript: "took my" }], { isFinal: false })]
              });
              this.onresult({
                resultIndex: 0,
                results: [Object.assign([{ transcript: "took my pills" }], { isFinal: true })]
              });
            }
          }, 10);
        }
        stop() {
          if (this.onend) this.onend();
        }
      }
      window.SpeechRecognition = FakeRecognition;
      window.webkitSpeechRecognition = FakeRecognition;
    });
    await page.goto("/");
    await openTab(page, "wellness");

    await page.click("#btn-voice-mic");

    // Live transcript lands in the input while listening
    await expect(page.locator("#voice-input")).toHaveValue("took my pills");
    await expect(page.locator("#voice-mic-status")).toContainText("Heard:");
    await expect(page.locator("#btn-voice-mic")).toHaveAttribute("aria-pressed", "true");

    // Stopping the microphone runs the transcribed command
    await page.click("#btn-voice-mic");
    await expect(page.locator("#voice-output-feed")).toContainText("took my pills");
    await expect(page.locator("#btn-voice-mic")).toHaveAttribute("aria-pressed", "false");
  });

  test("Main navigation is hidden behind the hamburger menu", async ({ page }) => {
    const sidebar = page.locator("#sidebar");
    const overlay = page.locator("#nav-overlay");

    // Navigation is closed on load
    await expect(sidebar).toBeHidden();
    await expect(overlay).toBeHidden();
    await expect(page.locator("#btn-hamburger")).toHaveAttribute("aria-expanded", "false");

    // Opening the drawer reveals every navigation entry
    await page.click("#btn-hamburger");
    await expect(sidebar).toBeVisible();
    await expect(overlay).toBeVisible();
    await expect(page.locator("#btn-hamburger")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("button[data-tab='overview']")).toBeVisible();

    // Selecting an entry navigates and closes the drawer
    await page.click("button[data-tab='vault']");
    await expect(page.locator("#panel-vault")).toBeVisible();
    await expect(sidebar).toBeHidden();

    // Backdrop click closes the drawer
    await page.click("#btn-hamburger");
    await expect(sidebar).toBeVisible();
    await page.click("#nav-overlay", { position: { x: 350, y: 300 } });
    await expect(sidebar).toBeHidden();

    // Escape key closes the drawer
    await page.click("#btn-hamburger");
    await expect(sidebar).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sidebar).toBeHidden();
  });

  test("Parent setup page stores the profile in the NoSQL database", async ({ page }) => {
    await openTab(page, "setup-parent");

    await page.fill("#parent-name", "Ram Bahadur Shrestha");
    await page.fill("#parent-dob", "1948-04-12");
    await page.fill("#parent-phone", "+977 9800000000");
    await page.selectOption("#parent-blood", "O+");
    await page.fill("#parent-address", "Basa House, Kathmandu");
    await page.fill("#parent-conditions", "Hypertension");
    await page.click("text=Save Parent Setup");

    const summary = page.locator("#setup-parent-summary");
    await expect(summary).toContainText("Ram Bahadur Shrestha");
    await expect(summary).toContainText("Basa House, Kathmandu");

    // The profile survives a reload, proving it was persisted
    await page.reload();
    await openTab(page, "setup-parent");
    await expect(page.locator("#parent-name")).toHaveValue("Ram Bahadur Shrestha");
    await expect(page.locator("#side-storage-engine")).toContainText("PouchDB");
  });

  test("Child setup page stores caregiver contacts and alert preferences", async ({ page }) => {
    await openTab(page, "setup-child");

    await page.fill("#child-name", "Charles");
    await page.selectOption("#child-relationship", "Son");
    await page.fill("#child-email", "charles@example.com");
    await page.fill("#child-phone", "+1 555 0100");
    await page.uncheck("#child-alert-medication");
    await page.click("text=Save Caregiver Setup");

    const summary = page.locator("#setup-child-summary");
    await expect(summary).toContainText("Charles");
    await expect(summary).toContainText("charles@example.com");

    await page.reload();
    await openTab(page, "setup-child");
    await expect(page.locator("#child-name")).toHaveValue("Charles");
    await expect(page.locator("#child-alert-medication")).not.toBeChecked();
  });

  test("Emergency numbers card resolves numbers for the detected location", async ({ page }) => {
    const grid = page.locator("#emergency-numbers-grid");
    await expect(grid).toContainText("Police");
    // Whole card is a tel: link so a tap opens the phone dialler on mobile
    const firstCard = grid.locator("a").first();
    await expect(firstCard).toHaveAttribute("href", /^tel:[0-9+*#]+$/);
    await expect(firstCard).toContainText("Tap to call");

    // Manual override updates the listed numbers immediately
    await page.selectOption("#emergency-country-select", "JP");
    await expect(page.locator("#emergency-location")).toHaveText("Japan");
    await expect(grid).toContainText("110");
    await expect(grid).toContainText("119");
    await expect(page.locator("#emergency-numbers-note")).toContainText("selected manually");

    // Choice is persisted across reloads
    await page.reload();
    await expect(page.locator("#emergency-country-select")).toHaveValue("JP");
  });

  test("Wearable connections and manual vitals sync", async ({ page }) => {
    await openTab(page, "vitals");

    const connectBtn = page.locator("#btn-wearable-garmin");
    await expect(connectBtn).toHaveText("Connect");
    await expect(page.locator("#wearables-sync-status")).toContainText("No wearable connected");

    // Manual sync without a connection prompts the user to connect first
    await page.click("#btn-wearables-sync");
    await expect(page.locator("#wearables-sync-status")).toContainText("Connect Google Fit");

    // Connect Garmin and Whoop, then sync manually
    await connectBtn.click();
    await expect(connectBtn).toHaveText("Disconnect");
    await page.click("#btn-wearable-whoop");

    await page.click("#btn-wearables-sync");
    await expect(page.locator("#wearables-sync-status")).toContainText("2 source(s) connected");
    await expect(page.locator("#wearable-status-garmin")).toContainText("last sync");
    await expect(page.locator("#vitals-history-tbody")).toContainText("bpm");

    // Connections survive a reload, and disconnecting works
    await page.reload();
    await openTab(page, "vitals");
    await expect(page.locator("#btn-wearable-garmin")).toHaveText("Disconnect");
    await page.click("#btn-wearable-garmin");
    await expect(page.locator("#wearable-status-garmin")).toContainText("Not connected");
  });

});
