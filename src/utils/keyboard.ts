export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if ((el as any).isContentEditable || el.contentEditable === "true") return true;
  if (el.getAttribute && el.getAttribute("role") === "textbox") return true;
  const cl = (el as HTMLElement).classList;
  return !!cl && (cl.contains("ai-chat-input") || cl.contains("ai-command-bar-input"));
}


