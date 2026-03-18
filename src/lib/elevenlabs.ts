import fs from "fs/promises";
import path from "path";

// Premade voice (free-tier compatible) - Adam
const VOICE_ID = "pNInz6obpgDQGcFmaJgB";

export async function generateVoiceover(
  script: string,
  outputFilename: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    throw new Error(
      "ELEVENLABS_API_KEY is not set. Please add it to .env.local"
    );
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: script,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const outputPath = path.join(
    process.cwd(),
    "public",
    "audio",
    outputFilename
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, audioBuffer);

  return outputPath;
}
