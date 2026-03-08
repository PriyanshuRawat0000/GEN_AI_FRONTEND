import { useEffect, useRef, useState } from "react";
const FACTORS = [
  "Prompt adherence",
  "Visual Quality",
  "Structural Correctness",
  "Composition",
  "Style Consistency",
  "Creativity",
];

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
          className={`text-xl ${
            v <= value ? "text-yellow-400" : "text-gray-300"
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
export default function RatingBlock({
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
