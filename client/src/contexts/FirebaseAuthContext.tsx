import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  auth,
  onAuthChange,
  getUserProfile,
  logOut,
  updateLastLogin,
  type UserProfile,
  type AdminPermissions,
} from "@/lib/firebase";
import type { User } from "firebase/auth";

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: AdminPermissions | null;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultPermissions: AdminPermissions = {
  canManageUsers: false,
  canManageContent: false,
  canViewAnalytics: false,
  canManageSettings: false,
  canManageReports: false,
  canSendNotifications: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (firebaseUser) {
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
        // Update last login time
        try {
          await updateLastLogin(user.uid);
        } catch (e) {
          console.error("Failed to update last login:", e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await logOut();
    setFirebaseUser(null);
    setUserProfile(null);
  };

  const isAdmin = userProfile?.role === "admin" || userProfile?.role === "superadmin";
  const isSuperAdmin = userProfile?.role === "superadmin";
  
  // Super admins have all permissions, regular admins use their assigned permissions
  const permissions: AdminPermissions | null = isSuperAdmin
    ? {
        canManageUsers: true,
        canManageContent: true,
        canViewAnalytics: true,
        canManageSettings: true,
        canManageReports: true,
        canSendNotifications: true,
      }
    : isAdmin
    ? userProfile?.permissions || defaultPermissions
    : null;

  const value: AuthContextType = {
    firebaseUser,
    userProfile,
    loading,
    isAuthenticated: !!firebaseUser && !!userProfile,
    isAdmin,
    isSuperAdmin,
    permissions,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useFirebaseAuth must be used within a FirebaseAuthProvider");
  }
  return context;
}
