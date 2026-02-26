"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import StarRating from "@/components/rating/star-rating"

export type ImageComparisonProps = {
  _id: string
  inputImage: string
  model1Image: string
  model2Image: string
  prompt: string
  model1Ratings: Array<{
    userId: string
    stars: [number, number, number, number, number, number]
    ratedAt: string
  }>
  model2Ratings: Array<{
    userId: string
    stars: [number, number, number, number, number, number]
    ratedAt: string
  }>
  model1AverageRating: [number, number, number, number, number, number]
  model2AverageRating: [number, number, number, number, number, number]
}

const EMPTY_RATING: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0]

export default function ImageComparison({
  image,
  userId,
}: {
  image: ImageComparisonProps
  userId: string | null
}) {
  const [userRatingModel1, setUserRatingModel1] = useState(EMPTY_RATING)
  const [userRatingModel2, setUserRatingModel2] = useState(EMPTY_RATING)
  const [avgRatingModel1, setAvgRatingModel1] = useState(image.model1AverageRating)
  const [avgRatingModel2, setAvgRatingModel2] = useState(image.model2AverageRating)

  useEffect(() => {
    if (!userId) return

    
    const userM1Rating = image.model1Ratings.find((r) => r.userId === userId)
    const userM2Rating = image.model2Ratings.find((r) => r.userId === userId)

    setUserRatingModel1(userM1Rating?.stars || EMPTY_RATING)
    setUserRatingModel2(userM2Rating?.stars || EMPTY_RATING)
    setAvgRatingModel1(image.model1AverageRating)
    setAvgRatingModel2(image.model2AverageRating)
  }, [image, userId])

  return (
    <Card className="overflow-hidden">
      
      <div className="bg-muted p-6 border-b border-border">
        <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Prompt</h3>
        <p className="text-base text-foreground">{image.prompt}</p>
      </div>

      {/* Images Grid */}
      <div className="grid md:grid-cols-3 gap-6 p-6">
        {/* Input Image */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Input Image</h4>
          <div className="bg-muted rounded-lg overflow-hidden aspect-square relative">
            <img src={image.inputImage || "/placeholder.svg"} alt="Input" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Model 1 */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Model 1 Output</h4>
          <div className="bg-muted rounded-lg overflow-hidden aspect-square relative mb-4">
            <img src={image.model1Image || "/placeholder.svg"} alt="Model 1" className="w-full h-full object-cover" />
          </div>
          <StarRating
            imageId={image._id}
            model="model1"
            userRating={userRatingModel1}
            avgRating={avgRatingModel1}
            userId={userId}
            onRatingChange={(newRating) => setUserRatingModel1(newRating)}
          />
        </div>

        {/* Model 2 */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Model 2 Output</h4>
          <div className="bg-muted rounded-lg overflow-hidden aspect-square relative mb-4">
            <img src={image.model2Image || "/placeholder.svg"} alt="Model 2" className="w-full h-full object-cover" />
          </div>
          <StarRating
            imageId={image._id}
            model="model2"
            userRating={userRatingModel2}
            avgRating={avgRatingModel2}
            userId={userId}
            onRatingChange={(newRating) => setUserRatingModel2(newRating)}
          />
        </div>
      </div>
    </Card>
  )
}
