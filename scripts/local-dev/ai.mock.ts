// Only aliased by the guarded Vite serve configuration.
export async function moderateComment() {
  return { safe: true, reason: "Local fixture moderation (no AI request)" };
}
export async function summarizeText(_context: unknown, text: string) {
  return { summary: `[LOCAL MOCK] ${text.slice(0, 160)}` };
}
export async function generateTags() {
  return ["本地测试"];
}
