
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/db"

export async function GET() {
  const { db } = await connectToDatabase()

  const images = await db
    .collection("Images")
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  return NextResponse.json(
    images.map((img) => ({
      ...img,
      _id: img._id.toString(),
    })),
  )
}
