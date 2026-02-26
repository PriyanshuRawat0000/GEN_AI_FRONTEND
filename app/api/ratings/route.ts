
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const comparisonId = req.nextUrl.searchParams.get("comparisonId");
    const userEmail = req.nextUrl.searchParams.get("userEmail");

    if (!comparisonId || !ObjectId.isValid(comparisonId) || !userEmail) {
      return NextResponse.json({ model1: null, model2: null }, { status: 200 });
    }

    const { db } = await connectToDatabase();

    const user = await db.collection("Users").findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ model1: null, model2: null }, { status: 200 });
    }

    const image = await db.collection("Images").findOne({
      _id: new ObjectId(comparisonId),
    });

    if (!image) {
      return NextResponse.json({ model1: null, model2: null }, { status: 200 });
    }

    const userId = new ObjectId(user._id);

    const model1 = image.model1Ratings?.find((r: any) =>
      r.raterId.equals(userId)
    );
    const model2 = image.model2Ratings?.find((r: any) =>
      r.raterId.equals(userId)
    );

    return NextResponse.json(
      {
        model1: model1?.stars ?? null,
        model2: model2?.stars ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET RATINGS]", err);
    return NextResponse.json(
      { model1: null, model2: null },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { comparisonId, model, stars, userEmail } = await req.json();

    if (
      !comparisonId ||
      !ObjectId.isValid(comparisonId) ||
      (model !== "model1" && model !== "model2") ||
      !Array.isArray(stars) ||
      !userEmail
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { db } = await connectToDatabase();


    const user = await db.collection("Users").findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const imageId = new ObjectId(comparisonId);
    const userId = new ObjectId(user._id);

    const ratingsField = model === "model1" ? "model1Ratings" : "model2Ratings";


    const updateResult = await db.collection("Images").updateOne(
      {
        _id: imageId,
        [`${ratingsField}.raterId`]: userId,
      },
      {
        $set: {
          [`${ratingsField}.$.stars`]: stars,
        },
      }
    );


    if (updateResult.matchedCount === 0) {
      await db.collection("Images").updateOne(
        { _id: imageId },
        {
          $push: {
            [ratingsField]: {
              raterId: userId,
              stars,
            },
          } as any,
        }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[SAVE RATING]", err);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}
