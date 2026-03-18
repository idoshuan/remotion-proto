import { NextRequest, NextResponse } from "next/server";
import { generateWithClaude } from "@/lib/claude";
import { generateVoiceover } from "@/lib/elevenlabs";
import { getAudioDurationInSeconds } from "@/lib/audio-utils";
import { writeFile, mkdir } from "fs/promises";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import crypto from "crypto";

const execFileAsync = promisify(execFile);

export const maxDuration = 300; // 5 minutes for Vercel, but we're local

export async function POST(request: NextRequest) {
  try {
    const { topic, skipAudio } = await request.json();
    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    const jobId = crypto.randomBytes(8).toString("hex");
    console.log(`[${jobId}] Starting generation for topic: ${topic} (skipAudio=${!!skipAudio})`);

    // Step 1: Generate component + voiceover script via Claude
    console.log(`[${jobId}] Calling Claude CLI...`);
    const { componentCode, voiceoverScript } =
      await generateWithClaude(topic);
    console.log(`[${jobId}] Claude generated component and voiceover script`);

    // Step 2: Generate voiceover audio via ElevenLabs (skippable)
    const audioFilename = `voiceover-${jobId}.mp3`;
    let durationSeconds: number;

    if (skipAudio) {
      console.log(`[${jobId}] Skipping audio generation, writing silent placeholder`);
      durationSeconds = 30;
      // Write a minimal silent WAV (1s, 8kHz, 8-bit mono) so Remotion's staticFile() resolves
      const sampleRate = 8000;
      const numSamples = sampleRate * durationSeconds;
      const wav = Buffer.alloc(44 + numSamples);
      wav.write("RIFF", 0); wav.writeUInt32LE(36 + numSamples, 4); wav.write("WAVE", 8);
      wav.write("fmt ", 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
      wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24);
      wav.writeUInt32LE(sampleRate, 28); wav.writeUInt16LE(1, 32); wav.writeUInt16LE(8, 34);
      wav.write("data", 36); wav.writeUInt32LE(numSamples, 40); wav.fill(128, 44);
      const silentPath = path.join(process.cwd(), "public", "audio", audioFilename);
      await mkdir(path.dirname(silentPath), { recursive: true });
      await writeFile(silentPath, wav);
    } else {
      console.log(`[${jobId}] Generating voiceover with ElevenLabs...`);
      const audioPath = await generateVoiceover(voiceoverScript, audioFilename);
      console.log(`[${jobId}] Voiceover saved to ${audioPath}`);
      durationSeconds = await getAudioDurationInSeconds(audioPath);
      console.log(`[${jobId}] Audio duration: ${durationSeconds}s`);
    }

    // Step 4: Inject audio filename into generated component and write to disk
    const componentPath = path.join(
      process.cwd(),
      "src",
      "remotion",
      "generated",
      "VideoComposition.tsx"
    );
    await mkdir(path.dirname(componentPath), { recursive: true });
    await writeFile(componentPath, componentCode, "utf-8");
    console.log(`[${jobId}] Component written to ${componentPath}`);

    // Step 5: Save generated code for viewing
    const generatedCodePath = path.join(
      process.cwd(),
      "public",
      "generated",
      `${jobId}.tsx`
    );
    await mkdir(path.dirname(generatedCodePath), { recursive: true });
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
        shell: true,
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
