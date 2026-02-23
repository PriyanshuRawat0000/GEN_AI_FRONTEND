import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    //console.log("Signup request email:", email);

    const { db } = await connectToDatabase();
    //console.log("Connected to DB");

    // Find or create user
    let user = await db.collection("Users").findOne({ email });
    if (!user) {
      //console.log("User not found, creating new user");
      const result = await db.collection("Users").insertOne({
        email,
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email };
      //console.log("New user created:", user);
    } else {
      //console.log("Existing user found:", user);
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
