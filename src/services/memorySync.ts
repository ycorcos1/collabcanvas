// Browser-safe MemorySync: store markdown in localStorage under the
// "memoryBank:" prefix so the agent has persistent, cheap context.

const LS_PREFIX = "memoryBank:";

function now() {
  return new Date().toISOString();
}

function write(key: string, content: string) {
  try {
    localStorage.setItem(LS_PREFIX + key, content);
  } catch {}
}

function read(key: string): string {
  try {
    return localStorage.getItem(LS_PREFIX + key) || "";
  } catch {
    return "";
  }
}

function appendTop(key: string, block: string, maxChars = 100_000) {
  const prev = read(key);
  let next = `${block}\n${prev}`;
  if (next.length > maxChars) next = next.slice(0, maxChars);
  write(key, next);
}

export const memorySync = {
  updateProjectBrief(data: {
    name?: string;
    goal?: string;
    phase?: string;
    stacks?: string[];
  }) {
    const s = `# Project Brief
- Name: ${data.name ?? "HØRIZON"}
- Goal: ${data.goal ?? "Collaborative canvas + AI agent"}
- Primary stacks: ${(
      data.stacks ?? ["React", "Vite", "Firebase", "Konva", "OpenAI"]
    ).join(", ")}
- Current phase: ${data.phase ?? "AI Agent + Reliability"}

Last updated: ${now()}
`;
    write("project_brief.md", s);
  },

  updateActiveContext(ctx: {
    projectId?: string;
    canvas?: { width?: number; height?: number; background?: string };
    pages?: { total?: number; selectedId?: string };
    ai?: {
      defaultPosition?: { x: number; y: number };
      duplicateOffset?: { x: number; y: number };
      palette?: string[];
    };
    recentCommands?: string[];
    locks?: string[];
  }) {
    const s = `# Active Context
- Current project id/slug: ${ctx.projectId ?? "-"}
- Canvas: width=${ctx.canvas?.width ?? "-"} height=${
      ctx.canvas?.height ?? "-"
    } background=${ctx.canvas?.background ?? "-"}
- Pages: ${ctx.pages?.total ?? "-"} | Selected page: ${
      ctx.pages?.selectedId ?? "-"
    }
- AI defaults: position=${ctx.ai?.defaultPosition?.x ?? "-"},${
      ctx.ai?.defaultPosition?.y ?? "-"
    } duplicateOffset=${ctx.ai?.duplicateOffset?.x ?? "-"},${
      ctx.ai?.duplicateOffset?.y ?? "-"
    } colorPalette=${(ctx.ai?.palette ?? []).join(", ")}
- Recent commands (last 5): ${(ctx.recentCommands ?? []).join(" | ")}
- Known locks: ${(ctx.locks ?? []).join(", ") || "-"}

Last updated: ${now()}
`;
    write("active_context.md", s);
  },

  recordEvent(ev: {
    type: "AI_COMMAND" | "SAVE" | "LOAD" | "ERROR";
    summary: string;
    details?: Record<string, unknown>;
  }) {
    const block = `# ${now()}
- Event: ${ev.type}
- Summary: ${ev.summary}
- Details: ${JSON.stringify(ev.details ?? {}, null, 2)}
`;
    appendTop("progress.md", block);
  },

  snapshotFrontend(env: Record<string, string | undefined>) {
    const s = `# Frontend Snapshot
- Routes: /, /sign-in, /sign-up, /dashboard/*, /canvas/:slug
- Feature flags: AI_ENABLED=${env.VITE_ENABLE_AI_AGENT ?? "-"} | USE_AI_PROXY=${
      env.VITE_USE_AI_PROXY ?? "-"
    }

Last updated: ${now()}
`;
    write("frontend.md", s);
  },
};
