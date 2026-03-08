import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import CloneCreateModal from "@/components/dashboard/clone-create-modal";
import RatingBlock from "@/components/dashboard/ratingBlock";

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

const FACTORS = [
  "Prompt adherence",
  "Visual Quality",
  "Structural Correctness",
  "Composition",
  "Style Consistency",
  "Creativity",
];
async function fetchInputImageFile(path: string): Promise<File> {
  if (!path) throw new Error("No path provided");

  const isRemoteUrl = /^https?:\/\//i.test(path);
  const fetchUrl = isRemoteUrl
    ? path
    : `/api/image-input?path=${encodeURIComponent(path)}`;

  const res = await fetch(fetchUrl);
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `Image fetch failed: ${res.status} ${res.statusText} ${txt}`,
    );
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
  } catch (e) {}

  const fileType = blob.type || "image/png";
  return new File([blob], filename, { type: fileType });
}

export default function ComparisonCard({
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

            <div className="px-3 overflow-auto max-h-195 sleek-scrollbar">
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
