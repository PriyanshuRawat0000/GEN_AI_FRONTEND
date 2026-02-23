// Rating factor definitions and utilities

export const RATING_FACTORS = [
  { id: 0, label: "Prompt Adherence" },
  { id: 1, label: "Visual Realism" },
  { id: 2, label: "Detail Quality" },
  { id: 3, label: "Lighting & Composition" },
  { id: 4, label: "Artifact Handling" },
  { id: 5, label: "Overall Usefulness" },
] as const

export const EMPTY_RATING: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]

export const formatRating = (rating: [number, number, number, number, number, number]) => {
  return {
    promptAdherence: rating[0],
    visualRealism: rating[1],
    detailQuality: rating[2],
    lightingComposition: rating[3],
    artifactHandling: rating[4],
    overallUsefulness: rating[5],
  }
}

export const averageRating = (ratings: [number, number, number, number, number, number][]) => {
  if (ratings.length === 0) return EMPTY_RATING
  const sum: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]
  for (const rating of ratings) {
    for (let i = 0; i < 6; i++) {
      sum[i] += rating[i]
    }
  }
  return sum.map((s) => s / ratings.length) as [number, number, number, number, number, number]
}
