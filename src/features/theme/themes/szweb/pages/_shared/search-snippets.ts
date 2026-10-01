export interface SafeSnippetSegment {
  text: string;
  marked: boolean;
}

const SAFE_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
};

function decodeSearchText(text: string) {
  return text.replace(/&(?:amp|lt|gt|quot);|&#0*39;/gi, (entity) => {
    const normalized = entity.toLowerCase();
    return (
      SAFE_ENTITIES[normalized] ?? (/^&#0*39;$/.test(normalized) ? "'" : entity)
    );
  });
}

/** Split Orama's exact mark wrappers while leaving every other tag as plain text. */
export function parseSafeSnippet(value: string): Array<SafeSnippetSegment> {
  const parts = value.split(/(<mark>[\s\S]*?<\/mark>)/gi);

  return parts.flatMap((part) => {
    const match = /^<mark>([\s\S]*?)<\/mark>$/i.exec(part);
    const segment = {
      marked: Boolean(match),
      text: decodeSearchText(match?.[1] ?? part),
    };
    return segment.text ? [segment] : [];
  });
}
