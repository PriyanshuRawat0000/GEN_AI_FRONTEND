import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const match = cookie.match(/auth_token=([^;]+)/);
    if (!match) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const token = match[1];
    const secret = process.env.JWT_SECRET || "secret";

    const payload = jwt.verify(token, secret) as { userId: string; email: string };
    return NextResponse.json({ _id: payload.userId, email: payload.email });
  } catch (err) {
    console.error("Error in /api/user:", err);
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
