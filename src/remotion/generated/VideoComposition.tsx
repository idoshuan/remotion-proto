import { AbsoluteFill, useCurrentFrame, useVideoConfig, Series, interpolate, staticFile } from "remotion";
import { Audio } from "@remotion/media";
import React from "react";

type Props = { voiceoverDuration: number; audioFileName: string };

const VideoComposition: React.FC<Props> = ({ voiceoverDuration, audioFileName }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = Math.ceil(voiceoverDuration * fps);

  const introDuration = Math.ceil(totalFrames * 0.18);
  const scene1Duration = Math.ceil(totalFrames * 0.28);
  const scene2Duration = Math.ceil(totalFrames * 0.28);
  const outroDuration = totalFrames - introDuration - scene1Duration - scene2Duration;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0f0c29, #1a1a4e, #24243e)", fontFamily: "Arial, sans-serif" }}>
      <Audio src={staticFile(audioFileName)} />
      <Series>

        {/* Scene 1 – כן, יש לי כישורים! */}
        <Series.Sequence durationInFrames={introDuration}>
          {(() => {
            const titleOpacity = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
            const titleScale = interpolate(frame, [0, 18], [0.7, 1], { extrapolateRight: "clamp" });
            const checkOpacity = interpolate(frame, [20, 36], [0, 1], { extrapolateRight: "clamp" });
            const checkScale = interpolate(frame, [20, 36], [0.4, 1.1], { extrapolateRight: "clamp" });
            const checkBounce = interpolate(frame, [36, 44], [1.1, 1], { extrapolateRight: "clamp" });
            const finalCheckScale = frame < 36 ? checkScale : checkBounce;
            return (
              <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
                <div style={{ opacity: titleOpacity, transform: `scale(${titleScale})`, textAlign: "center", direction: "rtl" }}>
                  <div style={{ fontSize: 72, fontWeight: 900, color: "#facc15", lineHeight: 1.2 }}>בדיקת מפתחים</div>
                  <div style={{ fontSize: 42, color: "#a5b4fc", marginTop: 16 }}>האם יש לי כישורי Remotion?</div>
                </div>
                <div style={{ opacity: checkOpacity, transform: `scale(${finalCheckScale})` }}>
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="72" fill="none" stroke="#22c55e" strokeWidth="8" />
                    <polyline points="44,84 70,110 118,56" fill="none" stroke="#22c55e" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div style={{ opacity: checkOpacity, fontSize: 64, fontWeight: 900, color: "#22c55e", direction: "rtl" }}>כן!</div>
              </AbsoluteFill>
            );
          })()}
        </Series.Sequence>

        {/* Scene 2 – מה הכישורים שלי */}
        <Series.Sequence durationInFrames={scene1Duration}>
          {(() => {
            const skills = [
              { label: "סצנות עם Series ו-Sequence", icon: "🎬", color: "#38bdf8" },
              { label: "אנימציות SVG עם interpolate()", icon: "✏️", color: "#a78bfa" },
              { label: "וויסאובר עברי עם ElevenLabs", icon: "🔊", color: "#f472b6" },
              { label: "סגנון חינוכי – כמו Kurzgesagt", icon: "🎨", color: "#facc15" },
            ];
            const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
            return (
              <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 32, padding: "0 60px" }}>
                <div style={{ opacity: headerOpacity, fontSize: 52, fontWeight: 900, color: "#facc15", direction: "rtl", textAlign: "center" }}>
                  מה יש לי?
                </div>
                {skills.map((s, i) => {
                  const delay = 20 + i * 18;
                  const op = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: "clamp" });
                  const tx = interpolate(frame, [delay, delay + 14], [60, 0], { extrapolateRight: "clamp" });
                  return (
                    <div key={i} style={{
                      opacity: op,
                      transform: `translateX(${tx}px)`,
                      background: "rgba(255,255,255,0.07)",
                      border: `2px solid ${s.color}`,
                      borderRadius: 20,
                      padding: "22px 36px",
                      width: "100%",
                      direction: "rtl",
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                    }}>
                      <span style={{ fontSize: 42 }}>{s.icon}</span>
                      <span style={{ fontSize: 36, color: s.color, fontWeight: 700 }}>{s.label}</span>
                    </div>
                  );
                })}
              </AbsoluteFill>
            );
          })()}
        </Series.Sequence>

        {/* Scene 3 – הדגמה חיה: SVG מונפש */}
        <Series.Sequence durationInFrames={scene2Duration}>
          {(() => {
            const labelOp = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
            // animated sine wave drawn progressively
            const progress = interpolate(frame, [10, scene2Duration - 10], [0, 1], { extrapolateRight: "clamp" });
            const totalPoints = 200;
            const drawnPoints = Math.floor(progress * totalPoints);
            const width = 800;
            const height = 280;
            const points = Array.from({ length: drawnPoints }, (_, k) => {
              const x = (k / totalPoints) * width;
              const y = height / 2 - Math.sin((k / totalPoints) * 4 * Math.PI) * 100;
              return `${x},${y}`;
            }).join(" ");
            const dotX = progress * width;
            const dotY = height / 2 - Math.sin(progress * 4 * Math.PI) * 100;
            const dotOp = drawnPoints > 2 ? 1 : 0;

            const equationOp = interpolate(frame, [30, 44], [0, 1], { extrapolateRight: "clamp" });

            return (
              <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 36, padding: "0 60px" }}>
                <div style={{ opacity: labelOp, fontSize: 52, fontWeight: 900, color: "#facc15", direction: "rtl", textAlign: "center" }}>
                  הנה הדגמה חיה!
                </div>
                <div style={{ opacity: labelOp, fontSize: 34, color: "#a5b4fc", direction: "rtl", textAlign: "center" }}>
                  גרף פונקציית סינוס — מונפש ב-interpolate()
                </div>
                <svg width={width} height={height} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20 }}>
                  {/* axes */}
                  <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#334155" strokeWidth="2" />
                  <line x1="0" y1="0" x2="0" y2={height} stroke="#334155" strokeWidth="2" />
                  {/* drawn wave */}
                  {drawnPoints > 1 && (
                    <polyline points={points} fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {/* moving dot */}
                  <circle cx={dotX} cy={dotY} r="10" fill="#facc15" opacity={dotOp} />
                </svg>
                <div style={{ opacity: equationOp, fontSize: 56, color: "#22c55e", fontWeight: 700, fontFamily: "Arial, sans-serif" }}>
                  y = sin(x)
                </div>
              </AbsoluteFill>
            );
          })()}
        </Series.Sequence>

        {/* Scene 4 – סיכום */}
        <Series.Sequence durationInFrames={outroDuration}>
          {(() => {
            const op = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
            const scale = interpolate(frame, [0, 20], [0.85, 1], { extrapolateRight: "clamp" });
            const badgeOp = interpolate(frame, [22, 38], [0, 1], { extrapolateRight: "clamp" });
            const badgeScale = interpolate(frame, [22, 38], [0.5, 1], { extrapolateRight: "clamp" });
            return (
              <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 40 }}>
                <div style={{ opacity: op, transform: `scale(${scale})`, textAlign: "center", direction: "rtl" }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: "#facc15" }}>אני מוכן!</div>
                  <div style={{ fontSize: 38, color: "#a5b4fc", marginTop: 18, lineHeight: 1.5 }}>
                    כישורי Remotion טעונים ופעילים.
                    <br />
                    בואו ניצור סרטונים חינוכיים מדהימים!
                  </div>
                </div>
                <div style={{ opacity: badgeOp, transform: `scale(${badgeScale})`, background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: 24, padding: "24px 48px", textAlign: "center" }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: "#fff", direction: "rtl" }}>✅ כישורים פעילים</div>
                </div>
              </AbsoluteFill>
            );
          })()}
        </Series.Sequence>

      </Series>
    </AbsoluteFill>
  );
};

export default VideoComposition;