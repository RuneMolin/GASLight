/**
 * ============================================================================
 * NGO CRM - DATA ACCESS LAYER (DonorRepository.ts)
 * ============================================================================
 * 
 * The Repository (or DAO - Data Access Object) pattern isolates all direct
 * database interactions. In our project, the "database" is a Google Sheet.
 * 
 * WHY THIS MATTERS:
 * - The rest of your application never needs to know which row, column, or
 *   range holds the data.
 * - If you later migrate to Cloud SQL or Firestore, you only rewrite this class.
 * - This is also the right place to handle concurrency via LockService.
 */

class DonorRepository {
  private readonly sheetName = 'Donors';
  private readonly headers = [
    'Donor ID',
    'Full Name',
    'Email',
    'Phone',
    'Category',
    'Status',
    'Total Donations ($)',
    'Notes / Cause',
    'Created Date'
  ];

  /**
   * Helper method to get the Donors worksheet.
   * Throws a friendly error if the sheet has not been initialized yet.
   */
  private getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(this.sheetName);
    if (!sheet) {
      throw new Error(
        `The "${this.sheetName}" sheet was not found. Please click 'NGO CRM > Initialize CRM Sheet' from the menu.`
      );
    }
    return sheet;
  }

  /**
   * Initializes the Donors sheet with professional formatting.
   * Creates headers, sets column widths, freezes the header row, and styles fonts.
   */
  public initializeSheet(): void {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(this.sheetName);

    if (!sheet) {
      sheet = spreadsheet.insertSheet(this.sheetName);
    }

    // Set headers
    const headerRange = sheet.getRange(1, 1, 1, this.headers.length);
    headerRange.setValues([this.headers]);

    // Apply clean, professional visual styling
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#2E5B88'); // Dark slate blue
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');

    // Freeze header row so it stays visible while scrolling
    sheet.setFrozenRows(1);

    // Auto-resize columns for readability
    for (let i = 1; i <= this.headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    // Set currency formatting for the "Total Donations ($)" column (Column 7)
    sheet.getRange(2, 7, Math.max(sheet.getMaxRows() - 1, 1), 1).setNumberFormat('$#,##0.00');
  }

  /**
   * Reads all donor records from the sheet and maps raw rows into typed Donor objects.
   */
  public getAllDonors(): Donor[] {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();

    // If only the header row exists, there are no records yet
    if (lastRow <= 1) {
      return [];
    }

    const dataRange = sheet.getRange(2, 1, lastRow - 1, this.headers.length);
    const rows = dataRange.getValues();

    return rows.map((row) => ({
      id: String(row[0]),
      fullName: String(row[1]),
      email: String(row[2]),
      phone: String(row[3]),
      category: row[4] as DonorCategory,
      status: row[5] as DonorStatus,
      totalDonations: Number(row[6]) || 0,
      notes: String(row[7]),
      createdAt: String(row[8])
    }));
  }

  /**
   * Finds a single donor by their email address or unique ID.
   */
  public findDonor(identifier: string): { donor: Donor; rowIndex: number } | null {
    const sheet = this.getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return null;

    const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
    const query = identifier.trim().toLowerCase();

    for (let i = 0; i < data.length; i++) {
      const rowId = String(data[i][0]).toLowerCase();
      const rowEmail = String(data[i][2]).toLowerCase();

      if (rowId === query || rowEmail === query) {
        const donors = this.getAllDonors();
        return {
          donor: donors[i],
          rowIndex: i + 2 // +2 because 1-based indexing and row 1 is header
        };
      }
    }
    return null;
  }

  /**
   * Appends a new donor row safely using LockService to prevent race conditions.
   */
  public insertDonor(donor: Donor): void {
    const lock = LockService.getScriptLock();
    try {
      // Wait up to 10 seconds for concurrent operations to complete
      lock.waitLock(10000);

      const sheet = this.getSheet();
      const rowData = [
        donor.id,
        donor.fullName,
        donor.email,
        donor.phone,
        donor.category,
        donor.status,
        donor.totalDonations,
        donor.notes,
        donor.createdAt
      ];

      sheet.appendRow(rowData);

      // Force immediate flush to ensure changes are written before lock release
      SpreadsheetApp.flush();
    } catch (error) {
      console.error('Failed to insert donor with lock:', error);
      throw new Error(`Could not save donor due to high system load. Please try again.`);
    } finally {
      lock.releaseLock();
    }
  }

  /**
   * Updates the total donation amount for an existing donor row.
   */
  public addDonationAmount(rowIndex: number, additionalAmount: number): number {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);

      const sheet = this.getSheet();
      // Column 7 is Total Donations
      const cell = sheet.getRange(rowIndex, 7);
      const currentTotal = Number(cell.getValue()) || 0;
      const newTotal = currentTotal + additionalAmount;

      cell.setValue(newTotal);
      SpreadsheetApp.flush();

      return newTotal;
    } catch (error) {
      console.error('Failed to update donation amount:', error);
      throw new Error(`Could not record donation. Please try again.`);
    } finally {
      lock.releaseLock();
    }
  }
}
