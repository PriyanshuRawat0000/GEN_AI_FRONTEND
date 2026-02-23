// lib/db.ts
// MongoDB connection + all DB operations (users, images, ratings)

import { MongoClient, Db, ObjectId } from "mongodb";

/* =======================
   CONNECTION (POOL SAFE)
======================= */

declare global {
  // eslint-disable-next-line no-var
  var _cachedMongoClient: MongoClient | null;
  // eslint-disable-next-line no-var
  var _cachedMongoDb: Db | null;
}

global._cachedMongoClient ??= null;
global._cachedMongoDb ??= null;

export async function connectToDatabase() {
  if (global._cachedMongoClient && global._cachedMongoDb) {
    return {
      client: global._cachedMongoClient,
      db: global._cachedMongoDb,
    };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not defined");

  const client = new MongoClient(uri, {
    maxPoolSize: 5, // you had this — keeping it
    minPoolSize: 1,
  });

  await client.connect();

  global._cachedMongoClient = client;
  global._cachedMongoDb = client.db(process.env.MONGODB_DB || "llm-comparison");

  return {
    client: global._cachedMongoClient,
    db: global._cachedMongoDb,
  };
}

export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/* =======================
   TYPES
======================= */

export type User = {
  _id: ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Rating = {
  userId: ObjectId;
  stars: [number, number, number, number, number, number]; // 6-factor rating
  ratedAt: Date;
};

export type ImageDoc = {
  _id: ObjectId;
  inputImage: string;
  model1Image: string;
  model2Image: string;
  prompt: string;
  createdBy: ObjectId;

  model1Ratings: Rating[];
  model2Ratings: Rating[];

  createdAt: Date;
  updatedAt: Date;
};

/* =======================
   USER OPERATIONS
======================= */

export async function createUser(email: string): Promise<User> {
  const db = await getDb();
  const now = new Date();

  const user: User = {
    _id: new ObjectId(),
    email,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection<User>("users").insertOne(user);
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ email });
}

export async function getUserById(id: string | ObjectId): Promise<User | null> {
  const db = await getDb();
  const _id = typeof id === "string" ? new ObjectId(id) : id;
  return db.collection<User>("users").findOne({ _id });
}

/* =======================
   IMAGE OPERATIONS
======================= */

export async function createImage(
  inputImage: string,
  model1Image: string,
  model2Image: string,
  prompt: string,
  userId: string | ObjectId,
): Promise<ImageDoc> {
  const db = await getDb();
  const now = new Date();
  const createdBy = typeof userId === "string" ? new ObjectId(userId) : userId;

  const image: ImageDoc = {
    _id: new ObjectId(),
    inputImage,
    model1Image,
    model2Image,
    prompt,
    createdBy,

    model1Ratings: [],
    model2Ratings: [],

    createdAt: now,
    updatedAt: now,
  };

  await db.collection<ImageDoc>("images").insertOne(image);
  return image;
}

export async function getImage(
  imageId: string | ObjectId,
): Promise<ImageDoc | null> {
  const db = await getDb();
  const _id = typeof imageId === "string" ? new ObjectId(imageId) : imageId;
  return db.collection<ImageDoc>("images").findOne({ _id });
}

export async function getAllImages(): Promise<ImageDoc[]> {
  const db = await getDb();
  return db
    .collection<ImageDoc>("images")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

/* =======================
   RATING OPERATIONS
   (CORE LOGIC)
======================= */

export async function getUserRating(
  imageId: string | ObjectId,
  model: "model1" | "model2",
  userId: string | ObjectId,
): Promise<Rating | null> {
  const image = await getImage(imageId);
  if (!image) return null;

  const uid = typeof userId === "string" ? new ObjectId(userId) : userId;
  const ratings =
    model === "model1" ? image.model1Ratings : image.model2Ratings;

  return ratings.find((r) => r.userId.equals(uid)) || null;
}

export async function saveRating(
  imageId: string | ObjectId,
  model: "model1" | "model2",
  userId: string | ObjectId,
  stars: [number, number, number, number, number, number],
): Promise<ImageDoc | null> {
  const db = await getDb();
  const _imageId =
    typeof imageId === "string" ? new ObjectId(imageId) : imageId;
  const _userId = typeof userId === "string" ? new ObjectId(userId) : userId;
  const now = new Date();

  const image = await getImage(_imageId);
  if (!image) return null;

  const ratingKey: "model1Ratings" | "model2Ratings" =
    model === "model1" ? "model1Ratings" : "model2Ratings";

  const existingIndex = image[ratingKey].findIndex((r) =>
    r.userId.equals(_userId),
  );

  if (existingIndex !== -1) {
    // Update existing rating
    await db.collection<ImageDoc>("images").updateOne(
      { _id: _imageId },
      {
        $set: {
          [`${ratingKey}.${existingIndex}`]: {
            userId: _userId,
            stars,
            ratedAt: now,
          },
          updatedAt: now,
        },
      },
    );
  } else {
    // Insert new rating
    await db.collection<ImageDoc>("images").updateOne(
      { _id: _imageId },
      {
        $push: {
          [ratingKey]: {
            userId: _userId,
            stars,
            ratedAt: now,
          },
        } as any, // MongoDB TS typing limitation (intentional)
        $set: { updatedAt: now },
      },
    );
  }

  return getImage(_imageId);
}

/* =======================
   AVERAGE RATING (SERVER)
======================= */

export function getAverageRating(
  ratings: Rating[],
): [number, number, number, number, number, number] {
  if (ratings.length === 0) return [0, 0, 0, 0, 0, 0];

  const sums = [0, 0, 0, 0, 0, 0];

  for (const r of ratings) {
    for (let i = 0; i < 6; i++) {
      sums[i] += r.stars[i];
    }
  }

  return sums.map((s) => s / ratings.length) as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
}
