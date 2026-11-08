/**
 * inkstone-gate.ts — OpenCode Plugin
 * Reminds agents to run Inkstone pre-injection checks before starting work.
 * Soft dependency — logs a warning but never blocks tool execution.
 */
const PLUGIN_NAME = "inkstone-gate";

export default function inkstoneGate() {
  let precheckDone = false;

  return {
    name: PLUGIN_NAME,
    version: "1.0.0",
    setup(api: any) {
      // Listen for session start
      api.on?.("session:start", () => {
        precheckDone = false;
        console.log(
          `[${PLUGIN_NAME}] Reminder: Run inkstone_memory_failures() or inkstone_memory_search() before starting work (AGENTS.md mandatory precheck)`
        );
      });

      // Track when inkstone tools are called
      api.on?.("tool:call", (event: any) => {
        if (
          event.toolName?.startsWith("inkstone_memory_") ||
          event.toolName?.startsWith("inkstone_")
        ) {
          precheckDone = true;
        }
      });

      // Soft reminder if tools are called before precheck
      api.on?.("tool:before", (event: any) => {
        if (!precheckDone && event.toolName) {
          // Only remind once
          if (!globalThis.__inkstoneGateReminded) {
            console.warn(
              `[${PLUGIN_NAME}] Precheck not done yet. ` +
                `Run inkstone_memory_search() first per AGENTS.md. ` +
                `This is a soft reminder — tools will still execute.`
            );
            globalThis.__inkstoneGateReminded = true;
          }
        }
      });

      // Reset reminder flag on session end
      api.on?.("session:end", () => {
        precheckDone = false;
        (globalThis as any).__inkstoneGateReminded = false;
      });
    },
  };
}
