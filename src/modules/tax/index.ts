// Public surface of the Tax & Calculators module.
// See MODULE.md for what this module owns and what it borrows from shared code.

export { CompoundCalculator } from './components/CompoundCalculator';
export { TaxCentre } from './components/TaxCentre';
export { CAPITAL_GAINS_MATRIX, COMPLIANCE_CALENDAR, NEW_REGIME_SLABS, OLD_REGIME_SLABS, TAXATION_LESSONS, TAX_REFERENCE_AS_OF, TRANSACTION_CHARGES } from './data/taxationLessons';
export type { CapitalGainRow, ComplianceDate, TaxSlabRow, TransactionChargeRow } from './data/taxationLessons';
