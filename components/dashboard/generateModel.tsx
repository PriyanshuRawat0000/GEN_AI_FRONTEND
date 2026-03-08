import { useState } from "react";
import RatingBlock from "@/components/dashboard/ratingBlock";

export default function GeneratedModel({
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
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#121212] border border-neutral-700 rounded-lg p-4 max-w-4xl w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
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