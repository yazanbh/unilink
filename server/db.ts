/**
 * Database operations using Firebase Admin SDK
 * This replaces the previous Drizzle/MySQL implementation
 */

import type { User, InsertUser } from "@shared/types";

// For server-side operations, we'll use Firebase Admin SDK
// But since this project uses client-side Firebase, we'll create a simple in-memory cache
// and rely on Firestore for persistence

// Temporary in-memory store for server-side user data
// In production, this should use Firebase Admin SDK
const userCache = new Map<string, User>();
let userIdCounter = 1;

export async function getUserByOpenId(openId: string): Promise<User | null> {
  return userCache.get(openId) || null;
}

export async function upsertUser(data: Partial<InsertUser> & { openId: string }): Promise<User> {
  const existing = userCache.get(data.openId);
  const now = new Date();
  
  if (existing) {
    const updated: User = {
      ...existing,
      ...data,
      updatedAt: now,
      lastSignedIn: data.lastSignedIn || existing.lastSignedIn,
    };
    userCache.set(data.openId, updated);
    return updated;
  }
  
  const newUser: User = {
    id: userIdCounter++,
    openId: data.openId,
    name: data.name || null,
    email: data.email || null,
    loginMethod: data.loginMethod || null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: data.lastSignedIn || now,
  };
  
  userCache.set(data.openId, newUser);
  return newUser;
}

export async function getAllUsers(): Promise<User[]> {
  return Array.from(userCache.values());
}

export async function deleteUser(openId: string): Promise<boolean> {
  return userCache.delete(openId);
}
