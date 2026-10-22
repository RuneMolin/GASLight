/**
 * ============================================================================
 * NGO CRM - UI CONTROLLER (UIController.ts)
 * ============================================================================
 * 
 * The Controller acts as the entry point for user interactions. In Google
 * Sheets, this means handling the "onOpen" trigger to create menus, and
 * handling the dialog prompts when users click menu items.
 * 
 * WHY THIS MATTERS:
 * - Google Apps Script requires trigger functions (like onOpen) and menu
 *   callbacks to be top-level functions.
 * - The controller handles UI input/output (alerts, prompts) and delegates
 *   all actual data processing to the Service layer.
 */

// Lazy getter for service layer instances to prevent Apps Script load-order ReferenceError
let _donorServiceInstance: DonorService | null = null;

function getDonorService(): DonorService {
  if (!_donorServiceInstance) {
    const donorRepository = new DonorRepository();
    _donorServiceInstance = new DonorService(donorRepository);
  }
  return _donorServiceInstance;
}

/**
 * Special Google Apps Script trigger executed automatically whenever the
 * spreadsheet is opened by a user with edit permissions.
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🌱 NGO CRM')
    .addItem('🚀 Initialize CRM Sheet', 'menuInitializeCRM')
    .addSeparator()
    .addItem('➕ Add New Donor', 'menuAddNewDonor')
    .addItem('💰 Record Donation', 'menuRecordDonation')
    .addSeparator()
    .addItem('📊 Show Donor Summary', 'menuShowSummary')
    .addToUi();
}

/**
 * Menu Callback: Sets up the "Donors" sheet and seed data.
 */
function menuInitializeCRM(): void {
  const ui = SpreadsheetApp.getUi();
  try {
    getDonorService().initializeCRM();
    ui.alert(
      'CRM Initialized',
      'The "Donors" sheet has been prepared and formatted with starter sample data.',
      ui.ButtonSet.OK
    );
  } catch (error: any) {
    ui.alert('Error Initializing CRM', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Menu Callback: Interactive prompt sequence to register a new donor.
 */
function menuAddNewDonor(): void {
  const ui = SpreadsheetApp.getUi();

  try {
    // Prompt 1: Full Name
    const nameResponse = ui.prompt('New Donor', 'Enter donor full name (or organization):', ui.ButtonSet.OK_CANCEL);
    if (nameResponse.getSelectedButton() !== ui.Button.OK) return;
    const fullName = nameResponse.getResponseText();

    // Prompt 2: Email
    const emailResponse = ui.prompt('New Donor', 'Enter donor email address:', ui.ButtonSet.OK_CANCEL);
    if (emailResponse.getSelectedButton() !== ui.Button.OK) return;
    const email = emailResponse.getResponseText();

    // Prompt 3: Phone (Optional)
    const phoneResponse = ui.prompt('New Donor', 'Enter phone number (optional):', ui.ButtonSet.OK_CANCEL);
    if (phoneResponse.getSelectedButton() !== ui.Button.OK) return;
    const phone = phoneResponse.getResponseText();

    // Prompt 4: Notes (Optional)
    const notesResponse = ui.prompt('New Donor', 'Notes / Program of interest (e.g., Clean Water):', ui.ButtonSet.OK_CANCEL);
    if (notesResponse.getSelectedButton() !== ui.Button.OK) return;
    const notes = notesResponse.getResponseText();

    // Register donor via service layer
    const newDonor = getDonorService().registerDonor({
      fullName,
      email,
      phone,
      category: 'Individual',
      notes
    });

    ui.alert(
      'Donor Registered',
      `Successfully registered ${newDonor.fullName} with ID: ${newDonor.id}.`,
      ui.ButtonSet.OK
    );
  } catch (error: any) {
    ui.alert('Failed to Add Donor', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Menu Callback: Records a financial donation for an existing donor.
 */
function menuRecordDonation(): void {
  const ui = SpreadsheetApp.getUi();

  try {
    // Prompt 1: Donor Identifier
    const idResponse = ui.prompt(
      'Record Donation',
      'Enter the Donor ID (e.g. DON-1001) or Email address:',
      ui.ButtonSet.OK_CANCEL
    );
    if (idResponse.getSelectedButton() !== ui.Button.OK) return;
    const identifier = idResponse.getResponseText();

    // Prompt 2: Donation Amount
    const amountResponse = ui.prompt('Record Donation', 'Enter donation amount in USD ($):', ui.ButtonSet.OK_CANCEL);
    if (amountResponse.getSelectedButton() !== ui.Button.OK) return;
    const amount = parseFloat(amountResponse.getResponseText());

    const result = getDonorService().logDonation(identifier, amount);

    ui.alert(
      'Donation Recorded',
      `Successfully added $${amount.toFixed(2)} to ${result.donor.fullName} (${result.donor.id}).\n` +
      `New Total Giving: $${result.newTotal.toFixed(2)}`,
      ui.ButtonSet.OK
    );
  } catch (error: any) {
    ui.alert('Failed to Record Donation', error.message, ui.ButtonSet.OK);
  }
}

/**
 * Menu Callback: Computes and displays dashboard analytics in a dialog box.
 */
function menuShowSummary(): void {
  const ui = SpreadsheetApp.getUi();

  try {
    const stats = getDonorService().getStatistics();

    const formattedTotal = `$${stats.totalFundsRaised.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const formattedAvg = `$${stats.averageDonation.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const message = [
      '📊 NGO CRM Donor Analytics',
      '────────────────────────────',
      `• Total Donors: ${stats.totalDonors}`,
      `• Active Donors: ${stats.activeDonors}`,
      `• Total Funds Raised: ${formattedTotal}`,
      `• Average per Donor: ${formattedAvg}`
    ].join('\n');

    ui.alert('Summary Report', message, ui.ButtonSet.OK);
  } catch (error: any) {
    ui.alert('Error Generating Summary', error.message, ui.ButtonSet.OK);
  }
}
