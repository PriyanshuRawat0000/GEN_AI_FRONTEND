import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Download } from "lucide-react";
import renderUploadBox from "@/components/dashboard/renderUploadBox";
import GeneratedModel from "@/components/dashboard/generateModel";

type PromptJob = {
  id: string;
  prompt: string;

  loading: boolean;
  mongoId: string | null;

  model1Image: string | null;
  model2Image: string | null;
};
export default function CloneCreateModal({
  prompt,
  setPrompt,
  inputImageFile,
  onClose,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  inputImageFile: File | null;
  onClose: () => void;
}) {
  const [inputImage, setInputImage] = useState<File | null>(inputImageFile);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<PromptJob[]>([
    {
      id: crypto.randomUUID(),
      prompt: prompt,
      loading: false,
      mongoId: null,
      model1Image: null,
      model2Image: null,
    },
  ]);

  const [useModel1, setUseModel1] = useState(false);
  const [useModel2, setUseModel2] = useState(false);
  const [model1Image, setModel1Image] = useState<string | null>(null);
  const [model2Image, setModel2Image] = useState<string | null>(null);
  const [mongoId, setMongoId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!inputImage) return alert("Input image required");

    const models: string[] = [];
    if (useModel1) models.push("gemini-2.5-flash-image");
    if (useModel2) models.push("gemini-3-pro-image-preview");
    if (!models.length) return alert("Select at least one model");

    setLoading(true);

    try {
      const tasks = jobs
        .filter((job) => job.prompt.trim())
        .map(async (job) => {
          const form = new FormData();
          form.append("image", inputImage);
          form.append("prompt", job.prompt);
          form.append("author", userEmail || "S");
          models.forEach((m) => form.append("models", m));

          const res = await fetch(
            "https://gen-ai-backend-kutx.onrender.com/generate",
            {
              method: "POST",
              body: form,
            },
          );

          if (!res.ok) throw new Error(await res.text());

          const data: {
            mongoId: string;
            model1?: string;
            model2?: string;
          } = await res.json();

          setJobs((all) =>
            all.map((j) =>
              j.id === job.id
                ? {
                    ...j,
                    mongoId: data.mongoId,
                    model1Image: data.model1 ?? null,
                    model2Image: data.model2 ?? null,
                  }
                : j,
            ),
          );
        });

      await Promise.all(tasks);
    } catch (e) {
      console.error("Generation failed", e);
      alert("Generation failed. Check console.");
    } finally {
      setLoading(false);
    }
  }
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    const e = localStorage.getItem("userEmail");
    if (!e) {
      router.replace("/");
      return;
    }
    setUserEmail(e);
  }, [router]);

  useEffect(() => {
    setInputImage(inputImageFile);
  }, [inputImageFile]);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-[95vw] h-[95vh] max-w-7xl bg-[#0b0b0b] border border-neutral-700 rounded-lg flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-700">
          <h2 className="text-xl font-semibold text-white">
            Create Image Comparison
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 sleek-scrollbar space-y-6">
          {/* selection part */}
          <div className="flex gap-6 text-sm text-gray-300">
            {
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useModel1}
                  onChange={() => setUseModel1((v) => !v)}
                />
                gemini-2.5-flash-image
              </label>
            }

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useModel2}
                onChange={() => setUseModel2((v) => !v)}
              />
              gemini-3-pro-image-preview
            </label>
          </div>

          <div className="max-w-md mx-auto">
            {renderUploadBox(
              inputImage,
              setInputImage,
              "Upload / Change Input Image",
            )}
          </div>

          <div className="space-y-8">
            {jobs.map((job, idx) => (
              <div
                key={job.id}
                className="border border-neutral-700 rounded-lg p-4 space-y-4 bg-[#111]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">
                    Prompt {idx + 1}
                  </h3>

                  {jobs.length > 1 && (
                    <button
                      className="text-xs text-gray-400 hover:text-white"
                      onClick={() =>
                        setJobs((j) => j.filter((x) => x.id !== job.id))
                      }
                    >
                      ✕
                    </button>
                  )}
                </div>

                <textarea
                  value={job.prompt}
                  onChange={(e) =>
                    setJobs((all) =>
                      all.map((j) =>
                        j.id === job.id ? { ...j, prompt: e.target.value } : j,
                      ),
                    )
                  }
                  placeholder={`Enter prompt ${idx + 1}`}
                  className="w-full min-h-70 bg-[#0b0b0b] p-4 text-sm resize-y outline-none text-white border border-neutral-700 rounded"
                />

                <div className="grid grid-cols-2 gap-4">
                  <GeneratedModel
                    label="gemini-2.5-flash-image"
                    disabled={!useModel1}
                    imageUrl={job.model1Image}
                    comparisonId={job.mongoId ?? "temp"}
                    userEmail={userEmail}
                    modelKey="model1"
                    prompt={job.prompt}
                  />

                  <GeneratedModel
                    label="gemini-3-pro-image-preview"
                    disabled={!useModel2}
                    imageUrl={job.model2Image}
                    comparisonId={job.mongoId ?? "temp"}
                    userEmail={userEmail}
                    modelKey="model2"
                    prompt={job.prompt}
                  />
                </div>
              </div>
            ))}

            {/* add prompt */}
            {jobs.length < 2 && (
              <button
                className="text-xs px-3 py-2 border border-neutral-600 rounded hover:bg-neutral-800 text-gray-300 w-fit"
                onClick={() =>
                  setJobs((j) => [
                    ...j,
                    {
                      id: crypto.randomUUID(),
                      prompt: "",
                      loading: false,
                      mongoId: null,
                      model1Image: null,
                      model2Image: null,
                    },
                  ])
                }
              >
                + Add prompt
              </button>
            )}
          </div>
        </div>

        {/* fooetr */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 text-sm bg-white text-black rounded disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
