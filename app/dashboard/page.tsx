"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ComparisonCard from "@/components/dashboard/comparisonCard";
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
    <main className="min-h-screen text-white bg-[#030303] 
bg-[radial-gradient(circle_at_top,rgba(79,124,255,0.12),transparent_40%)]">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#0f0f0f] text-white text-sm px-4 py-2 rounded-lg shadow-lg border border-neutral-800 z-50 backdrop-blur">
          {toast}
        </div>
      )}

      <header className="mb-14 px-6 pt-12">
        <div className="flex items-start justify-between max-w-7xl mx-auto">

          <div className="space-y-5 max-w-2xl">

            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              <span className="text-[#4f7cff]">PromptLens</span>
              <span className="text-neutral-200"> Dashboard</span>
            </h1>

            <p className="text-neutral-400 text-lg leading-relaxed">
              Compare outputs from multiple AI models and rate them across
              precision, creativity and structure.
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-700 hover:bg-neutral-800 transition"
          >
            Logout
          </button>

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