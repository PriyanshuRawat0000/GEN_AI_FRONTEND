"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GeneratedModel from "@/components/dashboard/generateModel";
import renderUploadBox from "@/components/dashboard/renderUploadBox";

type PromptJob = {
    id: string;
    prompt: string;

    loading: boolean;
    mongoId: string | null;

    model1Image: string | null;
    model2Image: string | null;
};

export default function CreateNewModal({
    inputImageFile,
    onClose,
}: {
    inputImageFile?: File | null;
    onClose: () => void;
}) {
    const [inputImage, setInputImage] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [jobs, setJobs] = useState<PromptJob[]>([
        {
            id: crypto.randomUUID(),
            prompt: "",
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
                    if (inputImage) {
                        form.append("image", inputImage);
                    }
                    form.append("prompt", job.prompt);
                    form.append("author", userEmail || "S");
                    models.forEach((m) => form.append("models", m));

                    const res = await fetch("https://gen-ai-backend-kutx.onrender.com/generate", {
                        method: "POST",
                        body: form,
                    });

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
        setInputImage(inputImageFile ?? null);
    }, [inputImageFile]);

    return (
        <main className="min-h-screen w-full text-white py-12 bg-[#030303] 
bg-[radial-gradient(circle_at_top,rgba(79,124,255,0.12),transparent_40%)]">
            <div className=" mx-auto px-6">
                <div className="flex items-start justify-between mb-10">

                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">
                            Create Comparison
                        </h1>

                        <p className="text-neutral-400 text-sm">
                            Generate outputs from multiple AI models and compare them side-by-side.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 rounded-md border border-neutral-700 hover:bg-neutral-800 text-sm transition"
                        >
                            Back
                        </button>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="px-5 py-2 rounded-md bg-[#4f7cff] hover:bg-[#3b66ff] text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? "Generating..." : "Generate"}
                        </button>
                    </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    <aside className="md:col-span-1 bg-[#0b0b0b] border border-neutral-800 rounded-xl p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                        <h3 className="text-sm font-semibold text-neutral-200 mb-4 uppercase tracking-wide">Input Image</h3>
                        <div className="mb-4">
                            {renderUploadBox(inputImage, setInputImage, "Upload / Change Input Image")}
                        </div>

                        <div className="mt-4">
                            <h4 className="text-xs text-neutral-400 mb-2">Models</h4>
                            <div className="flex flex-col gap-3 mt-2">
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={useModel1} onChange={() => setUseModel1(v => !v)} />
                                    <span className="text-neutral-300">gemini-2.5-flash-image</span>
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <input type="checkbox" checked={useModel2} onChange={() => setUseModel2(v => !v)} />
                                    <span className="text-neutral-300">gemini-3-pro-image-preview</span>
                                </label>
                            </div>
                        </div>
                    </aside>

                    <section className="md:col-span-2 space-y-6">
                        {jobs.map((job, idx) => (
                            <div key={job.id} className="bg-[#0b0b0b] border border-neutral-800 rounded-lg p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-semibold">Prompt {idx + 1}</h3>
                                            {jobs.length > 1 && (
                                                <button className="text-xs text-neutral-400 hover:text-white" onClick={() => setJobs(j => j.filter(x => x.id !== job.id))}>Remove</button>
                                            )}
                                        </div>

                                        <textarea
                                            value={job.prompt}
                                            onChange={(e) => setJobs(all => all.map(j => j.id === job.id ? { ...j, prompt: e.target.value } : j))}
                                            placeholder={`Enter prompt ${idx + 1}`}
                                            className="w-full min-h-36 bg-[#050506] p-3 text-sm resize-y outline-none text-white border border-neutral-700 rounded-md focus:border-[#4f7cff] focus:ring-1 focus:ring-[#4f7cff] transition sleek-scrollbar"
                                        />
                                    </div>

                                </div>

                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <GeneratedModel label="gemini-2.5-flash-image" disabled={!useModel1} imageUrl={job.model1Image} comparisonId={job.mongoId ?? 'temp'} userEmail={userEmail} modelKey="model1" prompt={job.prompt} />
                                    <GeneratedModel label="gemini-3-pro-image-preview" disabled={!useModel2} imageUrl={job.model2Image} comparisonId={job.mongoId ?? 'temp'} userEmail={userEmail} modelKey="model2" prompt={job.prompt} />
                                </div>
                            </div>
                        ))}

                        <div>
                            {jobs.length < 2 && (
                                <button
                                    className="text-sm px-4 py-2 border border-neutral-700 rounded-md hover:bg-neutral-800 text-neutral-300 transition"
                                    onClick={() => setJobs(j => [...j, { id: crypto.randomUUID(), prompt: '', loading: false, mongoId: null, model1Image: null, model2Image: null }])}
                                >
                                    + Add prompt
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}