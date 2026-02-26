import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = "7d";

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


    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );


    const response = NextResponse.json({
      success: true,
      user: { _id: user._id.toString(), email: user.email },
      auth_token: token,
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (err) {
    console.error("Error in /api/auth/login:", err);
    return NextResponse.json(
      { success: false, error: "Login failed" },
      { status: 500 }
    );
  }
}
