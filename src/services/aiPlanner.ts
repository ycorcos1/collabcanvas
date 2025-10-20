export type PlannedStep = { text: string };

const VERB_RE =
  /\b(create|add|make|delete|remove|clear|update|change|set|duplicate|copy|clone|rotate|turn|spin|align|distribute|move|nudge|resize|scale)\b/i;

export function segmentCommands(input: string): PlannedStep[] {
  if (!input) return [];
  const t = input.replace(/\s+/g, " ").trim();
  const hardSplit = t
    .split(/(?:;|\.\s+|\n)+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const segments: string[] = [];
  for (const chunk of hardSplit) {
    const parts = chunk
      .split(/\bthen\b|\band\s+then\b/i)
      .map((s) => s.trim())
      .flatMap((p) =>
        p.split(
          /\band\b(?=\s+(?:create|add|make|delete|remove|clear|update|change|set|duplicate|copy|clone|rotate|turn|spin|align|distribute|move|nudge|resize|scale)\b|\s+(?:a|an|the|another|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b)/i
        )
      )
      // also split on comma followed by a verb phrase
      .flatMap((p) =>
        p.split(
          /,\s*(?=(?:create|add|make|delete|remove|clear|update|change|set|duplicate|copy|clone|rotate|turn|spin|align|distribute|move|nudge|resize|scale)\b)/i
        )
      )
      .map((s) => s.trim())
      .filter(Boolean);
    segments.push(...parts);
  }

  const finalized: string[] = [];
  let lastVerb = "";
  for (const s of segments) {
    const m = s.match(VERB_RE);
    if (m) {
      lastVerb = m[1];
      finalized.push(s);
    } else if (lastVerb) {
      finalized.push(`${lastVerb} ${s}`);
    } else {
      finalized.push(s);
    }
  }
  return finalized.map((text) => ({ text }));
}

export type Anchor =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "center";

export function detectAnchor(text: string): Anchor | undefined {
  const t = text.toLowerCase();
  if (/\btop\s*right\b/.test(t)) return "top-right";
  if (/\btop\s*left\b/.test(t)) return "top-left";
  if (/\bbottom\s*right\b/.test(t)) return "bottom-right";
  if (/\bbottom\s*left\b/.test(t)) return "bottom-left";
  if (/\b(center|centre|middle)\b/.test(t)) return "center";
  return undefined;
}

export function anchorXY(
  anchor: Anchor,
  cw: number,
  ch: number,
  w: number,
  h: number
) {
  const m = 20;
  switch (anchor) {
    case "top-left":
      return { x: m, y: m };
    case "top-right":
      return { x: Math.max(0, cw - w - m), y: m };
    case "bottom-left":
      return { x: m, y: Math.max(0, ch - h - m) };
    case "bottom-right":
      return { x: Math.max(0, cw - w - m), y: Math.max(0, ch - h - m) };
    case "center":
    default:
      return {
        x: Math.max(0, Math.round((cw - w) / 2)),
        y: Math.max(0, Math.round((ch - h) / 2)),
      };
  }
}
