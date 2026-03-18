"use client";

import { useState } from "react";

type Status = "idle" | "generating" | "done" | "error";

interface GenerationResult {
  videoUrl: string;
  audioUrl: string;
  generatedCode: string;
  voiceoverScript: string;
  duration: number;
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [skipAudio, setSkipAudio] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(false);

  async function handleGenerate() {
    if (!topic.trim()) return;

    setStatus("generating");
    setStatusMessage("Generating video content with Claude...");
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), skipAudio }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      setStatus("done");
      setStatusMessage("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      setError(message);
      setStatus("error");
      setStatusMessage("");
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Math Video Generator</h1>
          <p className="text-gray-400 text-lg">
            Create short educational math reels with Hebrew voiceover
          </p>
        </div>

        {/* Input */}
        <div className="mb-8">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && status !== "generating" && handleGenerate()
              }
              placeholder="Enter a math topic (e.g., Pythagorean theorem, quadratic equations)"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={status === "generating"}
            />
            <button
              onClick={handleGenerate}
              disabled={status === "generating" || !topic.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {status === "generating" ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none mt-3">
            <input
              type="checkbox"
              checked={skipAudio}
              onChange={(e) => setSkipAudio(e.target.checked)}
              disabled={status === "generating"}
              className="w-4 h-4 accent-blue-500"
            />
            Skip audio (test video only)
          </label>
        </div>

        {/* Status */}
        {status === "generating" && (
          <div className="mb-8 p-4 bg-blue-900/30 border border-blue-800 rounded-lg">
            <p className="text-blue-300">{statusMessage}</p>
            <p className="text-blue-400/60 text-sm mt-1">
              This may take a few minutes...
            </p>
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="mb-8 p-4 bg-red-900/30 border border-red-800 rounded-lg">
            <p className="text-red-300 font-medium">Generation failed</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Result */}
        {status === "done" && result && (
          <div className="space-y-6">
            {/* Video Player */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <video
                controls
                className="w-full max-h-[600px] mx-auto"
                src={result.videoUrl}
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Info & Download */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                Duration: {Math.round(result.duration)}s
              </span>
              <a
                href={result.videoUrl}
                download
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                Download MP4
              </a>
            </div>

            {/* Voiceover Script */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">
                Voiceover Script
              </h3>
              <p
                className="text-gray-200 leading-relaxed"
                dir="rtl"
                style={{ textAlign: "right" }}
              >
                {result.voiceoverScript}
              </p>
            </div>

            {/* Code Viewer */}
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <button
                onClick={() => setShowCode(!showCode)}
                className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
              >
                <span>Generated Remotion Code</span>
                <span>{showCode ? "Hide" : "Show"}</span>
              </button>
              {showCode && (
                <pre className="px-4 pb-4 text-sm text-gray-300 overflow-x-auto max-h-[500px] overflow-y-auto">
                  <code>{result.generatedCode}</code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
