// import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// // Initialize R2 S3-compatible client
// const s3Client = new S3Client({
//   region: "auto",
//   endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//   credentials: {
//     accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
//     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
//   },
// })

// const BUCKET_NAME = process.env.R2_BUCKET_NAME || "llm-comparison"
// const PUBLIC_BASE = process.env.R2_PUBLIC_BASE || ""

// export async function uploadImageToR2(fileName: string, fileBuffer: Buffer, contentType: string): Promise<string> {
//   const key = `images/${Date.now()}-${fileName}`

//   const command = new PutObjectCommand({
//     Bucket: BUCKET_NAME,
//     Key: key,
//     Body: fileBuffer,
//     ContentType: contentType,
//   })

//   try {
//     await s3Client.send(command)
//     // Return public URL
//     return `${PUBLIC_BASE}/${key}`
//   } catch (error) {
//     console.error("[R2] Upload failed:", error)
//     throw new Error("Failed to upload image")
//   }
// }

// export async function deleteImageFromR2(imageUrl: string): Promise<void> {
//   // Extract key from URL
//   const url = new URL(imageUrl)
//   const key = url.pathname.substring(1) // Remove leading slash

//   const command = new DeleteObjectCommand({
//     Bucket: BUCKET_NAME,
//     Key: key,
//   })

//   try {
//     await s3Client.send(command)
//   } catch (error) {
//     console.error("[R2] Delete failed:", error)
//     throw new Error("Failed to delete image")
//   }
// }

// export async function getSignedUploadUrl(fileName: string, contentType: string): Promise<string> {
//   const key = `temp/${Date.now()}-${fileName}`

//   const command = new PutObjectCommand({
//     Bucket: BUCKET_NAME,
//     Key: key,
//     ContentType: contentType,
//   })

//   try {
//     const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
//     return signedUrl
//   } catch (error) {
//     console.error("[R2] Signed URL generation failed:", error)
//     throw new Error("Failed to generate signed URL")
//   }
// }
// lib/r2.ts
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: "auto", // Cloudflare R2 doesn’t need a real region
  endpoint: process.env.R2_PUBLIC_BASE, // e.g. https://<account_id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getSignedImageUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  return url;
}
