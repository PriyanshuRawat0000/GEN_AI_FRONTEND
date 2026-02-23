// import jwt from "jsonwebtoken"
// import bcrypt from "bcryptjs"
// import type { ObjectId } from "mongodb"

// const JWT_SECRET = process.env.JWT_SECRET
// const JWT_EXPIRY = "7d"

// if (!JWT_SECRET) {
//   throw new Error("JWT_SECRET environment variable is not defined")
// }

// export type JWTPayload = {
//   userId: string
//   email: string
//   iat?: number
//   exp?: number
// }

// // Generate JWT token
// export function generateToken(userId: string | ObjectId, email: string): string {
//   const payload: JWTPayload = {
//     userId: userId.toString(),
//     email,
//   }
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
// }

// // Verify and decode JWT token
// export function verifyToken(token: string): JWTPayload | null {
//   try {
//     const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
//     return decoded
//   } catch (error) {
//     return null
//   }
// }

// // Hash password with bcrypt
// export async function hashPassword(password: string): Promise<string> {
//   const salt = await bcrypt.genSalt(10)
//   return bcrypt.hash(password, salt)
// }

// // Compare password with hash
// export async function comparePassword(password: string, hash: string): Promise<boolean> {
//   return bcrypt.compare(password, hash)
// }

// // Extract token from Authorization header
// export function getTokenFromHeader(authHeader: string | null): string | null {
//   if (!authHeader) return null
//   const parts = authHeader.split(" ")
//   if (parts.length !== 2 || parts[0] !== "Bearer") return null
//   return parts[1]
// }

// // Validate email format
// export const isValidEmail = (email: string): boolean => {
//   const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//   return re.test(email) && email.length <= 254
// }

// // Validate password strength
// export const isValidPassword = (password: string): boolean => {
//   // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
//   return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)
// }
"use server"

import jwt from "jsonwebtoken"

const JWT_EXPIRY = "7d"

/* =======================
   JWT SECRET
======================= */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not defined")
  }
  return secret
}

/* =======================
   JWT PAYLOAD TYPE
======================= */
export type JWTPayload = {
  userId: string
  email: string
}

/* =======================
   GENERATE TOKEN
======================= */
export async function generateToken(
  userId: string,
  email: string
): Promise<string> {
  return jwt.sign(
    { userId, email },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRY }
  )
}

/* =======================
   VERIFY TOKEN
======================= */
export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload
  } catch {
    return null
  }
}

/* =======================
   EXTRACT BEARER TOKEN
======================= */
export async function getTokenFromHeader(
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2) return null
  if (parts[0] !== "Bearer") return null

  return parts[1]
}

/* =======================
   EMAIL VALIDATION
======================= */
export async function isValidEmail(
  email: string
): Promise<boolean> {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
