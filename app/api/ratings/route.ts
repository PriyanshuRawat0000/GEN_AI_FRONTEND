// // app/api/ratings/route.ts
// import { NextRequest, NextResponse } from "next/server"
// import { ObjectId } from "mongodb"
// import { connectToDatabase } from "@/lib/db"

// export async function GET(req: NextRequest) {
//   try {
//     const userId = req.nextUrl.searchParams.get("userId")
//     if (!userId) {
//       return NextResponse.json([], { status: 200 })
//     }

//     const { db } = await connectToDatabase()
//     const _userId = new ObjectId(userId)

//     const images = await db
//       .collection("Images")
//       .find({
//         $or: [
//           { "model1Ratings.raterId": _userId },
//           { "model2Ratings.raterId": _userId },
//         ],
//       })
//       .toArray()

//     const ratings: any[] = []

//     images.forEach((img) => {
//       img.model1Ratings?.forEach((r: any) => {
//         if (r.raterId.equals(_userId)) {
//           ratings.push({
//             imageId: img._id.toString(),
//             model: "model1",
//             stars: r.stars,
//           })
//         }
//       })

//       img.model2Ratings?.forEach((r: any) => {
//         if (r.raterId.equals(_userId)) {
//           ratings.push({
//             imageId: img._id.toString(),
//             model: "model2",
//             stars: r.stars,
//           })
//         }
//       })
//     })

//     return NextResponse.json(ratings, { status: 200 })
//   } catch (err) {
//     console.error("[GET RATINGS]", err)
//     return NextResponse.json([], { status: 200 }) // never break dashboard
//   }
// }

// app/api/ratings/route.ts
// app/api/ratings/route.ts
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

    // 1️⃣ Get user
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
      { status: 200 } // dashboard must not break
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

    // 1️⃣ Get user
    const user = await db.collection("Users").findOne({ email: userEmail });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const imageId = new ObjectId(comparisonId);
    const userId = new ObjectId(user._id);

    const ratingsField = model === "model1" ? "model1Ratings" : "model2Ratings";

    // 2️⃣ Try update existing rating
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

    // 3️⃣ If not found → push new rating
    if (updateResult.matchedCount === 0) {
      await db.collection("Images").updateOne(
        { _id: imageId },
        {
          $push: {
            [ratingsField]: {
              raterId: userId,
              stars,
            },
          } as any, // 👈 intentional TS escape hatch
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
