/**
 * env-inject.ts — OpenCode Plugin
 * Loads environment variables from .env file in the project root.
 * Run `kimaki send` or `opencode` from a project directory and
 * this plugin auto-loads the .env file.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const PLUGIN_NAME = "env-inject";

export default function envInject() {
  return {
    name: PLUGIN_NAME,
    version: "1.0.0",
    setup(api: any) {
      // Look for .env in current working directory
      const cwd = process.cwd();
      const envFiles = [".env", ".env.local", ".env.development"];

      for (const file of envFiles) {
        const envPath = join(cwd, file);
        if (existsSync(envPath)) {
          try {
            const content = readFileSync(envPath, "utf-8");
            const lines = content.split("\n");

            for (const line of lines) {
              const trimmed = line.trim();
              // Skip empty lines and comments
              if (!trimmed || trimmed.startsWith("#")) continue;

              const eqIndex = trimmed.indexOf("=");
              if (eqIndex === -1) continue;

              const key = trimmed.substring(0, eqIndex).trim();
              let value = trimmed.substring(eqIndex + 1).trim();

              // Remove surrounding quotes
              if (
                (value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))
              ) {
                value = value.slice(1, -1);
              }

              // Only set if not already set in environment
              if (!process.env[key]) {
                process.env[key] = value;
              }
            }

            console.log(`[${PLUGIN_NAME}] Loaded ${file}`);
          } catch (err) {
            console.error(`[${PLUGIN_NAME}] Error loading ${file}:`, err);
          }
        }
      }
    },
  };
}
