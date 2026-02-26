"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

export default function CreateComparisonCard() {
  const [prompt, setPrompt] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  }

  const router = useRouter();

  
  useEffect(() => {
    const e = localStorage.getItem("userEmail");
    if (!e) {
      router.replace("/");
      return;
    }

    setEmail(e);
    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="p-8 text-center text-white">Loading…</div>;
  }
  const logout = () => {
    localStorage.removeItem("userEmail");
    router.push("/");
  };
  function renderUploadBox(
    file: File | null,
    setFile: (f: File) => void,
    label: string
  ) {
    return (
      <label className="w-full max-w-xs h-64 border border-dashed rounded-lg bg-[#111] flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition">
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />

        {file ? (
          <img
            src={URL.createObjectURL(file)}
            className="w-full h-full object-cover rounded-lg"
            alt={label}
          />
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-400">{label}</span>
            <span className="text-xs text-gray-500 mt-1">PNG / JPG</span>
          </>
        )}
      </label>
    );
  }

  return (
    <main className="min-h-screen bg-[#030303] text-white">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-black text-white text-sm px-4 py-2 rounded shadow-lg border border-neutral-700 z-50">
          {toast}
        </div>
      )}

      <header className="mb-12 px-6 pt-10">
        <div className="flex justify-between items-start max-w-6xl mx-auto">
          {/* Text Section */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Analyze LLM{" "}
              <span className="text-[#4757FF] italic ">Outputs</span> with
              Precision.
            </h1>

            <p className="text-muted-foreground max-w-2xl text-lg">
              Track, compare, and version your prompts across multiple models.
              Built for teams shipping high-quality AI features.
            </p>
          </div>

          {/* Logout Button */}
          <div>
            <button
              onClick={logout}
              className="px-5 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <h1 className="text-2xl font-semibold mb-4 px-6 ">Create Image Comparison Based on your prompt</h1>
      <div className="overflow-x-auto border border-gray-700 bg-[#0b0b0b] p-4">
        <div className="min-w-225 grid grid-cols-4 gap-4">
          {/* Input Image */}
          <div className="flex flex-col items-center">
            {renderUploadBox(inputImage, setInputImage, "Upload Input Image")}
          </div>

          {/* Model 1 (Generated) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xs h-64 border rounded-lg bg-[#111] flex items-center justify-center">
              <span className="text-sm text-gray-500 text-center px-4">
                Model 1 output will appear here after generation
              </span>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              gemini-2.5-flash-image
            </div>
          </div>

          {/* Model 2 (Generated) */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-xs h-64 border rounded-lg bg-[#111] flex items-center justify-center">
              <span className="text-sm text-gray-500 text-center px-4">
                Model 2 output will appear here after generation
              </span>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              gemini-3-pro-image-preview
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-[#191919] rounded flex flex-col">
            <div className="p-2 border-b border-neutral-700 text-sm text-gray-400">
              Prompt
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the exact prompt used for generation…"
              className="flex-1 bg-transparent p-3 text-sm resize-none outline-none sleek-scrollbar text-white"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
