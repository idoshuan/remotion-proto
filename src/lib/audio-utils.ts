import { parseFile } from "music-metadata";

export async function getAudioDurationInSeconds(
  filePath: string
): Promise<number> {
  const metadata = await parseFile(filePath);
  const duration = metadata.format.duration;
  if (!duration) {
    throw new Error(`Could not determine duration for: ${filePath}`);
  }
  return duration;
}

export function secondsToFrames(seconds: number, fps: number): number {
  return Math.ceil(seconds * fps);
}
