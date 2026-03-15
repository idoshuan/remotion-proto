import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import React from "react";

type Props = {
  voiceoverDuration: number;
  audioFileName: string;
};

const VideoComposition: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 1 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          opacity,
          color: "white",
          fontSize: 60,
          fontFamily: "Arial, sans-serif",
          direction: "rtl",
          textAlign: "center",
        }}
      >
        ממתין ליצירת סרטון...
      </div>
    </AbsoluteFill>
  );
};

export default VideoComposition;
