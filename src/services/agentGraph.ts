// Optional LangGraph-based planner. Used as a fallback when the local router can't handle a command.
// To enable this, install deps: npm i @langchain/langgraph langchain

// Deps are optional; guard import with dynamic require pattern to avoid bundling when not installed.
type ToolStep = {
  tool: string;
  args: Record<string, unknown>;
};

type GState = {
  input: string;
  context: any;
  plan?: ToolStep[];
  results?: Array<{ ok: boolean; message: string }>;
  retries?: number;
};

export async function runGraphPlan(
  input: string,
  context: any
): Promise<GState | null> {
  let StateGraph: any, START: any, END: any, ChatOpenAI: any;
  try {
    const LG = "@langchain/langgraph";
    const LC = "langchain/chat_models/openai";
    ({ StateGraph, START, END } = await import(/* @vite-ignore */ LG));
    ({ ChatOpenAI } = await import(/* @vite-ignore */ LC));
  } catch {
    // LangGraph not installed; skip
    return null;
  }

  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
    openAIApiKey: (import.meta as any).env.VITE_OPENAI_API_KEY,
  });

  async function parseNode(state: GState): Promise<GState> {
    const sys = `Return a pure JSON array of tool steps: [{ "tool": "<name>", "args": { ... } }].
Tools: create_shape, update_shape, delete_shape, duplicate_shape, rotate_shape, align_shapes, distribute_shapes, create_from_template, update_many_shapes, delete_many_shapes, duplicate_many_shapes, rotate_many_shapes, clear_canvas.
Use numeric x,y,width,height,radius,degrees. Colors must be hex '#RRGGBB'.`;
    const res = await llm.call([
      { role: "system", content: sys },
      { role: "user", content: state.input },
    ]);
    let plan: ToolStep[] = [];
    try {
      plan = JSON.parse((res as any).text || "[]");
    } catch {}
    return { ...state, plan };
  }

  async function executeNode(state: GState): Promise<GState> {
    const plan = state.plan || [];
    const results: Array<{ ok: boolean; message: string }> = [];
    for (const step of plan) {
      try {
        const r = await state.context.executeTool(
          step.tool,
          step.args,
          state.context
        );
        results.push({ ok: !!r?.success, message: r?.message || "" });
        if (!r?.success) break;
      } catch (e: any) {
        results.push({ ok: false, message: e?.message || "error" });
        break;
      }
    }
    return { ...state, results };
  }

  async function reviewNode(state: GState): Promise<GState> {
    const allOk = (state.results || []).every((r) => r.ok);
    if (allOk) return state;
    const retries = (state.retries || 0) + 1;
    if (retries >= 1) return { ...state, retries }; // single retry at most
    const feedback = JSON.stringify(state.results || []);
    const sys = `Previous execution failed: ${feedback}. Return a revised plan as pure JSON array of steps.`;
    const res = await llm.call([
      { role: "system", content: sys },
      { role: "user", content: state.input },
    ]);
    let plan: ToolStep[] = [];
    try {
      plan = JSON.parse((res as any).text || "[]");
    } catch {}
    return { ...state, plan, retries };
  }

  const graph: any = new StateGraph({ channels: {} } as any);
  graph.addNode("parse", parseNode);
  graph.addNode("execute", executeNode);
  graph.addNode("review", reviewNode);
  graph.addEdge(START, "parse");
  graph.addEdge("parse", "execute");
  graph.addConditionalEdges("execute", (s: GState) => {
    const ok = (s.results || []).every((r) => r.ok);
    return ok ? END : "review";
  });
  graph.addEdge("review", "execute");
  const app = graph.compile();
  try {
    return await app.invoke({ input, context });
  } catch {
    return null;
  }
}
