import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();


    const { db } = await connectToDatabase();



    let user = await db.collection("Users").findOne({ email });
    if (!user) {

      const result = await db.collection("Users").insertOne({
        email,
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email };

    } else {

    }

    return NextResponse.json({
      success: true,
      user: { _id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    console.error("Error in /api/auth/signup:", err);
    return NextResponse.json({ success: false, error: "Signup failed" }, { status: 500 });
  }
}
