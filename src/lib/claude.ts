import { spawn } from "child_process";
import { readFile, writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { getSystemPromptPath, enhanceUserPrompt } from "./prompt-template";

interface ClaudeResult {
  componentCode: string;
  voiceoverScript: string;
}

export async function generateWithClaude(
  topic: string
): Promise<ClaudeResult> {
  const enhancedPrompt = enhanceUserPrompt(topic);
  const systemPrompt = await readFile(getSystemPromptPath(), "utf-8");

  // Combine system prompt + user prompt and pipe via stdin
  // to avoid Windows shell escaping issues with multi-line args
  const combinedInput = `${systemPrompt}\n\n---\n\n${enhancedPrompt}`;

  console.log("Spawning claude CLI...");

  // Write prompt to a temp file and use shell < redirection.
  // Direct stdin piping through cmd.exe (shell:true) is unreliable on Windows —
  // the pipe doesn't consistently flow through to the child process.
  const tempFile = path.join(tmpdir(), `claude-input-${Date.now()}.txt`);
  await writeFile(tempFile, combinedInput, "utf-8");

  // Strip Claude Code session env vars so nested claude CLI call isn't blocked
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { CLAUDECODE, CLAUDE_CODE_SESSION, ...cleanEnv } = process.env;

  const stdout = await new Promise<string>((resolve, reject) => {
    // Use file redirect instead of stdin pipe — works reliably on Windows with cmd.exe
    const cmd = `claude -p - --output-format text --max-turns 1 < "${tempFile}"`;
    const proc = spawn(cmd, [], {
      cwd: process.cwd(),
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: cleanEnv,
    });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      if (output.length === 0) {
        console.log("[claude stdout] first chunk received");
      }
      output += chunk;
    });

    proc.stderr.on("data", (data: Buffer) => {
      const chunk = data.toString();
      errorOutput += chunk;
      process.stderr.write(`[claude stderr] ${chunk}`);
    });

    const timeout = setTimeout(() => {
      proc.kill();
      console.error("[claude timeout] stderr:", errorOutput.substring(0, 1000));
      console.error("[claude timeout] stdout:", output.substring(0, 500));
      reject(new Error("Claude CLI timed out after 5 minutes"));
    }, 300000);

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}. stderr: ${errorOutput}`));
      } else {
        resolve(output);
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });
  }).finally(() => unlink(tempFile).catch(() => {}));

  console.log(`Claude returned ${stdout.length} chars`);
  return parseClaudeResponse(stdout);
}

function parseClaudeResponse(response: string): ClaudeResult {
  const componentMatch = response.match(
    /```tsx\s*\n\/\/ COMPONENT\s*\n([\s\S]*?)```/
  );
  if (!componentMatch) {
    console.error(
      "Could not find COMPONENT block. Response starts with:",
      response.substring(0, 500)
    );
    throw new Error(
      "Failed to parse component code from Claude response. Expected a ```tsx block starting with // COMPONENT"
    );
  }

  const voiceoverMatch = response.match(
    /```(?:text|txt)\s*\n\/\/ VOICEOVER\s*\n([\s\S]*?)```/
  );
  if (!voiceoverMatch) {
    console.error(
      "Could not find VOICEOVER block. Response starts with:",
      response.substring(0, 500)
    );
    throw new Error(
      "Failed to parse voiceover script from Claude response. Expected a ```text block starting with // VOICEOVER"
    );
  }

  return {
    componentCode: componentMatch[1].trim(),
    voiceoverScript: voiceoverMatch[1].trim(),
  };
}
