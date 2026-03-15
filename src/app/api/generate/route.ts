import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/claude";
import { generateVoiceover } from "@/lib/elevenlabs";
import { getAudioDurationInSeconds } from "@/lib/audio-utils";
import { writeFile } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import crypto from "crypto";

const execFileAsync = promisify(execFile);

export const maxDuration = 300; // 5 minutes for Vercel, but we're local

export async function POST(request: NextRequest) {
  try {
    const { topic } = await request.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    console.log(`[${jobId}] Starting generation for topic: ${topic}`);

    // Step 1: Generate component + voiceover script via Claude
    console.log(`[${jobId}] Calling Claude CLI...`);
    const { componentCode, voiceoverScript } =
      await generateWithClaude(topic);
    console.log(`[${jobId}] Claude generated component and voiceover script`);

    // Step 2: Generate voiceover audio via ElevenLabs
    console.log(`[${jobId}] Generating voiceover with ElevenLabs...`);
    const audioFilename = `voiceover-${jobId}.mp3`;
    const audioPath = await generateVoiceover(voiceoverScript, audioFilename);
    console.log(`[${jobId}] Voiceover saved to ${audioPath}`);

    // Step 3: Get audio duration
    const durationSeconds = await getAudioDurationInSeconds(audioPath);
    console.log(`[${jobId}] Audio duration: ${durationSeconds}s`);

    // Step 4: Inject audio filename into generated component and write to disk
    const componentPath = path.join(
      process.cwd(),
      "src",
      "remotion",
      "generated",
      "VideoComposition.tsx"
    );
    await writeFile(componentPath, componentCode, "utf-8");
    console.log(`[${jobId}] Component written to ${componentPath}`);

    // Step 5: Save generated code for viewing
    const generatedCodePath = path.join(
      process.cwd(),
      "public",
      "generated",
      `${jobId}.tsx`
    );
    await writeFile(generatedCodePath, componentCode, "utf-8");

    // Step 6: Render video via separate process
    console.log(`[${jobId}] Starting Remotion render...`);
    const videoFilename = `video-${jobId}.mp4`;
    const { stdout, stderr } = await execFileAsync(
      "npx",
      [
        "ts-node",
        "--esm",
        "scripts/render.ts",
        durationSeconds.toString(),
        videoFilename,
        `audio/${audioFilename}`,
      ],
      {
        cwd: process.cwd(),
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
      }
    );

    if (stderr) {
      console.warn(`[${jobId}] Render stderr:`, stderr);
    }
    console.log(`[${jobId}] Render stdout:`, stdout);
    console.log(`[${jobId}] Generation complete!`);

    return NextResponse.json({
      success: true,
      jobId,
      videoUrl: `/videos/${videoFilename}`,
      audioUrl: `/audio/${audioFilename}`,
      codeUrl: `/generated/${jobId}.tsx`,
      generatedCode: componentCode,
      voiceoverScript,
      duration: durationSeconds,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
