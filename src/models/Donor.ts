/**
 * ============================================================================
 * NGO CRM - DOMAIN MODEL (Donor.ts)
 * ============================================================================
 * 
 * In software architecture, the "Model" defines the shape of our data.
 * Even in a simple Google Sheets project, defining data contracts (interfaces)
 * ensures that every part of the application knows exactly what properties
 * exist on a "Donor" object, preventing typos and unexpected undefined bugs.
 */

/**
 * Valid donor categories within our NGO.
 */
type DonorCategory = 'Individual' | 'Corporate' | 'Foundation' | 'Other';

/**
 * Valid donor engagement statuses.
 */
type DonorStatus = 'Active' | 'Prospective' | 'Lapsed';

/**
 * Interface representing a Donor record in our CRM.
 */
interface Donor {
  /** Unique identifier, e.g., "DON-1001" */
  id: string;

  /** Full name of the individual or organization contact */
  fullName: string;

  /** Primary contact email */
  email: string;

  /** Phone contact number */
  phone: string;

  /** Category classification (Individual, Corporate, Foundation) */
  category: DonorCategory;

  /** Engagement status */
  status: DonorStatus;

  /** Cumulative amount donated in USD (or local currency) */
  totalDonations: number;

  /** Specific programs or causes the donor cares about */
  notes: string;

  /** ISO date string or formatted date when the record was created */
  createdAt: string;
}

/**
 * Summary statistics for the NGO dashboard/reporting.
 */
interface DonorStats {
  totalDonors: number;
  activeDonors: number;
  totalFundsRaised: number;
  averageDonation: number;
}
