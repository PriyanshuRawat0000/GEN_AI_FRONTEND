import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const encodedUrl = req.nextUrl.searchParams.get("path");
  if (!encodedUrl) {
    return new NextResponse("Missing path", { status: 400 });
  }

  try {
    const fullUrl = decodeURIComponent(encodedUrl);

    if (!fullUrl.startsWith(process.env.R2_PUBLIC_BASE!)) {
      return new NextResponse("Invalid image URL", { status: 400 });
    }

    const url = new URL(fullUrl);
    let key = url.pathname.replace(/^\/+/, "");

    const bucketPrefix = `${process.env.R2_BUCKET_NAME}/`;
    if (key.startsWith(bucketPrefix)) {
      key = key.slice(bucketPrefix.length);
    }

    const obj = await s3.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
      })
    );

    if (!obj.Body) {
      return new NextResponse("Empty object", { status: 404 });
    }

    return new NextResponse(obj.Body as ReadableStream, {
      headers: {
        "Content-Type": obj.ContentType ?? "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("R2 IMAGE FETCH ERROR:", err);
    return new NextResponse("Image fetch failed", { status: 500 });
  }
}
