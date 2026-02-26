"use server"

import jwt from "jsonwebtoken"

const JWT_EXPIRY = "7d"


function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error("JWT_SECRET is not defined")
  }
  return secret
}


export type JWTPayload = {
  userId: string
  email: string
}


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


export async function verifyToken(
  token: string
): Promise<JWTPayload | null> {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload
  } catch {
    return null
  }
}


export async function getTokenFromHeader(
  authHeader: string | null
): Promise<string | null> {
  if (!authHeader) return null

  const parts = authHeader.split(" ")
  if (parts.length !== 2) return null
  if (parts[0] !== "Bearer") return null

  return parts[1]
}

export async function isValidEmail(
  email: string
): Promise<boolean> {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
