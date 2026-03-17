export interface SegmentOptions {
  start?: string;
}

export function createSegmentGrammar(
  segment: string,
  options: SegmentOptions = {}
): string {
  const start = options.start ?? "S";
  const trimmed = segment.trim();

  if (trimmed.length === 0) {
    throw new Error("Segment cannot be empty.");
  }

  const body =
    trimmed.startsWith("(") && trimmed.endsWith(")")
      ? trimmed.slice(1, -1).trim()
      : trimmed;

  return `${start} ::= (${body});`;
}
