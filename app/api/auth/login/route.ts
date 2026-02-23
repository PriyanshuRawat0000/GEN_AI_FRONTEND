import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const JWT_EXPIRES_IN = "7d"; // adjust as needed

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    ////console.log("Login request email:", email);

    const { db } = await connectToDatabase();
    //////console.log("Connected to DB");

    // Find or create user
    let user = await db.collection("Users").findOne({ email });
    if (!user) {
      ////console.log("User not found, creating new user");
      const result = await db.collection("Users").insertOne({
        email,
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, email };
      ////console.log("New user created:", user);
    } else {
      ////console.log("Existing user found:", user);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: { _id: user._id.toString(), email: user.email },
      auth_token: token, // return for localStorage
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,       // cannot be accessed by JS (for security)
      path: "/",             // available on all routes
      maxAge: 7 * 24 * 60 * 60, // 7 days
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
