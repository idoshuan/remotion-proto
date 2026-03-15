import { spawn } from "child_process";
import { getSystemPromptPath, enhanceUserPrompt } from "./prompt-template";

interface ClaudeResult {
  componentCode: string;
  voiceoverScript: string;
}

export async function generateWithClaude(
  topic: string
): Promise<ClaudeResult> {
  const enhancedPrompt = enhanceUserPrompt(topic);
  const systemPromptPath = getSystemPromptPath();

  const args = [
    "-p",
    enhancedPrompt,
    "--system-prompt-file",
    systemPromptPath,
    "--output-format",
    "text",
    "--max-turns",
    "1",
  ];

  console.log("Spawning claude CLI...");

  const stdout = await new Promise<string>((resolve, reject) => {
    const proc = spawn("claude", args, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data: Buffer) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data: Buffer) => {
      errorOutput += data.toString();
    });

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("Claude CLI timed out after 5 minutes"));
    }, 300000); // 5 minutes

    proc.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(
          new Error(
            `Claude CLI exited with code ${code}. stderr: ${errorOutput}`
          )
        );
      } else {
        resolve(output);
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn claude: ${err.message}`));
    });
  });

  console.log(`Claude returned ${stdout.length} chars`);
  return parseClaudeResponse(stdout);
}

function parseClaudeResponse(response: string): ClaudeResult {
  // Extract component code
  const componentMatch = response.match(
    /```tsx\s*\n\/\/ COMPONENT\s*\n([\s\S]*?)```/
  );
  if (!componentMatch) {
    // Log first 500 chars for debugging
    console.error(
      "Could not find COMPONENT block. Response starts with:",
      response.substring(0, 500)
    );
    throw new Error(
      "Failed to parse component code from Claude response. Expected a ```tsx block starting with // COMPONENT"
    );
  }

  // Extract voiceover script
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
