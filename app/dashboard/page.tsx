"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInView } from "react-intersection-observer";
import { Download } from "lucide-react";



interface Comparison {
  _id: string;
  prompt: string;
  author: string;
  inputImage?: string; 
  model1Image?: string;
  model1Ratings?: number[]; 
  model2Image?: string; 
  model2Ratings?: number[]; 
  
}

type Rating = {
  comparisonId: string;
  stars: number[];
};



const FACTORS = [
  "Prompt adherence",
  "Visual Quality",
  "Structural Correctness",
  "Composition",
  "Style Consistency",
  "Creativity",
];


export default function DashboardPage() {
  const [ratingsMap, setRatingsMap] = useState<{
    [comparisonId: string]: {
      user: {
        model1: number[] | null;
        model2: number[] | null;
      };
      avg: {
        image1?: number[] | null;
        image2?: number[] | null;
        count?: { image1: number; image2: number };
      };
    };
  }>({});

  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(comparisons.length / ITEMS_PER_PAGE);

  const paginatedComparisons = comparisons.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  useEffect(() => {
    setCurrentPage(1);
  }, [comparisons.length]);

  useEffect(() => {
    if (!email || comparisons.length === 0) return;

    async function loadBulkRatings() {
      try {
        const res = await fetch("/api/ratings/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comparisonIds: comparisons.map((c) => c._id),
            userEmail: email,
          }),
        });

        const data = await res.json();
        setRatingsMap(data);
      } catch (e) {
        console.error("Bulk ratings fetch failed", e);
      }
    }

    loadBulkRatings();
  }, [email, comparisons]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  }

  /*Auth */
  useEffect(() => {
    const e = localStorage.getItem("userEmail");
    if (!e) {
      router.replace("/");
      return;
    }
    setEmail(e);
  }, [router]);

  useEffect(() => {
    if (!email) return;

    async function load() {
      setLoading(true);

      const [imagesRes] = await Promise.all([fetch("/api/images")]);

      const images = await imagesRes.json();
      // //console.log("Loaded comparisons:", images);

      setComparisons(images);

      setLoading(false);
    }

    load();
  }, [email]);

  const logout = () => {
    localStorage.removeItem("userEmail");
    router.push("/");
  };

  if (!email || loading) {
    return <div className="p-8 text-center">Loading…</div>;
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
          {/* text area*/}
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
      <div className="w-[95%] mx-auto px-6">
    
        <div className="flex justify-end mb-3 px-2">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push("/newmodel")}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40"
            >
              Add New
            </button>
           
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${page === currentPage
                    ? "bg-blue-600 text-white"
                    : "bg-neutral-800 hover:bg-neutral-700"
                    }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden">
          
          <div className="grid grid-cols-4 bg-[#111111] border-b border-neutral-800 text-sm font-semibold text-neutral-300">
            <div className="px-4 py-3 capitalize">Input</div>
            <div className="px-4 py-3 capitalize">gemini-2.5-flash-image</div>
            <div className="px-4 py-3 capitalize">
              gemini-3-pro-image-preview
            </div>
            <div className="px-4 py-3 capitalize">Prompt</div>
          </div>

       

          <section className="divide-y divide-neutral-800">
            {paginatedComparisons.map((c) => (
              <ComparisonCard
                key={c._id}
                author={c.author}
                comparison={c}
                userEmail={email}
                ratings={ratingsMap[c._id]}
              />
            ))}

          </section>
        </div>
        
      </div>
    </main>
  );
}


export function renderUploadBox(
  file: File | null,
  setFile: (f: File | null) => void,
  label: string,
) {
  return (
    <label className="w-full max-w-2xl h-80 border border-dashed rounded-lg bg-[#111] flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition relative overflow-hidden">
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
        <span className="text-sm text-gray-400 text-center px-4">{label}</span>
      )}
    </label>
  );
}

// async function fetchInputImageFile(path: string) {
//   const res = await fetch(`/api/image-input?path=${encodeURIComponent(path)}`);

//   if (!res.ok) throw new Error("Image fetch failed");

//   const blob = await res.blob();
//   return new File([blob], "cloned-input.png", { type: blob.type });
// }
async function fetchInputImageFile(path: string): Promise<File> {
  if (!path) throw new Error("No path provided");

 
  const isRemoteUrl = /^https?:\/\//i.test(path);
  const fetchUrl = isRemoteUrl
    ? path
    : `/api/image-input?path=${encodeURIComponent(path)}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
  
    const txt = await res.text().catch(() => "");
    throw new Error(`Image fetch failed: ${res.status} ${res.statusText} ${txt}`);
  }

  const blob = await res.blob();

  
  let filename = "cloned-input.png";
  try {
    if (isRemoteUrl) {
      const u = new URL(path);
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last) filename = last.split("?")[0];
    } else {
     
      const last = path.split("/").filter(Boolean).pop();
      if (last) filename = last.split("?")[0];
    }
  } catch (e) {
    
  }

  const fileType = blob.type || "image/png";
  return new File([blob], filename, { type: fileType });
}
type BulkRatingsResponse = {
  [comparisonId: string]: {
    user: {
      model1: number[] | null;
      model2: number[] | null;
    };
    avg: {
      image1: number[] | null;
      image2: number[] | null;
      count: {
        image1: number;
        image2: number;
      };
    };
  };
};

function ComparisonCard({
  comparison,
  userEmail,
  ratings,
}: {
  comparison: Comparison;
  userEmail: string;
  author: string;
  ratings?: {
    user: {
      model1: number[] | null;
      model2: number[] | null;
    };
    avg: {
      image1?: number[] | null;
      image2?: number[] | null;
      count?: { image1: number; image2: number };
    };
  };
}) {
  const [inputUrl, setInputUrl] = useState("");
  const [model1Url, setModel1Url] = useState("");
  const [model2Url, setModel2Url] = useState("");
  const [model1Stars, setModel1Stars] = useState<number[] | null>(null);
  const [model2Stars, setModel2Stars] = useState<number[] | null>(null);
  const [loadingRatings, setLoadingRatings] = useState(!ratings);

  const [isCloneOpen, setIsCloneOpen] = useState(false);
  const [clonePrompt, setClonePrompt] = useState("");
  const [cloneInputImageUrl, setCloneInputImageUrl] = useState<string | null>(
    null,
  );
  const [cloneInputImageFile, setCloneInputImageFile] = useState<File | null>(
    null,
  );

  const [modalContent, setModalContent] = useState<string | null>(null);
  const [isPrompt, setIsPrompt] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [avg, setAvg] = useState<{
    image1?: number[] | null;
    image2?: number[] | null;
    count?: { image1: number; image2: number };
  }>({});

  const { ref: inputRef, inView: inputInView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });
  const { ref: m1Ref, inView: m1InView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });
  const { ref: m2Ref, inView: m2InView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });

  useEffect(() => {
    fetchAvg();
  }, [comparison._id]);

  useEffect(() => {
    if (!ratings) return;

    setModel1Stars(ratings.user.model1);
    setModel2Stars(ratings.user.model2);
    setAvg(ratings.avg);
    setLoadingRatings(false);
  }, [ratings]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  }
  
  useEffect(() => {
    if (inputInView && comparison.inputImage) {
      setInputUrl(comparison.inputImage);
    }

    if (m1InView && comparison.model1Image) {
      setModel1Url(comparison.model1Image);
    }

    if (m2InView && comparison.model2Image) {
      setModel2Url(comparison.model2Image);
    }
  }, [comparison, inputInView, m1InView, m2InView]);

  const openModal = (content: string, prompt = false) => {
    setModalContent(content);
    setIsPrompt(prompt);
  };
  const closeModal = () => {
    setModalContent(null);
    setIsPrompt(false);
  };

  async function fetchAvg() {
    const res = await fetch(
      `/api/ratings/average?comparisonId=${comparison._id}`,
    );
    const data = await res.json();
    setAvg(data);
  }

  // async function handleCloneOpen() {
  //   setClonePrompt(comparison.prompt);

  //   if (comparison.inputImage) {
  //     try {
  //       const file = await fetchInputImageFile(comparison.inputImage);
  //       setCloneInputImageFile(file);
  //     } catch (e) {
  //       console.error(e);
  //     }
  //   }

  //   setIsCloneOpen(true);
  // }

  async function handleCloneOpen() {
    setClonePrompt(comparison.prompt);

    if (comparison.inputImage) {
      try {
        
        const file = await fetchInputImageFile(comparison.inputImage);
        setCloneInputImageFile(file);
      } catch (e) {
        console.error("Failed to fetch input image for clone:", e);

     
      }
    }

    setIsCloneOpen(true);
  }

  
  const handleDownload = (imageUrl?: string) => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = imageUrl.split("/").pop() || "image.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <>
      <div className="overflow-x-auto border border-gray-700 bg-[#0b0b0b] p-4">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-51">
            <div className="bg-green-500 text-[#ffffff] text-md px-4 py-2 rounded-md shadow-md border border-green-500">
              {toast}
            </div>
          </div>
        )}

        <div className="min-w-250 grid grid-cols-4 gap-4">
          
          <div className="flex flex-col items-center">
            <div
              ref={inputRef}
              className=" relative w-full max-w-xs h-64 border rounded-lg overflow-hidden bg-gray-100"
            >
              {inputUrl ? (
                <>
                  <img
                    src={inputUrl}
                    alt="Input"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openModal(inputUrl)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDownload(inputUrl)}
                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No input image
                </div>
              )}
            </div>
          </div>

          {/* M1 */}
          <div className="flex flex-col items-center">
            <div
              ref={m1Ref}
              className=" relative w-full max-w-xs h-64 border rounded-lg overflow-hidden bg-gray-100"
            >
              {model1Url ? (
                <>
                  <img
                    src={model1Url}
                    alt="Model 1"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openModal(model1Url)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDownload(model1Url)}
                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No image
                </div>
              )}
            </div>

            {avg.image1 && (
              <div className="mt-3 text-sm text-neutral-400 border-t border-neutral-700 pt-3">
                <div className="font-semibold mb-2">
                  Community Avg ({avg.count?.image1}) Raters
                </div>
                {avg.image1.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center mb-1"
                  >
                    <span className="capitalize">{FACTORS[i]}</span>{" "}
                    &nbsp;&nbsp;&nbsp;
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <span
                          key={starIndex}
                          className={
                            starIndex < Math.round(v)
                              ? "text-yellow-400"
                              : "text-neutral-600"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loadingRatings ? (
              <div className="text-sm text-gray-400 mt-4">Loading ratings…</div>
            ) : (
              <RatingBlock
                comparisonId={comparison._id}
                userEmail={userEmail}
                model="model1"
                initialStars={model1Stars ?? Array(6).fill(0)}
                onSaved={fetchAvg}
              />
            )}
          </div>

          {/* M2 */}
          <div className="flex flex-col items-center">
            <div
              ref={m2Ref}
              className=" relative w-full max-w-xs h-64 border rounded-lg overflow-hidden bg-gray-100"
            >
              {model2Url ? (
                <>
                  <img
                    src={model2Url}
                    alt="Model 2"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => openModal(model2Url)}
                  />
                  <button
                    type="button"
                    onClick={() => handleDownload(model2Url)}
                    className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white p-2 rounded-full"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No image
                </div>
              )}
            </div>

            {avg.image2 && (
              <div className="mt-3 text-sm text-neutral-400 border-t border-neutral-700 pt-3">
                <div className="font-semibold mb-2">
                  Community Avg ({avg.count?.image2}) Raters
                </div>
                {avg.image2.map((v, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center mb-1 mr-2"
                  >
                    <span className="capitalize">{FACTORS[i]}</span>{" "}
                    &nbsp;&nbsp;&nbsp;
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <span
                          key={starIndex}
                          className={
                            starIndex < Math.round(v)
                              ? "text-yellow-400"
                              : "text-neutral-600"
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {loadingRatings ? (
              <div className="text-sm text-gray-400 mt-4">Loading ratings…</div>
            ) : (
              <RatingBlock
                comparisonId={comparison._id}
                userEmail={userEmail}
                model="model2"
                initialStars={model2Stars ?? Array(6).fill(0)}
                onSaved={fetchAvg}
              />
            )}
          </div>

          
          <div
            className="bg-[#191919] rounded cursor-pointer"
            onClick={() => openModal(comparison.prompt, true)}
          >
            
            <div className="sticky top-0 z-10 flex justify-end gap-2 bg-[#191919] p-2 border-b border-neutral-700">
              <p className="mr-auto max-w-20 truncate">
                {comparison.author?.split("@")[0]}
              </p>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(comparison.prompt);
                  showToast("Prompt copied");
                }}
                className="bg-gray-700 text-white px-2 py-1 text-xs rounded hover:bg-gray-600"
              >
                Copy
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloneOpen();
                }}
                className="bg-gray-700 text-white px-3 py-1 text-xs rounded hover:bg-gray-600"
              >
                Clone
              </button>
            </div>

           
            <div className="px-3 overflow-auto max-h-180 sleek-scrollbar">
              <p className="text-md whitespace-pre-wrap leading-relaxed">
                {comparison.prompt.trim()}
              </p>
            </div>
          </div>
        </div>
      </div>

      
      {modalContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={closeModal}
        >
          <div
            className="relative w-[80vw] h-[80vh] p-6 rounded-lg bg-[#191919] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-white"
              onClick={closeModal}
            >
              ✕
            </button>

            {isPrompt ? (
              <div className="relative h-full sleek-scrollbar">
                <button
                  className="absolute top-3 right-10 bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-600 z-10"
                  onClick={() => {
                    navigator.clipboard.writeText(modalContent || "");
                    showToast("Prompt copied");
                  }}
                >
                  Copy
                </button>
                <div className="bg-black text-white p-4 rounded-lg h-full overflow-auto whitespace-pre-wrap text-lg">
                  {modalContent}
                </div>
              </div>
            ) : (
              <img
                src={modalContent}
                alt="Expanded"
                className="w-full h-full object-contain rounded-lg"
              />
            )}
          </div>
        </div>
      )}
      
      {isCloneOpen && (
        <CloneCreateModal
          prompt={clonePrompt}
          setPrompt={setClonePrompt}
          inputImageFile={cloneInputImageFile}
          onClose={() => setIsCloneOpen(false)}
        />
      )}
    </>
  );
}
type PromptJob = {
  id: string; // frontend temp id
  prompt: string;

  loading: boolean;
  mongoId: string | null;

  model1Image: string | null;
  model2Image: string | null;
};


function CloneCreateModal({
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
            {<label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useModel1}
                onChange={() => setUseModel1((v) => !v)}
              />
              gemini-2.5-flash-image
            </label>}

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
export function GeneratedModel({
  label,
  disabled,
  imageUrl,
  comparisonId,
  userEmail,
  modelKey,
  prompt,
}: {
  label: string;
  disabled?: boolean;
  imageUrl?: string | null;
  comparisonId: string;
  userEmail: string | null;
  modelKey: "model1" | "model2";
  prompt?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="bg-[#191919] rounded border border-neutral-700 flex flex-col">
        
        <div className="px-3 py-2 text-xs text-gray-400 border-b border-neutral-700">
          {label}
        </div>

        
        <div className="flex-1 flex items-center justify-center p-3">
          {disabled ? (
            <div className="text-xs text-gray-500">Model disabled</div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={label}
              className="max-h-100 max-w-full object-contain rounded cursor-pointer hover:opacity-80 transition"
              onClick={() => setOpen(true)}
            />
          ) : (
            <div className="text-xs text-gray-500">No output yet</div>
          )}
        </div>

        
        {!disabled && imageUrl && (
          <div className="border-t border-neutral-700 px-3 py-2">
            <RatingBlock
              comparisonId={comparisonId}
              userEmail={userEmail}
              model={modelKey}
              initialStars={Array(6).fill(0)}
            />
          </div>
        )}
      </div>

     
      {/*ui */}
      
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)} // modal close
        >
          <div
            className="bg-[#121212] border border-neutral-700 rounded-lg p-4 max-w-4xl w-full shadow-xl"
            onClick={(e) => e.stopPropagation()} // prevent close when content is clicked
          >
            
            <img
              src={imageUrl!}
              alt="Preview Large"
              className="w-full max-h-[80vh] object-contain rounded"
            />

            
            <div className="mt-4 flex justify-end">
              <button
                className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 rounded transition border border-neutral-600"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



function RatingBlock({
  comparisonId,
  userEmail,
  model,
  initialStars,
  onSaved,
}: {
  comparisonId: string;
  userEmail: string | null;
  model: "model1" | "model2";
  initialStars?: number[];
  onSaved?: () => void;
}) {
  const [stars, setStars] = useState<number[]>(
    initialStars ?? Array(6).fill(0),
  );

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 1500);
  }

  // clear all stars
  const clear = () => setStars(Array(6).fill(0));

  
  const save = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comparisonId, userEmail, model, stars }),
      });
      if (!res.ok) throw new Error("Failed to save");
      
      showToast("Rating saved");
      onSaved?.();
    } catch (err) {
      console.error(err);
      alert("Error saving rating");
    } finally {
      setSaving(false);
    }
  };
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!hydratedRef.current && initialStars) {
      setStars(initialStars);
      hydratedRef.current = true;
    }
  }, [initialStars]);

  return (
    <div className="w-67 mt-5 max-w-sm space-y-4">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-51">
          <div className="bg-green-500 text-[#ffffff] text-md px-4 py-2 rounded-md shadow-md border border-green-500">
            {toast}
          </div>
        </div>
      )}
      {FACTORS.map((factor, i) => (
        <div key={factor} className="flex items-center justify-between gap-4">
          <span className="min-w-30 text-sm font-medium">{factor}</span>
          <StarRow
            value={stars[i]}
            onChange={(v) => {
              const next = [...stars];
              next[i] = v;
              setStars(next);
            }}
          />
        </div>
      ))}

      <div className="flex flex-col gap-3 mt-4">
        <button
          onClick={clear}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          disabled={saving}
        >
          Clear
        </button>

        <button
          onClick={save}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Rating"}
        </button>
      </div>
    </div>
  );
}


function StarRow({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`text-xl ${v <= value ? "text-yellow-400" : "text-gray-300"
            }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}


