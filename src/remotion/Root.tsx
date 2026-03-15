import React, { lazy } from "react";
import { Composition } from "remotion";

const VideoComposition = lazy(() => import("./generated/VideoComposition"));

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="math-video"
      component={VideoComposition}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        voiceoverDuration: 30,
        audioFileName: "voiceover.mp3",
      }}
      calculateMetadata={async ({ props }) => {
        return {
          durationInFrames: Math.ceil(props.voiceoverDuration * 30) + 60,
        };
      }}
    />
  );
};
