import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/db";

const FACTOR_COUNT = 6;

function calculateAverage(ratings: any[]) {
  if (!Array.isArray(ratings) || ratings.length === 0) return null;

  const sum = Array(FACTOR_COUNT).fill(0);

  ratings.forEach((r) => {
    if (!Array.isArray(r.stars)) return;
    r.stars.forEach((v: number, i: number) => {
      sum[i] += Number(v) || 0;
    });
  });

  return sum.map((v) =>
    Number((v / ratings.length).toFixed(2))
  );
}

export async function GET(req: NextRequest) {
  try {
    const comparisonId = req.nextUrl.searchParams.get("comparisonId");

    if (!comparisonId || !ObjectId.isValid(comparisonId)) {
      return NextResponse.json(
        { error: "Invalid comparisonId" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const image = await db
      .collection("Images")
      .findOne({ _id: new ObjectId(comparisonId) });

    if (!image) {
      return NextResponse.json(
        { error: "Comparison not found" },
        { status: 404 }
      );
    }

    const image1Ratings = image.model1Ratings || [];
    const image2Ratings = image.model2Ratings || [];

    return NextResponse.json(
      {
        image1: calculateAverage(image1Ratings),
        image2: calculateAverage(image2Ratings),
        count: {
          image1: image1Ratings.length,
          image2: image2Ratings.length,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[AVG RATINGS PER IMAGE]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
