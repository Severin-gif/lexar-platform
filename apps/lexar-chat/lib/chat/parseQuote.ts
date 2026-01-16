export function parseQuoteAndText(raw: string): { quote: string | null; text: string } {
  if (!raw) return { quote: null, text: "" };
  const trimmed = raw.trim();

  // «…»
  const m1 = trimmed.match(/«([^»]+)»/);
  if (m1) {
    const q = m1[1].trim();
    const rest = trimmed.replace(m1[0], "").trim();
    return { quote: q, text: rest };
  }

  // markdown "> "
  const lines = trimmed.split(/\r?\n/);
  if (lines[0]?.startsWith(">")) {
    const q = lines[0].replace(/^>\s?/, "").trim();
    const rest = lines.slice(1).join("\n").trim();
    return { quote: q || null, text: rest };
  }

  return { quote: null, text: trimmed };
}
