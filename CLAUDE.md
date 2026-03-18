# remotion-proto — CLAUDE.md

## Project Overview
AI-powered educational math video generator for Hebrew-speaking students.
Generates Remotion React components + Hebrew voiceover via Claude CLI + ElevenLabs TTS, then renders to MP4.

## Tech Stack
- **Next.js 15** (App Router, Turbopack) + React 19
- **Remotion 4.0.431** — programmatic video rendering
- **Claude CLI** (`claude -p -`) — spawned as subprocess for component/voiceover generation
- **ElevenLabs** (`eleven_multilingual_v2`) — Hebrew TTS
- **TypeScript 5** with Tailwind CSS 4

## Dev Commands
```bash
cd remotion-proto
npm run dev          # Next.js dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

> **Important**: Run from a separate terminal, NOT from within a Claude Code session.
> Claude CLI subprocess will be blocked by `CLAUDECODE` env var if run from inside Claude Code.

## Environment Variables (`.env.local`)
```
ELEVENLABS_API_KEY=your_key_here
# ANTHROPIC_API_KEY not needed — uses Claude CLI, not SDK
```

## Key File Locations
| File | Purpose |
|------|---------|
| `src/app/api/generate/route.ts` | Main API handler — orchestrates Claude → ElevenLabs → Remotion render |
| `src/lib/claude.ts` | Spawns `claude -p -` CLI subprocess, pipes prompt via stdin |
| `src/lib/elevenlabs.ts` | ElevenLabs TTS API wrapper |
| `src/lib/audio-utils.ts` | Audio duration detection |
| `src/lib/prompt-template.ts` | User prompt enhancement |
| `prompts/system-prompt.txt` | System prompt piped to Claude CLI |
| `src/remotion/Root.tsx` | Remotion composition registration |
| `src/remotion/index.ts` | Remotion entry point |
| `src/remotion/generated/VideoComposition.tsx` | Generated component (overwritten each run) |
| `scripts/render.ts` | Remotion render script (called via `npx ts-node`) |
| `skills/remotion-best-practices/` | Local Remotion skills for Claude CLI |

## Architecture
```
Browser → POST /api/generate →
  1. generateWithClaude(topic)  → spawn "claude -p -" (stdin = system+user prompt)
                                → returns TSX component + Hebrew voiceover script
  2. generateVoiceover()        → ElevenLabs API → public/audio/voiceover-{jobId}.mp3
     (or silent WAV if skipAudio=true)
  3. Write VideoComposition.tsx → src/remotion/generated/
  4. execFileAsync("npx ts-node scripts/render.ts") → public/videos/video-{jobId}.mp4
  5. Return { videoUrl, audioUrl, generatedCode, voiceoverScript, duration }
```

## Known Gotchas

### Claude CLI subprocess
- Must use `shell: true` on Windows so `claude` is found in PATH
- System prompt is piped via **stdin** (not `--system-prompt` arg) to avoid cmd.exe shell escaping of multi-line content with backticks
- Combined format: `${systemPrompt}\n\n---\n\n${userPrompt}` written to proc.stdin

### ElevenLabs Voice
- Voice ID `pNInz6obpgDQGcFmaJgB` (Adam, premade) — free-tier compatible
- Library voices (e.g. Rachel `21m00Tcm4TlvDq8ikWAM`) → 402 error on free tier
- Model: `eleven_multilingual_v2`
- Hebrew quality may be suboptimal; consider `eleven_flash_v2_5` or Google TTS

### Remotion render
- Render script called via `execFileAsync("npx", [...], { shell: true })` — needs `shell: true`
- Output: `public/videos/`, audio: `public/audio/`, generated code: `public/generated/`
- All these directories must exist before render (created with `mkdir -p` as needed)

### skipAudio mode
- When `skipAudio=true`: writes a 30s silent WAV to `public/audio/voiceover-{jobId}.mp3`
  so Remotion's `staticFile()` resolves without error

### Remotion Skills
- Skills in `skills/remotion-best-practices/` and `.claude/skills/` are loaded by the Claude CLI subprocess automatically
- These are active by default in `-p` mode (opt-out is `--disable-slash-commands`)
