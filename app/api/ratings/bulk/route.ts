import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { comparisonIds, userEmail } = await req.json();

    if (!Array.isArray(comparisonIds) || comparisonIds.length === 0) {
      return NextResponse.json({});
    }

    const ids = comparisonIds
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    const { db } = await connectToDatabase();

    const user = userEmail
      ? await db.collection("Users").findOne({ email: userEmail })
      : null;

    const images = await db
      .collection("Images")
      .find({ _id: { $in: ids } })
      .toArray();

    const response: any = {};

    for (const image of images) {
      const key = image._id.toString();

      const model1Ratings = image.model1Ratings ?? [];
      const model2Ratings = image.model2Ratings ?? [];

      const avg1 = computeAvg(model1Ratings);
      const avg2 = computeAvg(model2Ratings);

      let userModel1 = null;
      let userModel2 = null;

      if (user) {
        const uid = new ObjectId(user._id);
        userModel1 =
          model1Ratings.find((r: any) => r.raterId.equals(uid))?.stars ??
          null;
        userModel2 =
          model2Ratings.find((r: any) => r.raterId.equals(uid))?.stars ??
          null;
      }

      response[key] = {
        user: {
          model1: userModel1,
          model2: userModel2,
        },
        avg: {
          image1: avg1.values,
          image2: avg2.values,
          count: {
            image1: avg1.count,
            image2: avg2.count,
          },
        },
      };
    }

    return NextResponse.json(response);
  } catch (e) {
    console.error("[BULK RATINGS]", e);
    return NextResponse.json({});
  }
}

function computeAvg(ratings: any[]) {
  if (!ratings.length) {
    return { values: null, count: 0 };
  }

  const sums = Array(6).fill(0);

  for (const r of ratings) {
    r.stars.forEach((v: number, i: number) => {
      sums[i] += v;
    });
  }

  return {
    values: sums.map((s) => s / ratings.length),
    count: ratings.length,
  };
}
