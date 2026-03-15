import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

async function main() {
  const voiceoverDuration = parseFloat(process.argv[2]);
  const outputFilename = process.argv[3];
  const audioFileName = process.argv[4];

  if (!voiceoverDuration || !outputFilename || !audioFileName) {
    console.error(
      "Usage: npx ts-node scripts/render.ts <voiceoverDuration> <outputFilename> <audioFileName>"
    );
    process.exit(1);
  }

  const entryPoint = path.join(process.cwd(), "src", "remotion", "index.ts");
  const outputPath = path.join(
    process.cwd(),
    "public",
    "videos",
    outputFilename
  );

  console.log("Bundling Remotion project...");
  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => config,
  });

  console.log("Selecting composition...");
  const inputProps = { voiceoverDuration, audioFileName };
  const composition = await selectComposition({
    serveUrl,
    id: "math-video",
    inputProps,
  });

  console.log(
    `Rendering ${composition.durationInFrames} frames at ${composition.fps}fps...`
  );
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0) {
        process.stdout.write(`\rRendering: ${Math.round(progress * 100)}%`);
      }
    },
  });

  console.log(`\nRender complete: ${outputPath}`);
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
