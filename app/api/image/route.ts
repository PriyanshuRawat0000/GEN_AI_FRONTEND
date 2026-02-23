import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const encodedUrl = searchParams.get("path");

  if (!encodedUrl) {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  try {
    const fullUrl = decodeURIComponent(encodedUrl);

    // SAFETY: ensure it is your R2 base
    if (!fullUrl.startsWith(process.env.R2_PUBLIC_BASE!)) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    const url = new URL(fullUrl);

    // remove leading slash
    let key = url.pathname.replace(/^\/+/, "");

    // 🚨 CRITICAL FIX: remove bucket prefix if present
    const bucketPrefix = `${process.env.R2_BUCKET_NAME}/`;
    if (key.startsWith(bucketPrefix)) {
      key = key.slice(bucketPrefix.length);
    }

    const filename = key.split("/").pop()!;

    // default: input image
    let model: string | null = null;

    // only outputs have model info
    if (filename.includes("_")) {
      const parts = filename.split("_");

      if (parts.length > 1) {
        model = parts
          .slice(1)
          .join("_")
          .replace(/\.[^/.]+$/, "");
      }
    }

    console.log("IMAGE MODEL:", model);

    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    return NextResponse.json({ url: signedUrl });
  } catch (err) {
    console.error("IMAGE SIGN ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 },
    );
  }
}
