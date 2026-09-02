/**
 * Utility functions for safe CSV formatting and formula injection prevention (CWE-1236).
 */

/**
 * Characters that can trigger spreadsheet formula execution if at the beginning of a field.
 * Examples: =HYPERLINK(...), +cmd|' /C ...'!A0, -2+3, @SUM(...), tab or carriage return.
 */
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;

/**
 * Sanitizes a CSV field to protect against CSV / Formula Injection (CWE-1236).
 * If the string begins with any unsafe formula trigger characters, it prepends
 * a single quote (') to force spreadsheet processors (Excel, Google Sheets, LibreOffice)
 * to interpret the cell content purely as raw text.
 * Also safely escapes existing double quotes for CSV compliance.
 *
 * @param field The text value to sanitize
 * @returns Safe sanitized text string
 */
export function sanitizeCSVField(field: string | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  let str = String(field);

  // If the field starts with unsafe formula characters, prepend a single quote
  if (FORMULA_PREFIX_REGEX.test(str)) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them (" -> "")
  return str.replace(/"/g, '""');
}
