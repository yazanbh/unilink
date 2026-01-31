/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export * from "./_core/errors";

/**
 * User type - now based on Firestore structure
 */
export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export type InsertUser = Omit<User, "id" | "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};
