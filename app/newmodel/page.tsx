"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GeneratedModel, renderUploadBox } from "../dashboard/page";


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
        <main className="min-h-screen bg-[#050506] text-white py-12">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">Create Image Comparison</h1>
                        <p className="text-sm text-neutral-400 mt-1">Generate and compare model outputs side-by-side.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sm"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="px-4 py-2 rounded bg-[#4757FF] hover:bg-[#3648d6] text-sm font-medium disabled:opacity-60"
                        >
                            {loading ? "Generating…" : "Generate"}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <aside className="md:col-span-1 bg-[#0b0b0b] border border-neutral-800 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-neutral-300 mb-3">Input Image</h3>
                        <div className="mb-4">
                            {renderUploadBox(inputImage, setInputImage, "Upload / Change Input Image")}
                        </div>

                        <div className="mt-4">
                            <h4 className="text-xs text-neutral-400 mb-2">Models</h4>
                            <div className="flex flex-col gap-2">
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
                                            className="w-full min-h-36 bg-[#060607] p-3 text-sm resize-y outline-none text-white border border-neutral-700 rounded shadow-sm sleek-scrollbar"
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
                                    className="text-xs px-3 py-2 border border-neutral-600 rounded hover:bg-neutral-800 text-gray-300"
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