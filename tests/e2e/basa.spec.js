// @ts-check
const { test, expect } = require("@playwright/test");
const path = require("path");

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
    await page.click("button[data-tab='scheduler']");
    await expect(page.locator("#panel-scheduler")).toBeVisible();
    await expect(page.locator("#panel-overview")).toBeHidden();

    // Click Vitals tab
    await page.click("button[data-tab='vitals']");
    await expect(page.locator("#panel-vitals")).toBeVisible();
    
    // Verify SVG trend line is rendering
    await expect(page.locator("#vitals-svg-canvas")).toBeVisible();

    // Click Care Team Hub tab
    await page.click("button[data-tab='careteam']");
    await expect(page.locator("#panel-careteam")).toBeVisible();

    // Click Medical Vault tab
    await page.click("button[data-tab='vault']");
    await expect(page.locator("#panel-vault")).toBeVisible();

    // Click Geofence Alerts tab
    await page.click("button[data-tab='geofence']");
    await expect(page.locator("#panel-geofence")).toBeVisible();

    // Click Wellness & Voice tab
    await page.click("button[data-tab='wellness']");
    await expect(page.locator("#panel-wellness")).toBeVisible();
  });

  test("Medication routines checklist updates completion progress bars", async ({ page }) => {
    // Navigate to medication scheduler
    await page.click("button[data-tab='scheduler']");

    // Check progress on dashboard overview (0% initial or from seed)
    await page.click("button[data-tab='overview']");
    const progressText = await page.locator("#overview-routine-progress-pct").textContent();

    // Navigate back to scheduler and mark the first routine completed
    await page.click("button[data-tab='scheduler']");
    
    // Click "Mark Taken" on first routine
    const markTakenBtn = page.locator("text=Mark Taken").first();
    await markTakenBtn.click();

    // Check that success check is shown
    await expect(page.locator("text=✓ Taken at").first()).toBeVisible();

    // Go back to overview and check progress bar update
    await page.click("button[data-tab='overview']");
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
    await page.click("button[data-tab='vitals']");

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
    await page.click("button[data-tab='careteam']");

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
    await page.click("button[data-tab='vault']");

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
    await page.click("button[data-tab='geofence']");

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
    await page.click("button[data-tab='wellness']");

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
    await page.click("button[data-tab='wellness']");

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
    await page.click("button[data-tab='wellness']");

    // Fill command field
    await page.fill("#voice-input", "took my pills");
    await page.click("#btn-voice-mic");

    // Output visual feed logs successful voice parsing
    const feed = page.locator("#voice-output-feed");
    await expect(feed).toContainText("Success: Marked");
  });

});
