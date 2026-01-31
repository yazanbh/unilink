import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type SubscriptionPlan = "free" | "pro" | "business";

export interface Subscription {
  uid: string;
  plan: SubscriptionPlan;
  status: "active" | "canceled" | "expired";
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const getSubscription = async (uid: string): Promise<Subscription | null> => {
  const subDoc = await getDoc(doc(db, "subscriptions", uid));
  if (!subDoc.exists()) return null;
  return subDoc.data() as Subscription;
};

/**
 * This function should ONLY be called after a verified payment.
 */
export const upgradeUserPlan = async (
  uid: string,
  newPlan: SubscriptionPlan
): Promise<void> => {
  console.log(`DEBUG: Upgrading user ${uid} to ${newPlan} plan...`);
  
  // Update user document
  await updateDoc(doc(db, "users", uid), {
    plan: newPlan,
    updatedAt: serverTimestamp(),
  });

  // Update or create subscription document
  await setDoc(doc(db, "subscriptions", uid), {
    uid,
    plan: newPlan,
    status: "active",
    startDate: serverTimestamp(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    updatedAt: serverTimestamp(),
  }, { merge: true });
};
