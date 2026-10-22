/**
 * ============================================================================
 * NGO CRM - BUSINESS LOGIC SERVICE (DonorService.ts)
 * ============================================================================
 * 
 * The Service layer contains your application's rules, validation, and domain
 * calculations. It acts as an orchestrator between the user interface (Controller)
 * and the storage layer (Repository).
 * 
 * WHY THIS MATTERS:
 * - UI controllers shouldn't worry about validation or ID generation.
 * - Repositories shouldn't make decisions about what constitutes a valid email.
 * - Keeping business rules in the Service layer makes your code testable and reusable.
 */

class DonorService {
  private repository: DonorRepository;

  constructor(repository: DonorRepository) {
    this.repository = repository;
  }

  /**
   * Initializes the CRM sheet and adds starter seed data if empty.
   */
  public initializeCRM(): void {
    this.repository.initializeSheet();

    const existing = this.repository.getAllDonors();
    if (existing.length === 0) {
      this.seedInitialData();
    }
  }

  /**
   * Adds initial sample donors so the user immediately sees a working CRM.
   */
  private seedInitialData(): void {
    const sampleDonors: Donor[] = [
      {
        id: 'DON-1001',
        fullName: 'Jane Doe',
        email: 'jane.doe@example.org',
        phone: '+1 (555) 234-5678',
        category: 'Individual',
        status: 'Active',
        totalDonations: 250.00,
        notes: 'Interested in Clean Water initiatives',
        createdAt: new Date().toISOString().split('T')[0]
      },
      {
        id: 'DON-1002',
        fullName: 'Acme Green Foundation',
        email: 'grants@acmefoundation.org',
        phone: '+1 (555) 987-6543',
        category: 'Foundation',
        status: 'Active',
        totalDonations: 5000.00,
        notes: 'Annual environmental grant partner',
        createdAt: new Date().toISOString().split('T')[0]
      },
      {
        id: 'DON-1003',
        fullName: 'Carlos Santana',
        email: 'carlos.s@example.com',
        phone: '+1 (555) 456-7890',
        category: 'Individual',
        status: 'Prospective',
        totalDonations: 0.00,
        notes: 'Attended the Gala night',
        createdAt: new Date().toISOString().split('T')[0]
      }
    ];

    for (const donor of sampleDonors) {
      this.repository.insertDonor(donor);
    }
  }

  /**
   * Generates the next sequential ID, e.g., DON-1004.
   */
  private generateNextId(donors: Donor[]): string {
    if (donors.length === 0) {
      return 'DON-1001';
    }

    const ids = donors
      .map((d) => {
        const numPart = d.id.replace('DON-', '');
        return parseInt(numPart, 10);
      })
      .filter((n) => !isNaN(n));

    const highestId = ids.length > 0 ? Math.max(...ids) : 1000;
    return `DON-${highestId + 1}`;
  }

  /**
   * Validates and registers a new donor.
   */
  public registerDonor(params: {
    fullName: string;
    email: string;
    phone?: string;
    category?: DonorCategory;
    notes?: string;
  }): Donor {
    // 1. Validate required fields
    if (!params.fullName || params.fullName.trim().length === 0) {
      throw new Error('Donor full name is required.');
    }

    if (!params.email || !this.isValidEmail(params.email)) {
      throw new Error(`Invalid email address: "${params.email}".`);
    }

    // 2. Prevent duplicate donor entries by email
    const existing = this.repository.findDonor(params.email);
    if (existing) {
      throw new Error(`A donor with email "${params.email}" already exists (${existing.donor.id} - ${existing.donor.fullName}).`);
    }

    // 3. Assemble complete Donor entity
    const allDonors = this.repository.getAllDonors();
    const newDonor: Donor = {
      id: this.generateNextId(allDonors),
      fullName: params.fullName.trim(),
      email: params.email.trim().toLowerCase(),
      phone: (params.phone || '').trim(),
      category: params.category || 'Individual',
      status: 'Active',
      totalDonations: 0,
      notes: (params.notes || '').trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    // 4. Persist to repository
    this.repository.insertDonor(newDonor);
    return newDonor;
  }

  /**
   * Records a new financial donation for an existing donor.
   */
  public logDonation(identifier: string, amount: number): { donor: Donor; newTotal: number } {
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Donation amount must be a positive number greater than 0.');
    }

    const match = this.repository.findDonor(identifier);
    if (!match) {
      throw new Error(`No donor found matching identifier: "${identifier}".`);
    }

    const newTotal = this.repository.addDonationAmount(match.rowIndex, amount);
    match.donor.totalDonations = newTotal;

    return {
      donor: match.donor,
      newTotal
    };
  }

  /**
   * Computes key metrics across the donor database.
   */
  public getStatistics(): DonorStats {
    const donors = this.repository.getAllDonors();

    const totalDonors = donors.length;
    const activeDonors = donors.filter((d) => d.status === 'Active').length;
    const totalFundsRaised = donors.reduce((sum, d) => sum + d.totalDonations, 0);
    const averageDonation = totalDonors > 0 ? totalFundsRaised / totalDonors : 0;

    return {
      totalDonors,
      activeDonors,
      totalFundsRaised,
      averageDonation
    };
  }

  /**
   * Basic email structure check using regex.
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }
}
