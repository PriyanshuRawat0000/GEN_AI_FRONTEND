// pages/api/image/[key].ts
import { NextApiRequest, NextApiResponse } from "next";
import { getSignedImageUrl } from "@/lib/r2";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query;

  if (!key || typeof key !== "string") {
    return res.status(400).json({ error: "Invalid key" });
  }

  try {
    const url = await getSignedImageUrl(key);
    res.status(200).json({ url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
}
