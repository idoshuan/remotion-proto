import path from "path";

export function getSystemPromptPath(): string {
  return path.join(process.cwd(), "prompts", "system-prompt.txt");
}

export function enhanceUserPrompt(topic: string): string {
  return `Create an educational math video about: ${topic}

Target audience: Hebrew-speaking middle school and high school students
Duration: 30-50 seconds of content
Language: All text must be in Hebrew (math formulas can use Latin/standard notation)
Style: Engaging, colorful, step-by-step visual explanation with SVG diagrams
Format: Vertical reel (1080x1920)

The video should:
1. Start with an engaging title introducing the topic
2. Visually explain the core concept with animated diagrams
3. Show a concrete example with step-by-step solution
4. End with a brief summary of the key takeaway

Remember to output ONLY the two code blocks: // COMPONENT and // VOICEOVER`;
}
