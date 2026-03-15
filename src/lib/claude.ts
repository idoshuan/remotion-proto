import { execFile } from "child_process";
import { promisify } from "util";
import { getSystemPromptPath, enhanceUserPrompt } from "./prompt-template";

const execFileAsync = promisify(execFile);

interface ClaudeResult {
  componentCode: string;
  voiceoverScript: string;
}

export async function generateWithClaude(
  topic: string
): Promise<ClaudeResult> {
  const enhancedPrompt = enhanceUserPrompt(topic);
  const systemPromptPath = getSystemPromptPath();

  const { stdout } = await execFileAsync(
    "claude",
    [
      "-p",
      enhancedPrompt,
      "--system-prompt-file",
      systemPromptPath,
      "--output-format",
      "text",
      "--max-turns",
      "1",
      "--allowedTools",
      "",
    ],
    {
      maxBuffer: 1024 * 1024,
      timeout: 180000, // 3 minutes
      cwd: process.cwd(),
    }
  );

  return parseClaudeResponse(stdout);
}

function parseClaudeResponse(response: string): ClaudeResult {
  // Extract component code
  const componentMatch = response.match(
    /```tsx\s*\n\/\/ COMPONENT\s*\n([\s\S]*?)```/
  );
  if (!componentMatch) {
    throw new Error(
      "Failed to parse component code from Claude response. Expected a ```tsx block starting with // COMPONENT"
    );
  }

  // Extract voiceover script
  const voiceoverMatch = response.match(
    /```text\s*\n\/\/ VOICEOVER\s*\n([\s\S]*?)```/
  );
  if (!voiceoverMatch) {
    throw new Error(
      "Failed to parse voiceover script from Claude response. Expected a ```text block starting with // VOICEOVER"
    );
  }

  return {
    componentCode: componentMatch[1].trim(),
    voiceoverScript: voiceoverMatch[1].trim(),
  };
}
