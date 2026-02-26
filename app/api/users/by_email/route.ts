
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();
  const { db } = await connectToDatabase();

  const user = await db.collection("Users").findOne({ email });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    _id: user._id.toString(),
    email: user.email,
  });
}
