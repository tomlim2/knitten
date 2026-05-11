import { join, resolve } from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

// The allowed directories (we evaluate $CAOL_ILA_ROOT dynamically)
const caolIlaRoot = resolve(process.cwd()); // This extension runs where Pi runs. Adjust dynamically in hook.

export default function (pi: ExtensionAPI) {
  let allowedDirs: string[] = [];

  pi.on("session_start", (event, ctx) => {
    // Determine the root. If Pi runs inside the caol-ila repo, cwd is root. 
    // In a global setup, we hardcode the known path based on our previous config.
    const root = "/Users/deemooooooooo/Desktop/www/caol-ila";
    allowedDirs = [
      resolve(join(root, "agent", "skills")),
      resolve(join(root, "agent", "commands")),
      resolve(join(root, "agent", "rules")),
      resolve(join(root, "agent", "standards")),
      resolve(join(root, "agent", "extensions")),
      resolve(join(root, "agent", "config")),
      resolve(process.cwd()) // Allow whatever the current local project is
    ];
    
    ctx.ui.setStatus("crud-sandbox", ctx.ui.theme.fg("accent", "🛡️ CRUD Sandboxed"));
  });

  pi.on("tool_call", (event, ctx) => {
    // Guard: File Modification Tools
    if (event.toolName === "read" || event.toolName === "write" || event.toolName === "edit") {
      const targetPath = resolve(ctx.cwd, event.input.path);
      
      const isAllowed = allowedDirs.some(dir => targetPath.startsWith(dir));
      
      if (!isAllowed) {
        ctx.ui.notify(`Blocked ${event.toolName} access outside of sandbox: ${targetPath}`, "error");
        return { 
          block: true, 
          reason: `SANDBOX VIOLATION: You are not allowed to ${event.toolName} files outside the allowed directories. Try reading/writing inside the project instead.` 
        };
      }
    }

    // Guard: Bash command injection (basic check for traversing up)
    if (event.toolName === "bash") {
      const cmd = event.input.command;
      if (cmd.includes("cd ..") || cmd.includes("cd /") || cmd.includes("rm -rf /")) {
        ctx.ui.notify(`Blocked dangerous bash command: ${cmd}`, "error");
        return {
          block: true,
          reason: `SANDBOX VIOLATION: Dangerous or out-of-bounds bash command detected.`
        };
      }
    }
  });
}
