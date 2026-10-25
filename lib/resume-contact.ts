/** Contact extraction is conservative: dates and email identifiers are not phones. */
export function extractResumePhone(text: string): string | null {
  for (const line of text.split(/\n+/)) {
    const withoutEmail = line.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ");
    const labelled = /\b(phone|mobile|telephone|tel)\b\s*[:.-]?/i.test(withoutEmail);
    for (const match of withoutEmail.matchAll(/\+?\d[\d ()-]{5,}\d/g)) {
      const value = match[0].trim();
      const digits = value.replace(/\D/g, "");
      if (digits.length > 15 || digits.length < (labelled ? 7 : 10)) continue;
      if (/^(?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}$/.test(value)) continue;
      if (/^\d{1,2}-\d{1,2}-(?:19|20)\d{2}$/.test(value)) continue;
      return value;
    }
  }
  return null;
}
