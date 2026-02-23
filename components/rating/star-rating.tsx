"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"

const RATING_FACTORS = [
  { id: 0, label: "Quality" },
  { id: 1, label: "Accuracy" },
  { id: 2, label: "Detail" },
  { id: 3, label: "Color" },
  { id: 4, label: "Lighting" },
  { id: 5, label: "Overall" },
]

const EMPTY_RATING: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]

export default function StarRating({
  imageId,
  model,
  userRating,
  avgRating,
  userId,
  onRatingChange,
}: {
  imageId: string
  model: "model1" | "model2"
  userRating: [number, number, number, number, number, number]
  avgRating: [number, number, number, number, number, number]
  userId: string | null
  onRatingChange: (rating: [number, number, number, number, number, number]) => void
}) {
  const [hoveredFactor, setHoveredFactor] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  if (!userId) {
    return <div className="text-sm text-muted-foreground">Log in to rate this model</div>
  }

  const handleStarClick = async (factorIndex: number, starValue: number) => {
    const newRating = [...userRating] as [number, number, number, number, number, number]
    newRating[factorIndex] = starValue

    setSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.error("[Star Rating] No auth token found")
        return
      }

      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageId,
          model,
          stars: newRating,
        }),
      })

      if (response.ok) {
        onRatingChange(newRating)
      } else {
        console.error("[Star Rating] Failed to save rating:", response.status)
      }
    } catch (error) {
      console.error("[Star Rating] Error saving rating:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleClearRating = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        console.error("[Star Rating] No auth token found")
        return
      }

      const response = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageId,
          model,
          stars: EMPTY_RATING,
        }),
      })

      if (response.ok) {
        onRatingChange(EMPTY_RATING)
      } else {
        console.error("[Star Rating] Failed to clear rating:", response.status)
      }
    } catch (error) {
      console.error("[Star Rating] Error clearing rating:", error)
    } finally {
      setSaving(false)
    }
  }

  const hasAnyRating = userRating.some((v) => v > 0)

  return (
    <div className="space-y-4 bg-muted p-4 rounded-lg">
      {/* Factor Grid */}
      <div className="space-y-3">
        {RATING_FACTORS.map(({ id, label }) => (
          <div key={id} className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground">{label}</label>
              <span className="text-xs text-muted-foreground">
                {userRating[id] > 0 && `You: ${userRating[id]}`}
                {userRating[id] > 0 && avgRating[id] > 0 && " • "}
                {avgRating[id] > 0 && `Avg: ${avgRating[id].toFixed(1)}`}
              </span>
            </div>

            {/* Stars */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(id, star)}
                  onMouseEnter={() => setHoveredFactor(id)}
                  onMouseLeave={() => setHoveredFactor(null)}
                  className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                  aria-label={`Rate ${star} stars`}
                  disabled={saving}
                >
                  <Star
                    size={18}
                    className={
                      star <= (hoveredFactor === id ? userRating[id] : userRating[id])
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button size="sm" variant="default" disabled={!hasAnyRating || saving} className="flex-1">
          Ratings Saved
        </Button>
        {hasAnyRating && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearRating}
            disabled={saving}
            className="flex-1 bg-transparent"
          >
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}
